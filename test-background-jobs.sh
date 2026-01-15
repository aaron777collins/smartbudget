#!/bin/bash

# Test Background Job Processing System
# This script creates a merchant research batch job and verifies it processes correctly

API_BASE="https://budget.aaroncollins.info"
echo "Testing Background Job Processing"
echo "=================================="
echo ""

# Create a test user session cookie
# Since we need authentication, we'll use curl with session cookies
COOKIE_JAR=$(mktemp)
echo "Cookie jar: $COOKIE_JAR"
echo ""

# Step 1: Create a batch job with multiple merchants
echo "Step 1: Creating merchant research batch job..."
CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/api/jobs" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR" \
  -d '{
    "type": "MERCHANT_RESEARCH_BATCH",
    "payload": {
      "merchants": [
        {"merchantName": "Amazon", "amount": 25.99, "date": "2026-01-14"},
        {"merchantName": "Netflix", "amount": 15.99, "date": "2026-01-14"},
        {"merchantName": "Spotify", "amount": 9.99, "date": "2026-01-14"}
      ],
      "saveToKnowledgeBase": true
    },
    "total": 3
  }')

echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"
echo ""

# Extract job ID
JOB_ID=$(echo "$CREATE_RESPONSE" | jq -r '.job.id // empty' 2>/dev/null)

if [ -z "$JOB_ID" ] || [ "$JOB_ID" = "null" ]; then
  echo "❌ Failed to create job. Response:"
  echo "$CREATE_RESPONSE"
  echo ""
  echo "Note: Authentication is required. Testing will be done via authenticated API calls in production."
  rm -f "$COOKIE_JAR"
  exit 1
fi

echo "✅ Job created with ID: $JOB_ID"
echo ""

# Step 2: Check initial job status (should be PENDING)
echo "Step 2: Checking initial job status..."
INITIAL_STATUS=$(curl -s -b "$COOKIE_JAR" "$API_BASE/api/jobs/$JOB_ID")
echo "$INITIAL_STATUS" | jq '.' 2>/dev/null || echo "$INITIAL_STATUS"
echo ""

STATUS=$(echo "$INITIAL_STATUS" | jq -r '.status // empty' 2>/dev/null)
if [ "$STATUS" = "PENDING" ]; then
  echo "✅ Job status is PENDING (correct)"
else
  echo "⚠️ Job status is $STATUS (expected PENDING)"
fi
echo ""

# Step 3: Trigger job processing manually
echo "Step 3: Triggering job processing..."
PROCESS_RESPONSE=$(curl -s -X POST "$API_BASE/api/jobs/process" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR" \
  -d '{"limit": 5}')
echo "$PROCESS_RESPONSE" | jq '.' 2>/dev/null || echo "$PROCESS_RESPONSE"
echo ""

# Step 4: Poll for job completion (max 60 seconds)
echo "Step 4: Polling for job completion (max 60 seconds)..."
for i in {1..12}; do
  sleep 5
  CURRENT_STATUS=$(curl -s -b "$COOKIE_JAR" "$API_BASE/api/jobs/$JOB_ID")
  STATUS=$(echo "$CURRENT_STATUS" | jq -r '.status // empty' 2>/dev/null)
  PROGRESS=$(echo "$CURRENT_STATUS" | jq -r '.progress // 0' 2>/dev/null)
  PROCESSED=$(echo "$CURRENT_STATUS" | jq -r '.processed // 0' 2>/dev/null)
  TOTAL=$(echo "$CURRENT_STATUS" | jq -r '.total // 0' 2>/dev/null)
  
  echo "[Poll $i] Status: $STATUS | Progress: $PROGRESS% | Processed: $PROCESSED/$TOTAL"
  
  if [ "$STATUS" = "COMPLETED" ]; then
    echo ""
    echo "✅ Job completed successfully!"
    echo ""
    echo "Final job details:"
    echo "$CURRENT_STATUS" | jq '.'
    
    # Check if results were saved to knowledge base
    RESULT=$(echo "$CURRENT_STATUS" | jq -r '.result // empty' 2>/dev/null)
    if [ -n "$RESULT" ]; then
      echo ""
      echo "Job Result:"
      echo "$RESULT" | jq '.'
    fi
    
    rm -f "$COOKIE_JAR"
    exit 0
  elif [ "$STATUS" = "FAILED" ]; then
    echo ""
    echo "❌ Job failed!"
    ERROR=$(echo "$CURRENT_STATUS" | jq -r '.error // empty' 2>/dev/null)
    echo "Error: $ERROR"
    echo ""
    echo "$CURRENT_STATUS" | jq '.'
    rm -f "$COOKIE_JAR"
    exit 1
  fi
done

echo ""
echo "⚠️ Job did not complete within 60 seconds"
echo "Final status:"
curl -s -b "$COOKIE_JAR" "$API_BASE/api/jobs/$JOB_ID" | jq '.'

rm -f "$COOKIE_JAR"
exit 2
