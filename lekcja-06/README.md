# Lekcja 06: materiały do ćwiczeń

Rozpakuj ten ZIP w katalogu głównym projektu, tak żeby powstał folder `lekcja-06`. Agenta uruchamiasz w katalogu głównym projektu. Wyniki ćwiczeń zapisujesz w tym samym folderze, więc zostaw go do końca zadania domowego.

Przed każdym ćwiczeniem zacznij nową rozmowę z agentem (w Claude Code wpisz `/clear`). Gotowy prompt kopiujesz z pliku w całości i wklejasz.

## Ćwiczenie 1: wykrywacz generycznego wyglądu

- `cwiczenie-1-gotowy-prompt.txt`: sprawdza `02-rekrutacja.html`, czyli stronę platformy rekrutacyjnej z eksperymentu. Niczego nie zmienia, oddaje raport.
- `02-rekrutacja.html`: strona zbudowana przez agenta z jednego zdania polecenia, bez wskazówek o wyglądzie. Produkt, liczby, opinie i lista firm są zmyślone.
- Wynik: raport w rozmowie. Zapisz go poleceniem: „Zapisz ten raport do lekcja-06/audyt.md. Niczego poza tym plikiem nie zmieniaj.”

## Ćwiczenie 2: od referencji do tokenów

- `cwiczenie-2-gotowy-prompt.txt`: prompt „Od opinii do decyzji” z kartami R01 (GitHub), R02 (Slack) i A01. Agent zadaje pytania, zanim cokolwiek zapisze. Każdą jego propozycję przyjmij albo odrzuć osobno.
- Wynik: `lekcja-06/referencje.md`.
- `cwiczenie-2-tokeny-gotowy-prompt.txt`: prompt „Od decyzji do tokenów”. Wklejasz go w tej samej rozmowie. Agent pokazuje propozycję i czeka na zatwierdzenie.
- Wynik: `lekcja-06/tokeny.md`.

## Ćwiczenie 3: Storybook

- `cwiczenie-3-gotowy-prompt.txt`: skopiuj go do `lekcja-06/prompt-storybook.md`. Potem w nowej rozmowie napisz: „Przeczytaj lekcja-06/prompt-storybook.md i wykonaj go od etapu 0.”
- Na lekcji robisz etap 0 (plan) i etap 1 (fundamenty). Etapy 2–5 to zadanie domowe.
- Wynik: Storybook w `packages/ui/.storybook`, postęp w `packages/ui/POSTEP.md`.
- W każdej nowej sesji wklej: „Przeczytaj lekcja-06/prompt-storybook.md i POSTEP.md w katalogu design systemu. Kontynuuj od kroku, który POSTEP.md wskazuje jako następny. Zasady z promptu obowiązują dalej.”

## Test agentem

- `test-agentem-gotowy-prompt.txt`: test na pełnym design systemie DevMentora z nagrania (`align-tokens.css`, `foundations.css`, `Guidelines.mdx`). Jeśli budujesz własny system w ćwiczeniu 3, podmień ścieżki w bloku „Kontekst” na swoje.
- Uruchamiasz go w nowej rozmowie, a nie w tej, w której powstawała dokumentacja.

## Prompty do własnego produktu

Wersje do uzupełnienia są w lekcji 06, przy każdym ćwiczeniu.
