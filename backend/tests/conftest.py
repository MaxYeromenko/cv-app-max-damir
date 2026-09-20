import os
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
