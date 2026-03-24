#!/usr/bin/env python3
"""
Simple test server to verify the basic setup works
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Create a simple FastAPI app for testing
app = FastAPI(title="CyberRakshak Test API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "CyberRakshak Test API is running!", "status": "success"}

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "Server is running"}

@app.get("/test")
async def test():
    return {"message": "Test endpoint working", "data": {"test": True}}

if __name__ == "__main__":
    print("🚀 Starting CyberRakshak Test Server...")
    print("📖 Test endpoints:")
    print("   - http://localhost:8000/")
    print("   - http://localhost:8000/health")
    print("   - http://localhost:8000/test")
    print("   - http://localhost:8000/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
