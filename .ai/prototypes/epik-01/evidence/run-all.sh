#!/bin/zsh
# Uruchamia wszystkie skrypty przejścia po kolei (wymaga zbudowanego podglądu i serwera plików na porcie 4175). Wynik: results-*.txt.
cd "${0:A:h}"
for s in walk-auth walk-invite walk-mentor walk-public walk-review walk-keys; do
  echo "### $s"; zsh $s.sh 2>&1 | grep -v "^✓" | grep -v "^PASS" | cut -c1-300
done
echo "### walk-stage1 (etap 1, przejście ścieżki bez błędów)"; zsh walk-stage1.sh 2>&1 | grep -v "^✓" | tee results-stage1.txt | grep -v "^PASS" | cut -c1-300
echo "### walk-keyboard (etap 1, klawiatura)"; zsh walk-keyboard.sh 2>&1 | grep -v "^✓" | tee results-keyboard.txt | grep -v "^PASS" | cut -c1-300
echo "### walk-views (okna 1440/1280/320, motywy, kontrast): osobno, trwa ok. 15 minut: zsh walk-views.sh"
