import logging
from app.logging_config import setup_logging

setup_logging()

from pymongo import AsyncMongoClient
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

'''MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    logger.error("MONGODB_URI is not set")
    raise RuntimeError("MONGODB_URI is not set")'''
MONGODB_URI = "mongodb+srv://phantom393650_db_user:7n2BN7HjbV316PVT@cluster0.4mifcpm.mongodb.net/?appName=Cluster0"
try:
    mongo_client = AsyncMongoClient(MONGODB_URI)
except Exception as err:
    logger.error("Failed to connect to mongodb server", exc_info=err)
    raise
db = mongo_client["users"]
cvs = db["cvs"]