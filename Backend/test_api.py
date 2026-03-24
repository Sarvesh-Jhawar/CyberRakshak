#!/usr/bin/env python3
"""
Simple API test script for CyberRakshak Backend
Run this to test basic API functionality
"""

import requests
import json
from typing import Dict, Any
import time

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

def test_health_check():
    """Test health check endpoint"""
    print("Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_root_endpoint():
    """Test root endpoint"""
    print("Testing root endpoint...")
    try:
        response = requests.get(BASE_URL)
        if response.status_code == 200:
            print("✅ Root endpoint passed")
            return True
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
        return False

def test_user_registration():
    """Test user registration"""
    print("Testing user registration...")
    # Generate a unique email using the current timestamp to make test idempotent
    unique_id = int(time.time())
    email = f"testuser_{unique_id}@defence.mil"
    try:

        user_data = {
            "name": "Test User",
            "service_id": f"TEST-{unique_id}",
            "relation": "personnel",
            "email": email,
            "phone": "+1-555-0123",
            "password": "testpassword123"
        }

        response = requests.post(
            f"{API_BASE}/auth/register",
            json=user_data,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            print(f"✅ User registration passed (user: {email})")
            return email  # Return the unique email for the login test
        else:
            print(f"❌ User registration failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ User registration error: {e}")
        return None

def test_user_login(email: str):
    """Test user login"""
    if not email:
        print("⚠️  Skipping login test (registration failed)")
        return None
    print("Testing user login...")
    try:
        login_data = {
            "email": email,
            "password": "testpassword123"
        }
        
        response = requests.post(
            f"{API_BASE}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ User login passed")
            return data.get("access_token")
        else:
            print(f"❌ User login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ User login error: {e}")
        return None

def test_incident_creation(token: str):
    """Test incident creation"""
    print("Testing incident creation...")
    try:
        incident_data = {
            "category": "phishing",
            "description": "Test phishing incident",
            "evidence_type": "text",
            "evidence_text": "Suspicious email received"
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        
        response = requests.post(
            f"{API_BASE}/incidents/",
            json=incident_data,
            headers=headers
        )
        
        if response.status_code == 200:
            print("✅ Incident creation passed")
            return True
        else:
            print(f"❌ Incident creation failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Incident creation error: {e}")
        return False

def test_get_incidents(token: str):
    """Test getting incidents"""
    print("Testing get incidents...")
    try:
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        response = requests.get(
            f"{API_BASE}/incidents/",
            headers=headers
        )
        
        if response.status_code == 200:
            print("✅ Get incidents passed")
            return True
        else:
            print(f"❌ Get incidents failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Get incidents error: {e}")
        return False

def test_analytics_endpoints(token: str):
    """Test analytics endpoints"""
    print("Testing analytics endpoints...")
    try:
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        # Test monthly analytics
        response = requests.get(
            f"{BASE_URL}/api/analytics/monthly",
            headers=headers
        )
        
        if response.status_code == 200:
            print("✅ Analytics endpoints passed")
            return True
        else:
            print(f"❌ Analytics endpoints failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Analytics endpoints error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting CyberRakshak API Tests")
    print("=" * 50)
    
    tests_passed = 0
    total_tests = 0
    
    # Test basic endpoints
    total_tests += 1
    if test_health_check():
        tests_passed += 1
    
    total_tests += 1
    if test_root_endpoint():
        tests_passed += 1
    
    # Test authentication
    total_tests += 1
    registered_email = test_user_registration()
    if registered_email:
        tests_passed += 1
    
    total_tests += 1
    token = test_user_login(registered_email)
    if token:
        tests_passed += 1
        
        # Test authenticated endpoints
        total_tests += 1
        if test_incident_creation(token):
            tests_passed += 1
        
        total_tests += 1
        if test_get_incidents(token):
            tests_passed += 1
        
        total_tests += 1
        if test_analytics_endpoints(token):
            tests_passed += 1
    
    print("=" * 50)
    print(f"📊 Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! API is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the server logs for details.")
    
    print("\n📖 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/health")

if __name__ == "__main__":
    main()
