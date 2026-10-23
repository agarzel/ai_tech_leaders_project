#!/bin/zsh
# Etap 2/3: s06 zaproszenia i s04 rejestracja mentora (c02, c03, c04, c06, c08, c09, c10, c11, c12). Użycie: zsh walk-invite.sh [adres]
source "${0:A:h}/lib.sh" e01-invite
[[ -n "$1" ]] && URL="$1"
start

echo "== s06 zaproszenia"
role "Admin: Oliwia Nowak"; goto s06; sleep 0.6; S="$(ft)"
check "s06.1 domyślny: formularz" "Send invitation" "$S"; check "s06.1 lista: pending" "Pending" "$S"; check "s06.1 lista: used" "Used" "$S"; check "s06.1 lista: expired" "Expired" "$S"; check "s06.1 lista: e-mail" "anna.maj@example.com" "$S"; shot 50-s06-default
goto s05; sel c09 "Slow (3.5 s)"; goto s06; sleep 0.6; check "s06.2 ładowanie listy" "Loading…" "$(ft)"; shot 51-s06-loading; sleep 3.5; sel c09 "Normal"
sel c10 "Empty"; sleep 0.6; S="$(ft)"; check "s06.3 pusta lista" "No invitations yet" "$S"; shot 52-s06-empty
sel c10 "Error"; sleep 0.6; S="$(ft)"; check "s06.4 błąd ładowania z Try again (c10)" "Try again" "$S"; check "s06.4 komunikat po ludzku" "Something went wrong on our side" "$S"; shot 53-s06-load-error
clickb "Try again"; sleep 0.6; check "s06.4 Try again przy trwałym błędzie c10 nadal pokazuje błąd" "Try again" "$(ft)"
sel c10 "Full"; sleep 0.4; check "s06.4 po przełączeniu c10 na Full pokazuje listę" "anna.maj@example.com" "$(ft)"
goto s05; sel c08 "Network error"; goto s06; sleep 0.6; S="$(ft)"; check "s06.4 błąd sieci (c08) przy ładowaniu" "No connection" "$S"; clickb "Try again"; sleep 0.6; check "s06.4 Try again po jednorazowym błędzie działa" "anna.maj@example.com" "$(ft)"
fill "Mentor's email" "bad"; A press Enter >/dev/null; sleep 0.4; check "s06.9 walidacja e-maila przy polu (A07)" "Enter the mentor's email address" "$(ft)"; shot 54-s06-validation
fill "Mentor's email" "ola.wisniewska@example.com"; A press Enter >/dev/null; sleep 0.9; S="$(ft)"; check "s06.11 e-mail ma już konto (L11, A07)" "This address already has an account – log in." "$S"; check "s06.11 wpisany e-mail zostaje" "ola.wisniewska@example.com" "$(val email)"; shot 55-s06-email-has-account
sel c08 "Network error"; fill "Mentor's email" "nowa.osoba@example.com"; A press Enter >/dev/null; sleep 0.9; S="$(ft)"; check "s06.8 błąd wysyłki (c08)" "No connection" "$S"; check "s06.8 e-mail zostaje" "nowa.osoba@example.com" "$(val email)"; shot 56-s06-send-error
sel c09 "Slow (3.5 s)"; fill "Mentor's email" "nowa.osoba@example.com"; A press Enter >/dev/null; sleep 0.8; check "s06.5 wysyłanie (przycisk Saving…)" "Saving…" "$(snap)"; shot 57-s06-sending; sleep 3.5; sel c09 "Normal"
S="$(ft)"; check "s06.6 link pokazany raz" "Invitation for nowa.osoba@example.com" "$S"; check "s06.6 ostrzeżenie: tylko raz" "shown only once" "$S"; check "s06.6 token w linku" "register/mentor?token=" "$(A eval "document.querySelector('.screen.is-current input[readonly]')?.value ?? ''")"; shot 58-s06-link-once
clickb "Done"; sleep 0.5; S="$(ft)"; check "s06.7 po Done link zamknięty, wiersz pending" "nowa.osoba@example.com" "$S"; absent "s06.7 po Done brak linku" "Invitation for" "$S"; shot 59-s06-link-closed
fill "Mentor's email" "anna.maj@example.com"; A press Enter >/dev/null; sleep 0.9; check "s06.10 ponowne zaproszenie: nowy link" "Invitation for anna.maj@example.com" "$(ft)"
btn c12; sleep 0.4; S="$(ft)"; absent "c12 link zgubiony: panel zamknięty" "Invitation for" "$S"; check "s06.10 stary wiersz Anny Revoked" "Revoked" "$S"; check "c12 komunikat w pasku" "cannot be shown again" "$(bar)"; shot 60-s06-revoked-link-lost
btn c11; sleep 0.8; S="$(ft)"; check "c11 ponowne zaproszenie Tomasza: nowy link" "Invitation for tomasz.kowalczyk@example.com" "$S"; shot 61-s06-c11-reinvite
clickb "Done"; sleep 0.3; check "c11 stary wiersz Tomasza Revoked (dwa wiersze Revoked)" "Revoked" "$(ft)"

echo "== s04 rejestracja mentora (c02)"
reset; goto s03; sel c09 "Slow (3.5 s)"; sel c02 "Valid"; sleep 0.8; check "s04.1 sprawdzanie linku (szkielet)" "Checking the invitation" "$(snap)"; shot 62-s04-checking; sleep 3.5; sel c09 "Normal"
S="$(ft)"; check "s04.2 domyślny: zaproszony adres" "You were invited as anna.maj@example.com" "$S"; check "s04.2 pola" "Create mentor account" "$S"; shot 63-s04-default
INVALID="This invitation is no longer valid"
for kind in Already\ used Expired Revoked Unknown; do
  sel c02 "$kind"; sleep 0.8; S="$(ft)"; check "s04.3 link nieważny ($kind)" "$INVALID" "$S"; absent "s04.3 ($kind) bez formularza" "Create mentor account" "$S"; check "s04.3 ($kind) L12 Ask the founders" "Ask the founders for a new link" "$S"
done
shot 64-s04-invalid
BODY_USED="$(sel c02 "Already used"; sleep 0.8; ft)"; BODY_UNKNOWN="$(sel c02 "Unknown"; sleep 0.8; ft)"
[[ "$BODY_USED" == "$BODY_UNKNOWN" ]] && { echo "PASS  s04.3 użyty i nieznany wyglądają identycznie (U7)"; ((pass++)); } || { echo "FAIL  s04.3 użyty i nieznany różnią się"; ((fail++)); }
btn x03; sleep 0.8; check "s04.10 brak tokenu = jak link nieważny" "$INVALID" "$(ft)"; shot 65-s04-no-token
sel c02 "Valid"; sleep 0.8; clickb "Create mentor account"; sleep 0.4; S="$(ft)"; check "s04.5 walidacja: imię" "Enter your name." "$S"; check "s04.5 walidacja: hasło" "Use at least 12 characters." "$S"; shot 66-s04-validation
fill "Name" "Anna Maj"; fill "Password" "short"; A press Enter >/dev/null; sleep 0.4; check "s04.5 hasło krótsze niż 12" "Use at least 12 characters." "$(ft)"
sel c08 "Network error"; fill "Password" "kube-ctl-learner-2026"; A press Enter >/dev/null; sleep 0.9; S="$(ft)"; check "s04.8 błąd sieci" "No connection" "$S"; check "s04.8 imię zostaje" "Anna Maj" "$(val name)"; shot 67-s04-network-error
sel c06 "Register (mentor)"; fill "Password" "kube-ctl-learner-2026"; A press Enter >/dev/null; sleep 0.9; check "s04.7 limit (429)" "Try again in about an hour" "$(ft)"; shot 68-s04-rate-limit; sel c06 "Off"
tick c04; fill "Password" "kube-ctl-learner-2026"; A press Enter >/dev/null; sleep 0.9; S="$(ft)"; check "s04.6 konflikt: e-mail ma już konto (c04)" "This address already has an account – log in." "$S"; check "s04.6 wskazówka: założyciele mogą awansować konto" "can also move your existing account to mentor" "$S"; shot 69-s04-email-has-account; tick c04
tick c03; fill "Password" "kube-ctl-learner-2026"; A press Enter >/dev/null; sleep 0.9; S="$(ft)"; check "s04.4 użyty w międzyczasie (c03)" "Someone used this link while you were filling in the form" "$S"; absent "s04.4 formularz znika" "Create mentor account" "$S"; shot 70-s04-used-meanwhile
sel c02 "Valid"; sleep 0.8; check "c03 po zużyciu: link z c02 'Valid' tworzy nowe zaproszenie" "You were invited as anna.maj@example.com" "$(ft)"
fill "Name" "Anna Maj"; fill "Password" "kube-ctl-learner-2026"; A press Enter >/dev/null; sleep 1.3; check "s04.9 sukces -> /mentor" "Overview" "$(h1)"; check "s04.9 zalogowana jako Anna Maj" "Anna Maj" "$(A get text ".screen.is-current header")"; shot 71-s04-success
sel c02 "Valid"; sleep 0.9; check "s04.11 zalogowany otwiera link: notatka (A10)" "Creating this account signs you out of it." "$(ft)"; shot 72-s04-signed-in-opens-link

echo "== s04 konflikt naprawdę (konto mentee na ten adres)"
reset; goto s02; fill "Name" "Anna Maj"; fill "Email" "anna.maj@example.com"; fill "Password" "kubectl-explain-2026"; A press Enter >/dev/null; sleep 1.2; clickb "Log out"; sleep 0.6
sel c02 "Valid"; sleep 0.8; fill "Name" "Anna Maj"; fill "Password" "kube-ctl-learner-2026"; A press Enter >/dev/null; sleep 0.9; check "s04.6 konflikt bez c04: konto mentee na ten adres" "This address already has an account" "$(ft)"
echo "== U10: stary link po ponownym zaproszeniu"
reset; sel c02 "Revoked"; sleep 0.8; check "U10 c02 revoked: stary link nieważny" "$INVALID" "$(ft)"

summary | tee "$EV/results-invite.txt"
