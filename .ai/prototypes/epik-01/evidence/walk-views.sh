#!/bin/zsh
# Etap 3: prawdziwe okno 1440 / 1280 / 320 px, motyw jasny i ciemny (przybliżony kontrast), klawiatura (Tab, Shift+Tab, Enter, Space, Escape, strzałki).
# Użycie: zsh walk-views.sh [adres]
source "${0:A:h}/lib.sh" e01-views
[[ -n "$1" ]] && URL="$1"
start
visit() { # visit "rola" sNN  (bez parametru sNN=s11: otwiera stronę Kasi z listy)
  role "$1"; if [[ "$2" == s11 ]]; then goto s10; sleep 0.5; clickl "Kasia Lewandowska"; else goto $2; fi; sleep 0.8
}
SCREENS=("Guest:s01" "Guest:s02" "Guest:s03" "Guest:s04" "Admin: Oliwia Nowak:s05" "Admin: Oliwia Nowak:s06" "Mentor: Marek Zieliński:s07" "Mentor: Marek Zieliński:s08" "Mentor: Marek Zieliński:s09" "Guest:s10" "Guest:s11" "Guest:s12")
overflow() { A eval "(()=>{const f=document.querySelector('.screen.is-current .frame'); const w=window.innerWidth; const inScroll=(e)=>{for(let p=e.parentElement;p&&p!==f;p=p.parentElement){const o=getComputedStyle(p).overflowX;if(o==='auto'||o==='scroll')return true}return false}; const wide=[...f.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().right>w+1&&!inScroll(e)).slice(0,3).map(e=>e.tagName.toLowerCase()+'.'+String(e.className).slice(0,30)); return JSON.stringify({w, wide, page: document.documentElement.scrollWidth-w})})()"; }

for W in 1440 1280 320; do
  echo "== okno ${W} px (jasny motyw): brak poziomego przewijania produktu na każdym ekranie"
  A set viewport $W 900 >/dev/null; sleep 0.3
  for entry in $SCREENS; do
    who="${entry%:*}"; id="${entry##*:}"
    if [[ "$id" == s12 ]]; then role "Guest"; btn x02; sleep 0.6; else visit "$who" "$id"; fi
    O="$(overflow | tr -d '\\')"; check "${W}px $id: zawartość mieści się w oknie (tabela może przewijać się we własnym kontenerze)" '"wide":[]' "$O"
  done
  if [[ $W == 320 ]]; then
    visit "Guest" s03; shot 150-w320-s03; visit "Admin: Oliwia Nowak" s06; shot 151-w320-s06-table
    visit "Mentor: Marek Zieliński" s07; shot 152-w320-s07; visit "Mentor: Marek Zieliński" s09; shot 153-w320-s09
    dele 3; shotv 154-w320-s09-dialog; keep_slot
    visit "Guest" s10; shot 155-w320-s10; visit "Guest" s11; shot 156-w320-s11
  fi
  if [[ $W == 1440 ]]; then visit "Mentor: Marek Zieliński" s07; shot 157-w1440-s07; visit "Guest" s10; shot 158-w1440-s10; fi
done
A set viewport 1280 900 >/dev/null

echo "== kontrast tekstu (przybliżony), jasny i ciemny motyw"
for theme in light dark; do
  [[ $theme == dark ]] && { clickb "Dark theme"; sleep 0.4; check "motyw ciemny włączony (klasa dark)" "true" "$(A eval "document.documentElement.classList.contains('dark')" | tr -d '"')"; }
  for entry in $SCREENS; do
    who="${entry%:*}"; id="${entry##*:}"
    if [[ "$id" == s12 ]]; then role "Guest"; btn x02; sleep 0.6; else visit "$who" "$id"; fi
    C="$(A eval "$(cat "$EV/contrast.js")" | tr -d '\\')"; echo "  ($theme $id: $C)"
    check "kontrast ($theme) $id: brak tekstu poniżej progu WCAG AA" '"failCount":0' "$C"
    [[ $id == s03 || $id == s06 || $id == s09 || $id == s10 ]] && shot "160-$theme-$id"
  done
done
clickb "Dark theme"; sleep 0.3


summary | tee "$EV/results-views.txt"
