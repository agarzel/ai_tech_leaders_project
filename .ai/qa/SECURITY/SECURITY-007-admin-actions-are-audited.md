# SECURITY-007 – Admin and operator actions are audited, and only admins can read the log

- **Area:** SECURITY · **Priority:** High · **Type:** UI + API
- **Rule:** every role change, user delete, mentor invitation (and the invitations it revokes), CLI password set and failed login leaves one append-only `audit_events` row in the same flush as the change, with ids and roles only – no names, e-mails, passwords, tokens or IPs. Only admins can read it; nobody can change it over HTTP (threat model T-09; spec `.ai/specs/2026-11-11-audit-log.md`; route `api/admin/audit-events`).
- **Test:** [packages/app/tests/integration/audit-log.int.test.ts](../../../packages/app/tests/integration/audit-log.int.test.ts) › "records a role change, a delete and invitations made through the admin UI, and shows them in plain words", "records a failed login without the typed e-mail, and the visitor still sees the usual message", "writes no entry when the change itself fails in the database", "lets only an admin read the log, and nobody change it"

## Given
- The signed-in admin (created by `auth:set-password --admin`, which writes "Admin password set from the CLI"), two test users, an invited mentor, a signed-out visitor.

## When
- The admin changes one user's role to mentor and deletes the other on `/admin/users`, and invites the same address twice.
- The visitor tries to sign in with a wrong password.
- The admin tries to change a user's e-mail to an address that is taken, with a new role.
- A visitor, the mentor and the admin call `/api/admin/audit-events` with GET, POST, PUT and DELETE.

## Then
- `/admin/audit` shows all eight actions in plain words ("Role changed", "mentee → mentor", "Deleted user", …), never a raw key.
- The failed login adds one row for that user; no row anywhere contains an e-mail address; the visitor sees "Invalid email or password".
- The refused change (409) adds no role entry and leaves the role unchanged.
- Visitor 401; mentor 200 on `/api/mentor/profile` and 403 on the audit log; POST/PUT/DELETE 405 even for the admin; the admin's list is unchanged afterwards; `pageSize=101` and an unknown action are 400.

## Edge cases not covered here
- Rollback of the CLI password set (unit test in `auth.service.test.ts`).
- Two admins changing one role at the same moment (documented last-write-wins, spec Edge Cases).
