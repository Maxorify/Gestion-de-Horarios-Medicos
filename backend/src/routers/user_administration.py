from fastapi import APIRouter, HTTPException

user_router = APIRouter(tags=["User Data"])

@user_router.get("/user-data")
async def user_data():
    pass
