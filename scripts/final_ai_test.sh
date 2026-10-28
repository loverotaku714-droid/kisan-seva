#!/bin/bash
# Final acceptance test: /api/ask in EN/HI/KN, 3 tries each, 20s apart.
SITE="https://kisan-seva-z764.onrender.com"
ask() { # $1=text $2=lang $3=label
  echo "=== $3 ==="
  for t in 1 2 3; do
    out=$(curl -s --max-time 100 -X POST "$SITE/api/ask" \
      -H "Content-Type: application/json" -d "{\"text\":\"$1\",\"language\":\"$2\"}")
    if echo "$out" | rg -q '"answer"'; then
      echo "OK (try $t): $(echo "$out" | head -c 500)"
      return 0
    fi
    echo "  try $t failed: $(echo "$out" | rg -o 'status \d+' | head -1)"
    sleep 20
  done
  echo "FAILED after 3 tries"
  return 1
}
ask "My tomato leaves have yellow spots with brown patches. What should I spray?" "en" "ENGLISH - crop disease"
sleep 15
ask "मेरी गेहूं की फसल में कीड़े लग गए हैं, क्या करूं?" "hi" "HINDI - pest"
sleep 15
ask "ಈಗ ಮಳೆ ಬರುತ್ತಾ ಇಲ್ಲವೇ?" "kn" "KANNADA - weather"
