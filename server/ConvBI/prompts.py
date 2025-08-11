intent_prompt = [
    ("human", """Classify the user's intent based on their question and full conversation history.

Current question: {question}

Conversation history: {history}

Categories:
- general: General greetings, pleasantries, casual conversation (hi, hello, bye, thanks etc.)
- system_query: Questions about data, database queries, system information, get data, etc.

IMPORTANT: Use the conversation history to understand context. For example:
- If previous questions were about data and current question is "What about region X?", classify as system_query
- If this is a follow-up question referencing previous data queries, classify as system_query

Respond with only the category name (general or system_query)""")
]

greeting_prompt = [
    ("human", """Respond to the user's greeting or casual message in a friendly, professional manner.
Keep it brief and helpful.
User message: {question}""")
]

table_identification_prompt = [
    ("human", """Identify the table name which need to be queried to answer the question based on the DDL and previous conversation given below.
DDL: {ddl}
User question: {question}
previous conversation: {history}
just return the table name. no explanation needed.""")
]

text_to_sql_prompt = [
    ("human", """You are an expert SQL generator for the table public.supplier_kpi_monthly. Convert the user's question into a single SQL query using the provided semantic info and conversation history.

CONTEXT:
- Current question: {question}
- Previous conversation: {history}
- Semantic info (columns and constraints): {semantic_info}

TABLE AND COLUMNS:
- Table: supplier_kpi_monthly
- Columns: supplier_name (TEXT), kpi_name (TEXT), year (INTEGER), month (SMALLINT 1-12), value (NUMERIC), unit (TEXT), generated_on (DATE), created_at (TIMESTAMPTZ)

RULES:
1) Always SELECT from supplier_kpi_monthly.
2) Use exact column names.
3) Respect data types. Example filters:
   - year = 2024
   - month BETWEEN 1 AND 12
   - supplier_name ILIKE '%Acme%'
   - kpi_name = 'On-Time Delivery'
4) Aggregations:
   - Use AVG(value), SUM(value), MIN(value), MAX(value), COUNT(*) as needed.
   - GROUP BY the non-aggregated columns referenced (e.g., supplier_name, month, year, kpi_name).
5) Ranking/Top-N:
   - Use ORDER BY ... DESC/ASC and LIMIT N.
6) Trends over months:
   - Select month and aggregate over value with WHERE year = <year> ORDER BY month.
7) Comparisons across years/suppliers/KPIs:
   - GROUP BY the comparison dimension (e.g., year or supplier_name) and aggregate value.
8) Follow-ups:
   - If the question is a follow-up, incorporate prior context (supplier, kpi, year) from {history} unless the user changes it.
9) Use semantic sample values:
    - Prefer exact values from semantic_info.sample_values for text columns (e.g., kpi_name, supplier_name).
    - Do NOT invent KPI names or suppliers. If the user didn't specify a KPI/supplier and none is implied by history, omit that filter.
    - If the question requires a specific KPI/supplier but it's ambiguous (not present in sample values), return a simple query without that filter.
10) Output:
   - Return ONLY the SQL query. No explanations, no markdown.

EXAMPLES:
- "Top 5 suppliers by On-Time Delivery in 2024":
  SELECT supplier_name, AVG(value) AS avg_value
  FROM public.supplier_kpi_monthly
  WHERE kpi_name = 'On-Time Delivery' AND year = 2024
  GROUP BY supplier_name
  ORDER BY avg_value DESC
  LIMIT 5;

- "Trend of Defect Rate for Acme Corp in 2023":
  SELECT month, AVG(value) AS avg_value
  FROM public.supplier_kpi_monthly
  WHERE supplier_name ILIKE '%Acme Corp%' AND kpi_name = 'Defect Rate' AND year = 2023
  GROUP BY month
  ORDER BY month;

Now generate the SQL query:""")
]
prompt_ddl="""
CREATE TABLE supplier_kpi_monthly (
    id BIGSERIAL NOT NULL, 
    supplier_name TEXT NOT NULL, 
    kpi_name TEXT NOT NULL, 
    year INTEGER NOT NULL, 
    month SMALLINT NOT NULL, 
    value NUMERIC, 
    unit TEXT, 
    generated_on DATE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    CONSTRAINT supplier_kpi_monthly_pkey PRIMARY KEY (id), 
    CONSTRAINT supplier_kpi_monthly_supplier_name_kpi_name_year_month_key UNIQUE (supplier_name, kpi_name, year, month), 
    CONSTRAINT supplier_kpi_monthly_month_check CHECK (month >= 1 AND month <= 12)
);

"""

clarification_prompt = [
    ("human", """Based on the user's question and the error message, ask user to provide more information. It shouldn't be techinical like asking for column names.
User question: {question}
Error Message: {error_message}
previous conversation: {history}
Respond with only the rephrased question. no explanation needed.""")
]

summarizer_prompt= [
    ("human", """Summarize the SQL result for public.supplier_kpi_monthly based on the question and conversation context.

User question: {question}
Query result: {query_result}
Previous conversation: {history}
Table name: {tablename}

Guidelines:
- Be concise and business-focused.
- Refer to supplier, KPI, year, month, and units when relevant.
- If it is a follow-up, acknowledge comparisons or changed filters.
- Highlight notable highs/lows and trends over time.
- Use simple language; avoid technical SQL terms.

Respond with only the summary.""")
]


summarizer_prompt_2=[("human","""
You are an assistant summarizing supplier KPI data from public.supplier_kpi_monthly for leadership. Provide concise, data-driven insights about suppliers and KPIs (trends, comparisons, highs/lows), referencing units and timeframes when available. Keep it professional and brief.

User question: {question}
Query result: {query_result}
Previous conversation: {history}
Table name: {tablename}
""")]