#!/bin/zsh
# Wspólne funkcje skryptów przejścia (agent-browser). Użycie: source lib.sh <nazwa-sesji>
ROOT="${0:A:h:h:h:h:h}"; cd "$ROOT"
URL="${E01_URL:-http://localhost:4175/prototypes/epik-01/index.html}"
SESSION="${1:-e01}"
EV="$ROOT/.ai/prototypes/epik-01/evidence"
A() { node_modules/.bin/agent-browser --session "$SESSION" "$@"; }
pass=0; fail=0
check() { # check "ID opis" "oczekiwany fragment" "tekst"
  if [[ "$3" == *"$2"* ]]; then echo "PASS  $1"; ((pass++)); else echo "FAIL  $1 (oczekiwano: $2; jest: ${${3//$'\n'/ | }:0:600})"; ((fail++)); fi
}
absent() { # absent "ID opis" "fragment, którego nie ma" "tekst"
  if [[ "$3" != *"$2"* ]]; then echo "PASS  $1"; ((pass++)); else echo "FAIL  $1 (nie powinno być: $2)"; ((fail++)); fi
}
h1() { A get text ".screen.is-current h1" 2>/dev/null | tr -d '"'; }
ft() { A get text ".screen.is-current .frame" 2>/dev/null | sed $'s/\xc2\xa0/ /g'; }   # tekst aktualnego ekranu
bar() { A get text "#scenario-message" 2>/dev/null; }
snap() { A snapshot 2>&1; }
shot() { # zrzut ekranu produktu: przewija do ramki ekranu i robi zrzut okna (tryb prezentacji silnika jest domyślnie włączony)
  A eval "(()=>{const f=document.querySelector('.screen.is-current .frame'); window.scrollTo(0, f.getBoundingClientRect().top + window.scrollY - 4);})()" >/dev/null; sleep 0.25; A screenshot "$EV/$1.png" >/dev/null; }
shotv() { A screenshot "$EV/$1.png" >/dev/null; }   # okno bez przewijania (np. okno dialogowe)
fill() { A find label "$1" fill "$2" >/dev/null; }
clickb() { A find role button click --name "$1" >/dev/null; }
clickl() { A find role link click --name "$1" >/dev/null; }
sel() { A select "#$1" "$2" >/dev/null; }      # kontrolka scenariusza po id, np. sel c08 "Network error"
tick() { A eval "document.querySelector('#$1').click()" >/dev/null; }   # pole wyboru (checkbox) kontrolki
btn() { A eval "document.querySelector('#$1').click()" >/dev/null; }
start() { A set viewport 1280 900 >/dev/null; A open "$URL" >/dev/null; sleep 1; }
reset() { clickb "Reset simulation"; sleep 0.4; }
login() { # login email hasło (przez formularz)
  fill "Email" "$1"; fill "Password" "$2"; A press Enter >/dev/null; sleep 1.2
}
setslot() { A eval "(() => { const set=(el,v)=>{const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; s.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));}; set(document.querySelector('.screen.is-current input[type=date]'),'$1'); set(document.querySelector('.screen.is-current input[type=time]'),'$2'); return 'ok'; })()" >/dev/null; }
summary() { echo; echo "Wynik ($SESSION): PASS=$pass FAIL=$fail"; }
val() { A eval "document.querySelector('.screen.is-current input[name=$1]').value" | tr -d '"'; }
goto() { A eval "location.hash='#$1'" >/dev/null; sleep 0.5; }   # przejście paskiem przeglądu (ID ekranu)
role() { sel role-select "$1"; sleep 0.6; }                       # c01
idval() { A eval "document.querySelector('.screen.is-current [id\$=\"-$1\"]').value" | tr -d '"'; }   # wartość pola formularza DS po końcówce id (np. headline)
nslots() { A eval "document.querySelectorAll('.screen.is-current time').length" | tr -d '"'; }
focused() { A eval "(()=>{const e=document.activeElement; return (e.getAttribute('aria-label')||e.id||e.textContent).replace(/\\\\s+/g,' ').slice(0,60)})()" | tr -d '"'; }
has() { A eval "document.querySelectorAll('.screen.is-current $1').length" | tr -d '"'; }   # liczba elementów pasujących do selektora w bieżącym ekranie
clear_field() { # czyści pole formularza DS po etykiecie (fill "" i skróty klawiaturowe nie czyszczą pola w agent-browser)
  A eval "(()=>{const l=[...document.querySelectorAll('.screen.is-current label')].find(x=>x.textContent.trim().startsWith('$1')); const i=document.getElementById(l.htmlFor); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,''); i.dispatchEvent(new Event('input',{bubbles:true})); return 'ok'})()" >/dev/null; }
dele() { A eval "document.querySelectorAll('.screen.is-current button[aria-label^=\"Delete the slot\"]')[$1].click()" >/dev/null; sleep 0.6; }   # otwiera okno usuwania n-tego slotu
confirm_delete() { A eval "[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Delete slot').click()" >/dev/null; sleep 1; }
keep_slot() { A eval "[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Keep slot').click()" >/dev/null; sleep 0.5; }
