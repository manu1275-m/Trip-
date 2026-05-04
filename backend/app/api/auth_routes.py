from fastapi import APIRouter
from pydantic import BaseModel
from app.core.security import create_access_token

router = APIRouter()

class User(BaseModel):
    name: str
    email: str

@router.post("/signup")
def signup(user: User):
    return {
        "message": "User created",
        "user": user
    }

@router.post("/login")
def login(user: User):

    token = create_access_token({"user": user.email})

    return {
        "message": "Login successful",
        "token": token
    }