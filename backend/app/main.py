import logging
from app.logging_config import setup_logging

setup_logging()

import os
from app.db import create_mongo_client
from app.schemas import UserCVRequest, UserCVResponse, USER_CV_UPDATE_ALLOWED_FIELDS
from bson import ObjectId
from bson.errors import InvalidId
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from typing import Any
from slowapi import _rate_limit_exceeded_handler, Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.mongo_client = create_mongo_client(os.getenv("MONGODB_URI"))
    app.state.cvs = app.state.mongo_client["users"]["cvs"]
    yield
    await app.state.mongo_client.close()


logger = logging.getLogger(__name__)

_origins: str | None = os.getenv('ALLOWED_ORIGINS')

if not _origins:
    logger.error("ALLOWED_ORIGINS env var is not set")
    raise RuntimeError("ALLOWED_ORIGINS env var is not set")

ALLOWED_ORIGINS: list[str] = [o.strip() for o in _origins.split(',') if o.strip()]

app = FastAPI(title="CV App", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


limiter = Limiter(key_func=get_remote_address)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)



class PathError(Exception):
    pass


def get_by_dot_path(doc: dict[str, Any], path: str) -> Any:
      current = doc
      for key in path.split("."):
          current = current[key]

      return current

def get_cvs_collection(request: Request):
    return request.app.state.cvs

async def validate_fields_to_update(cvs, _id: ObjectId, fields_to_update: dict[str, Any]) -> dict[str, Any]:
    fields = fields_to_update.keys()
    if len(fields) == 0:
        raise ValueError("List of fields is empty.")

    for field in fields:
        if field not in USER_CV_UPDATE_ALLOWED_FIELDS:
            raise PathError(f"{field} is not a valid path.")

    doc = await cvs.find_one({"_id": _id})
    if doc is None:
        raise HTTPException(status_code=404, detail="CV not found")
    del doc['_id']

    for field, val in fields_to_update.items():
        keys = field.split(".")
        current = doc
        for key in keys[:-1]:
            current = current[key]

        current[keys[-1]] = val


    validated_doc = UserCVRequest.model_validate(doc).model_dump()
    validated_fields_to_update = {}

    for field in fields_to_update:
        validated_fields_to_update[field] = get_by_dot_path(validated_doc, field)

    return validated_fields_to_update

@app.get("/")
@limiter.limit("30/minute")
async def root(request: Request):

    logger.info("Successfully opened root endpoint.")
    return {
        "status":"ok"
    }

@app.get("/api/v1/users-cvs/{user_id}", response_model=UserCVResponse)
@limiter.limit("30/minute")
async def get_user_cv(
        request: Request,
        user_id: str,
        cvs = Depends(get_cvs_collection)
):
    try:
        _id = ObjectId(user_id)
    except InvalidId as err:
        logger.error(str(err), exc_info=err)
        raise HTTPException(status_code=400, detail=str(err))

    try:
        result = await cvs.find_one({"_id": _id})
    except Exception as err:
        logger.error("Failed to get doc from db.", exc_info=err)
        raise HTTPException(status_code=500, detail="Internal Server Error.")

    if result is None:
        logger.warning("No matched doc was founded.")
        raise HTTPException(status_code=404, detail="CV not found.")

    del result["_id"]
    logger.info("Successfully got doc from db.")
    return result

@app.get("/api/v1/users-cvs")
@limiter.limit("20/minute")
async def get_all_user_cvs(
        request: Request,
        skip: int = 0,
        limit: int = Query(le=100, default=10),
        cvs = Depends(get_cvs_collection)
) -> dict[str, int | list[dict[str, Any]]]:
     try:
        cursor = cvs.find().skip(skip).limit(limit)
        items = []
        async for doc in cursor:
            del doc["_id"]
            items.append(doc)
        total_count = await cvs.count_documents({})
        logger.info(f"Successfully retrieved {len(items)} CVs from db.")
        return {
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "items": items
        }
     except Exception as err:
        logger.error("Failed to get CV list from db.", exc_info=err)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/api/v1/users-cvs")
@limiter.limit("30/minute")
async def create_user_cv(
        request: Request,
        user_cv: UserCVRequest,
        cvs = Depends(get_cvs_collection)

) -> dict[str, str]:
    try:
        result = await cvs.insert_one(jsonable_encoder(user_cv))
    except Exception as err:
        logger.error("Failed to create doc in db.", exc_info=err)
        raise HTTPException(status_code=500, detail="Internal Server Error")

    answer = {
        "id": str(result.inserted_id),
        "status": "created"
    }
    logger.info("Successfully created doc in db.")
    return answer

@app.put("/api/v1/users-cvs/{user_id}")
@limiter.limit("30/minute")
async def update_user_cv(
        request: Request,
        user_id: str,
        fields_to_update: dict[str, Any],
        cvs = Depends(get_cvs_collection)

) -> dict[str, Any]:
    try:
        _id = ObjectId(user_id)
    except InvalidId as err:
        logger.error(str(err), exc_info=err)
        raise HTTPException(status_code=400, detail=str(err))


    try:
        validated_fields = await validate_fields_to_update(cvs, _id, fields_to_update)
    except HTTPException as err:
        logger.error("Failed to validate fields to update.", exc_info=err)
        raise
    except Exception as err:
        logger.error("Fields to update are not valid.", exc_info=err)
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Some fields are not valid update paths.",
                "invalid_fields": sorted(set(fields_to_update.keys()) - set(USER_CV_UPDATE_ALLOWED_FIELDS)),
                "allowed_fields": sorted(USER_CV_UPDATE_ALLOWED_FIELDS),
            },
        )

    try:
        result = await cvs.update_one({
            "_id": _id
        },{
            "$set": jsonable_encoder(validated_fields)
        })
    except Exception as err:
        logger.error("Failed to update doc in db.", exc_info=err)
        raise HTTPException(status_code=500, detail="Internal Server Error")

    if result.matched_count == 0:
        logger.warning("No matched doc was founded.")
        raise HTTPException(status_code=404, detail="CV not found")

    answer = {
        "id": user_id,
        "status": "updated",
        "updated_fields": fields_to_update
    }
    logger.info("Successfully updated doc in db.")
    return answer

@app.delete("/api/v1/users-cvs/{user_id}")
@limiter.limit("30/minute")
async def delete_user_cv(
        request: Request,
        user_id: str,
        cvs = Depends(get_cvs_collection)
) -> dict[str, str]:
    try:
        _id = ObjectId(user_id)
    except InvalidId as err:
        logger.error(str(err), exc_info=err)
        raise HTTPException(status_code=400, detail=str(err))

    try:
        result = await cvs.delete_one({"_id": _id})
    except Exception as err:
        logger.error("Failed to delete doc from db.", exc_info=err)
        raise HTTPException(status_code=500, detail="Internal Server Error")

    if result.deleted_count == 0:
        logger.warning("No matched doc was founded.")
        raise HTTPException(status_code=404, detail="CV not found")

    answer = {
        "id": user_id,
        "status": "deleted"
    }
    logger.info("Successfully deleted doc from db.")
    return answer
