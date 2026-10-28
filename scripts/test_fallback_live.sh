#!/bin/bash
# Test graceful fallback + AI paths, 3 languages, generous gaps.
SITE="https://kisan-seva-z764.onrender.com"
ask() { # $1=text $2=lang $3=label
  echo "=== $3 ==="
  out=$(curl -s --max-time 110 -X POST "$SITE/api/ask" \
    -H "Content-Type: application/json" -d "{\"text\":\"$1\",\"language\":\"$2\"}")
  src=$(echo "$out" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('source','AI'))" 2>/dev/null)
  ans=$(echo "$out" | python3 -c "import json,sys; d=json.load(sys.stdin); print((d.get('answer') or d.get('error') or '?')[:260])" 2>/dev/null)
  cat=$(echo "$out" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('category','?'))" 2>/dev/null)
  echo "  source=$src category=$cat"
  echo "  $ans"
}
ask "What is the price of onion in the mandi today?" "en" "EN - price (fallback shows real table data)"
sleep 12
ask "मेरी फसल पर पीले धब्बे पड़ रहे हैं, कीड़े लग गए हैं" "hi" "HINDI - crop disease"
sleep 12
ask "ಈಗ ಮಳೆ ಬರುತ್ತಾ ಇಲ್ಲವೇ? ಹವಾಮಾನ ಹೇಗಿದೆ?" "kn" "KANNADA - weather (fallback shows live weather)"
