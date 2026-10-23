#!/bin/zsh
# Etap 2/3: s07 panel, s08 profil, s09 terminy (c07, c08, c09, c13-c17, c19). Użycie: zsh walk-mentor.sh [adres]
source "${0:A:h}/lib.sh" e01-mentor
[[ -n "$1" ]] && URL="$1"
start
role "Mentor: Marek Zieliński"

echo "== s07 panel mentora (c13)"
sel c13 "New mentor"; sleep 0.8; S="$(ft)"; check "s07.1 nowy mentor: profil do zrobienia" "Complete profile" "$S"; check "s07.1 link do udostępniania dopiero po zapisie (L08)" "Your link appears here once you save your profile." "$S"; absent "s07.1 bez linku do otwarcia przed zapisem" "open this link as a visitor" "$S"; shot 80-s07-new
sel c13 "Profile and prices, no times"; sleep 0.8; S="$(ft)"; check "s07.2 profil i ceny bez terminów" "Add at least one time" "$S"; shot 81-s07-no-slots
sel c13 "Only times under 24 h"; sleep 0.8; S="$(ft)"; check "s07.3 tylko terminy <24 h: wyjaśnienie" "Your times start within 24 hours, so nobody can book them." "$S"; shot 82-s07-too-soon
sel c13 "Ready, not on the list"; sleep 0.8; S="$(ft)"; check "s07.4 gotowa, niewylistowany: link" "Anyone with this link can see your profile and book your open times." "$S"; check "s07.4 lista publiczna: nieaktywna" "You are not on the public list" "$S"; shot 83-s07-ready-unlisted
sel c13 "Ready and on the list"; sleep 0.8; check "s07.5 gotowa i na liście" "You are on the public list of mentors." "$(ft)"; shot 84-s07-listed
goto s08; sel c09 "Slow (3.5 s)"; goto s07; sleep 0.6; check "s07.6 ładowanie: 5 wierszy szkieletu" "5" "$(has '[data-slot=skeleton]')"
absent "s07.6 w trakcie ładowania nie ma listy kroków" "Complete profile" "$(ft)"; shot 85-s07-loading; sleep 3.5; sel c09 "Normal"
goto s08; sel c08 "Server error 500"; goto s07; sleep 0.6; S="$(ft)"; check "s07.7 błąd ładowania z Try again" "Try again" "$S"; check "s07.7 komunikat" "Something went wrong on our side" "$S"; shot 86-s07-error
clickb "Try again"; sleep 0.6; check "s07.7 Try again przywraca panel" "You are on the public list of mentors." "$(ft)"

echo "== s08 profil i ceny"
reset; role "Mentor: Marek Zieliński"; goto s08; sleep 0.6; S="$(ft)"
check "s08.1 kompletny: nagłówek" "Platform engineer – Kubernetes, Helm, CI pipelines" "$(idval headline)"; check "s08.1 cena 25 min" "180" "$(idval price25)"; check "s08.1 link do udostępniania (zapisany profil)" "Your share link" "$S"; shot 87-s08-complete
sel c13 "New mentor"; sleep 0.8; clickl "Complete profile: Profile"; sleep 0.8; S="$(ft)"
check "s08.2 nowy: tylko imię" "Marek Zieliński" "$(idval name)"; check "s08.2 nowy: nagłówek pusty" "" "$(idval headline)"; check "s08.2 nowy: bez sekcji linku do udostępniania (0)" "0" "$(has '#share-title')"; shot 88-s08-new
A find label "Name" click >/dev/null; A press Enter >/dev/null; sleep 0.4; check "s08.7 walidacja: brak nagłówka" "Add one line about what you can help with." "$(ft)"
fill "Headline" "Platform engineer"; fill "25-minute session" "5"; fill "50-minute session" "260"; A press Enter >/dev/null; sleep 0.7; check "s08.7 walidacja: cena poza zakresem" "Enter an amount from PLN 10.00" "$(ft)"
fill "Link 1" "http://example.com/x"; A press Enter >/dev/null; sleep 0.4; check "s08.7 walidacja: link spoza https" "Use a full https:// address" "$(ft)"; shot 89-s08-validation
fill "Link 1" "https://github.com/marek-zielinski"; fill "25-minute session" "180"
sel c08 "Network error"; fill "50-minute session" "320"; A press Enter >/dev/null; sleep 1; S="$(ft)"; check "s08.8 błąd zapisu (c08)" "No connection" "$S"; check "s08.8 wartości zostają" "Platform engineer" "$(idval headline)"; shot 90-s08-save-error
sel c09 "Slow (3.5 s)"; fill "50-minute session" "320"; A press Enter >/dev/null; sleep 0.8; check "s08.5 zapisywanie (Saving…)" "Saving…" "$(snap)"; shot 91-s08-saving; sleep 3.5; sel c09 "Normal"
S="$(ft)"; check "s08.6 zapisano" "Profile saved." "$S"; check "s08.6 link do udostępniania po zapisie" "Your share link" "$S"; shot 92-s08-saved
# s08.9 opt-in bez cen/terminów: komunikat A09
A find role checkbox click --name "Show me on the public list" >/dev/null; fill "50-minute session" "320"; A press Enter >/dev/null; sleep 1.2; S="$(ft)"
check "s08.9 opt-in zapisany: A09 czego brakuje" "Public list is on, but you are not visible yet. Missing: a time at least 24 hours ahead." "$S"; shot 93-s08-opt-in-missing
clickl "Overview"; sleep 0.8; check "s07 A09 także na panelu" "Public list is on, but you are not visible yet" "$(ft)"
sel c13 "New mentor"; sleep 0.6; clickl "Complete profile: Profile"; sleep 0.8; fill "Headline" "Platform engineer"; A find role checkbox click --name "Show me on the public list" >/dev/null; fill "Headline" "Platform engineer"; A press Enter >/dev/null; sleep 1.2
check "s08.9 A09 przy braku cen i terminów" "Missing: both prices, a time at least 24 hours ahead." "$(ft)"
sel c13 "Ready and on the list"; sleep 0.8; clickl "Change: Public list"; sleep 0.8; check "s08.9 opt-in włączony w polu wyboru" "Show me on the public list" "$(ft)"
A find role checkbox click --name "Show me on the public list" >/dev/null; fill "Headline" "Platform engineer – Kubernetes, Helm, CI pipelines"; A press Enter >/dev/null; sleep 1.2; S="$(ft)"; check "s08.10 opt-out zapisany" "Profile saved." "$S"; absent "s08.10 opt-out: bez ostrzeżenia A09" "Public list is on" "$S"
btn x01; sleep 0.3; goto s10; sleep 0.6; check "s08.10 opt-out: lista ma 3 mentorów bez Marka" "3 mentors" "$(ft)"; shot 94-s10-opt-out-not-listed
role "Mentor: Marek Zieliński"; goto s08; sleep 0.6
clear_field "25-minute session"; clear_field "50-minute session"; A find label "50-minute session" click >/dev/null; A press Enter >/dev/null; sleep 1.2; check "s08.11 ceny nieustawione: zapis możliwy (#25-4)" "Profile saved." "$(ft)"; shot 95-s08-prices-not-set
goto s07; sleep 0.6; check "s08.11 panel: Set prices" "Set prices" "$(ft)"
goto s08; sel c09 "Slow (3.5 s)"; goto s09; goto s08; sleep 0.6; check "s08.3 ładowanie (szkielet)" "Loading your profile" "$(snap)"; shot 96-s08-loading; sleep 3.5; sel c09 "Normal"
goto s09; sel c08 "Network error"; goto s08; sleep 0.6; S="$(ft)"; check "s08.4 błąd ładowania z Try again" "Try again" "$S"; check "s08.4 No connection" "No connection" "$S"; shot 97-s08-load-error; clickb "Try again"; sleep 0.6; check "s08.4 Try again" "Your share link" "$(ft)"

echo "== s09 terminy"
reset; role "Mentor: Marek Zieliński"; goto s09; sleep 0.6; S="$(ft)"
check "s09.1 domyślny: otwarty" "Open for booking" "$S"; check "s09.1 domyślny: zbyt wcześnie" "Not bookable – starts too soon" "$S"; check "s09.1 domyślny: zarezerwowany" "Booked" "$S"; check "s09.1 etykieta strefy (lato)" "Europe/Warsaw, UTC+2" "$S"; check "s09.1 etykieta strefy (zima)" "Europe/Warsaw, UTC+1" "$S"; shot 100-s09-default
check "s09.12 zarezerwowany slot bez usuwania: wyjaśnienie" "Cannot be deleted: cancel the booking instead" "$S"
check "s09.12 liczba przycisków Delete = 7 (8 slotów, 1 zarezerwowany)" "7" "$(A eval "document.querySelectorAll('.screen.is-current button[aria-label^=\"Delete the slot\"]').length" | tr -d '"')"
sel c15 "None"; sleep 0.8; check "s09.2 pusty: brak slotów (c15)" "No slots yet" "$(ft)"; shot 101-s09-empty
sel c15 "60 slots"; sleep 0.8; check "s09.14 60 slotów" "60" "$(nslots)"; shot 102-s09-60
sel c15 "Normal"; sleep 0.8; check "c15 Normal przywraca 8 slotów" "8" "$(nslots)"
goto s08; sel c09 "Slow (3.5 s)"; goto s09; sleep 0.6; check "s09.3 ładowanie listy" "Loading slots" "$(snap)"; shot 103-s09-loading; sleep 3.5; sel c09 "Normal"
goto s08; sel c08 "Server error 500"; goto s09; sleep 0.6; S="$(ft)"; check "s09.4 błąd ładowania (500)" "Something went wrong on our side" "$S"; check "s09.4 Try again" "Try again" "$S"; shot 104-s09-load-error; clickb "Try again"; sleep 0.6; check "s09.4 Try again przywraca listę" "Open for booking" "$(ft)"
# odrzucenia
reset; role "Mentor: Marek Zieliński"; goto s09; sleep 0.6
tryslot() { setslot "$1" "$2"; clickb "Add slot"; sleep 0.9; }
tryslot 2026-10-24 09:30; check "s09.7 <24 h odrzucony (#27-3)" "A slot must start at least 24 hours from now." "$(ft)"; shot 105-s09-too-soon
tryslot 2026-12-28 18:00; check "s09.7 >60 dni" "A slot can start at most 60 days from now." "$(ft)"
tryslot 2026-10-27 18:10; check "s09.7 poza siatką 15 min" "Start times are on a 15-minute grid" "$(ft)"
tryslot 2026-10-26 18:00; check "s09.7 duplikat" "You already have a slot at this time." "$(ft)"
tryslot 2026-10-26 18:30; check "s09.7 odstęp <50 min" "Slots must start at least 50 minutes apart." "$(ft)"; shot 106-s09-spacing
check "s09.7 wpisane wartości zostają po błędzie" "2026-10-26" "$(A eval "document.querySelector('.screen.is-current input[type=date]').value" | tr -d '"')"
sel c09 "Slow (3.5 s)"; tryslot 2026-10-27 18:00; check "s09.5 dodawanie (Adding…)" "Adding…" "$(snap)"; shot 107-s09-adding; sleep 3.5; sel c09 "Normal"
S="$(ft)"; check "s09.6 dodany: Slot added." "Slot added." "$S"; check "s09.6 nowy wiersz" "Tuesday 27 October" "$S"; check "s09.6 fokus wraca na pole daty" "date" "$(focused)"; check "s09.6 9 slotów" "9" "$(nslots)"; shot 108-s09-added
# DST
sel c19 "Time that does not exist"; sleep 1; S="$(ft)"; check "s09.8 czas nieistniejący (DST)" "This time does not exist in your time zone" "$S"; check "c19 pola wypełnione datą 2027-03-28" "2027-03-28" "$(A eval "document.querySelector('.screen.is-current input[type=date]').value" | tr -d '"')"; shot 109-s09-dst-gap
clickb "Add slot"; sleep 0.5; check "s09.8 zapis zablokowany lokalnie, nie dodaje slotu" "9" "$(nslots)"
sel c19 "Time that happens twice"; sleep 1; S="$(ft)"; check "s09.9 czas niejednoznaczny: podgląd z offsetem" "UTC+2" "$S"; check "s09.9 podgląd: Starts" "Starts" "$S"; shot 110-s09-dst-ambiguous
clickb "Add slot"; sleep 0.9; S="$(ft)"; check "s09.9 zapis niejednoznacznego (pierwsze wystąpienie, UTC+2)" "Slot added." "$S"; check "s09.9 slot w niedzielę 25 Oct 02:30 (UTC+2)" "02:30" "$S"
# usuwanie
reset; role "Mentor: Marek Zieliński"; goto s09; sleep 0.6
dele 3
S="$(snap)"; check "s09.10 potwierdzenie usunięcia: pytanie z czasem" "Delete the slot on" "$S"; check "s09.10 bezpieczny wybór pierwszy: fokus na Keep slot" "Keep slot" "$(focused)"; shotv 111-s09-delete-confirm
keep_slot; check "s09.10 Keep slot: slot zostaje (8)" "8" "$(nslots)"
dele 3; confirm_delete; check "s09.11 usunięty: 7 slotów (#27-2)" "7" "$(nslots)"; check "s09.11 fokus na nagłówku Your slots" "your-slots" "$(focused)"; shot 112-s09-deleted
# konflikt: c16 (slot zarezerwowany w międzyczasie), powód w oknie, wiersz zmienia się przy następnym wczytaniu
tick c16; dele 3; confirm_delete; S="$(snap)"; check "s09.12 konflikt (c16): powód w oknie dialogowym" "Cancel the booking instead – a mentee booked this time." "$S"; shotv 113-s09-conflict
keep_slot; goto s08; goto s09; sleep 0.8; check "s09.12 po ponownym wczytaniu wiersz Booked bez Delete" "Cannot be deleted: cancel the booking instead" "$(ft)"; check "s09.12 teraz 5 przycisków Delete" "5" "$(has 'button[aria-label^="Delete the slot"]')"
# sesja kończy się przy usunięciu slotu
reset; role "Mentor: Marek Zieliński"; goto s09; sleep 0.6; sel c07 "Ends on the next save"
dele 0; confirm_delete; sleep 0.5
check "c07 sesja kończy się przy usunięciu: /login z komunikatem" "Your session has ended" "$(ft)"
# s09.13 i s09.15, c17
reset; role "Mentor: Marek Zieliński"; sel c13 "Only times under 24 h"; sleep 0.6; goto s09; sleep 0.6; S="$(ft)"; check "s09.13 tylko <24 h: wszystkie 'starts too soon'" "Not bookable – starts too soon" "$S"; absent "s09.13 żaden nie jest 'Open for booking'" "Open for booking" "$S"; shot 114-s09-only-too-soon
sel c13 "New mentor"; sleep 0.6; goto s09; sleep 0.6; check "s09.15 brak cen: można dodawać sloty, komunikat" "You have not set both prices yet" "$(ft)"; shot 115-s09-no-prices
setslot 2026-10-27 18:00; clickb "Add slot"; sleep 0.9; check "s09.15 mentor bez cen dodaje slot (L06)" "Slot added." "$(ft)"
# c17 zegar
reset; role "Mentor: Marek Zieliński"; goto s07; sleep 0.5; clickl "open this link as a visitor"; sleep 0.8; check "c17 (0 h) strona Marka: 5 terminów do rezerwacji" "5" "$(nslots)"
sel c17 "+6 h"; sleep 0.5; check "c17 (+6 h) komunikat zegara demo" "Fri 23 Oct, 16:00" "$(bar)"; goto s09; goto s11; sleep 0.8; check "c17 (+6 h) strona Marka: 4 terminy (sobota 12:00 za blisko)" "4" "$(nslots)"; shot 116-s11-clock-plus6
sel c17 "+24 h"; goto s09; sleep 0.6; check "c17 (+24 h) panel: terminy <24 h" "Not bookable – starts too soon" "$(ft)"; check "c17 (+24 h) przeszłe terminy: 'Past', bez Delete (G18, Q2)" "Past: this time has passed" "$(ft)"
goto s07; sleep 0.5; shot 117-s07-clock-plus24

summary | tee "$EV/results-mentor.txt"
