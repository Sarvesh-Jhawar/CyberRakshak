#!/usr/bin/env python3
"""
Development startup script for CyberRakshak Backend
This script helps set up the development environment
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")

def check_virtual_environment():
    """Check if virtual environment is activated"""
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("✅ Virtual environment is activated")
        return True
    else:
        print("⚠️  Virtual environment not detected")
        print("   Consider running: python -m venv venv && source venv/bin/activate")
        return False

def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def check_env_file():
    """Check if .env file exists"""
    env_file = Path(".env")
    if env_file.exists():
        print("✅ .env file found")
        return True
    else:
        print("⚠️  .env file not found")
        print("   Copy env.example to .env and configure your settings")
        return False

def check_firebase_models():
    """Check if ML models directory exists"""
    models_path = Path("../models")
    if models_path.exists():
        print("✅ ML models directory found")
        return True
    else:
        print("⚠️  ML models directory not found")
        print("   ML features will be limited")
        return False

def start_server():
    """Start the development server"""
    print("🚀 Starting CyberRakshak Backend Server...")
    print("=" * 50)
    print("📖 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/health")
    print("🛑 Press Ctrl+C to stop the server")
    print("=" * 50)
    
    try:
        subprocess.run([sys.executable, "run.py"], check=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Server failed to start: {e}")

def main():
    """Main startup function"""
    print("🛡️  CyberRakshak Backend Development Setup")
    print("=" * 50)
    
    # Check system requirements
    check_python_version()
    venv_active = check_virtual_environment()
    
    # Check configuration
    env_exists = check_env_file()
    models_exist = check_firebase_models()
    
    # Install dependencies if virtual environment is active
    if venv_active:
        if not install_dependencies():
            print("❌ Failed to install dependencies. Exiting.")
            sys.exit(1)
    else:
        print("⚠️  Skipping dependency installation (no virtual environment)")
    
    # Check if we can start the server
    if not env_exists:
        print("\n⚠️  Configuration incomplete. Please:")
        print("   1. Copy env.example to .env")
        print("   2. Configure Firebase credentials")
        print("   3. Run this script again")
        sys.exit(1)
    
    print("\n✅ Setup complete! Starting server...")
    start_server()

if __name__ == "__main__":
    main()
