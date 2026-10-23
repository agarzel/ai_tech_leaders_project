#!/bin/zsh
# Przejście etapu 1 w agent-browser (mysz + pola). Użycie: evidence/walk-stage1.sh [adres, domyślnie http://localhost:4175/prototypes/epik-01/index.html]
# Wymaga zbudowanego podglądu i serwera plików (npm run storybook albo: python3 -m http.server 4175 -d packages/ui/.storybook/public).
ROOT="${0:A:h:h:h:h:h}"; cd "$ROOT"
URL="${1:-http://localhost:4175/prototypes/epik-01/index.html}"
A() { node_modules/.bin/agent-browser --session e01-walk "$@"; }
EV="$ROOT/.ai/prototypes/epik-01/evidence"
pass=0; fail=0
check() { # check "opis" "oczekiwany fragment" "tekst"
  if [[ "$3" == *"$2"* ]]; then echo "PASS  $1"; ((pass++)); else echo "FAIL  $1 (oczekiwano: $2; jest: ${3:0:120})"; ((fail++)); fi
}
h1() { A get text ".screen.is-current h1" 2>/dev/null; }
snap() { A snapshot 2>&1; }
setslot() { A eval "(() => { const set=(el,v)=>{const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; s.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));}; set(document.querySelector('input[type=date]'),'$1'); set(document.querySelector('input[type=time]'),'$2'); return 'ok'; })()" >/dev/null; }
shot() { A screenshot "$EV/$1.png" >/dev/null; }

A open "$URL" >/dev/null; sleep 1
check "s01 start (gość)" "DevMentor" "$(h1)"; shot 01-start-guest

A find role link click --name "s06 Invitations" >/dev/null; sleep 0.8
check "bramka: gość na s06 trafia na Log in" "Log in" "$(h1)"; check "bramka: komunikat" "Log in to continue." "$(snap)"; shot 02-gate-guest-to-login
A find label "Email" fill "oliwia.nowak@example.com" >/dev/null; A find label "Password" fill "zle-haslo-demo-1" >/dev/null; A press Enter; sleep 0.9
check "s03 błędne dane" "Invalid email or password." "$(snap)"; shot 03-login-invalid
A find label "Password" fill "demo-admin-passphrase-1" >/dev/null; A press Enter; sleep 1.1
check "s03 sukces: powrót na s06" "Invitations" "$(h1)"; shot 04-admin-invitations

A find label "Mentor's email" fill "bad" >/dev/null; A press Enter; sleep 0.4
check "s06 walidacja e-maila" "Enter the mentor's email address" "$(snap)"
A find label "Mentor's email" fill "anna.maj@example.com" >/dev/null; A press Enter; sleep 1
S="$(snap)"; check "s06 link pokazany raz" "Invitation for anna.maj@example.com" "$S"; check "s06 token w linku" "register/mentor?token=" "$S"; shot 05-invitation-link-shown-once
A find role button click --name "Done" >/dev/null; sleep 0.4; S="$(snap)"
check "s06 po Done link zamknięty, stary wiersz Revoked" "Revoked" "$S"; shot 05b-invitations-after-done
A find role button click --name "Log out" >/dev/null; sleep 0.6; check "wylogowanie -> s01" "DevMentor" "$(h1)"

# zaproszona mentorka otwiera nowy link (symulacja): admin wystawia go jeszcze raz, żeby link był dostępny
A find role link click --name "s06 Invitations" >/dev/null; sleep 0.6
A find label "Email" fill "oliwia.nowak@example.com" >/dev/null; A find label "Password" fill "demo-admin-passphrase-1" >/dev/null; A press Enter; sleep 1.1
A find label "Mentor's email" fill "anna.maj@example.com" >/dev/null; A press Enter; sleep 1
A find role link click --name "open this link as the mentor" >/dev/null; sleep 0.9
check "s04 formularz z zaproszonym adresem" "You were invited as anna.maj@example.com" "$(snap)"; shot 06-mentor-registration
A find label "Name" fill "Anna Maj" >/dev/null; A find label "Password" fill "short" >/dev/null; A press Enter; sleep 0.4
check "s04 walidacja hasła" "Use at least 12 characters." "$(snap)"
A find label "Password" fill "kube-ctl-learner-2026" >/dev/null; A press Enter; sleep 1.3
check "s04 sukces -> s07" "Overview" "$(h1)"; shot 07-mentor-overview-new
check "s07 nowy mentor: kroki do zrobienia" "To do" "$(snap)"

A find role link click --name "Complete profile" >/dev/null; sleep 0.8
check "s08 profil" "Profile and prices" "$(h1)"
A find label "Name" click >/dev/null; A press Enter; sleep 0.3
check "s08 walidacja: brak nagłówka" "Add one line about what you can help with." "$(snap)"
A keyboard type "Data engineer – Python, SQL and pipelines" >/dev/null; A find role checkbox click --name "Python" >/dev/null
A find label "25-minute session" fill "5" >/dev/null; A press Enter; sleep 0.4
check "s08 walidacja: cena poza zakresem" "Enter an amount from PLN 10.00" "$(snap)"; shot 08-profile-validation
A find label "25-minute session" fill "150" >/dev/null; A find label "50-minute session" fill "260" >/dev/null
A find role checkbox click --name "Show me on the public list" >/dev/null; A find role button click --name "Save" >/dev/null; sleep 1
S="$(snap)"; check "s08 zapisano" "Profile saved." "$S"; check "s08 link do udostępniania po zapisie" "Your share link" "$S"; shot 09-profile-saved

A find role link click --name "Slots" >/dev/null; sleep 0.8
check "s09 pusty" "No slots yet" "$(snap)"
setslot 2026-10-24 09:30; A find role button click --name "Add slot" >/dev/null; sleep 0.8
check "s09 slot <24 h odrzucony" "A slot must start at least 24 hours from now." "$(snap)"; shot 10-slot-too-soon-rejected
setslot 2026-10-24 18:00; A find role button click --name "Add slot" >/dev/null; sleep 0.8
S="$(snap)"; check "s09 slot dodany" "Slot added." "$S"; check "s09 slot otwarty" "Open for booking" "$S"; shot 11-slot-added
setslot 2026-10-24 18:30; A find role button click --name "Add slot" >/dev/null; sleep 0.8
check "s09 odstęp 50 min" "Slots must start at least 50 minutes apart." "$(snap)"

A find role link click --name "Overview" >/dev/null; sleep 0.8
check "s07 oferta gotowa i na liście" "You are on the public list of mentors." "$(snap)"; shot 12-mentor-overview-ready
A find role link click --name "open this link as a visitor" >/dev/null; sleep 0.8
S="$(snap)"; check "s11 strona mentora" "Anna Maj" "$(h1)"; check "s11 Book wyłączony z powodem" "Booking is not open in this prototype" "$S"
check "s11 cena" "PLN 150.00" "$S"; check "s11 24 h wprost" "at least 24 hours ahead" "$S"; shot 13-public-page
if [[ "$S" == *"rating"* || "$S" == *"★"* ]]; then echo "FAIL  s11 bez ocen"; ((fail++)); else echo "PASS  s11 bez ocen"; ((pass++)); fi

A select "#role-select" "Mentee: Ola Wiśniewska" >/dev/null; sleep 0.8
check "c01 mentee ląduje na s10" "Mentors" "$(h1)"; S="$(snap)"
check "s10 Anna na liście po opt-in" "link \"Anna Maj\"" "$S"; check "s10 Marek na liście" "link \"Marek Zieliński\"" "$S"; check "s10 liczba" "5 mentors" "$S"; shot 14-mentor-list
A find role link click --name "Anna Maj" >/dev/null; sleep 0.8; check "s10 -> s11 po kliknięciu karty" "Anna Maj" "$(h1)"
A find role link click --name "s07 Mentor overview" >/dev/null; sleep 0.9
check "bramka: mentee na s07 -> Log in" "Log in" "$(h1)"; check "bramka: zła rola komunikat" "This page is for mentor accounts" "$(snap)"; shot 15-gate-wrong-role
A find label "Email" fill "marek.zielinski@example.com" >/dev/null; A find label "Password" fill "helm-chart-rollback-2" >/dev/null; A press Enter; sleep 1.1
check "powrót po logowaniu na s07 (Marek)" "Overview" "$(h1)"; check "Marek: oferta gotowa" "public list of mentors" "$(snap)"

A find role button click --name "Dark theme" >/dev/null; sleep 0.4; shot 16-dark-theme-mentor-overview
A find role button click --name "Dark theme" >/dev/null
A select "#width-select" "320 px (container)" >/dev/null; sleep 0.4; shot 17-width-320-container
A select "#width-select" "Full" >/dev/null
echo; echo "Wynik: PASS=$pass FAIL=$fail"
