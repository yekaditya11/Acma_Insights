from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Any, Dict, Optional
import logging

try:
    from ConvBI.conversationalBI import TextToSQLWorkflow, ddl_extraction, semantics_extraction
except ModuleNotFoundError as exc:
    # Fallback to relative import if package-style import fails
    from ..ConvBI.conversationalBI import TextToSQLWorkflow, ddl_extraction, semantics_extraction  # type: ignore


logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    question: str
    stream: Optional[bool] = False


router = APIRouter()


@router.post("/chat")
def chat_endpoint(body: ChatRequest) -> Dict[str, Any]:
    try:
        workflow = TextToSQLWorkflow()
        ddl = ddl_extraction(1)
        semantics = semantics_extraction(1)

        final_state = workflow.run_workflow(body.question, ddl, semantics)
        serializable_state = workflow._serialize_state_for_json(final_state)

        # Return key parts of the state for the client
        response: Dict[str, Any] = {
            "question": serializable_state.get("question"),
            "sql_query": serializable_state.get("sql_query"),
            "query_result": serializable_state.get("query_result"),
            "final_answer": serializable_state.get("final_answer"),
            "visualization_data": serializable_state.get("visualization_data", {}),
        }
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error in /chat endpoint")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


@router.post("/chat/stream")
def chat_stream_endpoint(body: ChatRequest):
    """Server-Sent Events (SSE) streaming endpoint for Conversational BI.

    Emits 'node_update' events as each workflow node completes, and a final 'final'
    event with the assembled response payload {question, sql_query, query_result, final_answer, visualization_data}.
    """
    try:
        workflow = TextToSQLWorkflow()
        ddl = ddl_extraction(1)
        semantics = semantics_extraction(1)

        def event_generator():
            for sse_line in workflow.run_stream_workflow(body.question, ddl, semantics):
                yield sse_line

        headers = {
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
        return StreamingResponse(event_generator(), media_type="text/event-stream", headers=headers)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error in /chat/stream endpoint")
        raise HTTPException(status_code=500, detail=f"Chat streaming failed: {str(e)}")

