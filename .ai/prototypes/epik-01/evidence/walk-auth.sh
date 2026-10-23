#!/bin/zsh
# Etap 2/3: s01-s05, s12 i bramki dostępu (c01, c04-c09). Użycie: zsh walk-auth.sh [adres]
source "${0:A:h}/lib.sh" e01-auth
[[ -n "$1" ]] && URL="$1"
start

echo "== s01 start"
goto s01; S="$(ft)"; check "s01.1 gość: Mentors, Log in, Register" "Register" "$S"; check "s01.1 gość: link Log in" "Log in" "$S"; shot 20-s01-guest
role "Mentee: Ola Wiśniewska"; goto s01; S="$(ft)"; check "s01.2 mentee: imię w nagłówku i Log out" "Log out" "$S"; absent "s01.2 mentee: bez Overview/Admin" "Overview" "$S"; shot 21-s01-mentee
role "Mentor: Marek Zieliński"; goto s01; check "s01.3 mentor: link Overview" "Overview" "$(ft)"
role "Admin: Oliwia Nowak"; goto s01; check "s01.4 admin: link Admin" "Admin" "$(ft)"
goto s05; sleep 0.5; S="$(ft)"; check "s05.1 domyślny: sekcja Invitations" "Invitations" "$S"; check "s05.1 Users nieaktywne z dopiskiem (P4)" "not in this prototype" "$S"; shot 43-s05-default
clickl "Invitations"; sleep 0.6; check "s05.1 -> s06 po kliknięciu sekcji" "Invitations" "$(h1)"
role "Guest"; clickl "s03 Log in"; sleep 0.3
sel c09 "Slow (3.5 s)"; goto s01; sleep 0.5; S="$(snap)"; check "s01.5 ładowanie sesji" "Checking your session" "$S"; shot 22-s01-loading-session; sleep 4
sel c09 "Normal"; clickl "s03 Log in"; sleep 0.3; sel c08 "Network error"; goto s01; sleep 0.6
S="$(ft)"; check "s01.6 błąd sesji z Try again" "Try again" "$S"; check "s01.6 jak gość: Register" "Register" "$S"; shot 23-s01-session-error
clickb "Try again"; sleep 0.6; absent "s01.6 Try again po ponowieniu działa" "We could not check your session" "$(ft)"

echo "== s02 rejestracja mentee"
reset; goto s02; S="$(ft)"; check "s02.1 domyślny: pola" "Create account" "$S"; shot 24-s02-default
clickb "Create account"; sleep 0.4; S="$(ft)"; check "s02.2 walidacja: imię" "Enter your name." "$S"; check "s02.2 walidacja: e-mail" "Enter an email address" "$S"; check "s02.2 walidacja: hasło" "Use at least 12 characters." "$S"; shot 25-s02-validation
fill "Name" "Ola Test"; fill "Email" "ola.test@example.com"; fill "Password" "kubectl-explain-2026"
sel c09 "Slow (3.5 s)"; clickb "Create account"; sleep 0.7; check "s02.3 wysyłanie: Saving…" "Saving…" "$(snap)"; shot 26-s02-submitting; sleep 3.5; sel c09 "Normal"
# wynik: sukces -> /mentors jako mentee
check "s02.7 sukces: ląduje na liście mentorów" "Mentors" "$(h1)"; check "s02.7 sukces: zalogowana Ola Test" "Ola Test" "$(A get text ".screen.is-current header" 2>/dev/null)"; shot 27-s02-success-mentee-lands
clickb "Log out"; sleep 0.6; goto s02
fill "Name" "Ola Test"; fill "Email" "ola.wisniewska@example.com"; fill "Password" "kubectl-explain-2026"; clickb "Create account"; sleep 0.8
S="$(ft)"; check "s02.4 konflikt (istniejący e-mail): ogólny komunikat przy polu" "We could not create an account with this email." "$S"; absent "s02.4 nie potwierdza istnienia konta słowem 'already'" "already has an account" "$S"; check "s02.4 wpisane dane zostają" "ola.wisniewska@example.com" "$(val email)"; shot 28-s02-conflict
reset; goto s02; tick c04; fill "Name" "Ola Test"; fill "Email" "ktos.nowy@example.com"; fill "Password" "kubectl-explain-2026"; clickb "Create account"; sleep 0.8
check "s02.4 konflikt wymuszony c04" "We could not create an account" "$(ft)"; tick c04
sel c06 "Register (mentee)"; fill "Password" "kubectl-explain-2026"; A press Enter >/dev/null; sleep 0.8; S="$(ft)"; check "s02.5 limit rejestracji (429) z czasem ponowienia" "Try again in about an hour" "$S"; shot 29-s02-rate-limit; sel c06 "Off"
sel c08 "Network error"; fill "Password" "kubectl-explain-2026"; A press Enter >/dev/null; sleep 0.8; S="$(ft)"; check "s02.6 błąd sieci: komunikat" "No connection" "$S"; check "s02.6 wpisane wartości zostają" "ktos.nowy@example.com" "$(val email)"; shot 30-s02-network-error
fill "Password" "kubectl-explain-2026"; A press Enter >/dev/null; sleep 1; check "s02.7 po ponowieniu sukces" "Mentors" "$(h1)"
goto s02; check "s02.8 zalogowany na /register: nie blokuje, notatka" "Registering creates a new account and replaces the session" "$(ft)"; shot 31-s02-already-signed-in

echo "== s03 logowanie"
reset; goto s03; S="$(ft)"; check "s03.1 domyślny: konta demo" "ola.wisniewska@example.com" "$S"; check "s03.1 link do Register" "Register" "$S"; shot 32-s03-default
login ola.wisniewska@example.com zle-haslo-demo-1; S="$(ft)"; check "s03.3 błędne dane (401): jeden komunikat" "Invalid email or password." "$S"; shot 33-s03-invalid
for i in 2 3 4 5; do fill "Password" "zle-haslo-demo-$i"; A press Enter >/dev/null; sleep 0.6; done
fill "Password" "ingress-1-28-upgrade"; A press Enter >/dev/null; sleep 0.8; S="$(ft)"; check "s03.4 za dużo prób (429) po 5 błędnych (prawdziwe hasło też zablokowane)" "Too many attempts. Try again in 15 minutes." "$S"; shot 34-s03-too-many
reset; goto s03; sel c06 "Log in"; fill "Email" "oliwia.nowak@example.com"; fill "Password" "demo-admin-passphrase-1"; A press Enter >/dev/null; sleep 0.8; check "s03.4 wymuszone c06" "Too many attempts" "$(ft)"; sel c06 "Off"
tick c05; fill "Password" "demo-admin-passphrase-1"; A press Enter >/dev/null; sleep 0.8; check "s03.3 wymuszone c05 przy poprawnym haśle" "Invalid email or password." "$(ft)"; tick c05
sel c08 "Network error"; fill "Password" "demo-admin-passphrase-1"; A press Enter >/dev/null; sleep 0.8; S="$(ft)"; check "s03.5 błąd sieci" "No connection" "$S"; check "s03.5 e-mail zostaje" "oliwia.nowak@example.com" "$(val email)"; shot 35-s03-network-error
sel c09 "Slow (3.5 s)"; fill "Password" "demo-admin-passphrase-1"; A press Enter >/dev/null; sleep 0.8; check "s03.2 wysyłanie: Saving…" "Saving…" "$(snap)"; shot 36-s03-submitting; sleep 3.5; sel c09 "Normal"
check "s03.6 sukces admin -> /admin" "Admin" "$(h1)"
goto s03; check "s03.8 zalogowany na /login: nowe logowanie zastępuje sesję" "A new login replaces the session" "$(ft)"; shot 37-s03-already-signed-in
login ola.wisniewska@example.com ingress-1-28-upgrade; check "s03.6 sukces mentee -> /mentors" "Mentors" "$(h1)"
goto s03; login marek.zielinski@example.com helm-chart-rollback-2; check "s03.6 sukces mentor -> /mentor" "Overview" "$(h1)"
# s03.7 sesja wygasła
btn c07-now; sleep 0.6; S="$(ft)"; check "s03.7 sesja wygasła: komunikat nad formularzem" "Your session has ended. Log in to continue." "$S"; check "s03.7 wylogowany" "Log in" "$(h1)"; shot 38-s03-session-ended

echo "== bramki dostępu (s05.2, s05.3, s06.12, s07.8, s08.12, s09.16, s12.1, s12.2)"
reset
for pair in "s05:Admin" "s06:Invitations" "s07:Overview" "s08:Profile" "s09:Slots"; do
  id="${pair%%:*}"; goto $id; sleep 0.6
  check "$id gość -> /login (s12.1)" "Log in" "$(h1)"; check "$id gość: komunikat bramki" "Log in to continue." "$(ft)"
done
shot 39-gate-guest
role "Mentee: Ola Wiśniewska"
for pair in "s05" "s06" "s07" "s08" "s09"; do
  goto $pair; sleep 0.6
  check "$pair mentee -> /login z komunikatem roli (s12.2)" "This page is for" "$(ft)"
done
shot 40-gate-mentee
role "Mentor: Marek Zieliński"; goto s05; sleep 0.6; check "s05.2 mentor na /admin -> /login (s12.2)" "This page is for admin accounts" "$(ft)"
goto s06; sleep 0.6; check "s06.12 mentor na /admin/invitations -> /login" "This page is for admin accounts" "$(ft)"
role "Admin: Oliwia Nowak"; goto s07; sleep 0.6; check "s07.8 admin na /mentor -> /login" "This page is for mentor accounts" "$(ft)"
goto s08; sleep 0.6; check "s08.12 admin na /mentor/profile -> /login" "This page is for mentor accounts" "$(ft)"
goto s09; sleep 0.6; check "s09.16 admin na /mentor/slots -> /login" "This page is for mentor accounts" "$(ft)"
# powrót po zalogowaniu na poprzednią stronę (L02): admin otwiera /mentor/slots, loguje się jako mentor
login marek.zielinski@example.com helm-chart-rollback-2; check "L02 powrót na /mentor/slots po zalogowaniu właściwą rolą" "Slots" "$(h1)"
# po zalogowaniu rolą, która nie pasuje do strony: ląduje na stronie roli (L04)
reset; goto s06; sleep 0.5; login ola.wisniewska@example.com ingress-1-28-upgrade; check "L04 mentee po bramce admina ląduje na /mentors" "Mentors" "$(h1)"

echo "== s12"
btn x02; sleep 0.5; S="$(ft)"; check "s12.3 nie znaleziono (404)" "We could not find this page" "$S"; check "s12.3 link do startu" "Go to the start page" "$S"; shot 41-s12-not-found
clickl "Go to the start page"; sleep 0.5; check "s12.3 link wraca na start" "DevMentor" "$(h1)"
role "Mentor: Marek Zieliński"; goto s08; sleep 0.8; sel c07 "Ends on the next save"; fill "Headline" "Platform engineer – Kubernetes"; clickb "Save profile"; sleep 1.2
S="$(ft)"; check "s12.4 sesja wygasła przy zapisie: /login z komunikatem" "Your session has ended. Log in to continue." "$S"; shot 42-s12-session-ended-on-save
login marek.zielinski@example.com helm-chart-rollback-2; check "s12.4 po zalogowaniu powrót na /mentor/profile" "Profile and prices" "$(h1)"

summary | tee "$EV/results-auth.txt"
