import os
from dotenv import load_dotenv
from fastapi import FastAPI
from schemas import UserCVRequest

load_dotenv()

app = FastAPI()
MONGODB_API_KEY = os.getenv("MONGODB_API_KEY")

@app.get("/")
async def root():
    return {
        "status":"ok"
    }

@app.get("/api/v1/usercv/{user_id}")
async def get_usercv(user_id: int):
    return {"status":"ok"}

@app.post("/api/v1/usercv")
async def create_usercv(usercv: UserCVRequest):
    return {"status":"ok"}

@app.put("/api/v1/usercv/{user_id}")
async def update_usercv(usercv: UserCVRequest):
    return {"status":"ok"}

@app.delete("/api/v1/usercv/{user_id}")
async def delete_usercv(user_id: int):
    return {"status":"ok"}
