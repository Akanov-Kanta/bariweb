from fastapi.testclient import TestClient
from app.main import app
from app.features.auth.dependencies import get_current_user
from app.features.auth.schemas import User

def mock_get_current_user():
    return User(
        id="796a16d0-1548-4ee5-9662-7d5b777aa12d",
        email="test@test.com",
        created_at="temp"
    )

app.dependency_overrides[get_current_user] = mock_get_current_user
client = TestClient(app)

res = client.get("/clients/my")
print(res.status_code)
print(res.json())
