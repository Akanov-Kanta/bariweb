from sqlmodel import SQLModel, Field, Column, JSON
from typing import Optional
import datetime

class PlanCache(SQLModel, table=True):
    __tablename__ = "agent_plan_cache"
    id: Optional[int] = Field(default=None, primary_key=True)
    url: str = Field(index=True)
    goal_hash: str = Field(index=True)
    plan_json: dict = Field(sa_column=Column(JSON))
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

class ActionIdempotency(SQLModel, table=True):
    __tablename__ = "agent_action_idempotency"
    id: Optional[int] = Field(default=None, primary_key=True)
    request_id: str = Field(index=True, unique=True)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
