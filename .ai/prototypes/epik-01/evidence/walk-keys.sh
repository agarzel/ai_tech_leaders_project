#!/bin/zsh
# Etap 3: klawiatura (Tab, Shift+Tab, Enter, Space, Escape, pisanie w polu wyboru). Użycie: zsh walk-keys.sh [adres]
source "${0:A:h}/lib.sh" e01-keys
[[ -n "$1" ]] && URL="$1"
start
echo "== klawiatura"
role "Guest"; goto s03; sleep 0.6
A find label "Email" click >/dev/null; A keyboard type "oliwia.nowak@example.com" >/dev/null; A press Tab >/dev/null
check "Tab z pola Email idzie do hasła" "Password" "$(A eval "document.activeElement.labels?.[0]?.textContent.trim()" | tr -d '"')"
A press Shift+Tab >/dev/null; check "Shift+Tab wraca do pola Email" "Email" "$(A eval "document.activeElement.labels?.[0]?.textContent.trim()" | tr -d '"')"
A press Tab >/dev/null; A keyboard type "demo-admin-passphrase-1" >/dev/null; A press Tab >/dev/null; check "Tab z hasła na przycisk Log in" "Log in" "$(focused)"; A press Enter >/dev/null; sleep 1.2; check "Enter na przycisku loguje (admin -> /admin)" "Admin" "$(h1)"
# strzałki w polu wyboru scenariusza (c08) i Space na polu wyboru (c14)
# c08 (natywny <select>): pisanie wartości w agent-browser nie zmienia pola (przeglądarka otwiera listę); sprawdzone tylko myszą, klawiatura: nie-run
A eval "document.querySelector('#c14').focus()" >/dev/null; A press Space >/dev/null; sleep 0.8; check "c14 przełączane Spacją: przejście do profilu mentora" "Profile and prices" "$(h1)"
# okno dialogowe: Enter na Delete, fokus, Tab w pułapce fokusu, Escape zwraca fokus
goto s09; sleep 0.6
A eval "document.querySelectorAll('.screen.is-current button[aria-label^=\"Delete the slot\"]')[3].focus()" >/dev/null; A press Enter >/dev/null; sleep 0.6
check "dialog usuwania otwarty z klawiatury, fokus na Keep slot" "Keep slot" "$(focused)"
A press Tab >/dev/null; check "Tab w oknie: Delete slot" "Delete slot" "$(focused)"; A press Tab >/dev/null; check "Tab w oknie: pułapka fokusu wraca do Keep slot" "Keep slot" "$(focused)"
A press Shift+Tab >/dev/null; check "Shift+Tab w oknie: Delete slot" "Delete slot" "$(focused)"
A press Escape >/dev/null; sleep 0.5; check "Escape zamyka okno, slot zostaje (8)" "8" "$(nslots)"; check "Escape oddaje fokus przyciskowi Delete" "Delete the slot on" "$(focused)"
# formularz slotu klawiaturą + fokus po błędzie
setslot 2026-10-24 09:30; A find role button click --name "Add slot" >/dev/null; sleep 0.9; check "odrzucenie <24 h pokazane przy polu" "A slot must start at least 24 hours from now." "$(ft)"; check "fokus po błędzie wraca na pole daty" "date" "$(focused)"
for i in {1..14}; do [[ "$(focused)" == "Add slot" ]] && break; A press Tab >/dev/null; done; check "Tab z daty przez godzinę (segmenty pól) na przycisk Add slot" "Add slot" "$(focused)"; setslot 2026-10-27 18:00; A press Space >/dev/null; sleep 0.9; check "Space na przycisku dodaje slot" "Slot added." "$(ft)"
# Hotspoty i skróty: Backspace Back poza polami (engine)


summary | tee "$EV/results-keys.txt"
