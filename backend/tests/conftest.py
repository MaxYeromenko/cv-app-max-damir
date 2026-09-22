import json
import pytest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

@pytest.fixture
def payload():
    with open(BASE_DIR / "tests/request_example.json", 'r', encoding="utf-8") as req_exm_file:
        payload = json.load(req_exm_file)
    yield payload
    del payload
