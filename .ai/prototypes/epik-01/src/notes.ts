// Notatki do ekranów (etap 3): numery historii, co jest symulacją, czego prototyp nie rozstrzyga. Pokazywane w `.notes > .note` pod każdym ekranem (silnik przeglądu).
// Numery: #26 konta i logowanie (zadanie pod #25), #25 ceny, #27 terminy, #28 link i lista publiczna; epik E01 = #21. Reguły U1-U24 i decyzje L01-L16, A01-A10: mapa ekranów i szary prototyp.

export type Note = { stories: string; simulated: string; open: string };

export const NOTES: Record<string, Note> = {
  s01: {
    stories: "#26 (zalogowany / niezalogowany widok), #28 (link do listy publicznej). Reguły U5, U12, L04.",
    simulated:
      "Sesja i rola pochodzą z pamięci karty. Ładowanie sesji (s01.5) i błąd sesji (s01.6) wywołują c09 i c08. Strona startowa dla gościa, mentee i mentora to najprostsza wersja z komponentów DS (luka G03), nie projekt strony.",
    open: "Treść strony startowej nie jest opisana w specyfikacji (L04 rozstrzyga tylko, dokąd lądują role po logowaniu). Zachowanie przy błędzie sesji (L03) jest założeniem: strona zachowuje się jak dla gościa.",
  },
  s02: {
    stories: "#26 (konto mentee, kryterium: użytkownik może się zalogować jako mentee). Reguły U1, U2, U4.",
    simulated:
      "Konto powstaje w pamięci karty; hasło (12-128 znaków) nie opuszcza przeglądarki. Zajęty e-mail (c04 albo e-mail istniejącego konta) daje ogólny komunikat przy polu (A07). Limit rejestracji (c06) to przełącznik, nie licznik.",
    open: "Po rejestracji mentee ląduje na /mentors (jak po logowaniu, L04); spec (U12) mówi o `/` w fazie 1. Brak weryfikacji e-maila (L01).",
  },
  s03: {
    stories: "#26 (logowanie mentora i mentee, chronione trasy), kryterium #26-a. Reguły U3, U4, U5, U12.",
    simulated:
      "Logowanie sprawdza konta demo w pamięci; hasła są fikcyjne i jawne na ekranie. Piąta nieudana próba na ten sam e-mail daje 429 (U4), a c06 wymusza 429. 'Your session has ended' pokazuje c07 (L03).",
    open: "Brak ekranu 'Forgot password' (L12: reset robi założyciel). Zalogowany użytkownik na /login nie jest blokowany, nowe logowanie zastępuje sesję (A10).",
  },
  s04: {
    stories: "#26 (rejestracja mentora tylko z zaproszenia). Reguły U6, U7, U8, U11, U14.",
    simulated:
      "Token z linku sprawdza pamięć karty; użyty, wygasły, unieważniony i nieznany wyglądają tak samo (U7), c02 służy sprawdzeniu, że nie są rozróżniane. c03 (użyty w międzyczasie), c04 (konflikt konta), c06 (limit) i c08 (sieć) to przełączniki.",
    open: "Brak tokenu traktowany jak link nieważny (L12/L13, założenie). Kontaktu do założycieli nie ma (L12: 'Ask the founders for a new link').",
  },
  s05: {
    stories: "#26 (chroniona trasa admina, fail closed), reguła U13, D11 (admin = założyciel).",
    simulated: "Rola admina z konta demo Oliwii Nowak. Bramka dostępu: gość i inne role są przekierowane na /login z komunikatem (L02).",
    open: "/admin/users (zmiana roli konta, L16) nie jest ekranem tego prototypu: wpis jest nieaktywny z dopiskiem.",
  },
  s06: {
    stories: "#26 (zaproszenia mentorów przez admina). Reguły U9, U10, U13, D15.",
    simulated:
      "Nic nie jest wysyłane: DevMentor nie wysyła e-maili, link zostaje u admina i jest pokazany raz. Link 'open this link as the mentor' to sterowanie prototypu. c10 (lista pełna/pusta/błąd), c11 (ponowne zaproszenie), c12 (zgubiony link) i c08 sterują stanami.",
    open: "Admin nie może unieważnić zaproszenia bez wystawienia nowego (L10). E-mail istniejącego konta jest odrzucany przy zapraszaniu (L11, A07), spec obsługuje to dopiero przy rejestracji.",
  },
  s07: {
    stories: "#25-1 (ceny), #27-1 (terminy), #28-1 (link), #28-3 (lista publiczna). Reguły U16, U17, D13.",
    simulated: "Lista kontrolna liczy się z danych w pamięci. c13 ustawia stan oferty jednym kliknięciem (nadpisuje dane mentora do Resetu), c17 przesuwa zegar demo (sloty <24 h).",
    open: "'Pending bookings' i nawigacja do rezerwacji należą do E02, poza zakresem (L05). Komunikat 'Public list is on, but you are not visible yet. Missing: ...' to założenie A09.",
  },
  s08: {
    stories: "#25-1, #25-2, #25-3, #25-4 (ceny 25 i 50 min, bez prowizji w widoku), #28-1, #28-3 (opt-in). Reguły U15, U23.",
    simulated: "Zapis do pamięci karty. Walidację pól robi formularz DS. c08 daje błąd zapisu, c07 kończy sesję przy zapisie, c14 przełącza opt-in.",
    open: "Kryterium #25-2 (długość inna niż 25/50 min) nie ma ekranu: UI ma dwa stałe pola cen (L09). Opt-in jest polem wyboru zapisywanym z profilem, nie przełącznikiem (G04, A09).",
  },
  s09: {
    stories: "#27-1 (publikacja), #27-2 (usunięcie), #27-3 (czas <24 h odrzucony), #27-4 (zarezerwowany bez usuwania). Reguły U18, U19, U20, D13.",
    simulated:
      "Reguły slotu (24 h, 60 dni, siatka 15 min, odstęp 50 min, duplikat) sprawdza symulowany 'serwer' względem zegara demo. DST (c19, A08) liczy komponent DS w strefie Europe/Warsaw: czas nieistniejący 28.03.2027 02:30, niejednoznaczny 25.10.2026 02:30. c16 rezerwuje slot w międzyczasie, c15 daje brak slotów albo 60.",
    open: "Kalendarz jako siatka nie istnieje (G05): lista wg dni (L06). Mentor bez cen może dodawać sloty (L06). Rezerwacje są poza zakresem (E02), slot 'booked' jest danymi demo. Nie obsługujemy innej strefy przeglądarki (c18 nie zbudowane).",
  },
  s10: {
    stories: "#28-2 (bez opt-in nie ma na liście), #28-3, #28-4 (bez ocen), #25-3 (cena widoczna dla mentee). Reguły U21, R08, N02.",
    simulated:
      "Lista to dane z pamięci: 3 stałych mentorów z mapy plus mentorzy z prototypu spełniający reguły (opt-in, ceny, slot >=24 h). c20 zmienia zestaw (pusta, 25 z paginacją, długie wartości i częściowy profil), c21 filtr stosu. Dodatkowych 22 mentorów to fikcyjne postacie bez ocen.",
    open: "Nie wiemy, jak lista ma sortować poza 'najbliższy termin' (U21). 'Brak mentorów' nie ma ścieżki 'zaproś mentora' (spec jej nie ma).",
  },
  s11: {
    stories: "#28-1 (link otwiera ofertę), #25-3 (cena), #28-4 (bez ocen). Reguły U22, D03, L05, L14.",
    simulated: "Strona mentora czyta dane z pamięci. Przycisk Book jest wyłączony z powodem napisanym tekstem: rezerwacja i płatność to E02 (#29-#32), tutaj ich nie ma.",
    open: "Nieznany slug i brak dostępu mają wspólny komunikat (G01). 24 h wyprzedzenia podane wprost (L14, D13). Czasy w Europe/Warsaw (A08).",
  },
  s12: {
    stories: "#26-a (fail closed). Reguły U13, U23, L02, L03.",
    simulated: "Brak dostępu (401/403) nie ma osobnej strony: bramka przenosi na /login z komunikatem, po zalogowaniu wraca na poprzednią stronę (L02); wygasła sesja przy zapisie daje /login z 'Your session has ended' (L03). Strona 404 to najprostsza wersja z komponentów DS (G01).",
    open: "Wpisane dane po wygaśnięciu sesji nie są odtwarzane po ponownym zalogowaniu (prototyp nie zapisuje szkicu); decyzja L03 mówi tylko o powrocie na stronę.",
  },
};
