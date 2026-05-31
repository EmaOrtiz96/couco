from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import productos, pedidos, extras, auth, otros
import os

app = FastAPI(title="Couco Aromas API v3", version="3.0.0")

app.add_middleware(CORSMiddleware,
    allow_origins=["https://couco.vercel.app","http://localhost:5173","http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(productos.router)
app.include_router(pedidos.router)
app.include_router(extras.router)
app.include_router(otros.cats)
app.include_router(otros.contact)
app.include_router(otros.adm)

@app.get("/")
def root(): return {"message":"Couco Aromas API v3 🌸","docs":"/docs"}