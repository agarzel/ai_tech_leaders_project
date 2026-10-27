# Testing – unit tests

Read this when writing or changing tests. Integration tests and Storybook story tests have their own sections in
`packages/app/AGENTS.md` and `packages/ui/AGENTS.md`.

**Every new feature and every change must be 100% covered by unit tests** (statements, branches, functions, lines) for `@devmentor/core`, `@devmentor/db`, `@devmentor/ui` and the repo `scripts/`. CI fails below 100% – do not lower the thresholds, do not add `/* v8 ignore */` comments and do not widen the coverage `exclude` list to get green. If code is genuinely unreachable, delete it or restructure it.

- **Runner:** Vitest (`vitest.config.mts`, one project per package: `core` and `db` in Node, `ui` in jsdom with Testing Library, `scripts` in Node).
- **Location:** colocated `<file>.test.ts(x)` next to the code it tests; repo scripts keep `<name>.test.mjs` next to `<name>.mjs`.
- **Excluded from unit coverage (by design):** barrels (`src/index.ts`), type-only modules, generated shadcn primitives (`ui/src/components/ui/`), migrations (checked by the CI migrations job), and the Next.js app (`packages/app` – pages and route wiring are covered by integration tests).
- **Style:** test behaviour through the public API; mock only boundaries (database `EntityManager`, `fetch`, the container, env). Arrange / act / assert, one behaviour per test, descriptive names.
- A bug fix ships with a regression test that fails without the fix.
- `vi.mock` must be called at the top level of a test file (Vitest 5 throws otherwise); `clearMocks` is on by default.
