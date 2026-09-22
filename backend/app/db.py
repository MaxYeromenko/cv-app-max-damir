import logging
from app.logging_config import setup_logging

setup_logging()

from pymongo import AsyncMongoClient


logger = logging.getLogger(__name__)

def create_mongo_client(uri: str) -> AsyncMongoClient:
    if not uri:
        logger.error("MONGODB_URI is not set.")
        raise RuntimeError("MONGODB_URI is not set.")
    try:
        return AsyncMongoClient(uri)
    except Exception as err:
        logger.error("Failed to connect to mongodb server", exc_info=err)
        raise