import logging

from backend.app.logging_config import setup_logging

setup_logging()

from backend.app.db import get_collection
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.encoders import jsonable_encoder
from backend.app.schemas import UserCVRequest, UserCVResponse, USER_CV_UPDATE_ALLOWED_FIELDS
from typing import Any
from slowapi import _rate_limit_exceeded_handler, Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

app = FastAPI(title="CV App")

limiter = Limiter(key_func=get_remote_address)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

logger = logging.getLogger(__name__)

try:
    cvs = get_collection('cvs')
except Exception as err:
    logger.error("Failed to get collection.", exc_info=err)
    raise HTTPException(status_code=500, detail="Internal Server Error.")

class PathError(Exception):
    pass


def get_by_dot_path(doc: dict[str, Any], path: str) -> Any:
      current = doc
      for key in path.split("."):
          current = current[key]

      return current

async def validate_fields_to_update(_id: ObjectId, fields_to_update: dict[str, Any]) -> dict[str, Any]:
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

@app.get("/api/v1/user-cv/{user_id}", response_model=UserCVResponse)
@limiter.limit("30/minute")
async def get_user_cv(
        request: Request,
        user_id: str
):
    try:
        _id = ObjectId(user_id)
    except InvalidId as err:
        logger.error("Failed to make ObjectID.", exc_info=err)
        raise HTTPException(status_code=400, detail=str(err))

    try:
        result = await cvs.find_one({"_id": _id})
    except Exception as err:
        logger.error("Failed to get doc from db.", exc_info=err)
        raise HTTPException(status_code=500, detail="Internal Server Error")

    if result is None:
        logger.warning("No matched doc was founded.")
        raise HTTPException(status_code=404, detail="CV not found")

    del result["_id"]
    logger.info("Successfully got doc from db.")
    return result

@app.get("/api/v1/user-cv")
@limiter.limit("20/minute")
async def get_all_user_cvs(
        request: Request,
        skip: int = Query(gt=0, default=0),
        limit: int = Query(gt=0, le=100, default=100)
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

@app.post("/api/v1/user-cv")
@limiter.limit("30/minute")
async def create_user_cv(
        request: Request,
        user_cv: UserCVRequest
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

@app.put("/api/v1/user-cv/{user_id}")
@limiter.limit("30/minute")
async def update_user_cv(
        request: Request,
        user_id: str,
        fields_to_update: dict[str, Any]
) -> dict[str, Any]:
    try:
        _id = ObjectId(user_id)
    except InvalidId as err:
        logger.error("Failed to make ObjectID.", exc_info=err)
        raise HTTPException(status_code=400, detail=str(err))


    try:
        validated_fields = await validate_fields_to_update(_id, fields_to_update)
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

@app.delete("/api/v1/user-cv/{user_id}")
@limiter.limit("30/minute")
async def delete_user_cv(
        request: Request,
        user_id: str
) -> dict[str, str]:
    try:
        _id = ObjectId(user_id)
    except InvalidId as err:
        logger.error("Failed to make ObjectID.", exc_info=err)
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
