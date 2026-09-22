from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

print(client.get("/api/v1/users-cvs/6aae673312890cb267e63c47").headers)