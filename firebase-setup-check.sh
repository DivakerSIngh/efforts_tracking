#!/bin/bash
# Firebase Setup Helper Script
# Run this to validate your Firebase setup

echo "📋 Firebase Setup Checker"
echo "==============================================="

# Check if firebase.config.ts exists
if [ -f "src/frontend/src/environments/firebase.config.ts" ]; then
  echo "✅ firebase.config.ts found"
else
  echo "❌ firebase.config.ts not found"
fi

# Check if firebase-key.json exists
if [ -f "firebase-key.json" ]; then
  echo "✅ firebase-key.json found"
else
  echo "⚠️  firebase-key.json not found (needed for data migration)"
fi

# Check if Firebase SDK is installed
if grep -q "firebase" src/frontend/package.json; then
  echo "✅ Firebase SDK installed"
else
  echo "⚠️  Firebase SDK not installed. Run: npm install firebase"
fi

# Check if Firebase Admin SDK is installed
if grep -q "firebase-admin" src/backend/requirements.txt 2>/dev/null; then
  echo "✅ Firebase Admin SDK in requirements"
else
  echo "⚠️  Firebase Admin SDK not in requirements. Check installation."
fi

echo "==============================================="
echo "Setup Status Complete"
