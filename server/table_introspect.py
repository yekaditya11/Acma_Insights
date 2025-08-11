import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from sqlalchemy import MetaData, Table, create_engine, inspect
from sqlalchemy.engine import Engine
from sqlalchemy.schema import CreateTable

# Load .env automatically from the server directory (this file's dir) or its parent
_ENV_CANDIDATES = [Path(__file__).parent / ".env", Path(__file__).parent.parent / ".env"]
for _p in _ENV_CANDIDATES:
    if _p.exists():
        load_dotenv(str(_p))
        break


def create_db_engine(database_url: str) -> Engine:
    """Create a SQLAlchemy engine from a database URL."""
    try:
        engine = create_engine(database_url)
        # Test connection early
        with engine.connect() as _:
            pass
        return engine
    except Exception as exc:  # noqa: BLE001 - surface clear CLI error
        raise RuntimeError(f"Failed to connect to database: {exc}") from exc


def get_database_url_from_env() -> Optional[str]:
    """Return DATABASE_URL or construct from DB_HOST/PORT/NAME/USER/PASSWORD if set."""
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    if all([host, name, user, password]):
        return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{name}"
    return None


def generate_table_ddl(engine: Engine, table_name: str, schema: Optional[str]) -> str:
    """Generate CREATE TABLE DDL for the given table using SQLAlchemy's compiler.

    This covers the table and its column definitions and constraints. Indexes are not emitted here.
    """
    metadata = MetaData()
    try:
        table = Table(table_name, metadata, autoload_with=engine, schema=schema)
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(
            f"Failed to reflect table '{schema + '.' if schema else ''}{table_name}': {exc}"
        ) from exc

    try:
        ddl_sql = str(CreateTable(table).compile(dialect=engine.dialect))
        return ddl_sql
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"Failed to compile DDL: {exc}") from exc


def collect_column_semantics(engine: Engine, table_name: str, schema: Optional[str]) -> List[Dict[str, Any]]:
    """Return a list of per-column semantics: name, type, nullable, default, and description.

    Also flags primary and foreign keys and includes a compact `references` field for FKs.
    """
    inspector = inspect(engine)
    columns = inspector.get_columns(table_name, schema=schema)

    pk_info = inspector.get_pk_constraint(table_name, schema=schema) or {}
    pk_cols = set(pk_info.get("constrained_columns", []) or [])

    fk_info = inspector.get_foreign_keys(table_name, schema=schema) or []
    fk_map: Dict[str, Dict[str, Optional[str]]] = {}
    for fk in fk_info:
        # Assume single-column FKs for compact mapping; for multi-column, map each 1:1 pair
        constrained_cols = fk.get("constrained_columns") or []
        referred_cols = fk.get("referred_columns") or []
        referred_table = fk.get("referred_table")
        referred_schema = fk.get("referred_schema")
        for idx, col in enumerate(constrained_cols):
            fk_map[col] = {
                "schema": referred_schema,
                "table": referred_table,
                "column": referred_cols[idx] if idx < len(referred_cols) else None,
            }

    results: List[Dict[str, Any]] = []
    for col in columns:
        name: str = col.get("name")  # type: ignore[assignment]
        col_type = col.get("type")
        col_default = col.get("default")
        description = col.get("comment")
        is_nullable = bool(col.get("nullable", True))

        entry: Dict[str, Any] = {
            "name": name,
            "type": str(col_type) if col_type is not None else None,
            "nullable": is_nullable,
            "default": str(col_default) if col_default is not None else None,
            "description": description,
            "is_primary_key": name in pk_cols,
            "is_foreign_key": name in fk_map,
        }

        if name in fk_map:
            entry["references"] = fk_map[name]

        results.append(entry)

    return results


def collect_table_constraints(engine: Engine, table_name: str, schema: Optional[str]) -> Dict[str, Any]:
    """Collect high-level constraint metadata to supplement column semantics."""
    inspector = inspect(engine)

    pk = inspector.get_pk_constraint(table_name, schema=schema) or {}
    uniques = inspector.get_unique_constraints(table_name, schema=schema) or []
    checks = inspector.get_check_constraints(table_name, schema=schema) or []
    fks = inspector.get_foreign_keys(table_name, schema=schema) or []

    return {
        "primary_key": pk.get("constrained_columns", []) or [],
        "unique": [u.get("column_names", []) for u in uniques if u],
        "checks": [
            {
                "name": c.get("name"),
                "sqltext": c.get("sqltext"),
            }
            for c in checks
        ],
        "foreign_keys": [
            {
                "name": f.get("name"),
                "constrained_columns": f.get("constrained_columns"),
                "referred_schema": f.get("referred_schema"),
                "referred_table": f.get("referred_table"),
                "referred_columns": f.get("referred_columns"),
            }
            for f in fks
        ],
    }


def build_table_semantics(engine: Engine, table_name: str, schema: Optional[str]) -> Dict[str, Any]:
    inspector = inspect(engine)
    table_comment_info = inspector.get_table_comment(table_name, schema=schema) or {}
    table_comment = table_comment_info.get("text")

    return {
        "schema": schema,
        "table": table_name,
        "table_comment": table_comment,
        "columns": collect_column_semantics(engine, table_name, schema),
        "constraints": collect_table_constraints(engine, table_name, schema),
    }


def _load_existing_semantics(path: Path) -> Optional[Dict[str, Any]]:
    try:
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        return None
    return None


def _merge_semantics(new_sem: Dict[str, Any], existing_sem: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not existing_sem:
        return new_sem

    # Preserve existing table_comment if DB has none
    if not new_sem.get("table_comment") and existing_sem.get("table_comment"):
        new_sem["table_comment"] = existing_sem.get("table_comment")

    # Build map for existing columns by name for quick lookup
    existing_cols = {c.get("name"): c for c in existing_sem.get("columns", []) if isinstance(c, dict)}
    merged_cols: List[Dict[str, Any]] = []
    for col in new_sem.get("columns", []):
        if not isinstance(col, dict):
            continue
        name = col.get("name")
        prev = existing_cols.get(name)
        if prev:
            # Carry forward manual description when present
            prev_desc = prev.get("description")
            if prev_desc and not col.get("description"):
                col["description"] = prev_desc
        merged_cols.append(col)
    new_sem["columns"] = merged_cols
    return new_sem


def list_target_tables(engine: Engine, schemas: Optional[List[str]] = None) -> List[Dict[str, Optional[str]]]:
    """Return a list of {schema, table} dicts for all tables to introspect.

    If schemas is None, enumerate all non-system schemas.
    """
    inspector = inspect(engine)
    if schemas is None or len(schemas) == 0:
        all_schemas = inspector.get_schema_names()
        system_schemas = {"information_schema", "pg_catalog", "pg_toast"}
        schemas = [s for s in all_schemas if s not in system_schemas]

    results: List[Dict[str, Optional[str]]] = []
    for s in schemas:
        for t in inspector.get_table_names(schema=s):
            results.append({"schema": s, "table": t})
    return results


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Generate CREATE TABLE DDL and JSON semantics (columns with name, type, "
            "nullable, default, description) for a database table."
        )
    )
    parser.add_argument(
        "--db",
        dest="database_url",
        default=None,
        help=(
            "SQLAlchemy database URL. If omitted, attempts to read from .env/ENV (DATABASE_URL "
            "or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD)."
        ),
    )
    parser.add_argument("--schema", dest="schema", default=None, help="Schema name (optional)")
    parser.add_argument("--table", dest="table", required=False, help="Table name (defaults to TABLE_NAME from .env)")
    parser.add_argument(
        "-o",
        "--out",
        dest="output_path",
        default=None,
        help="Optional path to write JSON output. If omitted, prints to stdout.",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print JSON output with indentation",
    )
    parser.add_argument(
        "--no-preserve",
        dest="preserve_existing",
        action="store_false",
        help="Do not preserve existing descriptions in semantics JSON if file exists",
    )
    parser.set_defaults(preserve_existing=True)

    args = parser.parse_args(argv)

    # Resolve inputs from args or environment
    database_url = args.database_url or get_database_url_from_env()
    table_name = args.table or os.getenv("TABLE_NAME") or os.getenv("DB_TABLE")
    schema = args.schema or os.getenv("TABLE_SCHEMA") or os.getenv("DB_SCHEMA")
    if not database_url:
        print(
            "ERROR: Provide --db or set database details in .env (DATABASE_URL or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD).",
            file=sys.stderr,
        )
        return 2
    # If table name is not provided, enumerate all tables based on schema(s)

    try:
        engine = create_db_engine(database_url)
        results_dir = Path(__file__).parent / "results"
        results_dir.mkdir(parents=True, exist_ok=True)

        if table_name:
            ddl = generate_table_ddl(engine, table_name, schema)
            semantics = build_table_semantics(engine, table_name, schema)

            if args.output_path:
                payload: Dict[str, Any] = {"ddl": ddl, "semantics": semantics}
                text_out = json.dumps(payload, indent=2 if args.pretty else None)
                with open(args.output_path, "w", encoding="utf-8") as f:
                    f.write(text_out)
                print(f"Wrote combined output to {args.output_path}")
            else:
                base = f"{(schema or 'public')}.{table_name}"
                ddl_path = results_dir / f"{base}.ddl.sql"
                json_path = results_dir / f"{base}.semantics.json"
                if args.preserve_existing:
                    existing = _load_existing_semantics(json_path)
                    semantics = _merge_semantics(semantics, existing)
                with open(ddl_path, "w", encoding="utf-8") as f:
                    f.write(ddl)
                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(semantics, f, indent=2 if args.pretty else None)
                print(f"Wrote DDL to {ddl_path}")
                print(f"Wrote semantics JSON to {json_path}")
        else:
            # Multi-table mode: enumerate schemas and tables
            schemas_list: Optional[List[str]] = None
            if schema:
                # Allow comma-separated schemas in env/arg
                schemas_list = [s.strip() for s in str(schema).split(",") if s.strip()]
            targets = list_target_tables(engine, schemas_list)
            if not targets:
                print("No tables found to introspect.")
                return 0

            count = 0
            for target in targets:
                s = target["schema"]
                t = target["table"]
                try:
                    ddl = generate_table_ddl(engine, t, s)
                    semantics = build_table_semantics(engine, t, s)
                except Exception as exc:
                    print(f"WARN: Skipping {s}.{t}: {exc}", file=sys.stderr)
                    continue
                base = f"{(s or 'public')}.{t}"
                ddl_path = results_dir / f"{base}.ddl.sql"
                json_path = results_dir / f"{base}.semantics.json"
                if args.preserve_existing:
                    existing = _load_existing_semantics(json_path)
                    semantics = _merge_semantics(semantics, existing)
                with open(ddl_path, "w", encoding="utf-8") as f:
                    f.write(ddl)
                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(semantics, f, indent=2 if args.pretty else None)
                count += 1
            print(f"Wrote {count} table outputs to {results_dir}")

        return 0
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())


