import logging
import os
from app.logging_config import setup_logging

setup_logging()

from pymongo import AsyncMongoClient
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    logger.error("MONGODB_URI is not set")
    raise RuntimeError("MONGODB_URI is not set")
try:
    mongo_client = AsyncMongoClient(MONGODB_URI)
except Exception as err:
    logger.error("Failed to connect to mongodb server", exc_info=err)
    raise
db = mongo_client["users"]

def get_collection(coll_name):
    return db[coll_name]

