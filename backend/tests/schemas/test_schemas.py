import json
import pytest
from app.schemas import *
from pathlib import Path
from pydantic import ValidationError
from typing import Any

BASE_DIR = Path(__file__).resolve().parent.parent.parent

def get_by_dot_path(d: dict[str, Any], path: str, val: Any) -> Any:
    current = d
    keys = path.split(".")
    for key in keys[:-1]:
        try:
            key = int(key)
            current = current[key]
        except:
            current = current[key]

    current[keys[-1]] = val

@pytest.fixture
def payload():
    with open(BASE_DIR / "tests/schemas/request_example.json", 'r', encoding="utf-8") as req_exm_file:
        payload = json.load(req_exm_file)
    yield payload
    del payload

@pytest.mark.schemas_test
def test_corr_payload(payload):
    pyd_model = UserCVRequest(**payload)


@pytest.mark.schemas_test
def test_extra_fields(payload):
    with pytest.raises(ValidationError):
        payload['extra'] = 'field'
        pyd_model = UserCVRequest(**payload)

@pytest.mark.schemas_test
def test_invalid_payload(payload):
    with pytest.raises(ValidationError):
        del payload['personal_info']
        pyd_model = UserCVRequest(**payload)

@pytest.mark.schemas_test
@pytest.mark.parametrize('field', [
    'first_name',
    'last_name',
    'nationality'
    'phone'
])
def test_too_short_fields(payload, field):
    with pytest.raises(ValidationError):
        payload['personal_info'][field] = '.'*9 if field == "phone" else ''
        pyd_model = UserCVRequest(**payload)

@pytest.mark.schemas_test
@pytest.mark.parametrize('field', [
    'first_name',
    'last_name',
    'nationality'
    'phone'
])
def test_too_long_fields(payload, field):
    with pytest.raises(ValidationError):
        payload['personal_info'][field] = "."*16 if field == "phone" else "."*21
        pyd_model = UserCVRequest(**payload)

@pytest.mark.schemas_test
def test_email_fields(payload):
    with pytest.raises(ValidationError):
        payload["personal_info"]["email"] = "not-email"
        pyd_model = UserCVRequest(**payload)

@pytest.mark.schemas_test
def test_invalid_date(payload):
    with pytest.raises(ValidationError):
        payload['personal_info']['date_of_birth,'] = "not-date"
        pyd_model = UserCVRequest(**payload)

@pytest.mark.schemas_test
@pytest.mark.parametrize('path, val', [
    ("personal_info.gender", "unknown"),
    ("languages.0.proficiency", "fluent"),
    ("programming_skills.0.level", "godmode"),
    ("favorite_subjects_in_school", "astronomy")
])
def test_enums(payload, path, val):
    with pytest.raises(ValidationError):
        get_by_dot_path(payload, path, val)
        pyd_model = UserCVRequest(**payload)

@pytest.mark.schemas_test
def test_with_optional_field(payload):
    payload['personal_info']['preferred_name'] = "JK"
    pyd_model = UserCVRequest(**payload)

@pytest.mark.schemas_test
def test_optional_is_none(payload):
    payload['personal_info']['preferred_name'] = None
    pyd_model = UserCVRequest(**payload)

@pytest.mark.schemas_test
def test_embedded_lists_validation(payload):
    with pytest.raises(ValidationError):
        payload["languages"] = [{"name": "", "proficiency": "native"}]
        pyd_model = UserCVRequest(**payload)

@pytest.mark.schemas_test
def test_equality_request_response(payload):
    pyd_model = UserCVResponse(**UserCVRequest(**payload).model_dump())


@pytest.mark.schemas_test
def test_device_access_field(payload):
    with pytest.raises(ValidationError):
        payload["device_access"]["weekly_hours"] = -1
        pyd_model = UserCVRequest(**payload)

@pytest.mark.schemas_test
def test_publication_authors_default_value(payload):
    del payload["publications"][0]["authors"]
    pyd_model = UserCVRequest(**payload)
    assert pyd_model.publications[0].authors == []