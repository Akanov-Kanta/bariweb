import logging
from app.features.agent.schemas import ActionPlan, ActionStep
from app.features.agent.models import ActionIdempotency
from sqlmodel import Session, select
from app.core.database import engine

logger = logging.getLogger(__name__)

class ExecutorEngine:
    def can_execute_action(self, request_id: str) -> bool:
        with Session(engine) as session:
            stmt = select(ActionIdempotency).where(ActionIdempotency.request_id == request_id)
            if session.exec(stmt).first():
                return False
            return True
            
    def mark_executed(self, request_id: str):
        with Session(engine) as session:
            record = ActionIdempotency(request_id=request_id)
            session.add(record)
            session.commit()

    def execute_step(self, step: ActionStep, request_id: str, is_final: bool = False, confirm: bool = False) -> dict:
        sensitive_types = {"submit", "payment"}
        
        # Security: Prevent double execution
        if step.type in sensitive_types or is_final:
            if not self.can_execute_action(request_id):
                logger.warning(f"Prevented duplicate execution for request_id: {request_id}")
                return {"status": "blocked", "message": "Action already executed"}
            
            if not confirm:
                logger.info(f"Step {step.type} requires confirmation")
                return {"status": "requires_confirmation", "step": step.dict(), "message": "Sensitive action needs confirmation"}

        # Perform the actual check (e.g. DOM state via Selenium/Playwright if backend driven, or pass to frontend if widget driven)
        logger.info(f"Executing step {step.type} on selector {step.selector}")
        
        # Mark as executed if this was a final/sensitive action that succeeded
        if (step.type in sensitive_types or is_final) and confirm:
            self.mark_executed(request_id)
            logger.info(f"Marked request_id {request_id} as executed")

        return {"status": "executed", "step": step.dict()}

executor_engine = ExecutorEngine()
