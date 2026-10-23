#!/bin/zsh
# Etap 2/3: s10 lista mentorów i s11 strona mentora (c01, c08, c09, c13, c15, c20, c21). Użycie: zsh walk-public.sh [adres]
source "${0:A:h}/lib.sh" e01-public
[[ -n "$1" ]] && URL="$1"
start
mlist() { A eval "document.querySelector('.screen.is-current [aria-label=Mentors]')?.innerText ?? ''" | tr -d '"'; }
cards() { has '[aria-label="Mentors"] [data-slot=item]'; }

echo "== s10 lista mentorów"
goto s10; sleep 0.6; S="$(ft)"
check "s10.1 domyślny: liczba (Marek + 3 stałych)" "4 mentors" "$S"; check "s10.1 Kasia" "Kasia Lewandowska" "$S"; check "s10.1 najbliższy termin" "Next time:" "$S"; check "s10.1 cena 25 min" "PLN 150.00" "$S"; check "s10.1 24 h wprost (L14)" "at least 24 hours ahead" "$S"; shot 120-s10-default
absent "s10 bez ocen i gwiazdek (N02)" "rating" "$S"; absent "s10 bez gwiazdek" "★" "$S"
sel c21 "TypeScript"; sleep 0.6; S="$(ft)"; check "s10.2 filtr stosu: 3 mentorów" "3 mentors" "$S"; check "s10.2 aktywny filtr" "Stack: TypeScript" "$S"; check "s10.2 lista po filtrze zawiera Kasię" "Kasia Lewandowska" "$(mlist)"; absent "s10.2 Marek (Python, AI agents) odfiltrowany" "Marek Zieliński" "$(mlist)"; shot 121-s10-filter
clickb "Remove filter: Stack: TypeScript"; sleep 0.5; check "s10.2 usunięcie filtra przyciskiem" "4 mentors" "$(ft)"
A eval "(()=>{const s=document.querySelector('.screen.is-current select'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,'React'); s.dispatchEvent(new Event('change',{bubbles:true}));})()" >/dev/null; sleep 0.5; check "s10.2 filtr z pola Stack na stronie" "1 mentor" "$(ft)"
sel c21 "No results"; sleep 0.6; S="$(ft)"; check "s10.3 brak wyników" "No mentors match this filter" "$S"; check "s10.3 Clear filters" "Clear filters" "$S"; shot 122-s10-no-match
A eval "[...document.querySelectorAll('.screen.is-current button')].filter(b=>b.textContent.trim()==='Clear filters')[1].click()" >/dev/null; sleep 0.5; check "s10.3 Clear filters przywraca listę" "4 mentors" "$(ft)"
sel c20 "Empty"; sleep 0.6; S="$(ft)"; check "s10.4 nikt na liście" "No mentors here yet" "$S"; check "s10.4 co dalej" "set their prices and published a time" "$S"; shot 123-s10-nobody
sel c20 "25 mentors"; sleep 0.6; S="$(ft)"; check "s10.7 25 mentorów" "25 mentors" "$S"; check "s10.7 paginacja" "Page 1 of 3" "$S"; check "s10.7 10 kart na stronie" "10" "$(cards)"; shot 124-s10-many
clickb "Next"; sleep 0.5; check "s10.7 strona 2" "Page 2 of 3" "$(ft)"; clickb "Next"; sleep 0.5; S="$(ft)"; check "s10.7 strona 3: 5 kart" "5" "$(cards)"; check "s10.7 strona 3 zakres" "21–25 of 25" "$S"
sel c20 "Long values and partial profile"; sleep 0.6; S="$(ft)"; check "s10.8 długie wartości: pełna nazwa" "Aleksandra Konstantynopolitańczykiewiczówna-Grzybowska" "$S"; check "s10.8 długie wartości: nagłówek 120 znaków" "the long tail of on-call lore" "$S"; check "s10.8 częściowy profil na liście" "Tomasz Kowalczyk" "$S"; shot 125-s10-long
sel c20 "A few mentors"; goto s03; sel c09 "Slow (3.5 s)"; goto s10; sleep 0.6; check "s10.5 ładowanie (szkielet kart)" "Loading mentors" "$(snap)"; shot 126-s10-loading; sleep 3.5; sel c09 "Normal"
goto s03; sel c08 "Server error 500"; goto s10; sleep 0.6; S="$(ft)"; check "s10.6 błąd z Try again" "Try again" "$S"; check "s10.6 komunikat" "Something went wrong on our side" "$S"; shot 127-s10-error
clickb "Try again"; sleep 0.6; check "s10.6 Try again przywraca listę" "4 mentors" "$(ft)"

echo "== s10 i s11 dla każdej roli"
for who in "Guest" "Mentee: Ola Wiśniewska" "Mentor: Marek Zieliński" "Admin: Oliwia Nowak"; do
  role "$who"; goto s10; sleep 0.5; check "s10 widoczny dla: $who" "Mentors" "$(h1)"; check "s10 ($who) lista" "Kasia Lewandowska" "$(ft)"
  clickl "Kasia Lewandowska"; sleep 0.6; check "s11 widoczny dla: $who" "Kasia Lewandowska" "$(h1)"
done

echo "== s11 strona mentora"
reset; goto s10; sleep 0.5; clickl "Marek Zieliński"; sleep 0.7; S="$(ft)"
check "s11.1 domyślny: nagłówek mentora" "Platform engineer – Kubernetes, Helm, CI pipelines" "$S"; check "s11.1 tagi" "AI agents" "$S"; check "s11.1 cena 25 min" "PLN 180.00" "$S"; check "s11.1 cena 50 min" "PLN 320.00" "$S"; check "s11.1 linki publiczne" "github.com/marek-zielinski" "$S"; check "s11.1 5 terminów do rezerwacji" "5" "$(nslots)"; shot 130-s11-default
check "s11.2 Book wyłączony: powód tekstem" "Booking is not open in this prototype, so Book is disabled." "$S"; check "s11.2 24 h wprost (L14, D13)" "at least 24 hours ahead" "$S"
check "s11.2 wszystkie 5 przycisków Book są wyłączone" "5" "$(has 'button[disabled][aria-label^="Book"]')"; absent "s11 bez ocen (N02)" "rating" "$S"
sel c15 "None"; sleep 0.6; goto s07; sleep 0.5; clickl "open this link as a visitor"; sleep 0.7; S="$(ft)"; check "s11.3 brak terminów: stan pusty, nie błąd" "No times available right now" "$S"; absent "s11.3 to nie jest błąd" "Something went wrong" "$S"; shot 131-s11-no-times
goto s10; sleep 0.5; check "s11.3 lista dalej pokazuje innych" "Kasia Lewandowska" "$(mlist)"; absent "s11.3 mentor bez slotów znika z listy (c15)" "Marek Zieliński" "$(mlist)"
sel c15 "Normal"; btn x01; sleep 0.7; S="$(ft)"; check "s11.4 nie znaleziono" "We could not find this mentor" "$S"; check "s11.4 link do listy" "See all mentors" "$S"; shot 132-s11-not-found
sel c20 "Long values and partial profile"; sleep 0.6; clickl "Tomasz Kowalczyk"; sleep 0.7; S="$(ft)"; check "s11.5 częściowy profil: bez błędu, jest imię" "Tomasz Kowalczyk" "$(h1)"; check "s11.5 ceny: druga cena" "PLN 280.00" "$S"; shot 133-s11-partial
goto s10; sleep 0.5; clickl "Aleksandra Konstantynopolitańczykiewiczówna-Grzybowska"; sleep 0.8; S="$(ft)"; check "s11.6 długie wartości: 60 terminów" "60" "$(nslots)"; check "s11.6 pięć linków" "on-call-lore" "$S"; shot 134-s11-long
goto s03; sel c09 "Slow (3.5 s)"; A eval "document.dispatchEvent(new CustomEvent('prototype:navigate',{detail:'s11'}))" >/dev/null; sleep 0.6; check "s11.7 ładowanie" "Loading the mentor" "$(snap)"; shot 135-s11-loading; sleep 3.5; sel c09 "Normal"
goto s03; sel c08 "Network error"; A eval "document.dispatchEvent(new CustomEvent('prototype:navigate',{detail:'s11'}))" >/dev/null; sleep 0.6; S="$(ft)"; check "s11.8 błąd z Try again" "Try again" "$S"; check "s11.8 komunikat" "No connection" "$S"; shot 136-s11-error

echo "== D03: niewylistowany mentor ma działający link"
reset; role "Mentor: Marek Zieliński"; sel c13 "Ready, not on the list"; sleep 0.7; clickl "open this link as a visitor"; sleep 0.7; check "D03 strona niewylistowanego mentora działa" "Marek Zieliński" "$(h1)"
goto s10; sleep 0.5; check "D03/#28-2 niewylistowany: nie ma na liście (3 mentorów)" "3 mentors" "$(ft)"
sel c13 "New mentor"; sleep 0.7; clickl "Complete profile: Profile"; sleep 0.6; fill "Headline" "Platform engineer"; A press Enter >/dev/null; sleep 1; goto s07; sleep 0.5; clickl "open this link as a visitor"; sleep 0.7; S="$(ft)"; check "s11 mentor bez cen i terminów: Not set" "Not set" "$S"; check "s11 mentor bez terminów: stan pusty" "No times available right now" "$S"

summary | tee "$EV/results-public.txt"
