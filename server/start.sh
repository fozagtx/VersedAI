#!/bin/bash
# VersedAI — Start the Google ADK backend
set -e

echo "🚀 Starting VersedAI backend..."

# Check for API key
if [ -z "$GEMINI_API_KEY" ] && [ -z "$GOOGLE_API_KEY" ]; then
  if [ -f ".env" ]; then
    echo "📄 Loading .env file..."
    export $(grep -v '^#' .env | xargs)
  else
    echo "❌ ERROR: No API key found."
    echo "   Create a .env file with: GEMINI_API_KEY=your_key_here"
    echo "   Get a key at: https://aistudio.google.com/app/api-keys"
    exit 1
  fi
fi

echo "📦 Installing dependencies..."
python3 -m pip install -r requirements.txt -q --break-system-packages 2>/dev/null || \
python3 -m pip install -r requirements.txt -q

echo "✅ Backend starting on http://localhost:8000"
echo "   Health check: http://localhost:8000/health"
echo ""
python3 -m uvicorn main:app --reload --port 8000 --host 0.0.0.0
