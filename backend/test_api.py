#!/usr/bin/env python3
"""
Simple test script for the FastAPI backend
Run this after starting the server to verify all endpoints work
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_health():
    """Test the health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure it's running on port 8000")
        return False

def test_ai_chat():
    """Test the AI chat endpoint"""
    print("\n🤖 Testing AI chat endpoint...")
    try:
        payload = {"prompt": "Hello, tell me about React development in one sentence."}
        response = requests.post(f"{BASE_URL}/api/ai-chat", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ AI chat endpoint working")
            print(f"📝 Response: {data.get('result', 'No result')[:100]}...")
            return True
        else:
            print(f"❌ AI chat failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ AI chat error: {str(e)}")
        return False

def test_enhance_prompt():
    """Test the enhance prompt endpoint"""
    print("\n✨ Testing enhance prompt endpoint...")
    try:
        payload = {"prompt": "Create a simple website"}
        response = requests.post(f"{BASE_URL}/api/enhance-prompt", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Enhance prompt endpoint working")
            print(f"📝 Enhanced: {data.get('enhancedPrompt', 'No result')[:100]}...")
            return True
        else:
            print(f"❌ Enhance prompt failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Enhance prompt error: {str(e)}")
        return False

def test_generate_code():
    """Test the code generation endpoint"""
    print("\n⚡ Testing code generation endpoint...")
    try:
        payload = {"prompt": "Create a simple counter component"}
        response = requests.post(f"{BASE_URL}/api/gen-ai-code", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Code generation endpoint working")
            if 'files' in data:
                print(f"📁 Generated {len(data['files'])} files")
                print(f"📝 Project: {data.get('projectTitle', 'Unknown')}")
            else:
                print("⚠️  No files in response, but endpoint responded")
            return True
        else:
            print(f"❌ Code generation failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Code generation error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing AI Website Builder FastAPI Backend")
    print("=" * 50)
    
    tests = [
        test_health,
        test_ai_chat,
        test_enhance_prompt,
        test_generate_code
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend is working correctly.")
        sys.exit(0)
    else:
        print("⚠️  Some tests failed. Check the output above.")
        sys.exit(1)

if __name__ == "__main__":
    main()