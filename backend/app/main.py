from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.endpoints import router as api_router
from .core.config import PROJECT_NAME, PROJECT_VERSION

app = FastAPI(
    title=f"{PROJECT_NAME} Surface Navigation Engine",
    description="Scientific terrain analysis and A* pathfinding backend for Jezero Crater, Mars.",
    version=PROJECT_VERSION,
)

# Enable CORS for all frontends (Safari, Chrome, Vercel, Localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
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

@app.get("/health")
async def health_check_root():
    """Root-level health check endpoint for cloud load balancers and frontends."""
    return {
        "status": "ok",
        "project": PROJECT_NAME,
        "version": PROJECT_VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

