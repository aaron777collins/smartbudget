#!/bin/bash
# Start Ralph build phase after plan completes

cd ~/repos/smartbudget

echo "Checking if plan is complete..."
if ! grep -q "PLANNING_COMPLETE\|Status: COMPLETED" SMARTBUDGET_DEPLOYMENT_PLAN_PROGRESS.md 2>/dev/null; then
    echo "ERROR: Plan not complete yet. Wait for plan to finish."
    echo "Current status:"
    head -20 SMARTBUDGET_DEPLOYMENT_PLAN_PROGRESS.md 2>/dev/null
    exit 1
fi

echo "Plan complete! Starting build phase..."
nohup ~/repos/AICEO/ralph/ralph.sh ./SMARTBUDGET_DEPLOYMENT_PLAN.md build 30 > ralph_build.log 2>&1 &
BUILD_PID=$!
echo "Ralph build started with PID: $BUILD_PID"
echo "$BUILD_PID" > ralph_build.pid

echo ""
echo "Monitor progress with:"
echo "  tail -f ralph_build.log"
echo "  ./monitor_ralph.sh"
echo ""
echo "Stop build with:"
echo "  kill $(cat ralph_build.pid)"
