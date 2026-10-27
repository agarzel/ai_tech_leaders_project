# Homework (lesson 11): stacked pull requests, two small fixes

Goal: try the stacked mode of the homework (PR 2 is based on PR 1). Both fixes are the same kind of bug: `notFound()` inside a Suspense boundary streams the not-found content with status 200.

## Stack
1. `m-slug-404` → PR 1 into `main`: the unknown mentor share link `/m/[slug]` answers 404. Regression test: `mentor-share-404.int.test.ts`.
2. `booking-404` → PR 2 into `m-slug-404`: the mentee and mentor booking pages answer 404 for an unknown booking. Regression test: `booking-404.int.test.ts` (mentee only; the mentor page needs a signed-in mentor, covered by the layout gate).

After PR 1 is merged, retarget PR 2 to `main` (GitHub does this when the base is deleted; otherwise `gh pr edit --base main`).

## Verification (agent sandbox)
- Both branches: `npm run typecheck`, `npm run lint`, `npm run lint:tokens` pass; `npm run test:coverage` passes (88 files, 1065 tests).
- Integration tests not run here (Docker). Owner runs `npm run test:integration` before merging each PR.

## Mode used
The fixes were written by hand, not by `om-auto-create-pr`: that skill needs `gh` and Docker, which the agent sandbox does not have. The stack and the PR order are the point of the exercise.

## Owner steps
1. Open PR 1 (`m-slug-404` → `main`) and PR 2 (`booking-404` → `m-slug-404`).
2. Run `npm run test:integration` and `npm run build` in the terminal on PR 2 (it contains PR 1).
3. Merge PR 1, then PR 2 into `main`.
