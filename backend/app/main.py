from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from app.db.db import connect_to_mongo, close_mongo_connection
from app.api.routes import auth, exam, admin, registration, report
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    from app.db.db import save_mock_db
    try:
        await save_mock_db()
    except Exception:
        pass
    await close_mongo_connection()


app = FastAPI(title="Online Assessment Platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(exam.router)
app.include_router(admin.router)
app.include_router(registration.router)
app.include_router(report.router)


@app.get("/")
def root():
    return {"message": "Backend is running 🚀"}


@app.get("/health")
def health():
    return {"status": "healthy"}
