from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.db.db import connect_to_mongo, close_mongo_connection
from app.api.routes import auth, exam, admin, registration


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(title="Online Assessment Platform", lifespan=lifespan)

# Include routers
app.include_router(auth.router)
app.include_router(exam.router)
app.include_router(admin.router)
app.include_router(registration.router)


@app.get("/")
def root():
    return {"message": "Backend is running 🚀"}


@app.get("/health")
def health():
    return {"status": "healthy"}
