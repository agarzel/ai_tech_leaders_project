// Panel scenariuszy (c02-c21) w pasku przeglądu: osobno od nawigacji produktu. Kontrolki ustawiają wynik symulacji i prowadzą na ekran, który go pokazuje.
import type { ReactNode } from "react";

import { formatDateTime } from "@devmentor/ui/lib/format";

import { go } from "./nav";
import {
  applyOfferState,
  applyOptIn,
  applySlotMode,
  closeLinkPanel,
  demoToken,
  expireSession,
  fillDst,
  NO_MATCH_TAG,
  now,
  reinviteTomasz,
  scenarioMentorId,
  sessionAccount,
  setMessage,
  setScenario,
  setSessionFor,
  TIME_ZONE,
  type OfferKind,
  type Scenario,
  useStore,
} from "./sim/store";
function Control({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <label className="scenario-control" htmlFor={id}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="scenario-group">
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}

function ensureRole(role: "admin" | "mentor", accountId: string) {
  const me = sessionAccount();
  if (me?.role !== role) setSessionFor(accountId);
}

export function ScenarioPanel() {
  const state = useStore();
  const sc = state.sc;
  const set = <K extends keyof Scenario>(key: K, value: Scenario[K]) => {
    setMessage(null);
    setScenario({ [key]: value } as Partial<Scenario>);
  };
  const target = state.profiles[sessionAccount(state)?.role === "mentor" ? (sessionAccount(state)?.id as string) : "u-marek"];
  return (
    <details className="doc-scenarios" open>
      <summary>Scenario controls (review bar, not part of the product)</summary>
      <p className="proto-note" role="status" id="scenario-message">
        Demo time: {formatDateTime(now(state).toISOString(), TIME_ZONE)} (Europe/Warsaw). {state.message ?? ""}
      </p>
      <div className="scenario-groups">
        <Group title="Invitation">
          <Control id="c02" label="c02 Open invitation link">
            <select
              id="c02"
              value=""
              onChange={(event) => {
                const kind = event.target.value;
                if (!kind) return;
                setMessage(null);
                setScenario({ invite: kind });
                go(`/register/mentor?token=${demoToken(kind)}`);
              }}
            >
              <option value="">Choose a link…</option>
              <option value="valid">Valid</option>
              <option value="used">Already used</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
              <option value="unknown">Unknown</option>
            </select>
          </Control>
          <Control id="c03" label="c03 Used in the meantime">
            <input id="c03" type="checkbox" checked={sc.usedMeanwhile} onChange={(event) => set("usedMeanwhile", event.target.checked)} />
          </Control>
          <Control id="c04" label="c04 Address already registered">
            <input id="c04" type="checkbox" checked={sc.emailTaken} onChange={(event) => set("emailTaken", event.target.checked)} />
          </Control>
          <Control id="c10" label="c10 Invitation list">
            <select
              id="c10"
              value={sc.invList}
              onChange={(event) => {
                set("invList", event.target.value as Scenario["invList"]);
                ensureRole("admin", "u-oliwia");
                go("/admin/invitations");
              }}
            >
              <option value="full">Full</option>
              <option value="empty">Empty</option>
              <option value="error">Error</option>
            </select>
          </Control>
          <button
            id="c11"
            type="button"
            className="btn"
            onClick={() => {
              setMessage("c11: Tomasz was invited again; the old row is Revoked and the new link is shown once.");
              ensureRole("admin", "u-oliwia");
              reinviteTomasz();
              go("/admin/invitations");
            }}
          >
            c11 Invite Tomasz again
          </button>
          <button
            id="c12"
            type="button"
            className="btn"
            disabled={!state.linkPanel}
            onClick={() => {
              closeLinkPanel();
              setMessage("c12: the link panel was closed without copying; the link cannot be shown again, invite again (c11).");
            }}
          >
            c12 Lose the invitation link
          </button>
        </Group>
        <Group title="Sign-in and session">
          <Control id="c05" label="c05 Failing credentials">
            <input id="c05" type="checkbox" checked={sc.wrongPassword} onChange={(event) => set("wrongPassword", event.target.checked)} />
          </Control>
          <Control id="c06" label="c06 Too many attempts">
            <select id="c06" value={sc.tooMany} onChange={(event) => set("tooMany", event.target.value as Scenario["tooMany"])}>
              <option value="off">Off</option>
              <option value="login">Log in</option>
              <option value="mentee">Register (mentee)</option>
              <option value="mentor">Register (mentor)</option>
            </select>
          </Control>
          <Control id="c07" label="c07 Session">
            <select id="c07" value={sc.sessionExpires ? "next" : "ok"} onChange={(event) => set("sessionExpires", event.target.value === "next")}>
              <option value="ok">Valid</option>
              <option value="next">Ends on the next save</option>
            </select>
          </Control>
          <button id="c07-now" type="button" className="btn" onClick={() => expireSession()}>
            c07 End the session now
          </button>
        </Group>
        <Group title="Network">
          <Control id="c08" label="c08 Next request">
            <select id="c08" value={sc.fault} onChange={(event) => set("fault", event.target.value as Scenario["fault"])}>
              <option value="ok">Succeeds</option>
              <option value="network">Network error</option>
              <option value="server">Server error 500</option>
            </select>
          </Control>
          <Control id="c09" label="c09 Loading">
            <select id="c09" value={sc.slow ? "slow" : "normal"} onChange={(event) => set("slow", event.target.value === "slow")}>
              <option value="normal">Normal</option>
              <option value="slow">Slow (3.5 s)</option>
            </select>
          </Control>
        </Group>
        <Group title="Mentor offer">
          <Control id="c13" label="c13 Offer state">
            <select
              id="c13"
              value=""
              onChange={(event) => {
                const kind = event.target.value as OfferKind;
                if (!kind) return;
                applyOfferState(kind);
                setMessage(`c13: ${scenarioLabel(kind)}. Reset restores the demo data.`);
                go("/mentor");
              }}
            >
              <option value="">Set the state…</option>
              <option value="new">New mentor</option>
              <option value="prices">Profile and prices, no times</option>
              <option value="soon">Only times under 24 h</option>
              <option value="ready">Ready, not on the list</option>
              <option value="listed">Ready and on the list</option>
            </select>
          </Control>
          <Control id="c14" label="c14 Opt-in (public list)">
            <input
              id="c14"
              type="checkbox"
              checked={Boolean(target?.listed)}
              onChange={(event) => {
                scenarioMentorId();
                applyOptIn(event.target.checked);
                go("/mentor/profile");
              }}
            />
          </Control>
          <Control id="c15" label="c15 Slots">
            <select
              id="c15"
              value={sc.slotMode}
              onChange={(event) => {
                applySlotMode(event.target.value as Scenario["slotMode"]);
                go("/mentor/slots");
              }}
            >
              <option value="normal">Normal</option>
              <option value="none">None</option>
              <option value="many">60 slots</option>
            </select>
          </Control>
          <Control id="c16" label="c16 Booked in the meantime">
            <input id="c16" type="checkbox" checked={sc.bookedMeanwhile} onChange={(event) => set("bookedMeanwhile", event.target.checked)} />
          </Control>
        </Group>
        <Group title="Time">
          <Control id="c17" label="c17 Demo clock">
            <select id="c17" value={String(sc.clockHours)} onChange={(event) => set("clockHours", Number(event.target.value) as Scenario["clockHours"])}>
              <option value="0">Fri 23 Oct 10:00</option>
              <option value="6">+6 h</option>
              <option value="24">+24 h</option>
            </select>
          </Control>
          <Control id="c19" label="c19 Daylight saving">
            <select
              id="c19"
              value={sc.dst}
              onChange={(event) => {
                const kind = event.target.value as Scenario["dst"];
                if (kind === "none") return set("dst", "none");
                ensureRole("mentor", "u-marek");
                setMessage(kind === "gap" ? "c19: 28 Mar 2027, 02:30 does not exist in Warsaw." : "c19: 25 Oct 2026, 02:30 happens twice in Warsaw.");
                fillDst(kind);
                go("/mentor/slots");
              }}
            >
              <option value="none">None</option>
              <option value="gap">Time that does not exist</option>
              <option value="ambiguous">Time that happens twice</option>
            </select>
          </Control>
        </Group>
        <Group title="Public list">
          <Control id="c20" label="c20 Public list">
            <select
              id="c20"
              value={sc.publicList}
              onChange={(event) => {
                set("publicList", event.target.value as Scenario["publicList"]);
                go("/mentors");
              }}
            >
              <option value="few">A few mentors</option>
              <option value="empty">Empty</option>
              <option value="many">25 mentors</option>
              <option value="long">Long values and partial profile</option>
            </select>
          </Control>
          <Control id="c21" label="c21 Stack filter">
            <select
              id="c21"
              value={sc.filter}
              onChange={(event) => {
                set("filter", event.target.value);
                go("/mentors");
              }}
            >
              <option value="">None</option>
              <option value="TypeScript">TypeScript</option>
              <option value="React">React</option>
              <option value="Python">Python</option>
              <option value="AI agents">AI agents</option>
              <option value={NO_MATCH_TAG}>No results</option>
            </select>
          </Control>
        </Group>
        <Group title="Extra (not in the map)">
          <button id="x01" type="button" className="btn" onClick={() => go("/m/no-such-mentor")}>
            x01 Open an unknown mentor link
          </button>
          <button id="x02" type="button" className="btn" onClick={() => go("/no/such/page")}>
            x02 Open an unknown address
          </button>
          <button id="x03" type="button" className="btn" onClick={() => go("/register/mentor")}>
            x03 Open the registration link without a token
          </button>
        </Group>
      </div>
    </details>
  );
}

function scenarioLabel(kind: OfferKind) {
  return {
    new: "new mentor, nothing set",
    prices: "profile and prices set, no times",
    soon: "only times under 24 hours",
    ready: "offer ready, not on the public list",
    listed: "offer ready and on the public list",
  }[kind];
}
