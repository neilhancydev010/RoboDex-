# RoboDex́ | Train Yourself

**RoboDex́ | Train Yourself** is a 100% static, local-first educational web application that teaches absolute beginners to think, write, debug, and build Arduino C++ programs independently.

---

## Stage 1 Architecture Overview

- **Brand Identity**: Text-only wordmark `RoboDex́` and `RoboDex́ | Train Yourself` (zero graphical brand logos, zero version-based branding).
- **Hyper-Bloom Visual System**: Complete **Dark Hyper-Bloom** and **Light Hyper-Bloom** themes (`tokens.css`, `base.css`, `layout.css`, `components.css`) featuring organic layered background curves, curved section transitions, purple-centered gradients, geometric display + technical sans typography, laptop-first layout (`1280px` / `1440px`), and calm reading surfaces for Programming School.
- **Navigation & Application Shell**:
  - **Initial Screen (`index.html`)**: Mandatory Local Student Profile Selector (always shown on a fresh session via `sessionStorage`-scoped active profile). Supports multiple independent local profiles including identical full names via unique internal IDs (`stu_...`), requiring only a real full name.
  - **Persistent Left Sidebar (6 Primary Destinations)**:
    1. **Dashboard (`dashboard.html`)** — Consolidated Dashboard + Explore Academy overview backed strictly by the selected profile's IndexedDB records.
    2. **Programming School (`learn.html`)** — Preserved 12-module, 97-lesson, 136-exercise, 12-quiz W3Schools-inspired learning workspace.
    3. **Boards (`boards.html`)** — Prepared Stage 1 shell for Stage 2 hardware board paths + authentic hardware photography attribution manifest (`data/hardware-assets.json`).
    4. **Application-Based Learning (`projects.html`)** — Prepared Stage 1 shell for Stage 3 project learning environment.
    5. **My Information (`my-information.html`)** — Profile management, persistent storage status, export/backup/restore (V1 & V2 compatible), and explicit profile deletion.
    6. **About (`about.html`)** — Preserved educational methodology and platform overview moved from the removed Home page.
- **Persistence & Safe V1 Migration**:
  - **IndexedDB (`RoboDexAcademyDB`, Schema v2)**: Non-destructively upgrades V1 stores (`profiles`, `lessonProgress`, `exerciseAttempts`, `quizAttempts`, `projectProgress`), adds `boardProgress` and `activityLog`, recovers any unowned V1 records into a `"Migrated Local Learner"` profile rather than discarding them, and requests `navigator.storage.persist()` where supported.
  - **localStorage**: Lightweight UI preferences only (theme, reading font size, quiz pass score).
  - **sessionStorage**: Active profile selection for the current browser session only.

---

## Running Locally

Because browsers block `fetch()` of local JSON files over `file://`, serve the `robodex/` folder via a local static HTTP server:

```bash
cd robodex
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

---

## Footer Standard

Every application page displays the exact three-line footer:

```text
RoboDex́ | Train Yourself
United Academy Robotics Club | United Academy
Copyright © United Academy Robotics Club Member - Neilhancy Dev 2026
```
