#!/bin/zsh
# Ścieżka tylko z klawiatury (Tab, Shift+Tab, Enter, Space, pisanie): logowanie admina, zaproszenie, rejestracja mentorki, profil, slot.
# Wyjątek: pola daty i godziny slotu ustawiane skryptem (natywne kontrolki), kontrolki paska przeglądu nie są objęte.
ROOT="${0:A:h:h:h:h:h}"; cd "$ROOT"
URL="${1:-http://localhost:4175/prototypes/epik-01/index.html}"
A() { node_modules/.bin/agent-browser --session e01-kbd "$@"; }
EV="$ROOT/.ai/prototypes/epik-01/evidence"
pass=0; fail=0
ok() { if [[ "$2" == "$3" ]]; then echo "PASS  $1"; ((pass++)); else echo "FAIL  $1 (jest: $3)"; ((fail++)); fi }
# kto ma fokus: nazwa dostępna (aria-label, etykieta albo tekst)
who() { A eval "(()=>{const e=document.activeElement; const l=e.labels&&e.labels[0]; const f=e.getAttribute('role')==='checkbox'&&e.closest('[data-slot=field]'); return (e.getAttribute('aria-label')||(l&&l.textContent.trim())||(f&&f.querySelector('label').textContent.trim())||e.textContent.trim()).replace(/\\s+/g,' ').slice(0,60)})()" | tr -d '"'; }
tabto() { # tabto "nazwa" [maks]
  for i in {1..70}; do A press Tab >/dev/null; [[ "$(who)" == "$1"* ]] && return 0; done; echo "  (nie znaleziono fokusu: $1)"; return 1
}
A open "$URL" >/dev/null; sleep 1
tabto "Log in" && ok "K1 Tab do linku Log in (nagłówek produktu)" "ok" "ok"
# pierwsze trafienie to element paska przeglądu "s03 Log in"? sprawdzamy, że to nagłówek produktu
A eval "document.activeElement.closest('header.doc-toolbar')?'toolbar':'product'" | grep -q product || { tabto "Log in"; }
A press Enter >/dev/null; sleep 0.7
ok "K2 Enter otwiera s03" "Log in" "$(A get text '.screen.is-current h1' | tr -d '"')"
tabto "Email"; A keyboard type "oliwia.nowak@example.com" >/dev/null; A press Tab >/dev/null; A keyboard type "demo-admin-passphrase-1" >/dev/null; A press Enter >/dev/null; sleep 1.2
ok "K3 logowanie klawiaturą -> s05 (admin)" "Admin" "$(A get text '.screen.is-current h1' | tr -d '"')"
tabto "Invitations"; A press Enter >/dev/null; sleep 0.8
ok "K4 nawigacja admina klawiaturą -> s06" "Invitations" "$(A get text '.screen.is-current h1' | tr -d '"')"
tabto "Mentor's email"; A keyboard type "bad" >/dev/null; A press Enter >/dev/null; sleep 0.4
ok "K5 błędny e-mail: fokus zostaje na polu z komunikatem" "Mentor's email" "$(who)"
A press Control+a >/dev/null; A keyboard type "anna.maj@example.com" >/dev/null; A press Enter >/dev/null; sleep 1
ok "K6 link pokazany raz dostaje fokus" "Invitation link" "$(who)"
A screenshot "$EV/18-keyboard-link-focus.png" >/dev/null
tabto "Copy link"; A press Space >/dev/null; sleep 0.4
ok "K7 Space na Copy link: potwierdzenie słowami" "true" "$(A eval "document.body.innerText.includes('Copied to the clipboard.')||document.body.innerText.includes('Could not copy')" | tr -d '"')"
tabto "open this link as the mentor"; A press Enter >/dev/null; sleep 0.9
ok "K8 Enter otwiera s04" "Join DevMentor as a mentor" "$(A get text '.screen.is-current h1' | tr -d '"')"
tabto "Name"; A keyboard type "Anna Maj" >/dev/null; A press Tab >/dev/null; A keyboard type "kube-ctl-learner-2026" >/dev/null; A press Enter >/dev/null; sleep 1.3
ok "K9 rejestracja mentorki klawiaturą -> s07" "Overview" "$(A get text '.screen.is-current h1' | tr -d '"')"
tabto "Complete profile"; A press Enter >/dev/null; sleep 0.8
ok "K10 akcja z listy kontrolnej -> s08" "Profile and prices" "$(A get text '.screen.is-current h1' | tr -d '"')"
tabto "Headline"; A keyboard type "Data engineer – Python, SQL and pipelines" >/dev/null
tabto "Python"; A press Space >/dev/null
tabto "25-minute session"; A keyboard type "150" >/dev/null
tabto "50-minute session"; A keyboard type "260" >/dev/null
tabto "Show me on the public list"; A press Space >/dev/null
ok "K11 Space zaznacza opt-in" "true" "$(A eval "document.activeElement.getAttribute('aria-checked')" | tr -d '"')"
A press Enter >/dev/null; sleep 1
ok "K12 Enter zapisuje profil" "true" "$(A eval "document.body.innerText.includes('Profile saved.')" | tr -d '"')"
ok "K12b fokus na komunikacie Profile saved. (G12)" "Profile saved." "$(who)"
A screenshot "$EV/19-keyboard-profile-saved.png" >/dev/null
tabto "Slots"; A press Enter >/dev/null; sleep 0.8
ok "K13 nawigacja mentora klawiaturą -> s09" "Slots" "$(A get text '.screen.is-current h1' | tr -d '"')"
A eval "(() => { const set=(el,v)=>{const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; s.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));}; set(document.querySelector('input[type=date]'),'2026-10-24'); set(document.querySelector('input[type=time]'),'09:30'); })()" >/dev/null
tabto "Add slot"; A press Enter >/dev/null; sleep 0.8
ok "K14 błąd slotu: fokus wraca na pole daty" "Date" "$(who)"
ok "K14b komunikat <24 h przy polu" "true" "$(A eval "document.body.innerText.includes('A slot must start at least 24 hours from now.')" | tr -d '"')"
echo; echo "Wynik klawiatury: PASS=$pass FAIL=$fail"
