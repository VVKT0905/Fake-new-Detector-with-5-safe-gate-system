import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add the parent directory to sys.path to import api
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api import app, Verdict

client = TestClient(app)

def test_health_check():
    # We haven't added /health yet, but we can check if /docs is accessible
    response = client.get("/docs")
    assert response.status_code == 200

def test_verify_empty_text():
    response = client.post("/api/verify", json={"text": ""})
    assert response.status_code == 422  # Validation error

def test_verify_logic_flow():
    # This is a bit hard to test without mocks, but let's check the schema
    # We'll use a text that likely triggers a quick result or fallback
    response = client.post("/api/verify", json={"text": "Xin chào, đây là một bài kiểm tra hệ thống."})
    assert response.status_code == 200
    data = response.json()
    assert "verdict" in data
    assert "explanation" in data
    assert "gate_fired" in data
    assert "signals" in data
    assert "sources" in data
