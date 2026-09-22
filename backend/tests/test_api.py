from urllib import response

import pytest
from app.main import app
from asgi_lifespan import LifespanManager
from app.schemas import UserCVRequest, UserCVResponse
from httpx import AsyncClient, ASGITransport


@pytest.fixture
async def client():
    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as async_client:
            yield async_client

@pytest.mark.api_test
@pytest.mark.api_test_get
async def test_get_root(client):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "status": "ok"
    }

@pytest.mark.api_test
@pytest.mark.api_test_get
async def test_get_cv(client, payload):
    response = await client.post("/api/v1/users-cvs", json=payload)
    assert response.status_code == 200, response.text
    _id = response.json()["id"]

    try:
        response = await client.get(f"/api/v1/users-cvs/{_id}")
        assert response.status_code == 200
        data = response.json()
        assert UserCVRequest.model_validate(data) == UserCVRequest.model_validate(payload)
    finally:
        response = await client.delete(f"/api/v1/users-cvs/{_id}")
        assert response.status_code == 200


@pytest.mark.api_test
@pytest.mark.api_test_get
async def test_get_cv_incorr_id(client, payload):
    _id = "1"
    response = await client.get(f"/api/v1/users-cvs/{_id}")
    assert response.status_code == 400
    assert response.json()["detail"] == f"'{_id}' is not a valid ObjectId, it must be a 12-byte input or a 24-character hex string"

@pytest.mark.api_test
@pytest.mark.api_test_get
async def test_get_cv_unexisted_id(client, payload):
    response = await client.post("/api/v1/users-cvs", json=payload)
    assert response.status_code == 200, response.text
    _id = response.json()["id"]

    response = await client.delete(f"/api/v1/users-cvs/{_id}")
    assert response.status_code == 200

    response = await client.get(f"/api/v1/users-cvs/{_id}")
    assert response.status_code == 404
    assert response.json()["detail"] == "CV not found."


@pytest.mark.api_test
@pytest.mark.api_test_get
@pytest.mark.parametrize('skip, limit, num_of_cvs', [
    (None, None, 1),
    (1, 1, 1),
    (1, 2, 2),
    (1, 2, 3),
])
async def test_get_cvs(client, payload, skip, limit, num_of_cvs):
    _ids = []
    for _ in range(num_of_cvs):
        response = await client.post("/api/v1/users-cvs", json=payload)
        assert response.status_code == 200, response.text
        _ids.append(response.json()["id"])


    try:
        expected_skip = 0 if skip is None else skip
        expected_limit = 10 if limit is None else limit
        query = "?"
        query += f"skip={skip}" if skip is not None else ""
        query += "&" if skip is not None else ""
        query += f"limit={limit}" if limit is not None else ""
        response = await client.get("/api/v1/users-cvs" + (query if query != "?" else ""))
        assert response.status_code == 200, response.text

        data = response.json()
        assert "total" in data
        assert data["skip"] == expected_skip
        assert data["limit"] == expected_limit
        assert all(UserCVResponse.model_validate(item) for item in data["items"])

    finally:
        for _id in _ids:
            response = await client.delete(f"/api/v1/users-cvs/{_id}")
            assert response.status_code == 200

@pytest.mark.api_test
@pytest.mark.api_test_post
async def test_post_cv(client, payload):
    response = await client.post("/api/v1/users-cvs", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "id" in data
    assert data["status"] == "created"

@pytest.mark.api_test
@pytest.mark.api_test_put
async def test_put_cv(client, payload):
    response = await client.post("/api/v1/users-cvs", json=payload)
    _id = response.json()["id"]

    try:
        fields2update = {
            "personal_info.first_name": "new name",
            "personal_info.nationality" : "new nationality"
        }
        response = await client.put(f"/api/v1/users-cvs/{_id}", json=fields2update)
        assert response.status_code == 200

        data = response.json()

        assert data == {
            "id": _id,
            "status": "updated",
            "updated_fields": fields2update
        }

    finally:
        response = await client.delete(f"/api/v1/users-cvs/{_id}")
        assert response.status_code == 200

@pytest.mark.api_test
@pytest.mark.api_test_put
async def test_put_cv_incorr_id(client):
    fields2update = {
        "personal_info.first_name": "new name",
        "personal_info.nationality": "new nationality"
    }
    _id = "1"
    response = await client.put(f"/api/v1/users-cvs/{_id}", json=fields2update)
    assert response.status_code == 400
    assert response.json()["detail"] == f"'{_id}' is not a valid ObjectId, it must be a 12-byte input or a 24-character hex string"


@pytest.mark.api_test
@pytest.mark.api_test_put
async def test_put_cv_unexisted_id(client, payload):
    response = await client.post("/api/v1/users-cvs", json=payload)
    _id = response.json()["id"]

    response = await client.delete(f"/api/v1/users-cvs/{_id}")
    assert response.status_code == 200


    fields2update = {
        "personal_info.first_name": "new name",
        "personal_info.nationality" : "new nationality"
    }
    response = await client.put(f"/api/v1/users-cvs/{_id}", json=fields2update)
    assert response.status_code == 404
    assert response.json()["detail"] == "CV not found"



@pytest.mark.api_test
@pytest.mark.api_test_put
async def test_put_cv_invalid_fields(client, payload):
    response = await client.post("/api/v1/users-cvs", json=payload)
    _id = response.json()["id"]

    try:
        fields2update = {
            "personal_info.middle_name": "new name",
            "nationality" : "new nationality"
        }
        response = await client.put(f"/api/v1/users-cvs/{_id}", json=fields2update)
        assert response.status_code == 422
        assert response.json()["detail"]["message"] == "Some fields are not valid update paths."

    finally:
        response = await client.delete(f"/api/v1/users-cvs/{_id}")
        assert response.status_code == 200

@pytest.mark.api_test
@pytest.mark.api_test_delete
async def test_delete_cv(client, payload):
    response = await client.post("/api/v1/users-cvs", json=payload)
    _id = response.json()["id"]

    response = await client.delete(f"/api/v1/users-cvs/{_id}")
    assert response.status_code == 200

    data = response.json()

    assert data == {
        "id": _id,
        "status": "deleted"
    }

@pytest.mark.api_test
@pytest.mark.api_test_delete
async def test_delete_cv_incorr_id(client):
    _id = "1"

    response = await client.delete(f"/api/v1/users-cvs/{_id}")
    assert response.status_code == 400
    assert response.json()["detail"] == f"'{_id}' is not a valid ObjectId, it must be a 12-byte input or a 24-character hex string"


@pytest.mark.api_test
@pytest.mark.api_test_delete
async def test_delete_cv_unexisted_id(client, payload):
    response = await client.post("/api/v1/users-cvs", json=payload)
    _id = response.json()["id"]

    response = await client.delete(f"/api/v1/users-cvs/{_id}")
    assert response.status_code == 200

    response = await client.delete(f"/api/v1/users-cvs/{_id}")
    assert response.status_code == 404
    assert response.json()["detail"] == "CV not found"