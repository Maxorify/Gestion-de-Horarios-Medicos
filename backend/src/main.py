from fastapi import FastAPI
import os 
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def inicio() -> dict:
    return {"message": "Gestion de horarios médicos,", 
            "Database": "Supabase",
            "Version": "0.0.1",
            "Framework": "FastAPI",
            "Autor": "Max Ovalle"}
    
