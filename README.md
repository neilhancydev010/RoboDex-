# RoboDex́ — Version 1.0

**RoboDex́** is an application-first, 100% static educational website designed to take absolute beginners from zero programming experience to writing, debugging, and deploying Arduino C++ programs independently.

Its learning workspace is inspired by W3Schools' clear 3-column instructional structure (left course navigation, structured lesson column with Try It Yourself examples and exercises, and right-side section contents) while using original branding, original content, and robotics-specific engineering pedagogy.

---

## Core Architecture & Technical Stack

- **Multi-page HTML5**: Separate pages for Home (`index.html`), Learning Workspace (`learn.html`), Explore Academy (`academy.html`), Board-Specific Paths (`boards.html`), Guided Projects (`projects.html`), Student Dashboard (`dashboard.html`), Local Profiles (`profiles.html`), Local Data Management (`my-data.html`), and `404.html`.
- **CSS3 Design System**: Modular stylesheets (`tokens.css`, `base.css`, `layout.css`, `components.css`) with dark navy engineering navigation, blue/cyan accents, responsive desktop/tablet/mobile support, and Light/Dark reading themes.
- **Vanilla JavaScript**: Zero frameworks, zero build step, zero backend server, zero AI integrations, zero paid services.
- **Persistence**:
  - **IndexedDB (`RoboDexAcademyDB`)** for multiple independent local student profiles, lesson checkpoints, exercise attempts, module quiz scores, and project progress.
  - **localStorage** strictly for lightweight UI preferences (theme, font size, active profile ID, quiz passing threshold).
- **Interactive Code Editor**: Loads **Ace Editor** (C/C++ syntax mode) when online and seamlessly provides a built-in, zero-dependency syntax-highlighted editable code editor when offline — including Copy, Reset, and real `.ino` file download for Arduino IDE. It intentionally **never** fabricates compilation or hardware execution results.
- **PWA & GitHub Pages Ready**: All links and asset paths are strictly relative (`./...`), accompanied by `manifest.webmanifest`, `service-worker.js`, and `404.html`.

---

## Project Folder Structure

```text
robodex/
├── index.html                  # Home page & quick start
├── learn.html                  # W3Schools-style 3-column lesson & quiz workspace
├── academy.html                # Explore Academy (12 modules + project pathways)
├── boards.html                 # 5 Board-specific learning paths & comparison matrix
├── projects.html               # 8 Guided robotics project pathways
├── dashboard.html              # Live IndexedDB student dashboard
├── profiles.html               # Multi-profile local manager & preferences
├── my-data.html                # Export progress, records, versioned backup/restore, delete
├── 404.html                    # GitHub Pages custom 404 page
├── manifest.webmanifest        # Relative-path Web App Manifest
├── service-worker.js           # Offline static shell caching
├── README.md                   # Documentation
├── assets/
│   ├── css/
│   │   ├── tokens.css
│   │   ├── base.css
│   │   ├── layout.css
│   │   └── components.css
│   ├── js/
│   │   ├── prefs.js
│   │   ├── db.js
│   │   ├── progress.js
│   │   ├── app.js
│   │   ├── editor.js
│   │   ├── exercises.js
│   │   ├── quiz.js
│   │   ├── learn-page.js
│   │   ├── academy-page.js
│   │   ├── boards-page.js
│   │   ├── projects-page.js
│   │   ├── dashboard-page.js
│   │   ├── profiles-page.js
│   │   └── my-data-page.js
│   ├── img/
│   │   ├── logo.svg
│   │   └── favicon.svg
│   └── diagrams/
│       ├── ipo-model.svg
│       ├── flowchart-basics.svg
│       ├── arduino-loop.svg
│       └── boards-overview.svg
└── data/
    ├── curriculum.json         # Master index of all 12 modules & 97 lessons
    ├── boards.json             # Uno R3, Uno R4, Nano variants, Mega 2560, ESP32 variants
    ├── projects.json           # 8 progressive project pathways
    ├── lessons/
    │   ├── mod-01.json ... mod-12.json
    └── quizzes/
        └── quizzes.json        # Module quizzes for all 12 modules
```

---

## Running Locally

Because browsers block `fetch()` of local JSON files over the `file://` protocol, run RoboDex́ through any static local HTTP server:

### Option 1: Python 3 (Recommended)
```bash
cd robodex
python3 -m http.server 8080
```
Then open `http://localhost:8080` in your browser.

### Option 2: Node.js
```bash
cd robodex
npx serve .
```

### Option 3: VS Code Live Server
Open the `robodex/` folder in VS Code and click **Go Live**.

---

## Deploying to GitHub Pages

1. Create a new GitHub repository (e.g., `robodex`).
2. Push the contents of the `robodex/` folder to the root of your `main` branch.
3. Open **Settings → Pages** in your GitHub repository.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then click **Save**.
6. Your site will be live at `https://<your-username>.github.io/<repo-name>/`. Because all internal links, JSON fetches, manifest paths, and service worker paths are relative (`./`), repository subpath hosting works out of the box.

---

## Implemented Features (Version 1.0)

- Complete 12-module curriculum in the exact specified order (97 structured lessons across Modules 01–12), every lesson containing all 14 instructional sections.
- W3Schools-inspired 3-column learning workspace with expandable module sidebar, checkmarks, sequential lock/unlock states, live course progress bar, and right-side On-This-Page TOC scrollspy.
- Interactive Try It Yourself Arduino C++ editor (Ace Editor when online + built-in syntax-highlighted fallback offline) with Copy, Reset, `.ino` download, expected hardware behavior notes, and honest Arduino IDE compilation guidance.
- All 7 interactive exercise types (multiple choice, fill-in-the-blanks, select correct code, predict behavior, identify errors, arrange instructions, write short code) with Submit/Check, feedback, Try Again, Show Answer, and explanations.
- End-of-module quizzes for all 12 modules with configurable passing threshold (default 70%), auto-scoring, per-question explanations, and retake support.
- Weighted progress tracking (30% lessons/checkpoints, 50% coding exercises, 20% module quizzes) and 5-tier skill mastery indicators (`Not Started`, `Learning`, `Practicing`, `Competent`, `Mastered`).
- Separate board-specific learning paths for Arduino Uno R3, Uno R4, Nano (explicitly distinguishing Classic, Every, and Nano ESP32), Mega 2560, and ESP32 (explicitly distinguishing WROOM-32, S3, and C3).
- 8 guided project pathways integrated with curriculum prerequisites and interactive logic checklists (no immediate copy-paste spoilers).
- Multi-profile local student system (no fake server auth or passwords), live Student Dashboard (zero fabricated metrics), and My Data page (Export Progress JSON, Export Records CSV, Versioned Backup JSON, Restore Backup, Delete Local Profile).

---

## Known Limitations & Future Roadmap (Not in Version 1.0)

- **No in-browser compiler or hardware upload**: Real compiling, verifying, and uploading require the official Arduino IDE on desktop (intentional pedagogical design).
- **Token-based checking for `write-code` exercises**: Free-form code exercises validate required C++ / Arduino constructs and syntax patterns rather than running a full C++ compiler in the browser.
- **Browser-local storage**: IndexedDB data stays strictly on the local browser/device; clearing site data removes unsaved progress unless the student downloads a backup from `my-data.html`.
- **Intentionally excluded from Version 1.0**: Separate Coding Arena, Debugging Lab, Robotics Project Laboratory, project submission/review systems, certificates, cloud database/auth, instructor/admin dashboards, AI tutors, leaderboards, and paid services.
