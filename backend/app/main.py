import shutil
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.database import engine, Base
from app.routes import (
    auth, products, voice, nlp, customers, khata, billing, inventory, transactions, analytics
)

# Create all database tables on startup & ensure new columns exist
Base.metadata.create_all(bind=engine)

inspector = inspect(engine)
if "users" in inspector.get_table_names():
    existing_cols = [c["name"] for c in inspector.get_columns("users")]
    with engine.connect() as conn:
        if "upi_id" not in existing_cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN upi_id VARCHAR(100) DEFAULT 'akashkarka@ybl'"))
        if "upi_phone" not in existing_cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN upi_phone VARCHAR(20) DEFAULT '9346009164'"))
        conn.commit()

app = FastAPI(
    title="VendorGPT API",
    description="AI-Powered Multilingual Voice Billing and Smart Retail Management System",
    version="1.0.0"
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(voice.router)
app.include_router(nlp.router)
app.include_router(customers.router)
app.include_router(khata.router)
app.include_router(billing.router)
app.include_router(inventory.router)
app.include_router(transactions.router)
app.include_router(analytics.router)

@app.get("/")
def root():
    return {
        "app": "VendorGPT API",
        "status": "online",
        "version": "1.0.0",
        "documentation": "/docs"
    }


@app.get("/debug/ffmpeg")
def debug_ffmpeg():
    ffmpeg_path = shutil.which("ffmpeg")

    return {
        "ffmpeg_installed": ffmpeg_path is not None,
        "ffmpeg_path": ffmpeg_path
    }
@app.get("/debug/asr")
def debug_asr():
    result = {}

    try:
        import torch
        result["torch_installed"] = True
        result["torch_version"] = torch.__version__
    except Exception as e:
        result["torch_installed"] = False
        result["torch_error"] = str(e)

    try:
        import transformers
        result["transformers_installed"] = True
        result["transformers_version"] = transformers.__version__
    except Exception as e:
        result["transformers_installed"] = False
        result["transformers_error"] = str(e)

    try:
        from transformers import pipeline
        result["transformers_pipeline"] = True
    except Exception as e:
        result["transformers_pipeline"] = False
        result["pipeline_error"] = str(e)

    return result