from fastapi import APIRouter
from controllers.upload_controller import router as upload_router
from controllers.dashboard_controller import router as dashboard_router
from controllers.insights_controller import router as insights_router
from controllers.chat_controller import router as chat_router


api_router = APIRouter()
api_router.include_router(upload_router)
api_router.include_router(dashboard_router)
api_router.include_router(insights_router)
api_router.include_router(chat_router)



