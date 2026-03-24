#!/usr/bin/env python3
"""
Run the server without Firebase for testing purposes
"""

import os
import sys

# Temporarily disable Firebase
os.environ["DISABLE_FIREBASE"] = "true"

# Import and run the app
from app.main import app
import uvicorn

if __name__ == "__main__":
    print("🚀 Starting CyberRakshak Backend (Without Firebase)")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/health")
    print("⚠️  Note: This version runs without Firebase for testing")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
