import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, UniqueConstraint


class TrainedScreen(SQLModel, table=True):
    """
    Stores admin-annotated screen snapshots.
    Each record maps a fingerprint (hash of top buttons on the page)
    to a human-readable label, e.g. "Форма Жалоб" or "Профиль Пользователя".
    """
    __tablename__ = "trained_screens"
    __table_args__ = (
        UniqueConstraint("client_id", "fingerprint", name="unique_client_fingerprint"),
    )

    id: Optional[uuid.UUID] = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    client_id: str = Field(index=True)           # Links to the Client public_id
    fingerprint: str = Field(index=True)         # Element Blueprint hash token
    label: str                                   # Admin-assigned label
    description: Optional[str] = Field(default=None) # Optional explanation for the agent
    is_draft: bool = Field(default=False)        # True if auto-detected but not confirmed
    page_url: str = Field(default="")            # URL at time of training (informational)
    created_at: datetime = Field(default_factory=datetime.utcnow)
