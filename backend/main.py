from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import shutil
import os
import tempfile
from analysis import analyze_audio_files
import traceback

app = FastAPI()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"GLOBAL ERROR: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "traceback": traceback.format_exc()},
    )


@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"START Request: {request.method} {request.url}", flush=True)
    try:
        response = await call_next(request)
        print(f"END Request: {request.method} {request.url} Status: {response.status_code}", flush=True)
        return response
    except Exception as e:
        print(f"REQUEST FAILED: {request.method} {request.url} Error: {e}", flush=True)
        # Re-raise so the exception handler catches it
        raise e

# CORS config allowing frontend access
# CORS config allowing frontend access
# Default to allow all for convenience, but can be locked down via env
origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "VibeSync Backend is Running"}

@app.post("/analyze")
async def analyze_endpoint(
    reference: UploadFile = File(...),
    user: UploadFile = File(...)
):
    print(f"Received Request: Reference={reference.filename}, User={user.filename}")
    try:
        # Create temp files to store uploads
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as ref_tmp:
            shutil.copyfileobj(reference.file, ref_tmp)
            ref_path = ref_tmp.name

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as user_tmp:
            shutil.copyfileobj(user.file, user_tmp)
            user_path = user_tmp.name

        print(f"Saved temp files: {ref_path}, {user_path}")

        # Perform Analysis
        results = analyze_audio_files(ref_path, user_path)
        print(f"Analysis Results: {results}")

        # Cleanup
        try:
            os.remove(ref_path)
            os.remove(user_path)
        except Exception as e:
            print(f"Cleanup error: {e}")

        # Return Results
        return {
            "rhythm_precision": results["rhythm_precision"],
            "dynamics_match": results["dynamics_match"],
            "intonation_accuracy": results["intonation_accuracy"]
        }

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
