import { useEffect, useRef, useState, type ReactNode } from "react";

import { AdminHomeScreen, LoginScreen, NotFoundScreen, RegisterMentorScreen, RegisterScreen, StartScreen } from "./screens/general";
import { InvitationsScreen } from "./screens/admin";
import { MentorHomeScreen, MentorProfileScreen, MentorSlotsScreen } from "./screens/mentor";
import { MentorPageScreen, MentorsScreen } from "./screens/public";
import { go, ROLE_LANDING, SCREENS, useCurrentScreen, type ScreenId } from "./nav";
import { NOTES } from "./notes";
import { ScenarioPanel } from "./scenarios";
import { DEMO_ACCOUNTS, resetSimulation, sessionAccount, setSessionFor, useStore } from "./sim/store";

const CONTENT: Record<ScreenId, () => ReactNode> = {
  s01: StartScreen,
  s02: RegisterScreen,
  s03: LoginScreen,
  s04: RegisterMentorScreen,
  s05: AdminHomeScreen,
  s06: InvitationsScreen,
  s07: MentorHomeScreen,
  s08: MentorProfileScreen,
  s09: MentorSlotsScreen,
  s10: MentorsScreen,
  s11: MentorPageScreen,
  s12: NotFoundScreen,
};

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  return (
    <button
      id="theme-toggle"
      type="button"
      className="btn"
      aria-pressed={dark}
      onClick={() => {
        const next = !dark;
        document.documentElement.classList.toggle("dark", next);
        document.documentElement.dataset.theme = next ? "dark" : "light";
        setDark(next);
      }}
    >
      Dark theme
    </button>
  );
}

/** Pasek przeglądu: oznaczenie "Prototype", wybór ekranu, kontrolki scenariuszy (c01 rola, c22 szerokość, Reset), motyw. Osobno od nawigacji produktu. */
function Toolbar({ current, width, setWidth }: { current: string; width: string; setWidth: (value: string) => void }) {
  const state = useStore();
  const me = sessionAccount(state);
  const mentors = state.accounts.filter((a) => a.role === "mentor");
  return (
    <header className="doc-toolbar">
      <span className="proto-badge">Prototype</span>
      <nav className="screen-nav" aria-label="Screens (review bar)">
        {SCREENS.map((screen) => (
          <a key={screen.id} href={`#${screen.id}`} aria-current={current === screen.id ? "true" : undefined}>
            {screen.id} {screen.title}
          </a>
        ))}
      </nav>
      <label>
        Role (c01)
        <select
          id="role-select"
          value={me?.id ?? "guest"}
          onChange={(event) => {
            const account = state.accounts.find((a) => a.id === event.target.value) ?? null;
            setSessionFor(account?.id ?? null);
            go(account ? ROLE_LANDING[account.role] : "/");
          }}
        >
          <option value="guest">Guest</option>
          <option value={DEMO_ACCOUNTS[0].id}>Mentee: {DEMO_ACCOUNTS[0].name}</option>
          {mentors.map((mentor) => (
            <option key={mentor.id} value={mentor.id}>
              Mentor: {mentor.name}
            </option>
          ))}
          <option value={DEMO_ACCOUNTS[2].id}>Admin: {DEMO_ACCOUNTS[2].name}</option>
        </select>
      </label>
      <label>
        Width (c22)
        <select id="width-select" value={width} onChange={(event) => setWidth(event.target.value)} title="Limits the container only; resize the window to test real breakpoints">
          <option value="full">Full</option>
          <option value="narrow">320 px (container)</option>
        </select>
      </label>
      <button
        type="button"
        className="btn"
        onClick={() => {
          resetSimulation();
          go("/");
        }}
      >
        Reset simulation
      </button>
      <ThemeToggle />
    </header>
  );
}

export function Shell() {
  const current = useCurrentScreen();
  const [width, setWidth] = useState("full");

  // Silnik ustawia fokus na nagłówku zanim React wyrenderuje nowy ekran; po zmianie ekranu ustawiamy go na h1 ekranu.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const heading = document.querySelector<HTMLElement>(".screen.is-current .frame h1");
      if (heading && !document.querySelector(".frame :focus")) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      }
      // Silnik rysuje piny komentarzy przy "resize": po wyrenderowaniu ekranu prosimy go o ponowne ułożenie pinów.
      window.dispatchEvent(new Event("resize"));
    }, 50);
    return () => clearTimeout(timer);
  }, [current]);

  return (
    <div className="doc">
      <Toolbar current={current} width={width} setWidth={setWidth} />
      <ScenarioPanel />
      <div className="doc-head">
        <h1 className="type-page-title">DevMentor E01: accounts, roles and the mentor offer</h1>
        <p className="proto-note">Clickable prototype, stage 2 (states, roles, scenarios) with notes per screen. All data is fictitious and held in memory. Log-in, invitations and e-mail are simulations.</p>
      </div>
      {SCREENS.map((screen) => {
        const Content = CONTENT[screen.id];
        return (
          <section key={screen.id} className="screen" id={screen.id}>
            <div className="screen-meta">
              <h2 className="type-section-title">
                {screen.id} {screen.title} <span className="type-code">{screen.path}</span>
              </h2>
            </div>
            <div className={`frame${width === "narrow" ? " is-narrow" : ""}`}>{current === screen.id ? <Content /> : null}</div>
            <div className="notes">
              <div className="note">
                <p>
                  <strong>Stories:</strong> {NOTES[screen.id].stories}
                </p>
                <p>
                  <strong>Simulated:</strong> {NOTES[screen.id].simulated}
                </p>
                <p>
                  <strong>Not decided here:</strong> {NOTES[screen.id].open}
                </p>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
