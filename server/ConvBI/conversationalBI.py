from dotenv import load_dotenv
load_dotenv()

import os 


from langgraph.graph import StateGraph,START,END 
from langgraph.graph.message import add_messages
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_core.messages import HumanMessage, AIMessage
from typing_extensions import TypedDict
from typing import Annotated,Dict,Any,Optional
from datetime import datetime
from pydantic import BaseModel
import asyncio
from decimal import Decimal

try:
    from ConvBI.prompts import (
        intent_prompt,
        greeting_prompt,
        text_to_sql_prompt,
        clarification_prompt,
        summarizer_prompt,
        prompt_ddl,
    )
except ModuleNotFoundError:
    import sys as _sys, os as _os
    _sys.path.append(_os.path.dirname(__file__))
    from prompts import (  # type: ignore
        intent_prompt,
        greeting_prompt,
        text_to_sql_prompt,
        clarification_prompt,
        summarizer_prompt,
        prompt_ddl,
    )
import psycopg 
import json
 

class WorkflowState(TypedDict):
    history:Annotated[list,add_messages]
    question:str 
    intent:str
    database_ddl:str
    total_database_semantics:Dict[str,Any]
    tablename:str 
    rephrased_question:str 
    semantic_info:Dict[str,Any]
    sql_query:str 
    query_result:str 
    query_error_message:str
    needs_clarification:bool 
    visualization_data:Dict[str,Any]
    final_answer:str


class StreamResponse(BaseModel):
    type: str
    data: dict
    timestamp: str
    thread_id: Optional[str] = None
    node: Optional[str] = None

class TextToSQLWorkflow:
    def __init__(self):
        self.llm=AzureChatOpenAI(
            azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
            azure_deployment=os.environ["AZURE_OPENAI_DEPLOYMENT_NAME"],
            openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            api_key=os.environ["AZURE_OPENAI_API_KEY"]
        )
    
    def _serialize_state_for_json(self, state: WorkflowState) -> Dict[str, Any]:
        """Helper method to serialize state for JSON output, handling non-serializable objects"""
        serializable_state = {}
        for key, value in state.items():
            if key == "history" and value:
                # Convert AIMessage objects to serializable format
                serializable_history = []
                for msg in value:
                    if hasattr(msg, 'content') and hasattr(msg, 'type'):
                        serializable_history.append({
                            "type": msg.type,
                            "content": msg.content
                        })
                    else:
                        serializable_history.append(str(msg))
                serializable_state[key] = serializable_history
            else:
                serializable_state[key] = value
        return serializable_state

    def _build_workflow(self)->StateGraph[WorkflowState]:
        graph_builder=StateGraph(WorkflowState)
        graph_builder.add_node("intent_classification",self._intent_classification_agent)
        graph_builder.add_node("greeting",self._greeting_agent)

        # Single-table flow: no table identification or external semantics lookup nodes
        graph_builder.add_node("text_to_sql",self._text_to_sql_agent)
        graph_builder.add_node("execute_sql_query", self._execute_sql_query)
        graph_builder.add_node("summarizer", self._summarizer_agent)
        graph_builder.add_node("clarification_agent", self._clarification_agent)
        graph_builder.add_node("visualization",self._visualization_agent)
        

        graph_builder.add_edge(START,"intent_classification")
        graph_builder.add_conditional_edges(
            "intent_classification",
            lambda state: state["intent"]=="general",
            {True:"greeting",False:"text_to_sql"}
            )
        
        graph_builder.add_edge("text_to_sql","execute_sql_query")
        graph_builder.add_conditional_edges(
            "execute_sql_query",
            lambda state:state["needs_clarification"]==True,
            {True:"clarification_agent",False:"summarizer"}
            )
        graph_builder.add_edge("summarizer", "visualization")
        graph_builder.add_edge("visualization",END)
        graph_builder.add_edge("greeting",END)
        # graph_builder.add_edge("text_to_sql",END)

        return graph_builder
    
    def _intent_classification_agent(self,state:WorkflowState)->WorkflowState:
        prompt=ChatPromptTemplate.from_messages(intent_prompt)

        prev_conv=state["history"][-6:] if state["history"] else []

        chain=prompt|self.llm 
        result=chain.invoke({
            "question":state["question"],
            "history":prev_conv   
            })
        
        state["intent"]=result.content.strip().lower() # need to a validation for the ["general","system_query"]
        
        # Use the helper method to serialize state for JSON
        try:
            serializable_state = self._serialize_state_for_json(state)
            with open("intent.json","w") as intent_json:
                json.dump(serializable_state, intent_json, indent=2)
        except Exception as e:
            print(f"Warning: Could not save intent.json: {e}")

        return state
    
    def _greeting_agent(self,state:WorkflowState)->WorkflowState:
        prompt=ChatPromptTemplate.from_messages(greeting_prompt)
        chain=prompt|self.llm 
        result=chain.invoke({
            "question":state["question"]
        })
        state["final_answer"]=result.content.strip()

        return state
    

    
    # Removed table identification and external semantics lookup
    
    def _text_to_sql_agent(self,state:WorkflowState)->WorkflowState:
        prompt=ChatPromptTemplate.from_messages(text_to_sql_prompt)

        prev_conv=state["history"][-6:] if state["history"] else []
        # print("="*8)
        # print(prev_conv)
        # print("="*6)
        chain=prompt|self.llm
        result=chain.invoke({
            "semantic_info":state["semantic_info"] ,
            "question":state["question"],
            "history":prev_conv
        })

        state["sql_query"]=result.content.strip()



        state["history"] = [
            HumanMessage(content=state["question"]),
            AIMessage(content=state["sql_query"])
        ]
        

        return state
    
    def _execute_sql_query(self, state: WorkflowState) -> WorkflowState:
        try:
            conn = self._get_db_connection()
            if not conn:
                raise Exception("Could not establish database connection")
            
            cursor = conn.cursor()
            cursor.execute(state["sql_query"])
           
            results = cursor.fetchall()
            columns = [description[0] for description in cursor.description]
            formatted_results = []
            for row in results:
                row_dict = dict(zip(columns, row))
                # Convert Decimal values to float for JSON serialization
                safe_row = {k: (float(v) if isinstance(v, Decimal) else v) for k, v in row_dict.items()}
                formatted_results.append(safe_row)
            
            state["query_result"] = formatted_results
            # Optimize state by storing only essential query info
            # state["history"] = [{"role":"system", "content":f"query_result_count: {len(results)}"}]
            state["needs_clarification"] = False
            
            cursor.close()
            conn.close()
            
        except Exception as e:
            state["query_error_message"] = str(e)
            state["needs_clarification"] = True
        return state

    def _get_db_connection(self):
        try:
            DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
            connection = psycopg.connect(DATABASE_URL)
            return connection
        except psycopg.Error as e:
            return None  
    
    def _summarizer_agent(self, state: WorkflowState) -> WorkflowState:

        
        prompt = ChatPromptTemplate.from_messages(summarizer_prompt)
        # Optimize history to reduce state size
        prez_conv = state["history"][-1:] if state["history"] else []
        chain = prompt | self.llm
        result = chain.invoke({
            "question": state["question"],
            "history": prez_conv,
            "query_result": state["query_result"],
            "tablename": "supplier_kpi_monthly"
        })
        state["final_answer"] = result.content.strip()
        state["history"] = [
            AIMessage(content=state["final_answer"])
        ]
        

        return state

    def _clarification_agent(self, state: WorkflowState) -> WorkflowState:
        prompt = ChatPromptTemplate.from_messages(clarification_prompt)
        prez_conv=state["history"]
        if len(state["history"])>2:
            prez_conv=state["history"][-2:]
        chain = prompt | self.llm
        result = chain.invoke({
            "question": state["question"],
            "history": prez_conv,
            "error_message": state["query_error_message"]
        })
        state["final_answer"] = result.content.strip()
        
        return state
    
    def _visualization_agent(self, state: WorkflowState) -> WorkflowState:
        
        """
        This agent uses GPT to generate a JSON for Apache ECharts based on the summary data.
        It creates a chart configuration in the ECharts JSON format.
        """
        question = state["question"]
        query_result = state["query_result"]
        
        # Assuming the query result is a list of dictionaries, let's pass it along with the question to GPT.
        try:
            # Parse the result (assuming it's a list of dictionaries)
            results = query_result

            # Now prompt GPT to generate the ECharts JSON for visualization
            prompt = ChatPromptTemplate.from_template(
                """
                Based on the following question and the query result data, generate an ECharts JSON  configuration for a chart:
                previous conversation: {history}

                Question: {question}
                Query Result Data (Assuming it's a list of dictionaries with column names and values): {query_result}

                Generate a JSON in the ECharts format suitable for a bar chart, line chart, or pie chart, depending on the question. Include any necessary configuration like xAxis, yAxis, series, tooltip, etc.
                #Instruction
                - Do generate Echarts only if it makes meaningful to generate chart based on the Question and Query Result Data
                - Respon with JSON no extra information/explanation need.
                - Don't add ```json or ``` in the output 
                - if you feel chat makes no meaning for the give Question and Query Result Data just return empty json curly braces
                """
            )

            chain = prompt | self.llm  # Assuming `self.llm` is already initialized as AzureChatOpenAI
            # Optimize history to reduce state size
            prez_conv = state["history"][-1:] if state["history"] else []

            result = chain.invoke({
                "question": question,
                "query_result":results, # Pass the results as JSON string to GPT
                "history": prez_conv
            })
            # Parse the output and save the JSON to state
            try:
                parsed = json.loads(result.content.strip())
                if isinstance(parsed, dict) and parsed:
                    state["visualization_data"] = parsed
                else:
                    state["visualization_data"] = self._build_basic_chart_from_result(results, question)
            except Exception:
                state["visualization_data"] = self._build_basic_chart_from_result(results, question)
            
        except json.JSONDecodeError as e:
            # Fallback to basic chart generation if LLM JSON isn't parseable
            state["visualization_data"] = self._build_basic_chart_from_result(results, question)
            state["needs_clarification"] = False
            
        return state

    def _build_basic_chart_from_result(self, rows: list, question: str) -> Dict[str, Any]:
        """Generate a simple ECharts option from tabular SQL results.
        - If a month column is present, create a line chart over months
        - Else create a bar chart for the first categorical vs first numeric
        Returns an ECharts option dict or empty dict if not feasible.
        """
        try:
            if not rows or not isinstance(rows, list):
                return {}
            first_non_empty = None
            for r in rows:
                if isinstance(r, dict) and r:
                    first_non_empty = r
                    break
            if not first_non_empty:
                return {}
            keys = list(first_non_empty.keys())
            if not keys:
                return {}

            def is_number(value: Any) -> bool:
                return isinstance(value, (int, float))

            numeric_keys: list[str] = []
            categorical_keys: list[str] = []
            for k in keys:
                sample_val = next((v for v in (r.get(k) for r in rows if isinstance(r, dict)) if v is not None), None)
                if is_number(sample_val):
                    numeric_keys.append(k)
                else:
                    categorical_keys.append(k)

            month_key = None
            for k in keys:
                lk = k.lower()
                if lk in ("month",):
                    month_key = k
                    break

            month_order = [1,2,3,4,5,6,7,8,9,10,11,12]
            month_name = {1:"Jan",2:"Feb",3:"Mar",4:"Apr",5:"May",6:"Jun",7:"Jul",8:"Aug",9:"Sep",10:"Oct",11:"Nov",12:"Dec"}

            y_key = numeric_keys[0] if numeric_keys else None
            if month_key and y_key:
                series_data = []
                x_labels = []
                by_month: Dict[int, float] = {}
                for r in rows:
                    try:
                        m = r.get(month_key)
                        if isinstance(m, str):
                            m = m.strip()[:3].title()
                            inv = {v:k for k,v in month_name.items()}
                            m = inv.get(m)
                        if isinstance(m, float):
                            m = int(m)
                        if isinstance(m, int) and 1 <= m <= 12:
                            val = r.get(y_key)
                            if is_number(val):
                                by_month[m] = by_month.get(m, 0.0) + float(val)
                    except Exception:
                        continue
                for m in month_order:
                    if m in by_month:
                        x_labels.append(month_name[m])
                        series_data.append(round(by_month[m], 4))
                if series_data:
                    title = question or "Trend by Month"
                    return {
                        "title": {"text": title},
                        "tooltip": {"trigger": "axis"},
                        "xAxis": {"type": "category", "data": x_labels},
                        "yAxis": {"type": "value"},
                        "series": [{"type": "line", "data": series_data, "smooth": True}],
                    }

            if y_key and categorical_keys:
                x_key = None
                preferred = ["supplier_name", "kpi_name", "year"]
                for pref in preferred:
                    for k in categorical_keys:
                        if k.lower() == pref:
                            x_key = k
                            break
                    if x_key:
                        break
                if not x_key:
                    x_key = categorical_keys[0]

                x_vals: list[str] = []
                y_vals: list[float] = []
                agg: Dict[str, float] = {}
                for r in rows:
                    x = r.get(x_key)
                    y = r.get(y_key)
                    if x is None or not is_number(y):
                        continue
                    x_str = str(x)
                    agg[x_str] = agg.get(x_str, 0.0) + float(y)
                for k, v in agg.items():
                    x_vals.append(k)
                    y_vals.append(round(v, 4))
                if x_vals and y_vals:
                    title = question or "Summary"
                    return {
                        "title": {"text": title},
                        "tooltip": {"trigger": "item"},
                        "xAxis": {"type": "category", "data": x_vals},
                        "yAxis": {"type": "value"},
                        "series": [{"type": "bar", "data": y_vals}],
                    }
        except Exception:
            return {}
        return {}
     

    def run_workflow(self,question:str,required_database_ddl,required_database_semantics):
        input_state=WorkflowState(
            question=question,
            intent="",
            semantic_info=required_database_semantics,
            sql_query="", 
            query_result=[], 
            query_error_message="",
            needs_clarification=False, 
            visualization_data={},
            final_answer=""
        )
        # print(input_state)

        workflow=self._build_workflow()
        history_db = os.getenv('HISTORY_DB_NAME')
        if PostgresSaver and history_db:
            DB_URI = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{history_db}"
            with PostgresSaver.from_conn_string(DB_URI) as checkpointer:
                checkpointer.setup()
                graph=workflow.compile(checkpointer=checkpointer)
                config = {"configurable": {"thread_id": "201"}}
                result = graph.invoke(input_state, config=config)
                return result
        else:
            graph = workflow.compile()
            result = graph.invoke(input_state)
            return result
        
    def run_stream_workflow(self,question:str,required_database_ddl,required_database_semantics):
        input_state = WorkflowState(
            question=question,
            intent="",
            semantic_info=required_database_semantics,
            sql_query="", 
            query_result=[], 
            query_error_message="",
            needs_clarification=False, 
            visualization_data={},
            final_answer=""
        )
        # print(input_state)
        # Use PostgresSaver checkpointer with synchronous streaming if configured
        workflow = self._build_workflow()
        history_db = os.getenv('HISTORY_DB_NAME')
        if PostgresSaver and history_db:
            DB_URI = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{history_db}"
            with PostgresSaver.from_conn_string(DB_URI) as checkpointer:
                checkpointer.setup()
                graph = workflow.compile(checkpointer=checkpointer)
                config = {"configurable": {"thread_id": "555"}}
                for chunk in graph.stream(
                    input=input_state,
                    config=config,
                    stream_mode="updates",
                ):
                    for node_name, update in chunk.items():
                        update_response = StreamResponse(
                            type="node_update",
                            data={"node": node_name},
                            node=node_name,
                            timestamp=datetime.now().isoformat(),
                        )
                        yield f"data: {update_response.model_dump_json()}\n\n"
                # After streaming node updates, emit a final payload for the client
                final_state = graph.get_state(config)
                try:
                    state_values = getattr(final_state, "values", final_state)
                    serializable = self._serialize_state_for_json(state_values)
                except Exception:
                    serializable = {}
                final_payload = {
                    "question": serializable.get("question"),
                    "sql_query": serializable.get("sql_query"),
                    "query_result": serializable.get("query_result"),
                    "final_answer": serializable.get("final_answer"),
                    "visualization_data": serializable.get("visualization_data", {}),
                }
                final_response = StreamResponse(
                    type="final",
                    data=final_payload,
                    timestamp=datetime.now().isoformat(),
                )
                yield f"data: {final_response.model_dump_json()}\n\n"
        else:
            graph = workflow.compile()
            # Provide a local thread_id config even without a checkpointer
            local_config = {"configurable": {"thread_id": "local"}}
            for chunk in graph.stream(
                input=input_state,
                config=local_config,
                stream_mode="updates",
            ):
                for node_name, update in chunk.items():
                    update_response = StreamResponse(
                        type="node_update",
                        data={"node": node_name},
                        node=node_name,
                        timestamp=datetime.now().isoformat(),
                    )
                    yield f"data: {update_response.model_dump_json()}\n\n"
            # After streaming node updates, emit a final payload for the client
            # When no checkpointer is set, get_state() is unsupported. Re-invoke once to get final values.
            # Note: This recomputes the workflow; acceptable trade-off for correctness without checkpointer.
            result_state = graph.invoke(input_state)
            serializable = self._serialize_state_for_json(result_state)
            final_payload = {
                "question": serializable.get("question"),
                "sql_query": serializable.get("sql_query"),
                "query_result": serializable.get("query_result"),
                "final_answer": serializable.get("final_answer"),
                "visualization_data": serializable.get("visualization_data", {}),
            }
            final_response = StreamResponse(
                type="final",
                data=final_payload,
                timestamp=datetime.now().isoformat(),
            )
            yield f"data: {final_response.model_dump_json()}\n\n"


def ddl_extraction(id: int) -> str:
    """Return the DDL for the active table.

    For this project we use the single-table DDL embedded in prompts (supplier_kpi_monthly).
    The id parameter is ignored for compatibility.
    """
    return prompt_ddl.strip()

def semantics_extraction(id: int):
    """Load the semantics JSON for supplier_kpi_monthly from the project semantics directory.

    The id parameter is ignored for compatibility.
    """
    try:
        from pathlib import Path
        semantics_path = Path(__file__).parent / "semantics" / "supplier_kpi_monthly.semantics.json"
        with open(semantics_path, "r", encoding="utf-8") as semantics_json:
            semantics = json.load(semantics_json)
            return semantics
    except FileNotFoundError:
        print("Warning: supplier_kpi_monthly.semantics.json not found. Using default semantics.")
        return {"table": "supplier_kpi_monthly", "columns": []}
    except Exception as e:
        print(f"Error reading semantics file: {e}")
        return {"table": "supplier_kpi_monthly", "columns": []}
    


if __name__ == "__main__":
    # Simple test: ask a question about the supplier_kpi_monthly table
    question = "Top 3 suppliers by On-Time Delivery in 2025"
    required_database_ddl = ddl_extraction(1)
    required_database_semantics = semantics_extraction(1)
    workflow = TextToSQLWorkflow()
    final_state = workflow.run_workflow(question, required_database_ddl, required_database_semantics)
    serializable_state = workflow._serialize_state_for_json(final_state)

    with open("text_to_sql.json", "w") as text_to_sql_json:
        json.dump(serializable_state, text_to_sql_json, indent=2, default=str)