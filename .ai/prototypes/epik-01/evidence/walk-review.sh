#!/bin/zsh
# Etap 3: notatki do ekranów, tryb komentarzy (komentarz przypina się do ID ekranu), eksport (komentarze do repo i Markdown), mapa ekranów, Back, tryb prezentacji.
# Użycie: zsh walk-review.sh [adres]
source "${0:A:h}/lib.sh" e01-review
[[ -n "$1" ]] && URL="$1"
start
A eval "localStorage.clear()" >/dev/null; start   # komentarze są w localStorage przeglądarki: zaczynamy od czystego
mkdir -p "$EV/exports"

echo "== notatki do ekranów (poza trybem prezentacji)"
clickb "Presentation"; sleep 0.4
check "tryb prezentacji wyłączony: widać wszystkie ekrany (12 sekcji)" "12" "$(A eval "document.querySelectorAll('.screen').length" | tr -d '"')"
for id in s01 s02 s03 s04 s05 s06 s07 s08 s09 s10 s11 s12; do
  N="$(A eval "document.querySelector('#$id .notes .note')?.innerText ?? ''" | tr -d '"')"
  check "notatka $id: numery historii" "Stories:" "$N"; check "notatka $id: co jest symulacją" "Simulated:" "$N"; check "notatka $id: czego prototyp nie rozstrzyga" "Not decided here:" "$N"
done
for pair in "s02:#26" "s03:#26" "s06:#26" "s07:#25" "s08:#25-2" "s09:#27-4" "s10:#28-2" "s11:#28-1" "s11:#25-3" "s07:#28-3" "s09:#27-3"; do
  id="${pair%%:*}"; num="${pair#*:}"; check "notatka $id wymienia $num" "$num" "$(A eval "document.querySelector('#$id .notes .note').innerText" | tr -d '"')"
done
check "notatka s09 wspomina DST (A08)" "DST" "$(A eval "document.querySelector('#s09 .notes .note').innerText" | tr -d '"')"
check "nagłówek prototypu mówi, że to symulacja" "simulations" "$(A eval "document.querySelector('.doc-head .proto-note').innerText" | tr -d '"')"

echo "== tryb komentarzy: komentarz przypina się do ID ekranu"
clickb "Presentation"; sleep 0.3
comment() { # comment sNN selektor-elementu "tekst"
  goto "$1"; sleep 0.6
  A eval "document.querySelector('.screen.is-current $2').click()" >/dev/null; sleep 0.4
  A find placeholder "Your name for review comments" fill "Skrypt walk-review" >/dev/null 2>&1 || A find label "Your name for review comments" fill "Skrypt walk-review" >/dev/null
  A find label "New review comment" fill "$3" >/dev/null; clickb "Add comment"; sleep 0.5
}
clickb "Comment"; sleep 0.3
check "tryb Comment włączony" "true" "$(A eval "document.body.classList.contains('proto-comment')" | tr -d '"')"
comment s03 "h1" "Test s03: czy komunikat o hasle jest wystarczajacy?"
role "Admin: Oliwia Nowak"; comment s06 "h1" "Test s06: link pokazany raz."
role "Mentor: Marek Zieliński"; comment s09 "h1" "Test s09: DST w notatce."
role "Guest"; clickb "Clickable"; goto s10; sleep 0.5; clickl "Kasia Lewandowska"; sleep 0.6; clickb "Comment"; sleep 0.3
A eval "document.querySelector('.screen.is-current h1').click()" >/dev/null; sleep 0.4; A find label "New review comment" fill "Test s11: Book wylaczony." >/dev/null; clickb "Add comment"; sleep 0.5
comment s10 "h1" "Test s10: paginacja."
shot 140-review-comments-panel
THREADS="$(A eval "document.querySelector('.anno-panel')?.innerText ?? ''" | tr -d '"')"
for id in s03 s06 s09 s11 s10; do check "panel Threads grupuje komentarz pod ekranem $id" "$id" "$THREADS"; done
goto s03; sleep 0.8; check "pin komentarza pojawia się po wejściu na ekran s03 (resize po renderze)" "1" "$(has '.anno-pin')"; shot 141-review-pin-on-s03
goto s10; sleep 0.8; check "pin na s10" "1" "$(has '.anno-pin')"
check "komentarze innych ekranów są w panelu jako osierocone, dopóki ich ekran nie jest wyrenderowany (ograniczenie)" "Orphaned threads" "$(A eval "document.querySelector('.anno-panel')?.innerText ?? ''" | tr -d '"')"
A eval "window.__exports=[]; const orig=URL.createObjectURL.bind(URL); URL.createObjectURL=(b)=>{ b.text().then(t=>window.__exports.push(t)); return orig(b); }; 1" >/dev/null
clickb "Export for repository"; sleep 0.6
clickb "Export Markdown"; sleep 0.6
EXPORT="$(A eval "window.__exports[0]" | python3 -c 'import sys,json; print(json.loads(sys.stdin.read()))')"
MD="$(A eval "window.__exports[1]" | python3 -c 'import sys,json; print(json.loads(sys.stdin.read()))')"
print -r -- "$EXPORT" > "$EV/exports/comments.sample.js"; print -r -- "$MD" > "$EV/exports/prototype-feedback.sample.md"
check "eksport comments.js: nagłówek" "window.__OM_PROTOTYPE_COMMENTS__ =" "$EXPORT"; check "eksport comments.js: prototypeId epik-01" "\"prototypeId\": \"epik-01\"" "$EXPORT"
VALID="$(node -e '
const fs=require("fs"); const src=fs.readFileSync(process.argv[1],"utf8"); const w={}; new Function("window",src)(w);
const d=w.__OM_PROTOTYPE_COMMENTS__; const ids=new Set(["s01","s02","s03","s04","s05","s06","s07","s08","s09","s10","s11","s12"]);
const ops=d.operations; const screens=ops.map(o=>o.payload&&o.payload.screen).filter(Boolean);
console.log(JSON.stringify({version:d.version,prototypeId:d.prototypeId,ops:ops.length,screens:[...new Set(screens)].sort(),allValid:screens.every(s=>ids.has(s))}));
' "$EV/exports/comments.sample.js" 2>&1)"
echo "  (odczyt eksportu: $VALID)"
check "eksport: plik się ładuje jako JS (version 2)" "\"version\":2" "$VALID"; check "eksport: prototypeId" "\"prototypeId\":\"epik-01\"" "$VALID"; check "eksport: wszystkie ID ekranów należą do mapy" "\"allValid\":true" "$VALID"
for id in s03 s06 s09 s10 s11; do check "eksport: komentarz przypięty do $id" "\"$id\"" "$VALID"; done
check "eksport Markdown: sekcja ekranu s03" "## s03 Log in" "$MD"; check "eksport Markdown: sekcja ekranu s11" "## s11 Mentor page" "$MD"; check "eksport Markdown: treść komentarza" "Test s09: DST w notatce." "$MD"

echo "== mapa ekranów, Back, tryb prezentacji, hotspoty"
clickb "Comment"; clickb "Clickable"; sleep 0.2
check "pasek przeglądu ma 12 ekranów" "12" "$(A eval "document.querySelectorAll('.screen-nav a').length" | tr -d '"')"
for id in s01 s02 s03 s04 s05 s06 s07 s08 s09 s10 s11 s12; do
  case $id in s05|s06) role "Admin: Oliwia Nowak" ;; s07|s08|s09) role "Mentor: Marek Zieliński" ;; *) role "Guest" ;; esac
  A eval "document.querySelector('.screen-nav a[href=\"#$id\"]').click()" >/dev/null; sleep 0.35
  check "mapa ekranów: $id jest bieżącym ekranem" "$id" "$(A eval "document.querySelector('.screen.is-current')?.id" | tr -d '"')"
done
goto s03; goto s10; clickb "Presentation"; sleep 0.3; clickb "← Back"; sleep 0.4; check "przycisk Back wraca do poprzedniego ekranu" "s03" "$(A eval "document.querySelector('.screen.is-current')?.id" | tr -d '"')"
check "tryb prezentacji: jeden ekran na raz" "1" "$(A eval "[...document.querySelectorAll('.screen')].filter(s=>getComputedStyle(s).display!=='none').length" | tr -d '"')"

summary | tee "$EV/results-review.txt"
