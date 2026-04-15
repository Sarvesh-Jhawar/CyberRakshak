"""
CyberRakshak Dual-Server Startup Script
========================================
Starts both:
  1. Main Backend API   → http://127.0.0.1:8000  (FastAPI + PostgreSQL + Auth)
  2. ML Model API       → http://127.0.0.1:8001  (5 trained ML models)

Usage:
    python start_all.py

Requirements:
    - Both backend and models/api dependencies installed
    - PostgreSQL running
    - .env file configured in Backend/
"""
import subprocess
import sys
import os
import time
import signal
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()
BACKEND_DIR = BASE_DIR / "Backend"
MODELS_API_DIR = BASE_DIR / "models"

processes = []

def cleanup(sig=None, frame=None):
    print("\n🛑 Shutting down all servers...")
    for p in processes:
        try:
            p.terminate()
        except Exception:
            pass
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def start_server(name, cmd, cwd):
    print(f"🚀 Starting {name}...")
    print(f"   CMD: {' '.join(cmd)}")
    print(f"   CWD: {cwd}")
    p = subprocess.Popen(cmd, cwd=str(cwd))
    processes.append(p)
    return p

if __name__ == "__main__":
    python = sys.executable

    # 1. Start ML Model API on port 8001
    ml_proc = start_server(
        "ML Model API (port 8001)",
        [python, "-m", "uvicorn", "api.main:app", "--host", "127.0.0.1", "--port", "8001", "--reload"],
        cwd=MODELS_API_DIR
    )

    time.sleep(2)  # Give ML API time to load models (pkl files)

    # 2. Start Main Backend API on port 8000
    backend_proc = start_server(
        "Main Backend API (port 8000)",
        [python, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
        cwd=BACKEND_DIR
    )

    print("\n✅ Both servers started!")
    print("   🌐 Main API:    http://127.0.0.1:8000/docs")
    print("   🤖 ML Model API: http://127.0.0.1:8001/docs")
    print("\n   Press Ctrl+C to stop all servers\n")

    # Wait for both
    try:
        while True:
            # Check if either process died
            if ml_proc.poll() is not None:
                print("⚠️  ML Model API stopped unexpectedly!")
                break
            if backend_proc.poll() is not None:
                print("⚠️  Main Backend stopped unexpectedly!")
                break
            time.sleep(2)
    except KeyboardInterrupt:
        pass
    finally:
        cleanup()
