# Phase 3 And Phase 4 Plan

This file records the remaining work for testing, verification, cleanup, and documentation.

Constraints already agreed:
- Do not run tests on the current computer.
- Use this file as the execution guide on the testing computer.

## Current Scope

Phase 1 complete:
- foundation files created
- Vitest config and test scaffolding added

Phase 2 complete:
- state management centralized
- event constants unified across core modules
- storage adapters introduced
- initialization management introduced
- page-load performance improved by removing IP detection, caching translations, deferring non-critical startup work, and adding service worker support

What is not yet done:
- Phase 3: actual test execution and verification
- Phase 4: final cleanup and documentation polish after verification

## Phase 3: Testing And Verification

Goal:
- verify that the refactor did not break core gameplay
- verify that the initial-load performance regression is improved
- verify that new abstractions behave correctly

### 3.1 Environment Setup On Testing Computer

Prerequisites:
- Node.js 18+
- npm available
- clean clone or updated branch containing commit `a2bb7a6`

Suggested setup steps:
1. Run `npm install`
2. Confirm the workspace opens without editor errors
3. Serve the site with the usual local workflow used by this repo
4. Open browser DevTools before testing

Notes:
- `package.json` and `vitest.config.js` already exist
- two test files already exist as initial coverage:
  - `public/js/__tests__/GameStateManager.test.js`
  - `public/js/__tests__/i18n-cache.test.js`

### 3.2 Automated Test Plan

#### Unit Tests To Run First

Run:
```bash
npm test
```

Expected focus:
- `GameStateManager` reset and snapshot behavior
- i18n cache behavior
- no import/runtime failures from newly added modules

If failures appear, capture:
- failing test name
- stack trace
- whether the failure is environment-related or code-related

#### Coverage Pass

Run:
```bash
npm run test:coverage
```

Use this to answer:
- are new modules actually covered
- do we need extra tests for storage adapters, initialization manager, and event wiring

#### Additional Tests To Add If Needed

If the initial suite passes, add the following next:
1. `InitializationManager` unit tests
2. `StorageAdapter` integration tests for:
   - local records adapter
   - game state adapter
   - supabase sync adapter surface behavior
3. event constant smoke test to ensure imported constants match expected event names
4. board-renderer rendering test for cached node lists and conflict updates

### 3.3 Manual Verification Checklist

Use a real browser and walk through these in order.

#### A. Cold Load

Steps:
1. Open the app in a fresh tab
2. Clear site data first if needed
3. Reload once with DevTools Network open

Verify:
- page shell appears quickly
- grid becomes visible without the previous several-second delay
- no request to `/cdn-cgi/trace`
- translation file loads once and is cached for later refreshes
- no blocking console errors

#### B. Warm Reload

Steps:
1. Refresh the page again
2. Compare load feel versus the previous cold load

Verify:
- grid appears faster than first load
- translation data is reused from localStorage cache
- service worker does not break normal asset loading

#### C. New Game Flow

Steps:
1. Select each difficulty once
2. Click `New Game`

Verify:
- puzzle renders correctly
- timer starts
- pause button still works
- no duplicated event handling
- game counter fetch is deferred and does not delay board display

#### D. Pause / Resume Flow

Steps:
1. Start a game
2. Enter a few values
3. Pause
4. Resume from the overlay button

Verify:
- overlay appears and disappears correctly
- resume action works through the current event constants
- timer resumes from the expected time
- board state remains intact

#### E. Save / Restore Flow

Steps:
1. Start a game and enter several cells
2. Wait at least 5 seconds for autosave cadence
3. Refresh the page

Verify:
- board restores correctly
- difficulty restores correctly
- elapsed time restores correctly
- paused state restores correctly when applicable

#### F. Language Flow

Steps:
1. Switch among `zh-CN`, `en-US`, and `ja-JP`
2. Refresh after choosing a language

Verify:
- selected language persists
- translations render correctly
- no regression from removed IP detection
- no missing-text obvious regressions in main controls

#### G. Records And Sync Flow

Steps:
1. Complete a game or mock a stored record state if faster
2. Verify local records UI
3. If a valid auth environment exists, log in and trigger sync

Verify:
- local records still save and render
- sync trigger still fires
- login/logout event flow still updates UI

### 3.4 Performance Verification Checklist

Use browser Performance panel or simple timing observations.

Compare these areas before and after if an older deploy is available:
- initial grid render latency
- reload latency with cached translations
- time until controls become interactive
- any layout thrash during board render

Specifically verify:
- `requestIdleCallback` defers non-critical startup work
- `DocumentFragment` board rendering does not regress UI correctness
- cached node lists do not produce stale DOM references after rerender

### 3.5 Failure Triage Rules

When a Phase 3 issue appears, classify it before changing code:

1. Functional regression
   - example: pause/resume broken, restore broken, sync broken

2. Performance regression
   - example: load still blocked, no visible improvement, repeated network fetches

3. Test harness issue
   - example: jsdom mismatch, localStorage mocking gap, service worker unavailable in test env

For each issue, record:
- reproduction steps
- expected result
- actual result
- probable owning module

## Phase 4: Cleanup And Documentation

Goal:
- remove leftover rough edges after Phase 3 confirms behavior
- document the new architecture and validation steps

### 4.1 Code Cleanup

Review these areas:
1. remove unused imports introduced by refactor
2. remove dead compatibility code if no longer needed
3. standardize naming where old and new patterns coexist
4. collapse duplicated helper logic if any remains
5. review console logging and remove noisy debug logs that are no longer useful

Likely files to inspect:
- `public/js/main.js`
- `public/js/utils/event-bus.js`
- `public/js/i18n/i18n.js`
- `public/js/ui/board-renderer.js`
- `public/js/storage/*.js`

### 4.2 Documentation Updates

Update or add documentation for:
1. event constant usage
2. state management ownership
3. storage adapter responsibilities
4. startup optimization strategy
5. service worker behavior and cache scope
6. how to run tests locally

Suggested targets:
- `README.md`
- optional architecture notes under `docs/`

### 4.3 Final Verification Before Merge Or Release

After cleanup changes, repeat a short regression pass:
1. app loads
2. new game works
3. pause/resume works
4. restore works
5. language switch works
6. records render
7. no obvious console errors

## Suggested Collaboration Workflow On The Testing Computer

When you are ready on the testing computer, use this order:
1. install dependencies
2. run the current tests
3. report failures back to me
4. run the manual checklist in sections A through G
5. record any broken behavior or unexpected console/network output
6. let me fix issues one batch at a time
7. after Phase 3 is stable, do Phase 4 cleanup and docs

## Open Risks To Watch

1. Event rename mismatch between modules may only show up in real browser flows.
2. Service worker caching may mask asset changes during repeated local testing.
3. Supabase sync behavior may need real credentials/session to verify fully.
4. localStorage-based translation cache may require invalidation strategy later if translations change frequently.

## Definition Of Done

Phase 3 is done when:
- automated tests run successfully on the testing computer
- manual verification checklist passes or remaining failures are documented
- no major functional regressions remain

Phase 4 is done when:
- cleanup changes are applied
- docs are updated
- final regression pass succeeds