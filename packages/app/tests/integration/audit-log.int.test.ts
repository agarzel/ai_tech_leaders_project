import { AUDIT_ACTIONS } from "@devmentor/core/validators/audit/audit-event-list.schema";
import { AUDIT_ACTION_LABELS } from "@devmentor/ui/components/audit/AuditLogTable";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { loginAs } from "./support/auth";
import { Browser } from "./support/browser";
import { sql } from "./support/database";
import { api, inviteMentor } from "./support/flow";

const baseUrl = inject("baseUrl");
const admin = new Browser("devmentor-it-audit-admin", baseUrl);
const mentor = new Browser("devmentor-it-audit-mentor", baseUrl);
const visitor = new Browser("devmentor-it-audit-visitor", baseUrl);

const stamp = Date.now();
const roleUser = { name: `Audit Role ${stamp}`, email: `audit.role.${stamp}@devmentor.test` };
const deletedUser = { name: `Audit Delete ${stamp}`, email: `audit.delete.${stamp}@devmentor.test` };
const invitedEmail = `audit.invite.${stamp}@devmentor.test`;
// The server's list is the source of truth; the ui keeps its own labels (it may not import core). A new server action
// without a ui label fails here – a drift check between the two lists.
const RAW_ACTIONS: readonly string[] = AUDIT_ACTIONS;
const PLAIN_ACTIONS = RAW_ACTIONS.map((action) => {
  const label = (AUDIT_ACTION_LABELS as Record<string, string>)[action];
  if (!label) throw new Error(`ui has no label for the audit action ${action}`);
  return label;
});

/** The status code only: a refused method answers 405 without a JSON body. */
async function statusOf(browser: Browser, method: string, path: string): Promise<number> {
  const call = `fetch(${JSON.stringify(path)}, { method: ${JSON.stringify(method)}, headers: { 'x-devmentor-client': '1' } }).then((response) => String(response.status))`;
  return Number(JSON.parse(await browser.run("eval", call)) as string);
}

/** Polls the database until `statement` returns `expected` (the UI saves asynchronously). */
async function waitForSql(statement: string, expected: string) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if ((await sql(statement)) === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  expect(await sql(statement)).toBe(expected);
}

/** Text of the audit table only – the "Action" filter's options carry the same labels. */
async function tableText(browser: Browser): Promise<string> {
  return JSON.parse(await browser.run("eval", "document.querySelector('main table')?.innerText ?? ''")) as string;
}

describe("audit log of admin and operator actions", () => {
  let roleUserId: string;
  let deletedUserId: string;

  beforeAll(async () => {
    await loginAs(admin, "admin");
    roleUserId = (await api(admin, "POST", "/api/users", { ...roleUser, role: "mentee" })).body.data.id as string;
    deletedUserId = (await api(admin, "POST", "/api/users", { ...deletedUser, role: "mentee" })).body.data.id as string;
    await inviteMentor(admin, mentor, `audit.mentor.${stamp}@devmentor.test`, `Audit Mentor ${stamp}`);
    // The CLI without --admin cannot run inside the browser test; its row is written the way AuthService writes it.
    await sql(`insert into audit_events (id, created_at, updated_at, occurred_at, actor_kind, actor_user_id, action, target_user_id, details) values (gen_random_uuid(), now(), now(), now() - interval '1 day', 'cli', null, 'auth.password_set', '${roleUserId}', '{}')`);
  });

  afterAll(async () => {
    for (const browser of [admin, mentor, visitor]) await browser.close();
  });

  // Scenario: .ai/qa/SECURITY/SECURITY-007-admin-actions-are-audited.md
  it("has a ui label for every server action, and no ui label for an action the server does not know", () => {
    expect(Object.keys(AUDIT_ACTION_LABELS).sort()).toEqual([...RAW_ACTIONS].sort());
  });

  it("records a failed login without the typed e-mail, and the visitor still sees the usual message", async () => {
    const before = Number(await sql(`select count(*) from audit_events where action = 'auth.login_failed' and target_user_id = '${roleUserId}'`));

    await visitor.open("/login");
    await visitor.waitForText("No account yet?");
    await visitor.fill("Email", roleUser.email);
    await visitor.fill("Password", "definitely not the password");
    await visitor.click("button", "Sign in");
    await visitor.waitForText("Invalid email or password");

    expect(Number(await sql(`select count(*) from audit_events where action = 'auth.login_failed' and target_user_id = '${roleUserId}'`))).toBe(before + 1);
    expect(Number(await sql(`select count(*) from audit_events where details::text like '%@%'`))).toBe(0);
  });

  it("records a role change, a delete and invitations made through the admin UI, and shows them in plain words", async () => {
    await admin.open("/admin/users");
    await admin.waitForText(roleUser.email);
    await admin.click("button", `Edit ${roleUser.name}`);
    await admin.select("role", "mentor");
    await admin.click("button", "Save changes");
    await waitForSql(`select role from users where id = '${roleUserId}'`, "mentor");
    await admin.click("button", `Delete ${deletedUser.name}`);
    await admin.click("button", `Confirm delete ${deletedUser.name}`);
    await waitForSql(`select count(*) from audit_events where action = 'user.deleted' and target_user_id = '${deletedUserId}'`, "1");
    // The second invitation for the same address revokes the first one.
    const first = await api(admin, "POST", "/api/admin/invitations", { email: invitedEmail });
    const second = await api(admin, "POST", "/api/admin/invitations", { email: invitedEmail });
    expect([first.status, second.status]).toEqual([201, 201]);
    const firstId = first.body.data.invitation.id as string;
    const secondId = second.body.data.invitation.id as string;
    // One created entry per invitation, and exactly one revoked entry: the first, replaced by the second.
    for (const id of [firstId, secondId]) expect(await sql("select count(*) from audit_events where action = 'invitation.created' and details->>'invitationId' = '" + id + "'")).toBe("1");
    expect(await sql("select details->>'replacedBy' from audit_events where action = 'invitation.revoked' and details->>'invitationId' = '" + firstId + "'")).toBe(secondId);
    expect(await sql("select count(*) from audit_events where action = 'invitation.revoked' and details->>'invitationId' = '" + secondId + "'")).toBe("0");

    expect(await sql(`select details::text from audit_events where action = 'user.role_changed' and target_user_id = '${roleUserId}'`)).toBe('{"to": "mentor", "from": "mentee"}');
    expect(await sql(`select count(*) from users where id = '${deletedUserId}'`)).toBe("0");
    expect(await sql(`select details::text from audit_events where action = 'user.deleted' and target_user_id = '${deletedUserId}'`)).toBe('{"role": "mentee"}');

    await admin.open("/admin");
    await admin.click("link", "Audit log Who changed roles, deleted users and invited mentors.");
    await admin.waitForText("Role changed");
    await admin.screenshot("audit-log");

    // Every action, filtered one by one, renders in the table in plain words – never as its raw key.
    for (const [index, action] of RAW_ACTIONS.entries()) {
      await admin.select("action", action);
      await admin.run("wait", "--fn", `(document.querySelector('main table')?.innerText ?? '').includes(${JSON.stringify(PLAIN_ACTIONS[index])})`);
      const text = await tableText(admin);
      for (const raw of [...RAW_ACTIONS, "undefined", "null", "Invalid Date"]) expect(text).not.toContain(raw);
    }
    await admin.select("action", "user.role_changed");
    await admin.run("wait", "--fn", "(document.querySelector('main table')?.innerText ?? '').includes('mentee → mentor')");
    await admin.select("action", "user.deleted");
    await admin.run("wait", "--fn", "(document.querySelector('main table')?.innerText ?? '').includes('Deleted user')");
  });

  it("writes no entry when the change itself fails in the database", async () => {
    const before = await sql(`select count(*) from audit_events where target_user_id = '${roleUserId}' and action = 'user.role_changed'`);

    const reply = await api(admin, "PUT", `/api/users/${roleUserId}`, { name: roleUser.name, email: "admin@devmentor.test", role: "admin" });

    expect(reply.status).toBe(409);
    expect(await sql(`select role from users where id = '${roleUserId}'`)).toBe("mentor");
    expect(await sql(`select count(*) from audit_events where target_user_id = '${roleUserId}' and action = 'user.role_changed'`)).toBe(before);
  });

  it("lets only an admin read the log, and nobody change it", async () => {
    const baseline = await api(admin, "GET", "/api/admin/audit-events?pageSize=100");
    expect(baseline.status).toBe(200);

    // Signed out: 401. A mentor: allowed on their own route (positive control), refused on the audit log.
    expect(await statusOf(visitor, "GET", "/api/admin/audit-events")).toBe(401);
    expect((await api(mentor, "GET", "/api/mentor/profile")).status).toBe(200);
    const refused = await api(mentor, "GET", "/api/admin/audit-events");
    expect(refused.status).toBe(403);
    expect(refused.body.data).toBeUndefined();

    // Append-only: no write method exists, even for the admin.
    for (const method of ["POST", "PUT", "DELETE"]) expect(await statusOf(admin, method, "/api/admin/audit-events")).toBe(405);

    const after = await api(admin, "GET", "/api/admin/audit-events?pageSize=100");
    expect(after.body.data.total).toBe(baseline.body.data.total);
    expect(after.body.data.items).toEqual(baseline.body.data.items);

    expect((await api(admin, "GET", "/api/admin/audit-events?pageSize=101")).status).toBe(400);
    expect((await api(admin, "GET", "/api/admin/audit-events?action=user.renamed")).status).toBe(400);
  });
});
