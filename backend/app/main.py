from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import registration

app = FastAPI(title="Online Assessment Platform")

# CORS middleware to allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(registration.router)

@app.get("/")
def root():
    return {"message": "Backend is running 🚀"}
