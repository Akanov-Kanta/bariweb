from pydantic import BaseModel
from typing import List, Optional, Literal

class ActionStep(BaseModel):
    type: Literal["read", "click", "input", "submit", "navigation"]
    selector: str
    value: Optional[str] = None
    description: str

class ActionPlan(BaseModel):
    url: str
    goal: str
    steps: List[ActionStep]

class PlanRequest(BaseModel):
    url: str
    goal: str
    elements_context: str = ""

class ExecuteRequest(BaseModel):
    request_id: str
    step: ActionStep
    is_final: bool = False
