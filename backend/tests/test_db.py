import bson
import pytest
import os
from bson import ObjectId
import pytest_asyncio
from pymongo import AsyncMongoClient
from dotenv import load_dotenv

load_dotenv()

@pytest_asyncio.fixture
async def collection():
    client = AsyncMongoClient(os.getenv("MONGODB_URI"))
    coll = client["users"]["test_cvs"]
    yield coll
    await client.close()


@pytest_asyncio.fixture
async def _id(collection):
    result = await collection.insert_one({"name": "John", "age": 21, "city": "California"})
    yield result.inserted_id




@pytest.mark.db_test
@pytest.mark.db_normal_case
async def test_collection_name(collection):
    assert collection.name == "test_cvs"



@pytest.mark.db_test
@pytest.mark.db_normal_case
async def test_create_doc(collection):
    result = await collection.insert_one({"name": "John", "age": 21, "city": "California"})
    assert result.inserted_id is not None

@pytest.mark.db_test
@pytest.mark.db_normal_case
async def test_get_doc(collection, _id):
    result = await collection.find_one({"_id": _id})
    assert result is not None

@pytest.mark.db_test
@pytest.mark.db_normal_case
async def test_update_doc(collection, _id):
    result = await collection.update_one({"_id": _id}, {"$set": {"age": 25}})
    assert result.modified_count == 1

@pytest.mark.db_test
@pytest.mark.db_normal_case
async def test_delete_doc(collection, _id):
    result = await collection.delete_one({"_id": _id})
    assert result.deleted_count == 1
    assert await collection.find_one({"_id": _id}) is None



########################################################################################################################

@pytest.mark.db_test
@pytest.mark.db_exception_case
@pytest.mark.parametrize('n', [
    1,
    2,
    '1',
    1.0
])
def test_incorrect_id(n):
    with pytest.raises((bson.errors.InvalidId, TypeError)):
        _id = ObjectId(n)

@pytest.mark.db_test
@pytest.mark.db_exception_case
async def test_get_unexisted(collection):
    result = await collection.insert_one({"name": "John", "age": 21})
    _id = result.inserted_id
    await collection.delete_one({"_id": _id})
    doc = await collection.find_one({"_id": _id})
    assert doc is None

@pytest.mark.db_test
@pytest.mark.db_exception_case
async def test_update_unexisted(collection):
    result = await collection.insert_one({"name": "John", "age": 21})
    _id = result.inserted_id
    await collection.delete_one({"_id": _id})
    result = await collection.update_one({"_id": _id}, {"$set": {"age": 25}})
    assert result.modified_count == 0

@pytest.mark.db_test
@pytest.mark.db_exception_case
async def test_delete_collection(collection):
    result = await collection.insert_one({"name": "John", "age": 21})
    _id = result.inserted_id
    await collection.delete_one({"_id": _id})
    result = await collection.delete_one({"_id": _id})
    assert result.deleted_count == 0




