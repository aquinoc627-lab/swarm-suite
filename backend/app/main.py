from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.oauth import router as oauth_router

app = FastAPI(title="Swarm Suite API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(oauth_router)


@app.get("/")
async def root():
    return {"message": "Swarm Suite API is running"}
