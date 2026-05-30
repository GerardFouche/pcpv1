# Project Conventions & Guidelines for Pill Counter PRO

Always adhere to the following rules during development to guarantee smooth, professional operation on both development and production environments (especially on the Raspberry Pi 5):

## 1. Operating Strategy
- **One Step at a Time**: Execute changes, designs, and debugging incrementally. Double-check each build step and wait/confirm user instruction before embarking on unrelated feature creep.
- **Focus Mode**: Stay highly focused on the core purpose: maintaining a reliable, clean, robust vision-based pill counter interface on the Raspberry Pi 5.

## 2. Ultra-Persistent Database Strategy (Preventing Data Loss)
- To prevent data loss during any/all future software upgrades (such as git pulls, updates, or redeployments), **never** store user data inside the active development working directory or dynamic installation folders.
- Always store the primary SQLite database at: `~/.pill_counter/pill_counter.db` (relative to the user's home folder `os.homedir()`).
- The application automatically handles smooth backwards-compatible migration to copy any pre-existing databases found in the standard workspace root folder into this persistent safe zone.
- Automated database path is defined in `server.ts` utilizing safer user homedir fallback.

## 3. GitHub Integrated Non-Destructive Auto-Updates
- Updates are pulled from the user's official GitHub repository: `GerardFouche/pcpv1`.
- The update engine normalizes and compares local version indicators (e.g., `PCPv1.1`) to the repository's `package.json` version string.
- When an update is initiated, it automatically produces a localized backup snapshot of the working SQLite database, executes `git fetch --all`, runs a non-destructive `git reset --hard origin/main`, builds the compiled environment assets using robust npm configurations, and restarts the backend process without sacrificing user state or historic pill records.
