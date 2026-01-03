#!/bin/bash

# Test script for context reuse functionality
# This tests: search query -> follow-up question for results

cd /home/txz/dev/local-felix

# Kill any existing app
killall node 2>/dev/null || true
sleep 1

# Clear logs
rm -f logs/app.log

# Start the app
echo "Starting app..."
npm start > /tmp/app.log 2>&1 &
APP_PID=$!

# Give it time to initialize
sleep 5

# Send test input via stdin
# Format: queries separated by newlines
{
  echo "Search memory.net for 8gb 2133mhz ddr4 laptop ram"
  sleep 3
  echo "Can I see the results?"
  sleep 3
  echo "exit"
} | timeout 20 node dist/src/index.js > /dev/null 2>&1 || true

# Kill the app
kill $APP_PID 2>/dev/null || true
sleep 2

# Display results
echo ""
echo "=== APP LOGS ==="
cat logs/app.log 2>/dev/null || echo "(no logs found)"

echo ""
echo "=== RELEVANT LOG LINES ==="
grep -E "search:|context:|compile" logs/app.log 2>/dev/null || echo "(no matching logs)"
