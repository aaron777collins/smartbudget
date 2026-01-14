#!/bin/bash
# Monitor Ralph progress

PLAN_LOG="ralph_plan.log"
BUILD_LOG="ralph_build.log"
PROGRESS_FILE="SMARTBUDGET_DEPLOYMENT_PLAN_PROGRESS.md"

echo "=== Ralph Monitor ==="
echo "Time: $(date)"
echo ""

# Check plan process
if ps aux | grep -v grep | grep "ralph.sh.*plan" > /dev/null; then
    echo "✓ Plan process running"
    echo "Last 5 lines of plan log:"
    tail -5 "$PLAN_LOG" 2>/dev/null || echo "  (no log yet)"
else
    echo "✗ Plan process not running"
fi

echo ""

# Check build process
if ps aux | grep -v grep | grep "ralph.sh.*build" > /dev/null; then
    echo "✓ Build process running"
    echo "Last 5 lines of build log:"
    tail -5 "$BUILD_LOG" 2>/dev/null || echo "  (no log yet)"
else
    echo "✗ Build process not running"
fi

echo ""

# Check progress file
if [ -f "$PROGRESS_FILE" ]; then
    echo "Progress file status:"
    grep -E "^(Status|Tasks Completed|RALPH_DONE)" "$PROGRESS_FILE" | head -10
else
    echo "Progress file not yet created"
fi
