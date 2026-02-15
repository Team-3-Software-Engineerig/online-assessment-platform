from fastapi import FastAPI

app = FastAPI(title="Online Assessment Platform")

@app.get("/")
def root():
    return {"message": "Backend is running 🚀"}
