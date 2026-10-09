from fastapi import FastAPI

app = FastAPI(
    title="Football AI Analysis and Prediction Platform",
    version="0.1.0",
    description="Football match analysis and prediction API",
)

@app.get("/")
def health_check():
    return {
        "status": "running",
        "message": "Football AI backend is online",
        "version": "0.1.0",
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
