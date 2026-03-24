#!/usr/bin/env python3
"""
CyberRakshak Backend Server
Run this script to start the FastAPI server
"""

import uvicorn
import os

if __name__ == "__main__":
    print("Starting CyberRakshak Backend Server...")
    print("API Documentation: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/health")

    uvicorn.run(
        "app.main:app",  # <-- pass as string "module:app"
        host=os.getenv("HOST", "127.0.0.1"),  # Use HOST from .env, default to 127.0.0.1
        port=int(os.getenv("PORT", 8000)),    # Use PORT from .env, default to 8000
        reload=True,
        log_level="info"
    )
