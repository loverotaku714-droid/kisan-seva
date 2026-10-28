#!/bin/bash
# Poll Render deploy after push, then smoke-test /api/ask in EN/HI/KN.
SITE="https://kisan-seva-z764.onrender.com"
ask() { # $1=text $2=lang $3=label
  echo "=== $3 ==="
  curl -s --max-time 90 -X POST "$SITE/api/ask" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"$1\",\"language\":\"$2\"}" | head -c 700
  echo
}
for i in $(seq 1 9); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 60 "$SITE/")
  detail=$(curl -s --max-time 90 -X POST "$SITE/api/ask" -H "Content-Type: application/json" \
    -d '{"text":"probe deploy version","language":"en"}')
  if echo "$detail" | rg -q 'ai_provider_error.*high demand'; then
    echo "[poll $i] site=$code still OLD code (no failover yet) or primary still overloaded; waiting 45s..."
    sleep 45
  elif echo "$detail" | rg -q '"answer"'; then
    echo "[poll $i] site=$code NEW behavior: got a real answer! Running full smoke test..."
    ask "My tomato leaves have yellow spots with brown patches. What should I spray?" "en" "ENGLISH - crop disease"
    sleep 2
    ask "मेरी गेहूं की फसल में कीड़े लग गए हैं, क्या करूं?" "hi" "HINDI - pest"
    sleep 2
    ask "ಈಗ ಮಳೆ ಬರುತ್ತಾ ಇಲ್ಲವೇ?" "kn" "KANNADA - weather"
    exit 0
  else
    echo "[poll $i] site=$code different response (deploy may be live): $(echo "$detail" | head -c 200)"
    sleep 30
  fi
done
echo "TIMED OUT waiting for deploy - check Render dashboard"
exit 1
