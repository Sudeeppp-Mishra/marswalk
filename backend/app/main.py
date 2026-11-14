from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.endpoints import router as api_router
from .core.config import PROJECT_NAME, PROJECT_VERSION

app = FastAPI(
    title=f"{PROJECT_NAME} Surface Navigation Engine",
    description="Scientific terrain analysis and A* pathfinding backend for Jezero Crater, Mars.",
    version=PROJECT_VERSION,
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API endpoints under /api
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "project": PROJECT_NAME,
        "message": "Astro-nah Surface Navigation Engine API is running.",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

