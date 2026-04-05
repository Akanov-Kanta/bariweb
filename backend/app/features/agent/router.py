from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from app.features.agent.schemas import PlanRequest, ActionPlan, ExecuteRequest
from app.services.plan_service import plan_service
from app.services.executor import executor_engine
from app.features.auth.dependencies import validate_widget_request
from app.features.organizations.models import Client

agent_router = APIRouter(tags=["agent"])

@agent_router.post("/v1/agent/plan", response_model=ActionPlan)
def generate_plan(
    req: PlanRequest,
    client: Client = Depends(validate_widget_request)
):
    """
    Generate or retrieve an Action Plan based on user goal and page context.
    Uses Postgres as a caching layer to avoid redundant LLM calls.
    """
    try:
        plan = plan_service.get_plan(req.url, req.goal, req.elements_context)
        return plan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")

@agent_router.post("/v1/agent/execute")
def execute_step(
    req: ExecuteRequest,
    confirm: bool = False,
    client: Client = Depends(validate_widget_request)
) -> Dict[str, Any]:
    """
    Execute a step.
    For sensitive actions (submit, payment) or final steps, checks idempotency using request_id.
    Requires `confirm=true` query param to bypass confirmation block for sensitive actions.
    """
    try:
        result = executor_engine.execute_step(
            step=req.step,
            request_id=req.request_id,
            is_final=req.is_final,
            confirm=confirm
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")
