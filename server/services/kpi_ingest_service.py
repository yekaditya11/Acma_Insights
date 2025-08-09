import os
import json
import datetime
import logging
import time
from pathlib import Path
from typing import Dict, List, Any, Iterable
import psycopg2
import psycopg2.extras as pg_extras

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from dotenv import load_dotenv


# Load .env from the server directory (same pattern as ai_client.py)
ENV_PATH = Path(__file__).parent.parent / ".env"
if ENV_PATH.exists():
    load_dotenv(str(ENV_PATH))

logger = logging.getLogger(__name__)

# Reuse a single engine within the process to avoid repeated SSL handshakes
_ENGINE: Engine | None = None


MONTH_MAP: Dict[str, int] = {
    "Jan": 1,
    "Feb": 2,
    "Mar": 3,
    "Apr": 4,
    "May": 5,
    "Jun": 6,
    "Jul": 7,
    "Aug": 8,
    "Sep": 9,
    "Oct": 10,
    "Nov": 11,
    "Dec": 12,
}


def _parse_year(generated_on: str) -> int:
    try:
        # ISO or YYYY-MM-DD
        return datetime.date.fromisoformat(generated_on).year
    except Exception:
        try:
            return int(str(generated_on)[:4])
        except Exception:
            return datetime.date.today().year


def _get_engine() -> Engine:
    global _ENGINE
    if _ENGINE is not None:
        return _ENGINE
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        host = os.getenv("DB_HOST")
        port = os.getenv("DB_PORT", "5432")
        name = os.getenv("DB_NAME")
        user = os.getenv("DB_USER")
        password = os.getenv("DB_PASSWORD")
        if not all([host, port, name, user, password]):
            raise RuntimeError(
                "Database configuration missing. Set DATABASE_URL or DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
            )
        database_url = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{name}"
    # Enforce SSL and a short connect timeout so requests don't hang
    connect_args = {"sslmode": "require", "connect_timeout": 10}
    logger.info("Creating database engine (sslmode=require, connect_timeout=10)")
    _ENGINE = create_engine(
        database_url,
        pool_pre_ping=True,
        connect_args=connect_args,
        pool_size=5,
        max_overflow=0,
    )
    return _ENGINE


def _ensure_table_exists(engine: Engine) -> None:
    create_sql = text(
        """
        CREATE TABLE IF NOT EXISTS supplier_kpi_monthly (
          id BIGSERIAL PRIMARY KEY,
          supplier_name TEXT NOT NULL,
          kpi_name TEXT NOT NULL,
          year INT NOT NULL,
          month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
          value NUMERIC,
          unit TEXT,
          generated_on DATE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (supplier_name, kpi_name, year, month)
        );
        CREATE INDEX IF NOT EXISTS idx_skm_supplier ON supplier_kpi_monthly (supplier_name);
        CREATE INDEX IF NOT EXISTS idx_skm_kpi ON supplier_kpi_monthly (kpi_name, year, month);
        """
    )
    with engine.begin() as conn:
        conn.execute(create_sql)


def _iter_chunks(items: List[Dict[str, Any]], chunk_size: int) -> Iterable[List[Dict[str, Any]]]:
    for i in range(0, len(items), chunk_size):
        yield items[i : i + chunk_size]


def _upsert_with_execute_values(raw_conn, rows: List[Dict[str, Any]], page_size: int) -> None:
    # Build list of tuples in column order matching the template
    data = [
        (
            r["supplier_name"],
            r["kpi_name"],
            r["year"],
            r["month"],
            r.get("value"),
            r.get("unit"),
            r.get("generated_on"),
        )
        for r in rows
    ]
    sql = (
        "INSERT INTO supplier_kpi_monthly (supplier_name, kpi_name, year, month, value, unit, generated_on) VALUES %s "
        "ON CONFLICT (supplier_name, kpi_name, year, month) DO UPDATE SET "
        "value = EXCLUDED.value, unit = EXCLUDED.unit, generated_on = EXCLUDED.generated_on"
    )
    with raw_conn.cursor() as cur:
        pg_extras.execute_values(cur, sql, data, page_size=page_size)


def ingest_final_kpis(
    json_path: str = "results/final_supplier_kpis.json",
    skip_nulls: bool = False,
    batch_size: int = 2000,
    method: str = "values",  # "values" (fast) | "batch" (sqlalchemy executemany)
) -> Dict[str, Any]:
    data = json.loads(Path(json_path).read_text(encoding="utf-8"))
    unit_descriptions: Dict[str, str] = (data.get("kpiMetadata") or {}).get("unitDescriptions") or {}
    generated_on = data.get("generatedOn")
    year = _parse_year(generated_on) if generated_on else datetime.date.today().year

    rows: List[Dict[str, Any]] = []
    for kpi_name, per_supplier in data.items():
        if kpi_name in ("generatedOn", "kpiMetadata"):
            continue
        if not isinstance(per_supplier, dict):
            continue
        for supplier_name, monthly in per_supplier.items():
            if supplier_name == "Sheet1":
                continue
            if not isinstance(monthly, dict):
                continue
            for month_str, value in monthly.items():
                month_num = MONTH_MAP.get(month_str)
                if month_num is None:
                    continue
                if skip_nulls and value is None:
                    continue
                rows.append(
                    {
                        "supplier_name": supplier_name,
                        "kpi_name": kpi_name,
                        "year": year,
                        "month": month_num,
                        "value": value,
                        "unit": unit_descriptions.get(kpi_name),
                        "generated_on": generated_on,
                    }
                )

    if not rows:
        return {"upserted": 0}

    engine = _get_engine()
    _ensure_table_exists(engine)

    upsert_sql = text(
        """
        INSERT INTO supplier_kpi_monthly
          (supplier_name, kpi_name, year, month, value, unit, generated_on)
        VALUES
          (:supplier_name, :kpi_name, :year, :month, :value, :unit, :generated_on)
        ON CONFLICT (supplier_name, kpi_name, year, month)
        DO UPDATE SET
          value = EXCLUDED.value,
          unit = EXCLUDED.unit,
          generated_on = EXCLUDED.generated_on
        """
    )

    start = time.time()
    total_rows = len(rows)
    logger.info(f"Starting KPI ingestion: {total_rows} rows, batch_size={batch_size}")
    batches = 0
    if method == "values":
        # Use psycopg2.execute_values for fastest single-round-trip batches
        raw_conn = engine.raw_connection()
        try:
            for chunk in _iter_chunks(rows, max(1, int(batch_size))):
                _upsert_with_execute_values(raw_conn, chunk, page_size=batch_size)
                raw_conn.commit()
                batches += 1
        finally:
            raw_conn.close()
    else:
        with engine.begin() as conn:
            for chunk in _iter_chunks(rows, max(1, int(batch_size))):
                conn.execute(upsert_sql, chunk)
                batches += 1
    elapsed = time.time() - start
    logger.info(f"KPI ingestion complete: {total_rows} upserted in {elapsed:.2f}s across {batches} batches")

    return {
        "upserted": total_rows,
        "batches": batches,
        "batchSize": batch_size,
        "elapsedSeconds": round(elapsed, 2),
    }


def test_db_connection() -> bool:
    engine = _get_engine()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.error(f"DB connection test failed: {exc}")
        return False


