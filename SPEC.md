# IT Command Center — Final Product & Build Spec (v1.1)

> **Read this first, every session.** This file is the single source of truth for building the IT Command Center. If code and this spec disagree, the spec wins until the spec is changed. Owner: **Sri (IT Manager)**. Last updated: 28 Sep 2026.

---

## What's new in v1.1 (read this if the v1.0 app is already built)

Phases 0–6 (v1.0) are built. v1.1 adds **six features requested by Sri**. They are built in **Phase 7** (Section 23.2). Section numbers from v1.0 are unchanged; new content is added inside the existing sections and marked **(v1.1)**.

| # | Feature asked | Feature IDs | Where in this spec |
|---|---|---|---|
| 1 | To-do list with schedule | F-TODO-01…11 | §10.4, schema §15 (`TodoItem`) |
| 2 | Full calendar with all dates | F-CAL-08…16 | §12.1 |
| 3 | Attendance protocol | F-ATT-01…14 | §10.5, schema §15 (`AttendanceRecord`, `AttendanceRegularization`) |
| 4 | Feedback by Admin on tasks assigned to individuals | F-FB-01…10 | §7.5, schema §15 (`TaskFeedback`) |
| 5 | Dynamic certificates linked to a URL (college website) | F-CERT-01…11 | §13.6, schema §15 (`CertificateTemplate`, `Certificate`) |
| 6 | Task duration | F-DUR-01…08 | §7.4, schema §15 (`TimeLog`, new `Task` fields) |

Also changed: permission matrix (§3.2), navigation (§4.1), glossary (§2), command intents (§8.3), notifications (§12.4), KPIs, JPA and JPR (§13), jobs (§17), seed (§20), e2e flows (§21), RULES (§22), open decisions (§25), prompts (§26.5).

---

## 0. How to use this file

- Put this file in the repo root as `SPEC.md`. Put `RULES.md` (Section 22) next to it.
- Every AI coding session starts with: *"Read SPEC.md and RULES.md. We are in Phase N. Build feature X only. Plan first, no code."*
- Every feature has **IDs** (e.g. `F-TASK-03`). Use them in branch names, commit messages and task titles: `git commit -m "F-TASK-03: whose-turn toggle"`.
- Every feature has **acceptance criteria (AC)**. A feature is done only when all its AC pass and the Definition of Done (Section 21) is met.
- Words in **bold monospace** like **`Task`** are database models (Section 15).
- **(v1.1)** Because the v1.0 app already exists, every Phase 7 change must be **additive**: new tables, new columns with defaults, new pages. Never drop or rename existing columns or break existing flows.

---

## 1. Product in one paragraph

A private, self-hosted web app (installable on phones as a PWA) where Sri and his team run all their work: tasks from anyone, follow-ups sent automatically on Sri's behalf, teams and campuses, group chat, daily updates, calendar, docs, a Dev Hub for software work, and reports (weekly KPI, JPA, JPR, personal progress) that download in one click for the CEO, COO and VC. **(v1.1)** It also covers personal to-do lists with a day schedule, a full calendar, attendance, task time tracking, Admin feedback on completed work, and verifiable certificates. Everything is typed in plain English through a command bar. It replaces WhatsApp groups, Excel trackers, paper attendance registers and hand-made weekly reports for the team.

### 1.1 Goals (measurable)

| # | Goal | Target | Measured by |
|---|---|---|---|
| G1 | Nothing asked of Sri gets lost | 100% of leadership asks logged as tasks | Tasks with `source=LEADERSHIP` vs asks |
| G2 | Less chasing by hand | 80% of follow-ups sent by the app, not Sri | `FollowUp` sent count |
| G3 | Weekly report time | < 5 minutes (was hours) | Time from open Reports → download |
| G4 | Team moves off WhatsApp for work | 90% of work messages inside the app by week 4 of rollout | Messages/day in app |
| G5 | Daily update compliance | ≥ 90% | Section 13 KPI |
| G6 (v1.1) | Attendance recorded in the app | 100% of working days for active users | `AttendanceRecord` count vs expected |
| G7 (v1.1) | Every assigned task gets feedback | ≥ 90% of done individual tasks get Admin/Lead feedback within 3 working days | `TaskFeedback` vs done tasks |
| G8 (v1.1) | Certificates are verifiable | 100% of issued certificates open a valid public verify page | `/verify/{code}` checks |

### 1.2 Non-goals for v1

- No WhatsApp, Telegram, SMS, Google, Microsoft or paid AI APIs. **Zero external services.**
- No student records, fee data, exam data or passwords stored in this app.
- No public sign-up. Accounts are created by an Admin.
- No native iOS/Android app (PWA only).
- No biometric attendance devices, face recognition or continuous location tracking (v1.1).
- Personal request link, voice-to-task, GitHub sync, helpdesk ticket numbers, UOS merge → **Later** (Section 24).

### 1.3 Hard constraints

1. **Self-contained:** runs with `docker compose up` on one machine: app + PostgreSQL + Ollama. Works with no internet except to reach the server.
2. **Private:** Sri's own app, not an SMRU system. Keep university-sensitive data out.
3. **Plain English first:** every create/read/update/delete and every follow-up can be done from the command bar.
4. **Works without AI:** a rule-based parser handles all standard sentences. The local model is only a fallback. If Ollama is down, nothing breaks.
5. **Mobile first for team members,** desktop first for Sri's console.
6. **(v1.1) One public page only:** the certificate verification page `/verify/{code}` is the only page reachable without login. The reverse proxy may expose only `/verify/*` (and its static assets) to the public internet while the rest of the app stays private.

---

## 2. Glossary

| Term | Meaning |
|---|---|
| **Console** | Sri's home screen: I owe / I'm chasing / Shared, Inbox, Follow-ups, Morning brief |
| **My Space** | Every user's home screen: my tasks, my follow-ups, my daily update, my calendar |
| **I owe** | Open tasks where *I* am the owner, or shared tasks where it's *my turn* |
| **I'm chasing** | Open tasks I asked for / assigned, owned by someone else |
| **Shared** | Tasks with two sides; shows **whose turn** it is |
| **Inbox** | New requests waiting for Sri (or any user) to Accept / Delegate / Schedule / Decline |
| **Follow-up** | A scheduled nudge sent by the app on someone's behalf until the task moves |
| **Approval mode** | Follow-ups to senior people are drafted and wait for Sri's tap before sending |
| **Daily update** | 3 fields: Done / Next / Blockers, due by 18:00 on working days |
| **KPI** | Weekly key performance indicators (Section 13.1) |
| **JPA** | **Job Performance Appraisal** — per person, per period (Section 13.2) |
| **JPR** | **Job Progress Report** — per team, per period (Section 13.3) |
| **Campus** | A physical institution (SMRU, Hyderabad group, Chebrol, Guntur, St. Mary's Women's) with on-site or remote support |
| **Team type** | Campus team, Implementation, Dev team, Interns, Support, or custom |
| **Working day** | Mon–Sat, 09:00–18:00 IST unless changed in Settings; holidays from the Holiday list |
| **To-do (v1.1)** | A private, personal item on a user's own list (e.g. "call vendor at 3pm"). Lighter than a Task: no requester, no follow-ups. Can be scheduled into a time slot |
| **Day schedule (v1.1)** | The time-slot view of one day showing to-dos, meetings and tasks due, so a user can plan the day |
| **Attendance record (v1.1)** | One row per user per working day: check-in, check-out, mode, status (Present, Late, Half day, Absent, On leave, Holiday, Week off) |
| **Regularisation (v1.1)** | A request to correct a wrong or missing attendance record, approved by the lead or Admin |
| **Estimate (v1.1)** | Planned duration of a task (e.g. "3h", "2d") |
| **Time log (v1.1)** | Actual time spent on a task, from the timer or entered by hand |
| **Task feedback (v1.1)** | Rating (1–5) + comment given by Admin (or the Lead) on a completed task done by one person |
| **Rework (v1.1)** | A feedback outcome that reopens the task with the reviewer's comment |
| **Certificate (v1.1)** | A PDF generated from a template with the person's data, a unique number and a QR code linked to a verification URL |
| **Verification URL (v1.1)** | Public link `{VERIFY_BASE_URL}/{code}` that shows whether a certificate is valid |

> ⚠️ **Confirm with Sri:** JPA = Job Performance Appraisal and JPR = Job Progress Report. If SMRU uses different meanings, change Section 13 only.

---

## 3. Users and roles

### 3.1 Personas

| Persona | Example | What they need | Main screen |
|---|---|---|---|
| **Admin / Owner** | Sri | See everything, capture asks from leadership, delegate, chase, report upward, give feedback, issue certificates | Console |
| **Lead** | Hari (IT Coordinator), campus leads | Run their team, review updates, assign tasks, see team progress and attendance | My Space + Teams |
| **Developer** | Dev · Web, Dev · Backend | Know what to build, report progress, log time, log bugs, get reviews | My Space + Dev Hub |
| **Intern** | Web batch interns | Clear tasks, learning docs, a mentor, credit for work, a verifiable certificate | My Space |
| **Member** | Support staff, campus IT | Tasks, updates, chat, attendance | My Space |
| **Guest** | CEO/COO/VC office, other departments, vendors (optional) | Raise requests, see status of their requests, view shared reports | Requests page |
| **Public visitor (v1.1)** | An employer checking an intern's certificate | Confirm a certificate is real | `/verify/{code}` only |

### 3.2 Permission matrix

`✔` = allowed, `Own` = only items they own/created, `Team` = only within teams they lead or belong to, `–` = not allowed.

| Action | Admin | Lead | Developer | Member | Intern | Guest |
|---|---|---|---|---|---|---|
| Create/edit users, reset passwords | ✔ | – | – | – | – | – |
| Create/edit campuses, team types | ✔ | – | – | – | – | – |
| Create/edit teams | ✔ | Team (own teams) | – | – | – | – |
| Add/remove team members | ✔ | Team | – | – | – | – |
| Create tasks | ✔ | ✔ | ✔ | ✔ | ✔ (for self or lead) | Requests only |
| Assign tasks to anyone | ✔ | Team | Team (peers) | Team (peers) | – | – |
| Edit/delete a task | ✔ | Team | Own | Own | Own | – |
| View tasks | All | Team + own | Team + own | Team + own | Own + team board | Own requests |
| Create follow-ups | ✔ | Team | Own tasks | Own tasks | – | – |
| Approve follow-ups to seniors | ✔ | – | – | – | – | – |
| Inbox (receive requests) | ✔ | ✔ | ✔ | ✔ | ✔ | – |
| Chat: create group | ✔ | Team | – | – | – | – |
| Chat: post | ✔ | ✔ | ✔ | ✔ | ✔ | Only in DM with requestee |
| Docs: create/edit | ✔ | Team | Team | Team | Own drafts; edit if allowed | View shared |
| Dev Hub: edit | ✔ | ✔ | ✔ | View | View + own bugs | – |
| Reports: KPI/JPR | All | Team | Own | Own | Own | Shared reports |
| Reports: JPA (per person) | All | Team members | Own only | Own only | Own only | – |
| Enter JPA review score | ✔ | Team | – | – | – | – |
| Settings | ✔ | – | – | – | – | – |
| Audit log | ✔ | – | – | – | – | – |
| **(v1.1)** To-do list (own, private) | Own | Own | Own | Own | Own | – |
| **(v1.1)** Check in / check out | ✔ | ✔ | ✔ | ✔ | ✔ | – |
| **(v1.1)** View attendance | All | Team + own | Own | Own | Own | – |
| **(v1.1)** Approve regularisation / leave | ✔ | Team | – | – | – | – |
| **(v1.1)** Edit any attendance record (with reason) | ✔ | – | – | – | – | – |
| **(v1.1)** Set estimate, run timer, log time | ✔ | Team + own | Own tasks | Own tasks | Own tasks | – |
| **(v1.1)** View timesheets | All | Team + own | Own | Own | Own | – |
| **(v1.1)** Give task feedback | ✔ | Team (if enabled in Settings) | – | – | – | – |
| **(v1.1)** View task feedback | All | Team + own | Own | Own | Own | – |
| **(v1.1)** Acknowledge / reply to feedback | Own | Own | Own | Own | Own | – |
| **(v1.1)** Certificate templates | ✔ | – | – | – | – | – |
| **(v1.1)** Issue / revoke certificates | ✔ | Propose for team (Admin approves) | – | – | – | – |
| **(v1.1)** View & download own certificates | ✔ | ✔ | ✔ | ✔ | ✔ | – |
| **(v1.1)** Open public verify page `/verify/{code}` (no login, limited data §13.6) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ (also anyone on the internet) |

Implement as `can(user, action, resource?)` in `lib/auth/can.ts`. **Every** server action and API route calls it. UI hides what `can` denies, but the server is the real guard. The public verify route uses its own read-only function and never touches `can()` sessions.

---

## 4. Information architecture

### 4.1 Navigation (desktop sidebar / phone bottom bar)

| Order | Item | Admin | Lead | Dev | Member | Intern | Guest | Phase |
|---|---|---|---|---|---|---|---|---|
| 1 | Console | ✔ | – | – | – | – | – | 2 |
| 2 | My Space | ✔ | ✔ | ✔ | ✔ | ✔ | – | 2 |
| 3 | **To-do (v1.1)** | ✔ | ✔ | ✔ | ✔ | ✔ | – | 7 |
| 4 | Inbox | ✔ | ✔ | ✔ | ✔ | ✔ | – | 2 |
| 5 | Teams | ✔ | ✔ | ✔ | ✔ | ✔ | – | 1 |
| 6 | Chat | ✔ | ✔ | ✔ | ✔ | ✔ | limited | 3 |
| 7 | Calendar | ✔ | ✔ | ✔ | ✔ | ✔ | – | 5 (full view 7) |
| 8 | **Attendance (v1.1)** | ✔ all | ✔ team | own | own | own | – | 7 |
| 9 | Dev Hub | ✔ | ✔ | ✔ | view | view | – | 5 |
| 10 | Docs | ✔ | ✔ | ✔ | ✔ | ✔ | shared | 5 |
| 11 | Reports | ✔ | ✔ | own | own | own | shared | 6 |
| 12 | **Certificates (v1.1)** | ✔ manage | propose | own | own | own | – | 7 |
| 13 | Setup | ✔ | teams | – | – | – | – | 1 |
| 14 | Settings | ✔ | – | – | – | – | – | 1 |
| – | Requests (guest home) | – | – | – | – | – | ✔ | 2 |
| – | **Verify (public, v1.1)** | – | – | – | – | – | – | 7 |

Phone bottom bar shows 4 items + "More": Home (Console or My Space), Inbox, Chat, More. **(v1.1)** The Home screen on phone shows a **Check in / Check out** button at the top and today's schedule (to-dos + meetings) below it.

### 4.2 Global UI elements (on every screen)

- **Command bar** (`/` or `Ctrl/Cmd+K`, and a fixed input on Console).
- **Notification bell** with unread count.
- **Quick add (+)**: Task, **To-do (v1.1)**, Request, Update, Message.
- **Search** (inside command bar: typing `?` or "find ...").
- **Toast** area for confirmations with **Undo** (10 seconds) on every delete, done, delegate, decline.
- **(v1.1) Running timer pill** in the header when a task timer is running (task ID, elapsed time, Stop button).
- **(v1.1) Attendance chip** in the header: "In since 09:04" / "Not checked in" / "On leave".

---

## 5. Module: Auth, Users & Settings (`F-AUTH`)

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-AUTH-01 | Email + password login | Wrong password shows "Email or password is wrong" (no hint which). 5 failed attempts → 15-minute lock for that email. Session lasts 30 days on "Keep me signed in", else 12 hours. |
| F-AUTH-02 | Admin creates users | Fields: name, email, phone (optional), role, teams, campus, job title, start/end date (for interns). System generates a one-time password; user must change it on first login. |
| F-AUTH-03 | Password reset by Admin | Admin clicks Reset → new one-time password shown once. No email service needed. |
| F-AUTH-04 | Change own password | Min 10 characters. Old password required. |
| F-AUTH-05 | Deactivate user | User can't log in; their tasks stay; open tasks are listed for reassignment. Never hard-delete users. |
| F-AUTH-06 | Profile | Photo (upload), display name, job title, working hours, quiet hours, notification preferences. |
| F-AUTH-07 | Settings (Admin) | Org name, timezone (default Asia/Kolkata), working days, working hours, daily-update deadline (18:00), holiday list, follow-up defaults (Section 9.4), senior people list (always approval mode), AI on/off, model name. |
| F-AUTH-08 | Audit log | Every create/update/delete on users, teams, tasks, follow-ups, settings is logged: who, what, when, before/after (JSON). Admin can filter and export CSV. |
| F-AUTH-09 | Onboarding checklist | First login shows: set photo → install app on phone → allow notifications → join your team chat → post first daily update. Progress bar until complete. |
| F-AUTH-10 (v1.1) | Settings for v1.1 features | **Attendance:** office start (09:00), grace minutes (15), half-day minimum hours (4), full-day hours (8), absent cut-off (11:00), verification method (Office IP / Location / Both / None), office IP ranges, location check on/off, max regularisations per month (3), leave approval required (on). **Time:** hours per working day for "d" estimates (8), timer auto-stop time (18:30). **Feedback:** who can give (Admin only / Admin + Leads), feedback due within (3 working days). **Certificates:** college name, college website URL, verify base URL, certificate number prefix, minimum attendance % for intern completion (80%). **Calendar:** week starts on (Monday), show week numbers (on). All changes audit-logged. |
| F-AUTH-11 (v1.1) | Remote-allowed flag | Per user: "Remote attendance allowed" (default off). Used by F-ATT-02. |

---

## 6. Module: Setup — Campuses, Team types, Teams (`F-ORG`)

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-ORG-01 | Campuses CRUD | Fields: name, short code, support mode (On-site / Remote), lead, address (optional). **(v1.1)** Optional attendance geofence: latitude, longitude, radius in metres (default 200), office IP ranges. Can't delete a campus that has teams; archive instead. |
| F-ORG-02 | Team types CRUD | Built-in: Campus team, Implementation, Dev team, Interns, Support. Admin adds custom types with: name, color, **stages** (e.g. "Data collected → Trained → Go-live") and **custom fields** (text, number, date, select). |
| F-ORG-03 | Teams CRUD | Fields: name, type, campus (or "All campuses"), lead, members, start/end date (interns), description. **Creating a team auto-creates its chat group** (`#team-slug`) and a Docs folder. |
| F-ORG-04 | Team membership | Roles inside team: Lead, Member. One user can be in many teams. Leaving a team keeps their history. |
| F-ORG-05 | Implementation tracker | For Implementation-type teams: rows = campuses, columns = the type's stages; each cell has status (Not started / In progress / Done / Blocked), date and owner. Shows % complete per campus. |
| F-ORG-06 | Intern batches | Interns-type teams show batch dates, mentor per intern, days left, evaluation due date (end date − 7 days → task for lead to complete JPA). **(v1.1)** Also shows each intern's attendance %, average feedback rating and certificate status (Not eligible / Eligible / Issued). |
| F-ORG-07 | Teams screen | Card per team: type chip, campus, lead, members count, progress %, open tasks, flags (overdue, blocked, missed updates), last update time. **(v1.1)** Also "In today: 6/8". Click → Team page with tabs: Board, Members, Updates, Chat, Links, Docs, **Attendance (v1.1)**, Reports. |
| F-ORG-08 | Create from command bar | "create team Exam cell support under SMRU lead Hari" and "create group admissions-web" work (Section 8). |

**Progress % of a team** = done tasks ÷ (done + open tasks) for tasks due in the current period (default: this month). Show "—" if no tasks.

---

## 7. Module: Tasks — the engine (`F-TASK`)

Everything in the app becomes a **`Task`** or points to one.

### 7.1 Task fields

| Field | Type | Rules |
|---|---|---|
| title | text (≤ 140) | Required |
| description | rich text | Optional; supports links, checklists, attachments |
| ownerId | user | Who must do it. Required (defaults to creator) |
| requesterId | user (optional) | Who asked for it (internal user) |
| requesterName | text (optional) | Who asked, if not a user ("VC office", "CTPL") |
| createdById | user | Auto |
| mode | SOLO / SHARED | SHARED shows in both people's Shared column |
| partnerId | user (optional) | The other side of a SHARED task |
| turnUserId | user (optional) | Whose turn it is on a SHARED task |
| turnNote | text | e.g. "Sign off checklist", "Payment approval" |
| status | TODO / IN_PROGRESS / IN_REVIEW / BLOCKED / DONE / CANCELLED | |
| priority | LOW / MEDIUM / HIGH / URGENT | Default MEDIUM; leadership asks default HIGH |
| dueAt | datetime (optional) | Date-only means 18:00 that day |
| startAt | datetime (optional) | For planning; shows on calendar |
| teamId, projectId, campusId | optional links | |
| tags | text[] | |
| source | COMMAND / MANUAL / INBOX / CHAT / LEADERSHIP / DEV / RECURRING / UPDATE | |
| recurrence | RRULE text (optional) | e.g. every weekday |
| parentId | task (optional) | Subtasks, one level deep |
| blockedReason | text | Required when status = BLOCKED |
| doneAt, doneById | auto | Set when status → DONE |
| estimateHours | number (optional) | **(v1.1)** Entered as "45m", "2h 30m", "3d" (1d = hours per working day from Settings) |
| checklist | JSON | [{text, done}] |
| **workStartedAt (v1.1)** | auto | Set the first time status → IN_PROGRESS (or first timer start) |
| **actualMinutes (v1.1)** | auto | Sum of `TimeLog` minutes; cached on the task, recomputed on every log change |
| **feedbackState (v1.1)** | auto | NONE / PENDING / GIVEN / REWORK (Section 7.5) |

### 7.2 The three lists (computed, never stored)

For the signed-in user **me**, open = status not in (DONE, CANCELLED):

- **I owe** = open tasks where (`mode=SOLO` and `ownerId=me`) or (`mode=SHARED` and `turnUserId=me`).
- **I'm chasing** = open tasks where (`requesterId=me` or `createdById=me`) and `ownerId≠me` and `mode=SOLO`.
- **Shared** = open tasks where `mode=SHARED` and me ∈ {ownerId, partnerId}. Card shows "Your turn: …" or "Their turn: …".

Sort each list: overdue first → due soonest → priority → oldest.

### 7.3 Features

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-TASK-01 | Create task | From Quick add, command bar, inbox, chat message ("Make task"), Dev Hub bug, recurring rule, **or a to-do (v1.1)**. Only title is required. |
| F-TASK-02 | Edit inline | Click title/due/owner/status on any card to edit in place. Saves on blur. Shows "Saved". |
| F-TASK-03 | Whose-turn toggle | On a SHARED task, "Pass the ball" button flips `turnUserId` and asks for a one-line note. The other side gets a notification. |
| F-TASK-04 | Status flow | TODO → IN_PROGRESS → IN_REVIEW → DONE. BLOCKED from any state (reason required). Reopen DONE → TODO (logs reason). |
| F-TASK-05 | Mark done | Checkbox or "done" command. Stops all follow-ups on that task. Notifies requester: "✔ Done: <title> by <name>". Undo within 10 s. **(v1.1)** Stops a running timer on this task and queues feedback (F-FB-01). |
| F-TASK-06 | Delete | Soft delete (`deletedAt`). "Are you sure?" dialog. Undo 10 s. Admin can restore from Trash for 30 days. |
| F-TASK-07 | Comments & activity | Thread under each task: comments, @mentions, attachments, and an automatic activity log (status changes, due changes, follow-ups sent, replies, **time logs and feedback (v1.1)**). |
| F-TASK-08 | Subtasks & checklist | One level of subtasks with their own owner/due. Parent shows "3/5 done". **(v1.1)** Parent's actual time = own logs + subtask logs. |
| F-TASK-09 | Recurring tasks | Daily / weekdays / weekly on day X / monthly on day N. Next instance is created when the current one is done or at its due time, whichever is first. |
| F-TASK-10 | Views | List (default), Board (by status), Calendar, and "By person" (for leads). Filters: owner, requester, team, campus, project, status, priority, due range, tag, source, **feedback state, over estimate (v1.1)**. Save a filter as a named view. |
| F-TASK-11 | Bulk actions | Select many → change owner, due date, status, priority, delete. |
| F-TASK-12 | Due-date rules | Past due and open → red "Overdue by N days". Due today → amber. Due in ≤ 2 days → shows on Morning brief. |
| F-TASK-13 | Task link | Every task has a short ID (`T-1042`) and a URL. Typing `T-1042` in chat or docs makes a live link chip showing status. |
| F-TASK-14 | Leadership asks | Tasks with requesterName/requester in the **Senior people list** get `source=LEADERSHIP`, priority HIGH, and appear in the "Leadership requests" report section. |
| F-TASK-15 | Stale detection | Open task with no activity for 3 working days → "Stale" badge; appears in Morning brief under "Stuck". |

### 7.4 Task duration & time tracking (`F-DUR`) (v1.1)

Two kinds of duration are shown on every task:

- **Planned duration** = the estimate (`estimateHours`) and, if both are set, the working time between `startAt` and `dueAt`.
- **Actual duration** = time logged (`actualMinutes`), plus two automatic measures on done tasks: **lead time** (created → done) and **work time** (`workStartedAt` → done), both in working hours/days (holidays and non-working hours excluded).

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-DUR-01 | Set estimate | On create/edit, command bar or card: accepts "30m", "2h", "2h 30m", "1.5h", "3d". Stored as hours. Shows as "Est. 2h 30m". Invalid input shows "Use formats like 45m, 2h, 3d". |
| F-DUR-02 | Planned span | If `startAt` and `dueAt` are set, card shows "Planned: 3 working days (Mon 29 Sep → Wed 1 Oct)". On Calendar the task shows as a bar across those dates. |
| F-DUR-03 | Timer | Start / Pause / Stop buttons on task card and task page. **One running timer per user**: starting a new one stops the old one (toast with Undo). Running timer shows in the header pill (Section 4.2) and survives page refresh (stored in DB as a `TimeLog` with `endedAt = null`). First start sets `workStartedAt` and moves TODO → IN_PROGRESS. |
| F-DUR-04 | Auto-stop | At the timer auto-stop time (Settings, default 18:30) running timers stop and the user gets "Timer stopped at 18:30 on T-1042 — correct it?" with an Edit link. Timers never run across midnight. |
| F-DUR-05 | Manual time log | "Log time" dialog: date (default today), duration ("1h 15m") or start–end time, note. Edit or delete own logs for 7 days; after that only Admin (audit-logged). No overlapping logs for the same user. |
| F-DUR-06 | Actual vs estimate | Card shows "2h 10m / 3h" with a thin progress bar: teal ≤ 100%, amber 101–150%, red > 150% ("Over estimate by 1h 20m"). No estimate → shows only actual. |
| F-DUR-07 | Timesheet | My timesheet: week grid (rows = tasks, columns = Mon–Sat, cells = hours), daily and weekly totals, add a log by clicking a cell. Lead sees team timesheet (rows = people). Export Excel/CSV. |
| F-DUR-08 | Duration on done tasks | Done task shows "Took 2 working days · 5h 40m logged · est. 6h". These numbers feed the KPIs in §13.1 and JPA in §13.2. |

**Working-time calculation** lives in `lib/time/working.ts` and must have unit tests for: same-day, overnight, weekend/holiday in between, start outside working hours, and leave days of the owner.

### 7.5 Task feedback by Admin (`F-FB`) (v1.1)

When a task that was **assigned to one individual** is completed, the Admin (and, if enabled, their Lead) rates it. "Assigned to an individual" = `mode=SOLO`, `ownerId ≠ reviewer`, owner is not a Guest.

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-FB-01 | Feedback queue | When such a task goes to DONE, `feedbackState=PENDING` and it appears in a **"Give feedback"** card on the Console (Admin) and on the Lead's My Space (team tasks, if leads are allowed). Card shows task, person, due vs done date, time logged vs estimate. |
| F-FB-02 | Feedback form | **Overall rating 1–5 stars (required)**; optional sub-ratings: Quality, Timeliness, Communication (1–5); **comment** (required when overall ≤ 2, optional otherwise, max 1000 chars); quick chips ("Great work", "On time", "Needs more testing", "Please update status earlier"). Timeliness is pre-selected from on-time data (on time → 5, ≤1 day late → 3, more → 2) and can be changed. |
| F-FB-03 | Outcome | **Accept** (default) → `feedbackState=GIVEN`. **Needs rework** → comment required, task reopens to TODO with the comment added, `reopenCount+1`, owner notified, `feedbackState=REWORK`; when done again it returns to the queue. |
| F-FB-04 | Person is notified | Push + in-app: "Sri gave feedback on T-1042: ★★★★☆". Opens the feedback on the task page. |
| F-FB-05 | Acknowledge & reply | The person taps **Acknowledge** and can add one reply (max 500 chars). Reviewer is notified of the reply. |
| F-FB-06 | My feedback page | Every user sees all feedback they received: list with filters (period, rating), average rating, count, rework count, and a 12-week trend line. |
| F-FB-07 | Quick bulk feedback | Admin can open "Feedback mode" for one person: done tasks shown one by one; keys 1–5 set rating, Enter saves, → next. Target: 10 tasks in under 1 minute. |
| F-FB-08 | Reminders | Feedback pending more than 3 working days appears in the Admin's Morning brief ("5 tasks waiting for your feedback"). No push spam: at most one reminder per day. |
| F-FB-09 | Privacy & edits | Feedback is visible only to the person, their lead(s) and Admin. Never posted in chat or team channels. Reviewer can edit within 24 hours; afterwards it is locked (Admin can still edit with a reason, audit-logged). |
| F-FB-10 | Summary per person | Profile and JPA show: average rating, number of rated tasks, rework rate %, top chips received. Feeds JPA "Quality" (§13.2). |

---

## 8. Module: Command bar & plain-English engine (`F-CMD`)

### 8.1 Behaviour

- Opens with `/` or `Ctrl/Cmd+K` anywhere; always visible on Console.
- As the user types, a **preview line** shows what will happen: *"Create task 'Fix fee page' → owner Hari, due Fri 26 Sep 18:00, chase daily."* Enter confirms. Esc cancels.
- After running: toast with result + **Undo**.
- History: ↑ / ↓ cycles the last 20 commands.
- Suggestions: typing a name suggests users; typing "by" suggests dates; typing "#" suggests teams/groups; "T-" suggests tasks.
- Works the same on phone (input at the top of My Space).

### 8.2 Pipeline

1. **Normalise:** trim, lowercase copy for matching, keep original for titles.
2. **Rule parser** (`lib/cmd/parse.ts`): tries every intent pattern in 8.3 in order. Returns `{intent, slots, confidence}`.
3. If no rule matches or confidence < 0.7 and AI is on → **LLM parser** (`lib/cmd/llm.ts`) calls Ollama with the JSON schema in 8.5. Invalid JSON → fall through.
4. If still unknown → treat as **Add task for me** with the whole text as title (never lose what the user typed), and show "Saved as a task. Did you mean something else?"
5. **Resolve entities:** people (by name, first name, alias, "me"), teams, tasks (by ID or fuzzy title match), dates.
6. **Check permission** with `can()`.
7. **Destructive intents** (delete, remove member, decline, **revoke certificate (v1.1)**) always show a confirm step.
8. **Execute** through the same service functions the UI uses (never separate logic).

### 8.3 Intents (must all be supported by the rule parser)

| Intent | Example sentences | Result |
|---|---|---|
| ADD_TASK | "Add: VC wants placement report by Monday", "task renew smru.in SSL", "remind me to call CTPL tomorrow 11am" | Task owner=me; requesterName from "X wants" pattern; due parsed |
| ASSIGN_TASK | "Ask Hari to fix the admission form by Thursday", "Tell Dev Web to check fee page", "Assign UOS training plan to Hari due Oct 1" | Task owner=Hari, requester=me → appears in I'm chasing |
| ASSIGN_WITH_CHASE | "...chase daily", "...every 2 days", "...remind him weekly" | ASSIGN + FollowUp with cadence |
| APPROVAL_FLAG | "...ask me first" | FollowUp needsApproval=true |
| SHARED_TASK | "Share with Hari: UOS rollout plan, my turn first", "Hari and me: domain renewal, their turn" | mode=SHARED |
| PASS_TURN | "Pass UOS rollout to Hari", "my turn on domain renewal" | Flip turn |
| FOLLOW_UP | "Remind Janardhan sir about lab network", "Follow up with CTPL on banners every 2 days", "Chase COO office on budget, ask me first" | FollowUp on matching task, or new chasing task if none |
| MARK_DONE | "Hari finished the admission form", "done fee page", "mark T-1042 done" | status DONE, follow-ups stopped |
| UPDATE_STATUS | "Fee page is blocked waiting for accounts", "UOS API in review" | status change (+ reason) |
| MOVE_DUE | "Move SEO audit to next week", "push T-1042 to Friday" | dueAt change |
| CHANGE_OWNER | "Give fee page to Dev Web", "reassign T-1042 to Hari" | ownerId change |
| SET_PRIORITY | "fee page is urgent", "make T-1042 low priority" | priority |
| DELETE | "Delete the old CTPL task", "remove T-1042" | Confirm → soft delete |
| COMMENT | "Note on UOS rollout: training venue changed to lab 2" | TaskComment |
| QUERY_DAY | "What's my day?", "today", "what's due tomorrow" | Answer card: meetings, I owe due, **to-dos scheduled (v1.1)**, chases going out |
| QUERY_CHASING | "What am I chasing?", "what does Hari owe me" | List card |
| QUERY_STATUS | "Status of UOS", "how is the dev team doing" | Team/project summary card |
| QUERY_FIND | "find fee page", "? SEO checklist" | Search results |
| CREATE_TEAM | "Create team Exam cell support under SMRU lead Hari" | Team + chat group |
| CREATE_GROUP | "Create group admissions-web with Hari and Dev Web" | Channel |
| CREATE_CAMPUS | "Add campus Vijayawada remote" | Campus |
| ADD_MEMBER | "Add Intern Web A to Developers" | TeamMember |
| CREATE_EVENT | "Meeting with COO office Thursday 12:30", "block 3-5pm for SEO audit" | Event |
| POST_UPDATE | "update: done fee page fix; next UOS API; blocker staging access" | DailyUpdate |
| MESSAGE | "tell #dev-team standup moved to 10:30", "message Hari: call me" | Chat message |
| REPORT | "Download weekly report for VC", "export monthly KPI for CEO as excel", "JPA for Hari this quarter", **"attendance register for September" (v1.1)** | Report generated + download |
| OPEN | "open reports", "go to Hari's tasks", **"open calendar December 2026" (v1.1)** | Navigate |
| UNDO | "undo" | Undo last command (within 10 min, if reversible) |
| HELP | "help", "what can I type?" | Cheat sheet |
| **ADD_TODO (v1.1)** | "todo call vendor tomorrow 3pm", "to-do buy HDMI cables", "plan SEO reading 4-5pm", "todo: pay electricity bill every month on 5th" | `TodoItem` for me with date/time/repeat |
| **SCHEDULE_TODO (v1.1)** | "move call vendor to 5pm", "schedule buy cables Friday 11am" | To-do date/time change |
| **DONE_TODO (v1.1)** | "done call vendor", "tick buy cables" | To-do done (matches to-dos before tasks when the title matches a to-do) |
| **SET_ESTIMATE (v1.1)** | "fee page will take 3h", "estimate T-1042 2 days" | estimateHours |
| **START_TIMER / STOP_TIMER (v1.1)** | "start timer on fee page", "start T-1042", "stop timer", "pause" | TimeLog open/close |
| **LOG_TIME (v1.1)** | "log 2h on T-1042", "spent 45m on SEO audit yesterday" | Manual TimeLog |
| **CHECK_IN / CHECK_OUT (v1.1)** | "check in", "in from campus Chebrol", "working remote today", "check out", "leaving" | AttendanceRecord |
| **APPLY_LEAVE (v1.1)** | "leave tomorrow sick", "on leave 3 to 5 Oct casual" | Leave request |
| **QUERY_ATTENDANCE (v1.1)** | "who is in today?", "my attendance this month", "Hari's attendance September" | Answer card |
| **GIVE_FEEDBACK (v1.1)** | "feedback T-1042 4 stars good work", "rate Hari's fee page 5", "T-1042 needs rework: test on mobile" | TaskFeedback (Admin/Lead only) |
| **ISSUE_CERTIFICATE (v1.1)** | "issue completion certificate to Intern Web A", "certificates for Interns · Web batch Sep '26" | Opens issue dialog pre-filled (never issues without the confirm step) |

### 8.4 Date parsing (must pass tests)

Use `chrono-node` with timezone Asia/Kolkata and these house rules:

| Input | Resolves to |
|---|---|
| today / tonight | today 18:00 / today 20:00 |
| tomorrow | tomorrow 18:00 |
| Monday … Sunday | next occurrence, 18:00 (if today is that day and before 18:00 → today) |
| next week | next Monday 18:00 |
| end of week | this Saturday 18:00 (working week) |
| end of month | last working day 18:00 |
| in 3 days | +3 calendar days 18:00 |
| 26 Sep, Sep 26, 26/9 | that date 18:00 (DD/MM, Indian format) |
| 11am, 3:30pm, 15:30 | that time today (or tomorrow if passed) |
| "by" / "before" / "on" / "due" + date | dueAt |
| **(v1.1)** 3-5pm, 15:00–16:30 | start and end time (to-dos, events, time logs) |
| **(v1.1)** 45m, 2h, 2h 30m, 1.5h, 3d, 2 days | a duration (estimates, time logs); "d" = working-day hours |
| **(v1.1)** to-do with date but no time | that date, **unscheduled** (no time slot), not 18:00 |

### 8.5 LLM fallback contract (Ollama)

- Model: `qwen2.5:7b-instruct` (default) or `llama3.1:8b`; set in Settings.
- Call: `POST http://ollama:11434/api/chat` with `format: "json"`, `temperature: 0`, timeout 8 s.
- System prompt includes: today's date, user's name, list of people (id, names, aliases), teams, the intent list above.
- Must return exactly:

```json
{
  "intent": "ASSIGN_WITH_CHASE",
  "confidence": 0.86,
  "slots": {
    "title": "Fix the fee page",
    "owner": "user_hari",
    "requester": "me",
    "requesterName": null,
    "due": "2026-09-26T18:00:00+05:30",
    "cadence": "DAILY",
    "needsApproval": false,
    "taskRef": null,
    "team": null,
    "status": null,
    "priority": null,
    "text": null,
    "start": null,
    "end": null,
    "durationMinutes": null,
    "rating": null,
    "mode": null
  }
}
```

- **(v1.1)** New slots: `start`, `end` (ISO datetimes for to-dos/time logs), `durationMinutes` (estimates/time logs), `rating` (1–5 feedback), `mode` (OFFICE/CAMPUS/REMOTE/FIELD for check-in).
- Validate with Zod. Reject unknown user IDs. Never execute a DELETE **or ISSUE_CERTIFICATE / GIVE_FEEDBACK with rework (v1.1)** from LLM output without the confirm step.
- Log every LLM call (input, output, ms) in `AiLog` for tuning. Keep 30 days.

### 8.6 Test corpus

`tests/cmd/corpus.json` holds **at least 150** example sentences with expected intent + slots, including Tenglish variants ("Hari ki cheppu fee page fix cheyyi by Friday" → ASSIGN). The rule parser must pass ≥ 90% of them before Phase 2 is done.

**(v1.1)** Add **at least 60 more** sentences for the new intents (total ≥ 210), including Tenglish: "repu 3 ki vendor ki call cheyyali todo" → ADD_TODO; "nenu office ki vachanu" → CHECK_IN; "fee page ki 2 gantalu padutundi" → SET_ESTIMATE (2h); "T-1042 ki 4 stars ivvu" → GIVE_FEEDBACK. The parser must still pass ≥ 90% of the full corpus before Phase 7 is done, and the old 150 must not regress.

---

## 9. Module: Inbox & Follow-ups (`F-INBOX`, `F-FU`)

### 9.1 Inbox — work from anyone

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-INBOX-01 | Raise a request | Any logged-in user (incl. Guest) opens "New request" to any user: what, why (optional), due, priority, attachment. |
| F-INBOX-02 | Request lands in Inbox | Shows requester, text, due, priority, age. Bell + push notification. |
| F-INBOX-03 | Accept | Creates **`Task`** (owner=me, requester=them, source=INBOX). Requester notified: "Sri accepted: … expected by <due>". |
| F-INBOX-04 | Delegate | Pick a person (+ optional note). Creates task owned by that person, requester = original requester, **and** appears in my I'm chasing. Both notified. |
| F-INBOX-05 | Schedule | Pick a date; request hides until that date, then returns to Inbox. |
| F-INBOX-06 | Decline | Required short reason (templates: "Not IT scope", "Duplicate", "Need more details", custom). Requester notified politely. |
| F-INBOX-07 | Ask for details | Sends a question back; request shows "Waiting for details". Requester's reply reopens it. |
| F-INBOX-08 | Auto-rules | Admin rules: *if* requester in Senior list *then* priority HIGH; *if* text contains "website/domain/SEO" *then* suggest delegate to Dev team. Rules suggest; they don't auto-act unless "auto-apply" is ticked. |
| F-INBOX-09 | Requester tracking | Requester sees "My requests" with live status: Received → Accepted/Delegated → In progress → Done (or Declined with reason). |
| F-INBOX-10 | Convert chat to request | Long-press/hover any chat message → "Make request" / "Make task". Links back to the message. |

### 9.2 Follow-ups — sent on your behalf

A **`FollowUp`** belongs to one task and one target person.

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-FU-01 | Create follow-up | From task ("Chase"), command bar, or automatically when assigning with a cadence. Fields: target, cadence, first send time, message template, needsApproval, escalateAfter, stopWhen. |
| F-FU-02 | Cadence options | Once, Daily, Every N working days, Weekly, "Before due" (24 h and 2 h before due), "After due" (daily after overdue). |
| F-FU-03 | Sending | At `nextRunAt` (working hours only; if outside, next working-hours slot 09:30), the app sends an **in-app DM from "Assistant on behalf of Sri"** + push notification to the target. Message includes task title, due, and 3 quick-reply buttons. |
| F-FU-04 | Quick replies | Target taps: **"Done ✔"** (marks done), **"On it — new date"** (date picker → updates due), **"Blocked"** (reason → status BLOCKED, notifies Sri), or types a free reply (added as task comment). Any reply pauses the follow-up until the next cadence. |
| F-FU-05 | Approval mode | If `needsApproval` or target is in Senior list: the message is drafted and shown in Sri's Console "Follow-ups" card with **Approve & send / Edit / Skip**. Nothing reaches senior people without a tap. |
| F-FU-06 | Escalation | After `escalateAfter` unanswered sends (default 2): notify the target's team lead; after 1 more: notify Sri with "No response from X on T-1042 after 3 nudges". |
| F-FU-07 | Stop conditions | Stops when task is DONE/CANCELLED, owner changes, Sri clicks Stop, or `maxSends` (default 10) reached. |
| F-FU-08 | Tone templates | Gentle / Normal / Firm; Firm only after first escalation. Editable in Settings. Uses first names and "sir/madam" when set on the user profile. |
| F-FU-09 | Follow-up log | On the task: every send, reply and escalation with timestamps. |
| F-FU-10 | "Follow-ups to me" | Every user sees in My Space who is waiting on them, sorted by oldest. |
| F-FU-11 | No spam | Max 1 follow-up per person per task per day; max 5 follow-ups per person per day across all tasks (bundle extras into one digest message). Quiet hours respected. **(v1.1)** No follow-ups to a person marked Absent or On leave today; they resume the next working day they check in. |

### 9.3 Follow-up message templates (defaults)

- **Gentle:** "Hi {first}, a quick check on **{title}** (due {due}). Any update? — sent for {sender}"
- **Normal:** "Hi {first}, **{title}** is due {due}. Please share the status or a new date. — sent for {sender}"
- **Firm:** "Hi {first}, **{title}** is now {overdueDays} days overdue. Please update today or tell us what's blocking it. — sent for {sender}"

### 9.4 Defaults (Settings)

| Setting | Default |
|---|---|
| Default cadence when "chase" has no frequency | Daily |
| First send | Next working day 09:30 |
| escalateAfter | 2 unanswered sends |
| maxSends | 10 |
| Senior people (approval always) | CEO, COO, VC, Janardhan sir (editable list) |

---

## 10. Module: Console, My Space, Daily updates, To-do, Attendance (`F-CON`, `F-MY`, `F-UPD`, `F-TODO`, `F-ATT`)

### 10.1 Console (Admin home)

Layout (desktop 1280+): header (date + greeting + bell + **attendance chip (v1.1)**) → command bar → 3 columns (I owe / I'm chasing / Shared) → row of 3 cards (Morning brief · Inbox · Follow-ups awaiting approval) → **(v1.1)** row of 2 cards (Give feedback · Who's in today).

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-CON-01 | Three columns | Per Section 7.2. Each card: checkbox, title, who, due, note line (chase status / whose turn), tag. Count of open items in header. Max 8 visible, "Show all" link. |
| F-CON-02 | Chasing note | Shows cadence and last/next nudge ("Daily · next 09:30"), or red "No reply 3 days". |
| F-CON-03 | Morning brief card | Generated 08:00 daily (Section 12.4). Refresh button. |
| F-CON-04 | Today strip | Today's events and due items in time order. |
| F-CON-05 | Leadership strip | Open leadership asks with due dates, always visible at the top of I owe with a "Leadership" tag. |
| F-CON-06 | Week at a glance | Mini KPIs: tasks done this week, on-time %, chases open, requests waiting. Click → Reports. |
| F-CON-07 (v1.1) | Give feedback card | F-FB-01 queue: count + oldest 5 items; "Start feedback mode" button (F-FB-07). |
| F-CON-08 (v1.1) | Who's in today | Live count "In 14 · Late 2 · Remote 3 · Leave 1 · Not yet 4" with a list on click (F-ATT-08). Pending regularisations and leave requests count with Approve buttons. |

### 10.2 My Space (everyone's home)

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-MY-01 | My tasks | I owe list for this user, grouped Today / This week / Later / No date. |
| F-MY-02 | Follow-ups to me | Section 9.2 F-FU-10 with quick replies inline. |
| F-MY-03 | My requests | Requests I raised and their status. |
| F-MY-04 | Daily update box | Section 10.3. Shows "Posted ✔" after posting. |
| F-MY-05 | My calendar | Next 7 days list, plus the mini month calendar (F-CAL-13, v1.1). |
| F-MY-06 | My progress | This week: done count, on-time %, update streak, kudos received, **hours logged, average feedback rating, attendance % this month (v1.1)**. |
| F-MY-07 | My team | Team chips → team page; lead's name and a "Message lead" button. |
| F-MY-08 (v1.1) | Check-in card | Top of My Space (and phone Home): big **Check in** button, then "In since 09:04 · Office" with **Check out** button, then "Worked 8h 12m". Shows "On leave" / "Holiday: Dussehra" on those days (no button). |
| F-MY-09 (v1.1) | Today's schedule | Compact version of the day schedule (F-TODO-03): next 3 time slots and unscheduled to-dos count; "Open to-do" link. |
| F-MY-10 (v1.1) | My feedback | Latest 3 feedback items with stars and "See all" (F-FB-06). Unacknowledged ones show a dot. |
| F-MY-11 (v1.1) | My certificates | List of issued certificates with Download and Copy link (F-CERT-08). Hidden if none. |

### 10.3 Daily updates

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-UPD-01 | Post update | Three fields: **Done**, **Next**, **Blockers** (optional). **Pre-filled** with tasks the user marked done today and tasks due tomorrow — user edits and posts. **(v1.1)** Also offers (tick box, off by default) to include to-dos done today and hours logged per task. Takes < 30 seconds. |
| F-UPD-02 | Where it goes | Saved as **`DailyUpdate`**, posted as a card in each of the user's team chats (one card per day, edited in place if updated). |
| F-UPD-03 | Blockers | Each blocker line can be turned into a task for the lead with one tap. Blockers appear in the lead's and Sri's Morning brief. |
| F-UPD-04 | Reminders | 17:00 push "Post your update"; 18:00 deadline; 18:30 missed → flagged on team card and in lead's evening wrap. Not sent on holidays, leave days, **days marked Absent (v1.1)** or for deactivated users. |
| F-UPD-05 | Leave | User marks leave (dates, optional reason). No update reminders; shows "On leave" on their avatar; follow-ups to them pause and are re-routed to their lead if urgent. **(v1.1)** Leave now has a **type** (Casual, Sick, Earned, Comp-off, Other), **half-day option**, and a **state** (Pending / Approved / Rejected). If "leave approval required" is on, the lead (or Admin for leads) approves; only approved leave counts as On leave in attendance. |
| F-UPD-06 | Lead review | Lead sees a Team Updates page: one row per member per day, ✔/✗, and can react or comment. |
| F-UPD-07 | Streak | Consecutive working days with an update. Shown on profile and My progress. |

### 10.4 To-do list with schedule (`F-TODO`) (v1.1)

A **personal** list for each user. To-dos are private: nobody else (including Admin) sees another person's to-dos. They are lighter than tasks (no requester, follow-ups or feedback). Anything that someone else must see or do should be a Task.

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-TODO-01 | Quick add | From the To-do page input, Quick add (+), My Space, or command bar ("todo call vendor tomorrow 3pm"). Only title required. Enter adds and keeps focus for the next one. |
| F-TODO-02 | Schedule fields | **Date** (optional), **start time** and **end time or duration** (optional; "3pm for 30m"), **reminder** (none / at start / 10 min before / 30 min before / custom time), **repeat** (none / daily / weekdays / weekly on day X / monthly on day N), **priority**, **list** (Personal / Work / Learning / custom, each with a color), notes. |
| F-TODO-03 | Day schedule view | Default view. Left: time grid for the selected day (07:00–21:00, 30-min rows, current-time line). Right: "Unscheduled" list for that day. Scheduled to-dos appear as blocks in their slot. **Meetings (events) and tasks due that day also appear, read-only, in a different color**, so the user plans around them. Date switcher with ← Today → and a date picker. |
| F-TODO-04 | Other views | **Today** (schedule + unscheduled), **Upcoming** (next 14 days grouped by date, using the full date labels "Tue, 30 Sep 2026"), **Someday** (no date), **Completed** (last 30 days, with Restore). Counts on each tab. |
| F-TODO-05 | Drag & drop | Drag an unscheduled to-do onto the grid to schedule it; drag a block to move it; drag its bottom edge to change duration (15-min snap); drag between days in Upcoming. On phone: long-press → "Schedule…" sheet with time picker (drag optional). |
| F-TODO-06 | Conflicts | If a to-do overlaps a meeting the user accepted, the block shows an amber "Clashes with: COO meeting" note. Saving is still allowed. |
| F-TODO-07 | Tick off | Checkbox marks done (strike-through, moves to Completed after 3 s, Undo 10 s). Repeating to-dos create the next instance on tick or at day end, whichever is first. |
| F-TODO-08 | Carry over | At 00:05, undone dated to-dos from past days move to today's Unscheduled list with a badge "Carried over from Fri, 26 Sep (2×)". A to-do carried over 5 times shows "Still needed?" with Keep / Someday / Delete. |
| F-TODO-09 | Reminders | Push at `remindAt` ("⏰ 15:00 Call vendor") with **Done** and **Snooze 15 min** buttons. Respects quiet hours unless the user set the reminder time inside quiet hours on purpose. |
| F-TODO-10 | Link with tasks | "Make task" on a to-do → opens task create pre-filled (owner = me or pick someone); to-do is marked done and linked. "Add to my to-do" on a task → to-do linked to the task; completing the task ticks the to-do, and ticking the to-do asks "Mark T-1042 done too?". |
| F-TODO-11 | Privacy & stats | To-dos are never shown in reports, JPA, team pages or search results of other users. The owner sees a small stat on My progress: "To-dos done this week: 18 / 22". |

### 10.5 Attendance protocol (`F-ATT`) (v1.1)

One **`AttendanceRecord`** per user per working day. Uses the org working days, holidays (F-CAL-15) and approved leave.

**Status rules (applied in this order, in `lib/services/attendance.ts`, with unit tests):**

1. Holiday on that date (org or the user's campus) → **HOLIDAY**.
2. Not a working day → **WEEK_OFF** (if the user checks in anyway, status is PRESENT and the day is marked "Extra day").
3. Approved full-day leave → **ON_LEAVE**. Approved half-day leave + worked ≥ half-day hours → **HALF_DAY** (not counted as late).
4. No check-in by the absent cut-off (11:00) → **ABSENT** (provisional; becomes final at day end if still no check-in; a later check-in changes it to LATE).
5. Check-in at or before office start + grace (09:15) → **PRESENT**; after that → **LATE** (store `lateMinutes`).
6. At check-out: worked minutes < half-day hours (4 h) → **HALF_DAY** (overrides PRESENT/LATE).

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-ATT-01 | Check in / check out | One tap from My Space, phone Home, header chip or command bar ("check in"). Before checking in the user picks a **mode**: Office, Campus visit (pick campus), Remote/WFH, Field visit. Stores server time (never trust device time). Only one check-in per day; after check-out the user can "Resume" (second session; worked time = sum of sessions). Toast with time and status: "Checked in 09:04 · Present". |
| F-ATT-02 | Verification (no external services) | Depends on Settings. **Office IP:** request IP must be in the office IP ranges of the user's campus. **Location:** browser Geolocation API asked once at check-in, compared with the campus lat/lng and radius using the haversine formula in code (no map services). If verification fails or the user denies location, check-in is still saved but marked **"Unverified"** and appears for lead approval. **Remote** mode needs the user's "Remote attendance allowed" flag, otherwise it is saved as Unverified. |
| F-ATT-03 | Status calculation | Rules above. Status and worked time recalculate on every check-in/check-out/regularisation/leave change. |
| F-ATT-04 | Missed check-out | At 23:59, open records are auto-closed at the office end time (18:00), flagged **"Auto-closed"**, and the user gets a notification next morning: "You didn't check out yesterday — confirm or correct". |
| F-ATT-05 | Regularisation | User requests a correction for any past date in the last 30 days: corrected check-in/out, mode, and **reason (required)**. Limit per month from Settings (default 3); Admin can exceed. Lead approves for team members, Admin approves for leads. Approved → record updated with `source=REGULARISED`; rejected → reason shown. Everything audit-logged. |
| F-ATT-06 | Leave integration | Uses F-UPD-05 leave (types, half-day, approval). Leave balance is **not** tracked in v1.1 (Later). Leave can be applied from the attendance calendar by selecting dates. |
| F-ATT-07 | My attendance | Month calendar (uses F-CAL-08 grid) with each date colored by status and showing in/out times; summary: Present, Late, Half day, Absent, Leave, Holidays, **Attendance %**, average in-time, average out-time, total hours worked. Month/year switcher. |
| F-ATT-08 | Today board (Admin/Lead) | Live list for today: Checked in (time, mode, verified ✔ / unverified ⚠), Late, Remote, On leave, Not yet in. Filter by team and campus. "Remind" button sends one push to the not-yet-in people (max once per day). |
| F-ATT-09 | Monthly register | Table: rows = people, columns = every date of the month (1…28/29/30/31), cells = code **P / L / H / A / LV / HO / WO** with colors; totals per person at the right. Filters: team, campus, role. Click a cell → record detail with edit (Admin, reason required). |
| F-ATT-10 | Export | Monthly register as **Excel** (one sheet per team, legend on top), **PDF** (A4 landscape) and **CSV**. File name `IT_Attendance_{Scope}_{Mon-YYYY}.xlsx`. |
| F-ATT-11 | Reminders | 09:10 push "You haven't checked in" (only to users with no record and not on leave/holiday). 18:15 push "Don't forget to check out" to users still checked in. Not sent on non-working days. |
| F-ATT-12 | Attendance % formula | **(Present + Late + 0.5 × Half day) ÷ (working days in period − holidays − approved leave days)** × 100, one decimal. Extra days are not counted. Unit tests required. |
| F-ATT-13 | Privacy | Location is taken only at the moment of check-in/check-out, never tracked in the background, and stored as lat/lng rounded to 4 decimals. Location check can be turned off in Settings. Users see only their own records; leads see their team; Admin sees all. Deleted/deactivated users' records are kept. |
| F-ATT-14 | Interns | Intern batch page shows attendance % per intern. Interns below the minimum % (Settings, default 80%) are marked "Not eligible" for a completion certificate (F-CERT-03) unless Admin overrides with a reason. |

---

## 11. Module: Chat, Links, Kudos (`F-CHAT`)

The goal is that the team **prefers** this chat to WhatsApp for work. It must feel as fast and simple.

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-CHAT-01 | Channels | Team channels (auto), custom groups (public in org / private), DMs, group DMs (≤ 8). |
| F-CHAT-02 | Real-time | Messages appear in < 1 s for online users (Socket.IO). Typing indicator. Read receipts in DMs ("Seen"). Online/away dot. |
| F-CHAT-03 | Messages | Text with markdown-lite (bold, italic, code, lists), emoji reactions, reply-in-thread, quote-reply, edit (15 min), delete (own), pin (lead/admin). |
| F-CHAT-04 | Attachments | Images, PDFs, docs up to 25 MB; images show inline with lightbox; paste screenshot from clipboard. |
| F-CHAT-05 | Voice notes | Hold-to-record on phone (Web Audio → Opus/webm), up to 3 min, plays inline with speed 1×/1.5×/2×. (Speech-to-text later.) |
| F-CHAT-06 | Mentions | @name, @team, @here. Mentioned users get push even if the channel is muted. |
| F-CHAT-07 | Message → task/request | Action menu on any message: Make task, Make request, **Make to-do (v1.1)**, Add to doc. Keeps a link both ways. |
| F-CHAT-08 | Task chips | Typing T-1042 renders a live chip (title, owner, status). |
| F-CHAT-09 | Links board | Every URL posted is saved to the team's **Links** tab with title, who shared, when, tags. Search and pin. |
| F-CHAT-10 | Search | Full-text search across messages the user can see (Postgres `tsvector`). Filters: channel, person, has:file, has:link, date. |
| F-CHAT-11 | Mute & quiet hours | Mute a channel; global quiet hours (default 21:00–08:00) hold pushes except @mentions from Admin marked urgent. |
| F-CHAT-12 | Announcements | Admin/lead can post "Announcement" (highlighted, pinned, requires "Got it" acknowledgement; shows who hasn't acknowledged). |
| F-CHAT-13 | Polls | Quick poll in any channel (single/multi choice, anonymous option). |
| F-CHAT-14 | Kudos | "/kudos @Hari for fixing the admission form" → special card in channel, counted in My progress and JPA "recognition" line. |
| F-CHAT-15 | Daily update cards | F-UPD-02 cards render in team channels with ✔ reactions. |
| F-CHAT-16 | Guest DMs | Guests can only DM the person they requested from; no channel access. |
| F-CHAT-17 | Retention | Messages kept forever by default; Admin can set retention per channel. Deleted messages show "Message deleted". |
| F-CHAT-18 (v1.1) | Status in chat | Avatar shows attendance state: green dot = checked in, grey = not in, "Leave" badge. Feedback and attendance data are **never** posted in chat. When a certificate is issued, Admin can optionally post a congratulations card (name + certificate title only, no scores). |

---

## 12. Module: Calendar, Docs, Dev Hub, Notifications

### 12.1 Calendar (`F-CAL`)

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-CAL-01 | Views | Day, Week (default), Month, Agenda, **Year (v1.1)**. Filter: me / team / all (admin). |
| F-CAL-02 | Event types | Meeting, Deadline (from task due), Go-live, Renewal (from Dev Hub sites), Leave, Holiday. Color-coded. **(v1.1)** Plus layers for To-dos (own only) and Attendance (own only, or team for leads). |
| F-CAL-03 | Create event | Title, start/end, all-day, attendees (users), location/room, notes, linked task. Attendees get an in-app invite with Accept/Decline. |
| F-CAL-04 | Tasks on calendar | Tasks with due dates appear on the due day; dragging changes the due date. **(v1.1)** Tasks with both start and due show as a bar across the dates (F-DUR-02). |
| F-CAL-05 | Reminders | 15 min before meetings (configurable). |
| F-CAL-06 | Meeting notes | "Start notes" on an event creates a Doc from the Meeting template with attendees and open tasks between them pre-filled. Action items in notes → tasks with one click. |
| F-CAL-07 | Export | Download .ics for any event or a personal feed file (no external sync in v1). |

**Full calendar with all dates (v1.1).** Sri's requirement: the calendar must show **every date** clearly, not only days that have items.

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-CAL-08 | Full month grid | Always a 6-row × 7-column grid showing **all dates of the month (1 to 28/29/30/31)** plus the trailing/leading dates of the previous/next month in a lighter color (clickable). Week starts Monday (Settings). Week numbers on the left (ISO, can be turned off). Leap years handled (29 Feb 2028 shows). Month title "September 2026". Works at 390 px (dates stay tappable ≥ 44 px; items become dots). |
| F-CAL-09 | Year view | 12 mini months on one screen (4×3 desktop, 2×6 phone) showing **every date of the year**. Holidays shaded, today ringed, dates with items show a dot (darker = more items). Click a date → Day view; click a month name → Month view. |
| F-CAL-10 | Date cell content | Each date cell shows: date number (bold if today, ringed), holiday name if any, Sundays/non-working days shaded, then up to 3 items (events, tasks due, to-dos) and "+N more". Small badges: my attendance status letter (P/L/A/LV) and number of tasks due. |
| F-CAL-11 | Day panel | Clicking any date (in any view) opens a side panel (bottom sheet on phone) with **everything for that date**: full date "Tuesday, 30 September 2026", holiday, events, tasks due, my to-do schedule, my attendance record, my daily update, who is on leave (team view). Quick add buttons (Event / Task / To-do / Leave) pre-filled with that date. |
| F-CAL-12 | Navigation | Prev / Next / **Today** buttons; **month and year dropdowns** (any year from 2000 to 2100); "Go to date" box accepting "15 Aug 2027", "15/8/2027" or "next Friday"; keyboard: ← → (day), ↑ ↓ (week), PgUp/PgDn (month), T (today). URL keeps the date (`/calendar/month/2026-09`) so links and back-button work. |
| F-CAL-13 | Mini calendar | A small full-month calendar in the Calendar sidebar, on My Space (F-MY-05) and on the To-do page. Dates with items show dots; clicking a date jumps there. |
| F-CAL-14 | Date picker everywhere | One shared date picker component (`components/ui/date-picker.tsx`) used by every date field in the app: full month grid, month/year dropdowns, today button, holidays marked, working-day hint, typed input in DD/MM/YYYY. Display format everywhere **DD MMM YYYY** (e.g. 30 Sep 2026). |
| F-CAL-15 | Holiday calendar | Admin manages holidays in Calendar → Holidays: add/edit, **import CSV** (date, name, type), types National / Regional / Optional, and scope (all campuses or selected campus). Holidays show on all calendars and drive working-day rules, attendance, reminders and follow-ups. |
| F-CAL-16 | Layers | Toggle chips: Events, Tasks, To-dos, Attendance, Leave, Holidays, Renewals. Choice remembered per user. |

### 12.2 Docs (`F-DOC`)

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-DOC-01 | Editor | Tiptap: headings, lists, checklists, tables, code, images, links, callouts, T-xxxx task chips, @mentions. Autosave every 2 s. |
| F-DOC-02 | Structure | Spaces per team and per project, plus "Org" space. Nested pages (3 levels). |
| F-DOC-03 | Templates | SOP, Project brief, Meeting notes, Handover, Release notes, Onboarding guide, Incident report, Weekly report narrative. Admin can add templates. |
| F-DOC-04 | Versions | Version on every save burst; view history and restore. |
| F-DOC-05 | Permissions | Inherit from space; per-doc override (view/edit by team or person). |
| F-DOC-06 | Search | Full-text across docs the user can see. |
| F-DOC-07 | AI helpers (local) | "Summarise this doc", "Draft SOP from these steps", "Turn action items into tasks" — optional, runs on Ollama. |
| F-DOC-08 | Export | Download page as PDF or Word. |

### 12.3 Dev Hub (`F-DEV`)

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-DEV-01 | Projects | Name, description, repo URL, stack, environments (dev/staging/prod URLs), owner, team, status. |
| F-DEV-02 | Build map | Table: developer · project · feature · stack · status · started · expected. One row per active feature (a task with `projectId` and tag `feature`). **(v1.1)** Adds columns: estimate, logged time. |
| F-DEV-03 | Sprints | 1–2 week sprints per project; board columns Backlog / In progress / Code review / Testing / Deployed. Sprint burndown (tasks remaining per day). **(v1.1)** Optional burndown by estimated hours. |
| F-DEV-04 | Bugs | Title, steps to reproduce, expected vs actual, screenshot, site/project, severity (Low/Medium/High/Critical), owner, status. Bug → task automatically. |
| F-DEV-05 | Code review | Developer pastes PR/commit link on a task and sets status IN_REVIEW → reviewer notified; waiting > 2 working days → follow-up to reviewer. |
| F-DEV-06 | Deployments log | Project, environment, version/notes, who, when, rollback note. "Release notes" button drafts notes from tasks done since last deploy. |
| F-DEV-07 | Sites registry | Domain, hosting, DNS provider, SSL expiry, domain expiry, owner, notes. Seed: smru.edu.in, smru.in, St. Mary's Women's, St. Mary's Group Chebrol, St. Mary's Group. |
| F-DEV-08 | Uptime checks | Every 5 min: HTTP GET each site (timeout 10 s). 2 failures in a row → "Down" alert to owner + Sri; recovery alert when back. Store checks 90 days. Uptime % per week. |
| F-DEV-09 | SSL/domain expiry | Daily check of the certificate expiry (TLS handshake) + manual domain expiry date. Alerts at 30, 7, 1 days; creates a renewal task at 30 days. |
| F-DEV-10 | Credentials pointer | Record **where** a credential lives (e.g. "Bitwarden → Hosting/SMRU") and who has access. **Never store secrets.** |
| F-DEV-11 | Tech notes | Each project links to its Docs space (setup guide, architecture, API notes). |

### 12.4 Notifications, Morning brief, Evening wrap (`F-NOTIF`)

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-NOTIF-01 | In-app bell | Unread count; list with filters (All / Mentions / Tasks / Follow-ups / **Attendance / Feedback (v1.1)** / System); mark all read. |
| F-NOTIF-02 | Web Push | Self-generated VAPID keys (no outside account). Works on Android Chrome and iPhone (iOS 16.4+, app added to Home Screen). Tapping opens the exact item. |
| F-NOTIF-03 | Preferences | Per type: push / in-app only / off. Quiet hours. Digest mode (bundle non-urgent every 2 h). |
| F-NOTIF-04 | Morning brief (08:00) | For Admin and Leads: meetings today; I owe due today/overdue; leadership asks; chases going out today; replies received overnight; stuck items (stale ≥ 3 days); blockers from yesterday's updates; sites down/expiring; new requests; **(v1.1)** yesterday's attendance summary (absent, late, auto-closed), pending regularisations/leave, feedback waiting > 3 days, and my to-dos scheduled today. Text from template; optional local-AI polish (never invents numbers — numbers are filled by code). |
| F-NOTIF-05 | Evening wrap (18:30) | Done today, slipped today, missed updates, tomorrow's top 3, **(v1.1)** hours logged today by team, people still checked in. |
| F-NOTIF-06 | Weekly digest (Fri 17:00) | Link to the auto-prepared weekly report (Section 13.5). |

**Notification catalogue**

| Event | Who gets it | Default channel |
|---|---|---|
| Task assigned to you | Owner | Push |
| Task due in 24 h / 2 h | Owner | Push |
| Task overdue | Owner (daily 09:30), requester (once) | Push |
| Task done | Requester, partner | In-app (push if leadership) |
| Your turn (shared) | New turn holder | Push |
| Follow-up received | Target | Push |
| Follow-up reply | Sender (Sri) | In-app; push if "Blocked" |
| Follow-up needs approval | Admin | Push |
| Escalation | Lead, then Admin | Push |
| New request / request status change | Receiver / requester | Push |
| @mention, DM | Mentioned person | Push |
| Announcement | Channel members | Push |
| Daily update reminder / missed | User / lead | Push / in-app |
| Site down / recovered, expiry alerts | Site owner + Admin | Push |
| Report ready | Creator | In-app |
| **(v1.1)** To-do reminder | Owner | Push |
| **(v1.1)** Check-in reminder (09:10) / check-out reminder (18:15) | User | Push |
| **(v1.1)** Auto-closed attendance | User | In-app (next morning) |
| **(v1.1)** Unverified check-in / regularisation / leave request | Lead (Admin for leads) | Push |
| **(v1.1)** Regularisation / leave approved or rejected | User | Push |
| **(v1.1)** Timer auto-stopped | User | In-app |
| **(v1.1)** Feedback received / rework requested | Task owner | Push |
| **(v1.1)** Feedback acknowledged / replied | Reviewer | In-app |
| **(v1.1)** Certificate issued / revoked | Recipient | Push |

---

## 13. Module: Reports — KPI, JPA, JPR, My progress, Certificates (`F-RPT`, `F-CERT`)

All numbers are **computed from data**, never typed in (except the lead's JPA review score and comments, **and Admin feedback ratings (v1.1)**). Every formula has a unit test.

### 13.1 Weekly KPIs (per org, team or person; any period)

| KPI | Formula | Target |
|---|---|---|
| Tasks completed | count(tasks with doneAt in period, not CANCELLED) | trend ↑ |
| On-time delivery % | done in period with dueAt ≥ doneAt ÷ done in period that had a dueAt | ≥ 85% |
| Overdue open | open tasks with dueAt < period end | ↓ |
| Requests closed | requests Accepted/Delegated→task DONE in period ÷ requests received in period | ≥ 90% |
| Avg first response (h) | mean(working hours from request created → first action: accept/delegate/decline/ask) | ≤ 4 h |
| Daily-update compliance % | updates posted by 18:00 ÷ expected updates (working days × active non-leave users) | ≥ 90% |
| Follow-ups answered % | follow-ups with a reply before next send ÷ follow-ups sent | ≥ 80% |
| Avg chase-to-close (days) | mean(days from first follow-up → task DONE) | ↓ |
| Leadership asks closed | leadership tasks done ÷ leadership tasks due in period | 100% |
| Blocked time (days) | sum of days tasks spent in BLOCKED | ↓ |
| Website uptime % | successful checks ÷ total checks (all sites) | ≥ 99.5% |
| Bugs closed / open | counts; open split by severity | – |
| Deployments | count in period | – |
| **Attendance % (v1.1)** | F-ATT-12 formula, averaged over active users in scope | ≥ 95% |
| **Late arrivals (v1.1)** | count of LATE records in period (and avg late minutes) | ↓ |
| **Absent days (v1.1)** | count of ABSENT records in period | ↓ |
| **Hours logged (v1.1)** | sum(TimeLog minutes) ÷ 60 | – |
| **Avg work time per task (v1.1)** | mean(working hours `workStartedAt` → `doneAt`) for tasks done in period | ↓ |
| **Estimate accuracy % (v1.1)** | tasks done with estimate and logged time where actual ≤ 120% of estimate ÷ such tasks | ≥ 75% |
| **Avg feedback rating (v1.1)** | mean(TaskFeedback.rating) given in period | ≥ 4.0 |
| **Feedback coverage % (v1.1)** | individual tasks done in period with feedback ÷ individual tasks done in period | ≥ 90% |
| **Rework rate % (v1.1)** | feedback with outcome REWORK ÷ feedback given | ≤ 10% |
| **Certificates issued (v1.1)** | count issued in period (by type) | – |

Each KPI tile shows: value, change vs previous period (↑/↓ and amount), and a sparkline of the last 8 periods. Personal to-do numbers are **never** included in KPIs (F-TODO-11).

### 13.2 JPA — Job Performance Appraisal (per person)

**(v1.1) Weights updated** to include attendance and Admin feedback. Weights stay editable in Settings and must add up to 100%.

| Component | Source | Weight v1.0 | **Weight v1.1** |
|---|---|---|---|
| Delivery | Tasks done in period vs team median (capped 0–5 scale) | 25% | **20%** |
| Timeliness | On-time % → 5-point scale (≥95% = 5, ≥85 = 4, ≥70 = 3, ≥50 = 2, else 1) | 25% | **20%** |
| Reliability | Daily-update compliance % → same scale | 15% | **10%** |
| **Attendance (v1.1)** | Attendance % (F-ATT-12) → same scale; late arrivals > 4 in the period lower it by 1 (min 1) | – | **10%** |
| Responsiveness | Follow-ups answered % and avg reply time → scale | 10% | **10%** |
| Quality | **(v1.1)** Average Admin/Lead feedback rating (F-FB) as the main input (already 1–5), minus 0.5 per 10% rework rate above 10%; if fewer than 3 rated tasks, falls back to v1.0 rule (reopened tasks and bugs reopened) | 10% | **15%** |
| Lead review | Lead's score 1–5 + comments (entered in app) | 15% | **15%** |

- **Overall score** = weighted average (1–5, one decimal). **Rating:** ≥ 4.3 Exceeds · ≥ 3.5 Meets · ≥ 2.5 Developing · else Needs support.
- **Recognition line:** kudos received, highlights (tasks tagged `highlight`), **top feedback chips (v1.1)**.
- **(v1.1) Work summary line:** hours logged, avg work time per task, estimate accuracy %.
- **Auto-drafted strengths & improvement areas:** generated by rules (e.g. timeliness ≥ 4 → "Consistently on time"; **feedback avg ≥ 4.5 → "Work quality consistently rated highly"; attendance ≥ 98% → "Excellent attendance" (v1.1)**), editable by lead.
- **Workflow:** Draft (auto) → Lead reviews and adds score/comments → Shared with person (they can add a response) → Final (locked, PDF saved).
- Interns: JPA due automatically 7 days before batch end; **(v1.1)** the final JPA rating and attendance % are used for the completion certificate (§13.6).
- Privacy: a person sees only their own JPA; leads see their team; Admin sees all.

### 13.3 JPR — Job Progress Report (per team)

| Column | Source |
|---|---|
| Team, lead | Team |
| Done / planned | tasks done in period ÷ tasks due in period |
| Progress % | done ÷ planned |
| **Attendance % (v1.1)** | team average (F-ATT-12) |
| **Hours logged (v1.1)** | team total |
| **Avg feedback (v1.1)** | team average rating |
| Highlights | Top 3: tasks tagged `highlight`, go-lives, leadership asks closed (lead can edit) |
| Risks | Blocked tasks, overdue > 3 days, stale tasks, missed updates, **attendance below 90%, rework rate above 10% (v1.1)** (auto) + lead notes |
| Next period plan | Tasks due next period (top 5 by priority) |
| Health | Good (no flags) · Watch (1 flag type) · Needs attention (2+) |

Implementation teams also show the stage tracker (F-ORG-05) per campus.

### 13.4 My progress (for every user; Sri's is the headline)

- Tasks completed per week (bar chart, last 12 weeks), on-time % line.
- Leadership asks: received vs closed this month.
- Areas: progress % per project/area (Websites & SEO, UOS, Voucher software, Helpdesk, Intern programme — driven by projects/tags).
- Time to first response on requests.
- Personal streak and kudos.
- **(v1.1)** Hours logged per week, estimate accuracy, average feedback rating trend, attendance % per month, certificates received.

### 13.5 Downloads

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-RPT-01 | One-click presets | **Weekly report · VC · PDF**, **Monthly report · CEO · PDF**, **Weekly pack · COO · PDF**, **Team KPI + JPR · Excel**, **JPA · person · Word/PDF**, **My progress · PDF**, **(v1.1) Attendance register · month · Excel**, **(v1.1) Timesheet · week · Excel**. One click → file downloads in < 10 s. |
| F-RPT-02 | Custom download | Choose: period (this week / last week / this month / last month / this quarter / custom dates), audience (VC / CEO / COO / Internal), scope (all / campus / team / person), sections (tick list below), written summary on/off, format (PDF / Excel / Word / CSV). Live file-name preview. "Save as preset". |
| F-RPT-03 | Sections available | Executive summary · KPIs · Leadership requests · Projects & areas · JPR per team · JPA per person · Implementation tracker · Dev Hub (builds, bugs, deployments) · Websites & renewals · Risks & blockers · Next period plan · **Attendance summary & register (v1.1)** · **Time & effort (v1.1)** · **Feedback summary (v1.1, Internal audience only by default)** · **Certificates issued (v1.1)** · Appendix: task list. |
| F-RPT-04 | Executive summary | 3–5 sentences built from a template with real numbers ("This week the IT team closed 38 tasks, 86% on time, with 96% attendance…"). Optional local-AI rewording; numbers are locked. Editable before download. |
| F-RPT-05 | Branding | Header: report title, period, "Prepared by Sri, IT Manager", date. Footer: page numbers. Clean A4 layout. Logo optional (Settings upload). |
| F-RPT-06 | Formats | PDF via Playwright (print HTML template), Excel via ExcelJS (one sheet per section, formatted tables, frozen header), Word via `docx`, CSV raw. |
| F-RPT-07 | Scheduled reports | Friday 17:00 prepares the weekly VC/COO pack and notifies Sri: "Weekly pack ready — review & download". (No auto-sending to leadership.) **(v1.1)** 1st of each month 07:00 prepares last month's attendance register. |
| F-RPT-08 | History | Every generated file saved as **`ReportRun`** with its settings; re-download or regenerate. |
| F-RPT-09 | Share inside app | Share a report with a Guest user (e.g. VC office account) → they see it in their Reports list. Individual feedback comments are never included in reports shared with Guests. |
| F-RPT-10 | Command | "Download weekly report for VC", "export monthly KPI for CEO as Excel", "JPA for Hari this quarter", **"attendance register September", "timesheet this week" (v1.1)**. |

**File naming:** `IT_{Type}_{Audience}_{Scope}_{PeriodTag}.{ext}` → `IT_Weekly_VC_All_W39-2026.pdf`, `IT_JPA_Hari_Q3-2026.docx`, `IT_Attendance_All_Sep-2026.xlsx`.

### 13.6 Certificates — dynamic and linked to a URL (`F-CERT`) (v1.1)

Certificates are **generated dynamically** from a template and the person's real data in the app (name, team, dates, grade, attendance), each with a unique number and a **verification URL**. The certificate also carries the **college website URL**.

**How the URL link works**

- Every certificate has a secret short `code` (10 characters, e.g. `K7Q2M9XA4D`) and a `verifyUrl = {VERIFY_BASE_URL}/{code}`.
- The PDF shows the verify URL as text **and** as a **QR code** (generated in the app with the `qrcode` npm package — no external QR service). Scanning it opens the public verification page.
- The PDF also shows the **college website** (Settings → College website URL, e.g. `https://smru.edu.in`) as a clickable link in the footer, next to the college logo.
- `VERIFY_BASE_URL` options (decision D8): **A.** the app's own public route, e.g. `https://cc.example.in/verify`; **B.** a sub-domain of the college website, e.g. `https://certificates.smru.edu.in/verify`, pointed by the college web team to this app's server (recommended — the URL looks official); **C.** a page on the college website that redirects `/{code}` to the app. The app works with any of these; only the setting changes.

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-CERT-01 | Templates | Admin creates templates: name, type (**Internship completion, Appreciation, Participation, Experience, Custom**), orientation (A4 landscape/portrait), background image upload, college logo, up to 3 signatories (name, designation, signature image), and **text blocks** positioned on the page (drag on a preview canvas; font, size, color, alignment from the design tokens + 2 self-hosted certificate fonts). Live preview with sample data. Duplicate and archive templates. |
| F-CERT-02 | Placeholders | Text blocks use: `{name}`, `{title}` (job title), `{role}`, `{team}`, `{campus}`, `{project}`, `{startDate}`, `{endDate}`, `{durationWeeks}`, `{grade}` (JPA rating), `{attendancePercent}`, `{hoursLogged}`, `{issueDate}`, `{certNumber}`, `{collegeName}`, `{collegeWebsite}`, `{verifyUrl}`, `{customText}`. Unknown placeholders are shown in red in the preview and block issuing. |
| F-CERT-03 | Issue | Admin picks template + person (or a whole team / intern batch for **bulk issue**). Values are filled automatically from the user, team, final JPA and attendance; Admin can edit any value before issuing. **Eligibility check** for Internship completion: batch ended, final JPA exists, attendance ≥ minimum %. Not eligible → shown with the reason; Admin may override with a written reason (audit-logged). Leads can **propose** certificates for their team; Admin approves. Confirm step before issuing. |
| F-CERT-04 | Number & code | Number format from Settings, default `{PREFIX}-{TYPE}-{YYYY}-{seq4}` → `SMRU-IT-INT-2026-0042` (sequence per year, never reused). Code: 10 random characters from an unambiguous alphabet (no 0/O/1/I), generated with a crypto-secure random function, unique. |
| F-CERT-05 | PDF generation | On issue, the app renders the template with the frozen values to **PDF (A4, print quality, fonts embedded) via Playwright** and a **PNG** preview; saved in `/data/certificates`. Bulk issue of 50 certificates finishes in under 2 minutes (background job with progress bar). |
| F-CERT-06 | Public verification page | `/verify/{code}` works **without login**. Shows: college logo and name, "✔ Valid certificate" (or "✖ This certificate has been revoked" with date), recipient name, certificate title/type, certificate number, period (from–to), issue date, issued by (name & designation), and a **"Visit college website"** button linking to the college website URL. Shows **nothing else** (no email, phone, scores, feedback, attendance details). Wrong code → "Certificate not found" (same response time, no hints). `/verify` also has a search box for the certificate number + recipient name. Pages send `noindex`. Rate limit: 30 requests/min per IP. Each view increments a counter (no visitor data stored except a daily count). |
| F-CERT-07 | Download & share | Recipient and Admin can download PDF/PNG and **Copy verification link**. Link also in the "Certificate issued" notification. |
| F-CERT-08 | My certificates | Each user sees their certificates on their profile and My Space (F-MY-11). |
| F-CERT-09 | Revoke & reissue | Admin revokes with a required reason → verify page shows Revoked immediately. **Reissue** (e.g. name spelling fix) creates a new number and code; the old certificate shows "Replaced by SMRU-IT-INT-2026-0051" on its verify page. |
| F-CERT-10 | Register | Admin list of all certificates: filters (type, team, status, year), search, bulk download ZIP, export CSV (number, name, type, dates, status, verify URL). |
| F-CERT-11 | Dynamic but frozen | Values are frozen at issue time, so later changes to a user's profile or a template never change an issued certificate. Admin can "Regenerate PDF" (same number, same code) only to fix layout; this is audit-logged. |

---

## 14. Why the team will choose this over WhatsApp (adoption design)

The team will only switch if the app is **easier, faster and better for them**, not just for Sri. These are product requirements, not marketing.

### 14.1 What each person gets

| Person | What's better than WhatsApp |
|---|---|
| Team member / intern | One list of *exactly* what's expected and by when; no scrolling through groups to find instructions. Quick-reply buttons ("Done", "New date", "Blocked") instead of typing explanations. Work stays off their personal WhatsApp and personal number; quiet hours are respected. **(v1.1)** A private to-do list and day planner; attendance in one tap; clear feedback on their work. |
| Lead (Hari) | Sees who posted updates without asking; blockers arrive as a list; follow-ups are sent by the app so he stops being the "reminder person". **(v1.1)** Sees who is in today and the monthly register without a paper register. |
| Developer | Build map shows their work to leadership; review requests are chased automatically; bug reports come with steps and screenshots. **(v1.1)** Time logged shows real effort, not just task counts. |
| Intern | Credit is visible: kudos, streak, JPA built from real work — useful for their certificate and CV. Onboarding guide and docs in one place. **(v1.1)** A certificate with a QR code that any employer can verify on a college-linked URL. |
| Sri | Everything in one place; weekly reports in one click. **(v1.1)** Attendance, effort and quality (feedback) in the same reports. |

### 14.2 Must-have "feels like WhatsApp" features (all in v1)

- Installable app icon on phone (PWA), opens straight into chat/My Space, **stays signed in** for 30 days.
- Push notifications that arrive like WhatsApp and open the exact message.
- Send a message in **≤ 2 taps** from the home screen; voice notes; photo from camera; reactions; reply; forward to another channel.
- Works on slow networks: messages queue offline and send when back (service worker + IndexedDB outbox). **(v1.1)** Check-in, to-do ticks and timer start/stop also queue offline; the server records the time the request was queued (device time shown as "sent offline at", verified against server receipt; more than 30 min difference → marked Unverified).
- Fast: home screen interactive in < 2 s on a mid-range Android over 4G.
- Telugu/Tenglish friendly: any text accepted; command parser handles common Tenglish verbs (Section 8.6).

### 14.3 Things that make people *want* to open it

- **Streaks & kudos** (F-UPD-07, F-CHAT-14) shown on profile.
- **"My week" card** every Friday: what you finished, kudos, on-time %, **hours logged, feedback average (v1.1)**.
- **Less nagging:** one follow-up message with buttons replaces multiple WhatsApp pings and calls.
- **Clear credit:** "Done by Hari" appears in reports that go to the VC.
- **Fair rules:** everyone sees the same due dates, and follow-ups stop the moment work is done. **(v1.1)** Attendance rules are the same for everyone and visible in Settings → Attendance rules (read-only for non-admins).

### 14.4 Rollout rules (Section 23 has the plan)

- From go-live day, **work instructions are given only in the app**; WhatsApp groups are renamed "(Personal/Emergency only)".
- Sri and leads reply to work WhatsApp messages with "Please post in the app" + the link.
- First two weeks: leads praise good updates publicly in the app (kudos).
- **(v1.1)** Attendance goes live on the 1st of a month (not mid-month) after a one-week trial where records are kept but not reported.

---

## 15. Data model (Prisma schema — authoritative)

Only **Track A** edits `prisma/schema.prisma`. All IDs are `cuid()`. All tables have `createdAt`, `updatedAt`; soft-deletable tables have `deletedAt`. Times are stored in UTC and shown in the org timezone.

**(v1.1) Migration rules:** all v1.1 changes are **additive** (new enums, new models, new optional fields or fields with defaults). No v1.0 column is removed or renamed. Lines marked `// v1.1` are new. Create migrations per feature: `npx prisma migrate dev --name v11_task_duration`, `v11_todo`, `v11_attendance`, `v11_feedback`, `v11_certificates`, `v11_calendar_holidays`. Back up the database before running migrations on the real server.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum RoleKey {
  ADMIN
  LEAD
  DEVELOPER
  MEMBER
  INTERN
  GUEST
}
enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  BLOCKED
  DONE
  CANCELLED
}
enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
enum TaskMode {
  SOLO
  SHARED
}
enum TaskSource {
  MANUAL
  COMMAND
  INBOX
  CHAT
  LEADERSHIP
  DEV
  RECURRING
  UPDATE
  MEETING
  TODO          // v1.1: created from a to-do
}
enum RequestState {
  NEW
  ACCEPTED
  DELEGATED
  SCHEDULED
  DECLINED
  NEEDS_INFO
}
enum FUStatus {
  ACTIVE
  PAUSED
  WAITING_APPROVAL
  STOPPED
  COMPLETED
}
enum FUCadence {
  ONCE
  DAILY
  EVERY_N_DAYS
  WEEKLY
  BEFORE_DUE
  AFTER_DUE
}
enum ChannelKind {
  TEAM
  GROUP
  DM
  ANNOUNCE
}
enum EventKind {
  MEETING
  DEADLINE
  GOLIVE
  RENEWAL
  LEAVE
  HOLIDAY
}
enum SupportMode {
  ONSITE
  REMOTE
}
enum Severity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
enum JpaState {
  DRAFT
  IN_REVIEW
  SHARED
  FINAL
}
enum ReportFormat {
  PDF
  XLSX
  DOCX
  CSV
}

// ---------- v1.1 enums ----------
enum FeedbackState {      // v1.1
  NONE
  PENDING
  GIVEN
  REWORK
}
enum FeedbackOutcome {    // v1.1
  ACCEPTED
  REWORK
}
enum AttendanceStatus {   // v1.1
  PRESENT
  LATE
  HALF_DAY
  ABSENT
  ON_LEAVE
  HOLIDAY
  WEEK_OFF
}
enum WorkMode {           // v1.1
  OFFICE
  CAMPUS
  REMOTE
  FIELD
}
enum ApprovalState {      // v1.1: regularisation and leave
  PENDING
  APPROVED
  REJECTED
}
enum LeaveType {          // v1.1
  CASUAL
  SICK
  EARNED
  COMP_OFF
  OTHER
}
enum TimeLogSource {      // v1.1
  TIMER
  MANUAL
}
enum CertKind {           // v1.1
  INTERNSHIP_COMPLETION
  APPRECIATION
  PARTICIPATION
  EXPERIENCE
  CUSTOM
}
enum CertState {          // v1.1
  DRAFT
  PROPOSED
  ISSUED
  REVOKED
  REPLACED
}

model User {
  id            String   @id @default(cuid())
  name          String
  displayName   String?
  email         String   @unique
  phone         String?
  passwordHash  String
  mustChangePw  Boolean  @default(true)
  role          RoleKey  @default(MEMBER)
  title         String?            // "IT Coordinator"
  honorific     String?            // "sir", "madam" for follow-up tone
  aliases       String[]           // "Hari", "Hari garu"
  avatarUrl     String?
  campusId      String?
  campus        Campus?  @relation(fields: [campusId], references: [id])
  isSenior      Boolean  @default(false) // approval mode always
  active        Boolean  @default(true)
  startDate     DateTime?
  endDate       DateTime?
  quietFrom     String   @default("21:00")
  quietTo       String   @default("08:00")
  failedLogins  Int      @default(0)
  lockedUntil   DateTime?
  lastSeenAt    DateTime?
  remoteAllowed Boolean  @default(false) // v1.1: remote attendance allowed
  trackAttendance Boolean @default(true) // v1.1: false for Guests and optionally Admin
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  memberships   TeamMember[]
  ownedTasks    Task[]   @relation("owner")
  pushSubs      PushSubscription[]
  notifPrefs    Json     @default("{}")
}

model Campus {
  id        String      @id @default(cuid())
  name      String      @unique
  code      String?
  mode      SupportMode @default(REMOTE)
  leadId    String?
  address   String?
  archived  Boolean     @default(false)
  lat       Float?                      // v1.1: attendance geofence centre
  lng       Float?                      // v1.1
  radiusM   Int         @default(200)   // v1.1
  officeIps String[]                    // v1.1: CIDR ranges, e.g. "103.21.44.0/24"
  teams     Team[]
  users     User[]
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}

model TeamType {
  id           String @id @default(cuid())
  name         String @unique
  color        String @default("#EFEDE6")
  stages       Json   @default("[]")   // ["Data collected","Trained","Go-live"]
  customFields Json   @default("[]")   // [{key,label,type,options?}]
  builtIn      Boolean @default(false)
  teams        Team[]
}

model Team {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  typeId      String
  type        TeamType @relation(fields: [typeId], references: [id])
  campusId    String?
  campus      Campus?  @relation(fields: [campusId], references: [id])
  leadId      String?
  description String?
  startDate   DateTime?
  endDate     DateTime?
  fields      Json     @default("{}")
  archived    Boolean  @default(false)
  members     TeamMember[]
  channels    Channel[]
  tasks       Task[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model TeamMember {
  id       String  @id @default(cuid())
  teamId   String
  userId   String
  isLead   Boolean @default(false)
  mentorId String?            // interns
  joinedAt DateTime @default(now())
  leftAt   DateTime?
  team     Team @relation(fields: [teamId], references: [id])
  user     User @relation(fields: [userId], references: [id])
  @@unique([teamId, userId])
}

model StageProgress {        // implementation tracker cell
  id       String @id @default(cuid())
  teamId   String
  campusId String
  stage    String
  status   String @default("NOT_STARTED") // NOT_STARTED|IN_PROGRESS|DONE|BLOCKED
  date     DateTime?
  ownerId  String?
  note     String?
  @@unique([teamId, campusId, stage])
}

model Project {
  id          String  @id @default(cuid())
  name        String
  description String?
  repoUrl     String?
  stack       String?
  devUrl      String?
  stagingUrl  String?
  prodUrl     String?
  ownerId     String?
  teamId      String?
  area        String?           // "Websites & SEO", "UOS"...
  status      String  @default("ACTIVE")
  tasks       Task[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Task {
  id            String     @id @default(cuid())
  number        Int        @unique @default(autoincrement()) // shown as T-1042
  title         String
  description   Json?
  ownerId       String
  owner         User       @relation("owner", fields: [ownerId], references: [id])
  requesterId   String?
  requesterName String?
  createdById   String
  mode          TaskMode   @default(SOLO)
  partnerId     String?
  turnUserId    String?
  turnNote      String?
  status        TaskStatus @default(TODO)
  priority      Priority   @default(MEDIUM)
  startAt       DateTime?
  dueAt         DateTime?
  doneAt        DateTime?
  doneById      String?
  blockedReason String?
  teamId        String?
  team          Team?      @relation(fields: [teamId], references: [id])
  projectId     String?
  project       Project?   @relation(fields: [projectId], references: [id])
  campusId      String?
  tags          String[]
  source        TaskSource @default(MANUAL)
  recurrence    String?    // RRULE
  parentId      String?
  checklist     Json       @default("[]")
  estimateHours Float?
  workStartedAt DateTime?                        // v1.1
  actualMinutes Int        @default(0)           // v1.1: cached sum of TimeLog
  feedbackState FeedbackState @default(NONE)     // v1.1
  lastActivityAt DateTime  @default(now())
  reopenCount   Int        @default(0)
  requestId     String?    @unique
  messageId     String?
  deletedAt     DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  comments      TaskComment[]
  followUps     FollowUp[]
  timeLogs      TimeLog[]                        // v1.1
  feedback      TaskFeedback[]                   // v1.1
  @@index([ownerId, status])
  @@index([requesterId, status])
  @@index([dueAt])
  @@index([feedbackState])                       // v1.1
}

model TaskComment {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id])
  authorId  String?            // null = system/assistant
  kind      String   @default("COMMENT") // COMMENT|ACTIVITY|FOLLOWUP|REPLY|TIMELOG|FEEDBACK (v1.1)
  body      Json
  createdAt DateTime @default(now())
}

model Attachment {
  id        String   @id @default(cuid())
  ownerType String   // TASK|MESSAGE|DOC|REQUEST|BUG|CERT_TEMPLATE (v1.1)
  ownerId   String
  fileName  String
  mime      String
  size      Int
  path      String   // local storage path
  uploadedById String
  createdAt DateTime @default(now())
}

model Request {
  id          String       @id @default(cuid())
  fromUserId  String
  toUserId    String
  text        String
  why         String?
  dueAt       DateTime?
  priority    Priority     @default(MEDIUM)
  state       RequestState @default(NEW)
  declineReason String?
  scheduledFor DateTime?
  delegatedToId String?
  firstActionAt DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model FollowUp {
  id            String    @id @default(cuid())
  taskId        String
  task          Task      @relation(fields: [taskId], references: [id])
  onBehalfOfId  String            // usually Sri
  targetId      String
  cadence       FUCadence @default(DAILY)
  everyNDays    Int?
  template      String    @default("GENTLE")
  customText    String?
  needsApproval Boolean   @default(false)
  status        FUStatus  @default(ACTIVE)
  nextRunAt     DateTime
  lastSentAt    DateTime?
  sentCount     Int       @default(0)
  unansweredCount Int     @default(0)
  escalateAfter Int       @default(2)
  maxSends      Int       @default(10)
  escalatedLevel Int      @default(0) // 0 none, 1 lead, 2 admin
  draftText     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  @@index([status, nextRunAt])
}

model DailyUpdate {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime @db.Date
  done      String
  next      String
  blockers  String?
  postedAt  DateTime @default(now())
  onTime    Boolean
  @@unique([userId, date])
}

model Leave {
  id         String        @id @default(cuid())
  userId     String
  from       DateTime      @db.Date
  to         DateTime      @db.Date
  reason     String?
  type       LeaveType     @default(CASUAL)   // v1.1
  halfDay    Boolean       @default(false)    // v1.1 (only when from = to)
  state      ApprovalState @default(APPROVED) // v1.1: existing rows stay approved; new rows start PENDING when approval is required
  approverId String?                          // v1.1
  decidedAt  DateTime?                        // v1.1
  decisionNote String?                        // v1.1
  createdAt  DateTime      @default(now())    // v1.1
}

model Holiday {
  id        String   @id @default(cuid())
  date      DateTime @db.Date @unique
  name      String
  type      String   @default("NATIONAL")     // v1.1: NATIONAL|REGIONAL|OPTIONAL
  campusIds String[]                          // v1.1: empty = all campuses
}

model Channel {
  id        String      @id @default(cuid())
  name      String
  slug      String      @unique
  kind      ChannelKind @default(GROUP)
  teamId    String?
  team      Team?       @relation(fields: [teamId], references: [id])
  isPrivate Boolean     @default(false)
  topic     String?
  archived  Boolean     @default(false)
  members   ChannelMember[]
  messages  Message[]
  createdAt DateTime    @default(now())
}

model ChannelMember {
  id         String   @id @default(cuid())
  channelId  String
  userId     String
  muted      Boolean  @default(false)
  lastReadAt DateTime @default(now())
  channel    Channel  @relation(fields: [channelId], references: [id])
  @@unique([channelId, userId])
}

model Message {
  id         String   @id @default(cuid())
  channelId  String
  channel    Channel  @relation(fields: [channelId], references: [id])
  authorId   String?            // null = assistant/system
  onBehalfOfId String?          // follow-ups
  kind       String   @default("TEXT") // TEXT|VOICE|FILE|UPDATE|KUDOS|POLL|ANNOUNCE|FOLLOWUP|SYSTEM|CERT (v1.1)
  body       String
  meta       Json     @default("{}") // poll options, follow-up buttons, task refs
  parentId   String?            // thread
  editedAt   DateTime?
  deletedAt  DateTime?
  pinned     Boolean  @default(false)
  createdAt  DateTime @default(now())
  reactions  Reaction[]
  @@index([channelId, createdAt])
}

model Reaction {
  id        String  @id @default(cuid())
  messageId String
  userId    String
  emoji     String
  message   Message @relation(fields: [messageId], references: [id])
  @@unique([messageId, userId, emoji])
}

model Acknowledgement {   // announcements
  id        String   @id @default(cuid())
  messageId String
  userId    String
  at        DateTime @default(now())
  @@unique([messageId, userId])
}

model Link {
  id         String   @id @default(cuid())
  teamId     String?
  channelId  String?
  messageId  String?
  url        String
  title      String?
  tags       String[]
  pinned     Boolean  @default(false)
  sharedById String
  createdAt  DateTime @default(now())
}

model Kudos {
  id        String   @id @default(cuid())
  fromId    String
  toId      String
  reason    String
  messageId String?
  createdAt DateTime @default(now())
}

model Event {
  id        String    @id @default(cuid())
  title     String
  kind      EventKind @default(MEETING)
  startAt   DateTime
  endAt     DateTime
  allDay    Boolean   @default(false)
  location  String?
  notes     String?
  ownerId   String
  taskId    String?
  docId     String?
  attendees EventAttendee[]
  @@index([startAt])                           // v1.1: month/year views
}

model EventAttendee {
  id      String @id @default(cuid())
  eventId String
  userId  String
  status  String @default("INVITED") // INVITED|ACCEPTED|DECLINED
  event   Event  @relation(fields: [eventId], references: [id])
  @@unique([eventId, userId])
}

model DocSpace {
  id        String  @id @default(cuid())
  name      String
  teamId    String?
  projectId String?
  docs      Doc[]
}

model Doc {
  id          String   @id @default(cuid())
  spaceId     String
  space       DocSpace @relation(fields: [spaceId], references: [id])
  parentId    String?
  title       String
  content     Json
  template    String?
  permissions Json     @default("{}")
  updatedById String
  deletedAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  versions    DocVersion[]
}

model DocVersion {
  id        String   @id @default(cuid())
  docId     String
  doc       Doc      @relation(fields: [docId], references: [id])
  content   Json
  byId      String
  createdAt DateTime @default(now())
}

model Sprint {
  id        String   @id @default(cuid())
  projectId String
  name      String
  startAt   DateTime
  endAt     DateTime
  goal      String?
}

model Bug {
  id        String   @id @default(cuid())
  projectId String?
  siteId    String?
  title     String
  steps     String?
  expected  String?
  actual    String?
  severity  Severity @default(MEDIUM)
  taskId    String   @unique
  reopened  Int      @default(0)
  createdAt DateTime @default(now())
}

model Deployment {
  id          String   @id @default(cuid())
  projectId   String
  environment String   // DEV|STAGING|PROD
  version     String?
  notes       String?
  rollback    String?
  byId        String
  at          DateTime @default(now())
}

model Site {
  id              String   @id @default(cuid())
  domain          String   @unique
  url             String
  hosting         String?
  dns             String?
  ownerId         String?
  sslExpiresAt    DateTime?
  domainExpiresAt DateTime?
  credentialHint  String?  // "Bitwarden → Hosting/SMRU" — never a secret
  lastStatus      String   @default("UNKNOWN") // UP|DOWN|UNKNOWN
  lastCheckedAt   DateTime?
  checks          SiteCheck[]
}

model SiteCheck {
  id      String   @id @default(cuid())
  siteId  String
  site    Site     @relation(fields: [siteId], references: [id])
  at      DateTime @default(now())
  ok      Boolean
  status  Int?
  ms      Int?
  error   String?
  @@index([siteId, at])
}

model Review {           // JPA
  id          String   @id @default(cuid())
  userId      String
  periodStart DateTime
  periodEnd   DateTime
  state       JpaState @default(DRAFT)
  metrics     Json               // computed components, frozen at FINAL
  leadScore   Float?
  leadComment String?
  strengths   String?
  improve     String?
  selfComment String?
  overall     Float?
  rating      String?
  reviewerId  String?
  finalizedAt DateTime?
  @@unique([userId, periodStart, periodEnd])
}

model ReportPreset {
  id        String  @id @default(cuid())
  name      String
  config    Json    // {period, audience, scope, sections, summary, format}
  ownerId   String
  builtIn   Boolean @default(false)
}

model ReportRun {
  id        String       @id @default(cuid())
  presetId  String?
  config    Json
  format    ReportFormat
  fileName  String
  path      String
  byId      String
  sharedWith String[]
  createdAt DateTime     @default(now())
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  title     String
  body      String?
  url       String?
  readAt    DateTime?
  pushed    Boolean  @default(false)
  createdAt DateTime @default(now())
  @@index([userId, readAt])
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  endpoint  String   @unique
  p256dh    String
  auth      String
  userAgent String?
  createdAt DateTime @default(now())
}

model InboxRule {
  id        String  @id @default(cuid())
  when      Json    // {requesterIn?:[], textContains?:[]}
  then      Json    // {priority?, suggestDelegateTo?}
  autoApply Boolean @default(false)
}

model Setting {
  key   String @id
  value Json
}

model AuditLog {
  id        String   @id @default(cuid())
  actorId   String?
  action    String   // CREATE|UPDATE|DELETE|LOGIN|CHECK_IN|ISSUE|REVOKE|...
  entity    String
  entityId  String
  before    Json?
  after     Json?
  at        DateTime @default(now())
  @@index([entity, entityId])
}

model AiLog {
  id      String   @id @default(cuid())
  userId  String?
  kind    String   // PARSE|BRIEF|SUMMARY
  input   String
  output  String?
  ms      Int?
  ok      Boolean
  at      DateTime @default(now())
}

// ======================= v1.1 models =======================

model TodoItem {          // v1.1 — private to userId
  id          String    @id @default(cuid())
  userId      String
  title       String
  notes       String?
  list        String    @default("Personal")   // Personal|Work|Learning|custom
  date        DateTime? @db.Date                // null = Someday
  startAt     DateTime?                         // null = unscheduled on that date
  endAt       DateTime?
  remindAt    DateTime?
  reminded    Boolean   @default(false)
  recurrence  String?                           // RRULE
  priority    Priority  @default(MEDIUM)
  done        Boolean   @default(false)
  doneAt      DateTime?
  carriedFrom DateTime? @db.Date
  carryCount  Int       @default(0)
  sortOrder   Int       @default(0)
  taskId      String?                           // linked task (F-TODO-10)
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  @@index([userId, date])
  @@index([remindAt, reminded])
}

model TodoList {          // v1.1 — custom list names and colors per user
  id     String @id @default(cuid())
  userId String
  name   String
  color  String @default("#0E6E66")
  @@unique([userId, name])
}

model TimeLog {           // v1.1
  id        String        @id @default(cuid())
  taskId    String
  task      Task          @relation(fields: [taskId], references: [id])
  userId    String
  startedAt DateTime
  endedAt   DateTime?                         // null = timer running
  minutes   Int?                              // set when ended / manual
  note      String?
  source    TimeLogSource @default(TIMER)
  autoStopped Boolean     @default(false)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  @@index([taskId])
  @@index([userId, startedAt])
}

model TaskFeedback {      // v1.1
  id            String          @id @default(cuid())
  taskId        String
  task          Task            @relation(fields: [taskId], references: [id])
  userId        String                        // person who did the task
  reviewerId    String                        // Admin or Lead
  rating        Int                           // 1–5 (validate in Zod)
  quality       Int?
  timeliness    Int?
  communication Int?
  chips         String[]
  comment       String?
  outcome       FeedbackOutcome @default(ACCEPTED)
  ackAt         DateTime?
  reply         String?
  lockedAt      DateTime?                     // 24 h after creation
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  @@index([taskId])                           // several rows possible after rework
  @@index([userId, createdAt])
}

model AttendanceRecord {  // v1.1 — one per user per date
  id            String           @id @default(cuid())
  userId        String
  date          DateTime         @db.Date
  status        AttendanceStatus @default(ABSENT)
  mode          WorkMode?
  campusId      String?
  sessions      Json             @default("[]") // [{in, out, inLat, inLng, inIp, outLat, outLng, outIp}]
  firstInAt     DateTime?
  lastOutAt     DateTime?
  workedMinutes Int              @default(0)
  lateMinutes   Int              @default(0)
  verified      Boolean          @default(true)
  verifyNote    String?          // "IP not in office range", "Outside 200 m"
  approvedById  String?          // for unverified check-ins
  autoClosed    Boolean          @default(false)
  extraDay      Boolean          @default(false)
  source        String           @default("SELF") // SELF|REGULARISED|ADMIN|SYSTEM
  note          String?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  @@unique([userId, date])
  @@index([date, status])
}

model AttendanceRegularization { // v1.1
  id          String        @id @default(cuid())
  userId      String
  date        DateTime      @db.Date
  reqInAt     DateTime?
  reqOutAt    DateTime?
  reqMode     WorkMode?
  reason      String
  state       ApprovalState @default(PENDING)
  reviewerId  String?
  reviewNote  String?
  reviewedAt  DateTime?
  createdAt   DateTime      @default(now())
  @@index([state])
  @@index([userId, date])
}

model CertificateTemplate { // v1.1
  id           String   @id @default(cuid())
  name         String
  kind         CertKind @default(INTERNSHIP_COMPLETION)
  orientation  String   @default("LANDSCAPE") // LANDSCAPE|PORTRAIT
  background   String?                        // file path
  logo         String?
  layout       Json     @default("[]")  // [{id, text, x, y, w, font, size, color, align}] in mm on A4
  signatories  Json     @default("[]")  // [{name, designation, signaturePath}]
  showQr       Boolean  @default(true)
  showWebsite  Boolean  @default(true)
  archived     Boolean  @default(false)
  createdById  String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  certificates Certificate[]
}

model Certificate {       // v1.1
  id            String    @id @default(cuid())
  number        String    @unique           // SMRU-IT-INT-2026-0042
  code          String    @unique           // K7Q2M9XA4D (public URL part)
  templateId    String
  template      CertificateTemplate @relation(fields: [templateId], references: [id])
  userId        String
  kind          CertKind
  title         String                      // "Internship Completion Certificate"
  data          Json                        // frozen placeholder values
  periodStart   DateTime?
  periodEnd     DateTime?
  state         CertState @default(DRAFT)
  proposedById  String?
  issuedById    String?
  issuedAt      DateTime?
  eligibilityOverride String?               // reason if Admin overrode
  revokedAt     DateTime?
  revokeReason  String?
  replacedById  String?                     // new certificate id
  verifyUrl     String
  pdfPath       String?
  pngPath       String?
  viewCount     Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  @@index([userId])
  @@index([state])
}

model CertificateCounter { // v1.1 — yearly sequence per type
  id    String @id        // e.g. "INT-2026"
  value Int    @default(0)
}
```

**(v1.1) New Setting keys** (stored in `Setting`): `attendance.officeStart` ("09:00"), `attendance.officeEnd` ("18:00"), `attendance.graceMinutes` (15), `attendance.halfDayHours` (4), `attendance.fullDayHours` (8), `attendance.absentCutoff` ("11:00"), `attendance.verifyMethod` ("IP" | "LOCATION" | "BOTH" | "NONE"), `attendance.maxRegularisationsPerMonth` (3), `leave.approvalRequired` (true), `time.hoursPerDay` (8), `time.timerAutoStop` ("18:30"), `feedback.leadsCanGive` (true), `feedback.dueWorkingDays` (3), `cert.collegeName`, `cert.collegeWebsite`, `cert.verifyBaseUrl`, `cert.numberFormat` ("{PREFIX}-{TYPE}-{YYYY}-{seq4}"), `cert.prefix` ("SMRU-IT"), `cert.minAttendancePercent` (80), `calendar.weekStartsOn` (1 = Monday), `calendar.showWeekNumbers` (true), `jpa.weights` (§13.2 v1.1).

---

## 16. Architecture

### 16.1 Stack (all self-hosted, all free)

| Layer | Choice |
|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript (strict)** |
| UI | **Tailwind CSS + shadcn/ui**, icons **lucide-react** |
| Forms & validation | react-hook-form + **Zod** (same schema on client and server) |
| Data fetching | Server Components + Server Actions; **TanStack Query** for live client lists |
| DB | **PostgreSQL 16** + **Prisma** |
| Auth | **Auth.js (NextAuth v5) Credentials**, bcrypt (cost 12), DB sessions |
| Real-time | **Socket.IO** server (custom `server.ts` alongside Next) with rooms per channel/user |
| Jobs | **pg-boss** (queue + cron inside Postgres) in a separate `worker` process |
| Push | **web-push** library with VAPID keys generated at install |
| AI | **Ollama** container, model `qwen2.5:7b-instruct` |
| Dates | **date-fns-tz**, **chrono-node**, **rrule** |
| Editor | **Tiptap** |
| Calendar UI | **FullCalendar** (MIT core) — **(v1.1)** plus a custom full-month grid, year view and shared date picker built with date-fns (FullCalendar's free core has no year view) |
| Charts | **Recharts** |
| Exports | **Playwright** (PDF), **ExcelJS**, **docx** |
| **QR codes (v1.1)** | **`qrcode`** npm package (generates PNG/SVG locally) |
| **Drag & drop (v1.1)** | **`@dnd-kit/core`** (to-do schedule, certificate template designer) |
| **IP ranges (v1.1)** | **`ipaddr.js`** (office CIDR check) |
| Search | Postgres full-text (`tsvector` + GIN index) |
| Files | Local volume `/data/uploads` (swap to MinIO later); **(v1.1)** `/data/certificates` |
| PWA | `@serwist/next` (service worker, offline shell, outbox) |
| Tests | **Vitest** (unit), **Playwright** (e2e) |
| Deploy | **Docker Compose**: `app`, `worker`, `db`, `ollama`, `backup` |

### 16.2 Folder structure

```
/app
  /(auth)/login, /change-password
  /(app)/console, /my, /inbox, /teams/[slug], /chat/[slug], /calendar,
         /calendar/[view]/[date]          (v1.1: day|week|month|year|agenda)
         /todo, /todo/[date]              (v1.1)
         /attendance, /attendance/register, /attendance/requests   (v1.1)
         /timesheet                       (v1.1)
         /feedback, /feedback/give        (v1.1)
         /certificates, /certificates/templates/[id], /certificates/[id]  (v1.1)
         /docs/[space]/[doc], /dev, /dev/projects/[id], /dev/sites,
         /reports, /reports/jpa/[userId], /setup, /settings, /trash, /audit
  /(public)/verify, /verify/[code]        (v1.1: no login, own minimal layout)
  /api/push, /api/upload, /api/reports/[id]/download, /api/health,
  /api/certificates/[id]/download         (v1.1)
/components        (ui/ from shadcn, plus feature components by module)
  /ui/date-picker.tsx, /calendar/month-grid.tsx, /calendar/year-view.tsx (v1.1)
/lib
  /auth (can.ts, session.ts)
  /db.ts
  /time (index.ts, working.ts, duration.ts)                    (v1.1: working.ts, duration.ts)
  /services  (task.ts, request.ts, followup.ts, update.ts, chat.ts, team.ts,
              event.ts, doc.ts, dev.ts, report.ts, notify.ts, kpi.ts, jpa.ts,
              todo.ts, timelog.ts, feedback.ts, attendance.ts, leave.ts,
              holiday.ts, certificate.ts)                       (v1.1: last 7)
  /cmd (parse.ts, intents.ts, dates.ts, resolve.ts, llm.ts, execute.ts)
  /jobs (definitions + handlers)
  /ai (ollama.ts, prompts.ts)
  /export (pdf.ts, xlsx.ts, docx.ts, templates/, certificate.ts (v1.1))
  /geo (haversine.ts, ip.ts)                                    (v1.1)
/server.ts         (Next + Socket.IO)
/worker.ts         (pg-boss jobs)
/prisma/schema.prisma, /prisma/seed.ts
/tests/unit, /tests/e2e, /tests/cmd/corpus.json
SPEC.md  RULES.md  docker-compose.yml  .env.example
```

### 16.3 Service-layer rule

UI, command bar, jobs and API all call the **same functions in `/lib/services`**. Each service function: validates input (Zod) → checks `can()` → runs in a Prisma transaction → writes `AuditLog` → emits real-time events → queues notifications. No business logic in components. **(v1.1)** The public verify page calls only `certificate.verifyByCode(code)`, which returns the limited public fields listed in F-CERT-06 and nothing else.

### 16.4 Real-time events (Socket.IO)

Rooms: `user:{id}`, `channel:{id}`, `team:{id}`. Events: `message:new|edit|delete`, `reaction`, `typing`, `task:changed`, `notification:new`, `followup:approval`, `presence`, **(v1.1)** `attendance:changed` (team room, for the Today board), `timer:changed` (user room, keeps the header pill in sync across tabs/devices), `todo:changed` (user room), `feedback:new` (user room).

---

## 17. Background jobs (worker, timezone Asia/Kolkata)

| Job | Schedule | What it does |
|---|---|---|
| `followups.tick` | every 1 min | Send due follow-ups (Section 9); approval drafts; escalations |
| `tasks.dueReminders` | every 15 min | 24 h / 2 h before due; overdue at 09:30 |
| `tasks.recurring` | every 15 min | Create next instances |
| `tasks.stale` | daily 07:30 | Mark stale (no activity ≥ 3 working days) |
| `updates.remind` | 17:00 working days | Reminder push |
| `updates.missed` | 18:30 working days | Flag missed, notify leads |
| `brief.morning` | 08:00 working days | Build Morning brief for Admin + Leads |
| `brief.evening` | 18:30 working days | Evening wrap |
| `requests.scheduled` | every 15 min | Return scheduled requests to Inbox |
| `sites.uptime` | every 5 min | HTTP checks |
| `sites.expiry` | daily 06:00 | SSL/domain expiry alerts + renewal tasks at 30 days |
| `reports.weekly` | Fri 17:00 | Prepare weekly packs, notify Sri |
| `jpa.draft` | 1st of quarter 07:00, and 7 days before intern end dates | Create JPA drafts |
| `digest.bundle` | every 2 h 09:00–19:00 | Send bundled non-urgent notifications |
| `cleanup` | daily 03:00 | Purge trash > 30 days, AiLog > 30 days, SiteCheck > 90 days |
| `backup` | daily 02:00 (backup container) | `pg_dump` + uploads tar → `/backups`, keep 14 daily + 8 weekly (**v1.1** includes `/data/certificates`) |
| **`todo.reminders` (v1.1)** | every 1 min | Send due to-do reminders (`remindAt ≤ now`, not reminded) |
| **`todo.carryOver` (v1.1)** | daily 00:05 | Move undone dated to-dos to today; create next repeat instances |
| **`attendance.remindIn` (v1.1)** | 09:10 working days | Push to users with no record, not on leave/holiday |
| **`attendance.markAbsent` (v1.1)** | at absent cut-off (11:00) working days | Create provisional ABSENT records |
| **`attendance.remindOut` (v1.1)** | 18:15 working days | Push to users still checked in |
| **`attendance.autoClose` (v1.1)** | daily 23:59 | Close open sessions at office end, flag auto-closed, finalise day status |
| **`reports.attendanceMonthly` (v1.1)** | 1st of month 07:00 | Prepare last month's attendance register, notify Admin |
| **`timers.autoStop` (v1.1)** | at timer auto-stop time (18:30) daily | Stop running timers, notify users |
| **`feedback.lock` (v1.1)** | every 1 h | Lock feedback older than 24 h |
| **`certificates.render` (v1.1)** | on demand (queue) | Render certificate PDFs/PNGs (bulk issue) |

All jobs are idempotent (safe to run twice) and skip holidays where marked "working days".

---

## 18. Design system (from the approved prototype)

| Token | Value |
|---|---|
| Ink / sidebar | `#17191E` |
| Ground (page) | `#F4F2EC` |
| Surface (cards) | `#FFFFFF`, alt `#FBFAF7` |
| Line | `#E3E0D8` |
| Muted text | `#5B5F68` (≥ 4.5:1 on white) |
| Primary (teal) | `#0E6E66`, hover `#0A4F49`, on-dark accent `#3FB8AC` |
| Chasing (amber) | `#9A4A08`, tint `#F6E4D0` |
| Shared (violet) | `#5B3FA6`, tint `#E7E1F4` |
| Danger | `#B42318`, tint `#FBE3E0` |
| **Attendance (v1.1)** | Present = primary teal tint `#DCEFEC`; Late = amber tint `#F6E4D0`; Half day = `#FFF4C2`; Absent = danger tint `#FBE3E0`; Leave = violet tint `#E7E1F4`; Holiday / Week off = `#ECEAE4`. Always with the letter code (P/L/H/A/LV/HO/WO), never color alone |
| **Rating stars (v1.1)** | Filled `#9A4A08`, empty `#E3E0D8`; always with the number ("4/5") for screen readers |
| **Calendar (v1.1)** | Today ring = primary; other-month dates = muted text at 60%; non-working day background = `#FBFAF7` |
| Fonts | **IBM Plex Sans** (UI), **IBM Plex Mono** (IDs, command bar, times) — self-host the font files. **(v1.1)** Certificates may also use 2 self-hosted display fonts chosen by Admin (e.g. a serif for names) |
| Radius | 8 (controls), 10 (cards inside), 14 (panels) |
| Spacing | 4-pt scale; panel padding 18; page padding 24–32 |
| Touch targets | ≥ 44 px (calendar date cells included) |
| Dark mode | v1.1 (tokens ready) — still planned, not part of Phase 7 |

Rules: no emoji in UI chrome (reactions are fine), status always shown as text + color, every icon-only button has `aria-label`, empty states say what to do next ("No tasks. Type one above or press +"; **"Nothing planned. Add a to-do or drag one onto the schedule." (v1.1)**).

---

## 19. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Page interactive < 2 s on mid-range Android 4G; command bar result < 300 ms (rules), < 8 s (LLM); list queries < 200 ms at 50k tasks. **(v1.1)** Check-in completes < 1 s (excluding the location prompt); month calendar with 500 items renders < 500 ms; year view < 800 ms; monthly register for 100 users < 2 s; verify page < 500 ms |
| Scale (v1) | 100 users, 50k tasks, 500k messages on a 4-core / 16 GB server (Ollama needs 8 GB). **(v1.1)** + 40k attendance records/year, 200k time logs, 5k certificates |
| Availability | Docker `restart: unless-stopped`; `/api/health` checks DB + worker heartbeat |
| Security | HTTPS only (reverse proxy with your own certificate); bcrypt; CSRF protection (Auth.js); rate-limit login & API (per IP + user); file type/size checks, files served with `Content-Disposition` and never executed; no secrets in DB; `.env` not committed; security headers (CSP, HSTS, X-Frame-Options). **(v1.1)** Attendance time always from server clock; IP taken from the trusted proxy header only; `/verify` is read-only, rate-limited, returns the same response time for valid and invalid codes, and exposes no internal IDs; certificate codes are crypto-random |
| Privacy | JPA visible only per permission matrix; audit log for every change; export of a user's own data on request. **(v1.1)** To-dos private to their owner; feedback visible only to person, lead and Admin; location captured only at check-in/out; public verify page shows only the fields in F-CERT-06 |
| Backups | Daily + weekly (Section 17); **restore test once a month** (checklist task auto-created) |
| Accessibility | WCAG 2.1 AA: keyboard reachable, visible focus, labels, contrast. **(v1.1)** Calendar grid uses `role="grid"` with arrow-key navigation and full-date `aria-label` on each cell ("Tuesday 30 September 2026, 3 items") |
| Browsers | Latest Chrome, Edge, Safari (iOS 16.4+), Firefox |
| Offline | App shell + last-loaded lists readable offline; chat messages and task checkboxes queue and sync. **(v1.1)** Plus check-in/out, to-do changes and timer start/stop (§14.2) |
| Localisation | English UI; any Unicode text (Telugu) accepted everywhere; dates DD MMM YYYY; Indian number grouping in reports. **(v1.1)** Durations shown as "2h 30m"; certificates support Unicode names |
| Logs | Structured JSON logs (pino) with request IDs; keep 14 days |

---

## 20. Seed data (for development and demo)

- Campuses: SMRU (on-site), Hyderabad group (on-site), St. Mary's Group Chebrol (remote), Guntur (remote), St. Mary's Women's (remote). **(v1.1)** SMRU and Hyderabad group get sample lat/lng, radius 200 m and a sample office IP range (`127.0.0.1/32` and `::1/128` in development so local check-ins verify).
- Team types: built-ins (Section 6); UOS rollout stages: Data collected → Accounts created → Trained → Go-live → First-week support.
- Teams: SMRU campus IT (lead Hari), Hyderabad group (lead Sri), Remote support (lead Hari), UOS rollout (Implementation), Developers (Dev team), Interns · Web batch Sep '26.
- Users: Sri (Admin), Hari (Lead), Janardhan sir (Member, isSenior), Dev Web, Dev Backend (Developer), Intern Web A, Intern Web B (Intern), VC office, COO office, CEO office (Guest, isSenior, **trackAttendance=false (v1.1)**). **(v1.1)** Dev Backend has `remoteAllowed=true`.
- Sites: smru.edu.in, smru.in, St. Mary's Women's, St. Mary's Group Chebrol, St. Mary's Group (real domains filled by Sri).
- ~40 tasks across all lists and statuses, 3 requests, 3 follow-ups (one needing approval), 2 weeks of daily updates, channels with sample messages.
- **(v1.1)** Estimates on 20 tasks and time logs on 15 (some over estimate); feedback on 10 done tasks (ratings 2–5, one REWORK), 5 done tasks still PENDING feedback; 15 to-dos per user for Sri, Hari and Intern Web A (scheduled, unscheduled, someday, repeating, one carried over); attendance for the last 2 months for all non-guest users with a realistic mix (mostly Present, some Late, 2 Half days, 1 Absent, approved and pending leave, 1 auto-closed, 1 pending regularisation); holidays for 2026 (Republic Day, Ugadi, Independence Day, Gandhi Jayanti, Dussehra, Diwali, Christmas, etc. — Sri confirms the real list); 1 Internship completion template and 1 Appreciation template; 1 issued certificate for Intern Web A and 1 revoked certificate (for testing the verify page).
- All seed passwords = `ChangeMe!2026` with `mustChangePw=true`. Seed never runs in production unless `SEED=true`. **(v1.1)** A separate `npm run db:seed:v11` adds only v1.1 demo data to an existing development database without touching v1.0 rows.

---

## 21. Definition of Done & testing

A feature is **done** only when all of these are true:

- [ ] All its acceptance criteria pass.
- [ ] Server checks `can()`; tested as Admin, Lead, Intern, Guest.
- [ ] Works on phone (390 px) and desktop (1280 px).
- [ ] Loading, empty and error states exist.
- [ ] Destructive actions confirm and offer Undo.
- [ ] Unit tests for logic (parser, dates, KPI/JPA formulas, follow-up scheduler, **(v1.1) working-time and duration parsing, attendance status rules and %, haversine and IP checks, to-do carry-over and repeats, certificate numbering and placeholder filling**) pass: `npm test`.
- [ ] One Playwright e2e test for the main happy path.
- [ ] No console errors; `npm run lint` and `npm run typecheck` clean.
- [ ] Audit log entry written for changes.
- [ ] Committed with the feature ID in the message.
- [ ] **(v1.1)** All v1.0 e2e flows (1–6) still pass — no regressions.

**Critical e2e flows (must always pass before a release):**
1. Login → change password → onboarding checklist.
2. Sri types "Ask Hari to fix the fee page by Friday, chase daily" → task in Sri's I'm chasing and Hari's I owe → worker sends follow-up → Hari taps "Done" → task done, follow-up stopped, Sri notified.
3. Guest raises request → Sri delegates to Hari → guest sees "Delegated".
4. Intern posts daily update → card in team chat → lead sees ✔.
5. Sri downloads "Weekly report · VC · PDF" → file opens with correct numbers for seed data.
6. Site goes down (mock) → alert → recovers → recovery alert.
7. **(v1.1)** Intern types "todo call vendor tomorrow 3pm" → appears in tomorrow's schedule at 15:00 → (mocked clock) reminder push arrives → tap Done → to-do completed.
8. **(v1.1)** Calendar: open Month view for February 2028 → 29 dates shown plus leading/trailing dates; open Year view 2026 → click 2 Oct → Day panel shows the Gandhi Jayanti holiday.
9. **(v1.1)** Intern checks in at 09:05 (mocked clock, office IP) → status Present → Hari's Today board shows them ✔ → check-in at 09:40 for another user → Late → monthly register shows P and L → Excel export opens.
10. **(v1.1)** Dev Web sets estimate 2h on T-1042, starts timer, stops after 30 mocked minutes, logs 1h manually → card shows "1h 30m / 2h"; marks done → task appears in Sri's Give feedback card → Sri gives 4★ → Dev Web is notified and acknowledges.
11. **(v1.1)** Sri issues an Internship completion certificate to Intern Web A → PDF contains name, number, QR and college website link → logged-out browser opens `/verify/{code}` → "Valid" → Sri revokes → page shows "Revoked".

---

## 22. RULES.md (copy into the repo)

```markdown
# RULES for AI coding sessions
1. Read SPEC.md first. Build only the feature IDs named in the prompt.
2. Plan before code: list files to create/change and wait for "go".
3. TypeScript strict. No `any`. Zod for every input.
4. Business logic lives in /lib/services only. Components call services via server actions.
5. Every service call checks can(user, action, resource). Never trust the client.
6. Only Track A edits prisma/schema.prisma. Others propose schema changes in the plan.
7. Use shadcn/ui + Tailwind tokens from SPEC §18. No inline hex colors in components.
8. No external services, SDKs that call the internet, or API keys. Ollama only via /lib/ai.
9. Every calculation (dates, parser, KPI, JPA, scheduler) has Vitest unit tests.
10. Files under 300 lines; split by responsibility.
11. Write AuditLog on create/update/delete. Soft delete where the model has deletedAt.
12. Times: store UTC, display Asia/Kolkata via /lib/time.
13. After each step: run typecheck, lint, tests; show me the result.
14. Never delete or rewrite working code outside the feature scope.
15. If stuck twice on the same error, stop and explain the problem in plain English.
16. (v1.1) The v1.0 app is live. Schema changes must be additive: no dropped or renamed
    columns. Show the Prisma diff and migration name in the plan before running it.
17. (v1.1) Before and after each Phase 7 feature, run the full test suite and e2e flows 1–6.
    If an old test breaks, fix the new code, not the old test (unless SPEC changed it).
18. (v1.1) Attendance, feedback and certificate logic are privacy-sensitive: follow the
    visibility rules in SPEC §3.2, §7.5, §10.5 and §13.6 exactly. Never log locations,
    feedback comments or certificate codes in plain application logs.
19. (v1.1) The only route without login is /verify. Never add another public route.
```

---

## 23. Build plan (phases, tracks, rollout)

### 23.1 Tracks

| Track | Owns | Depends on |
|---|---|---|
| A. Foundation | Repo, Docker, schema, auth, roles, shell, Setup, Settings, seed | – |
| B. Work engine | Tasks, Console, My Space, Inbox, Daily updates, Command bar (rules) | A |
| C. Talk | Chat, Links, Kudos, Announcements, Polls, uploads, voice notes | A |
| D. Automation & AI | Worker, follow-ups, reminders, push, briefs, Ollama fallback | B |
| E. Dev Hub | Projects, build map, sprints, bugs, deployments, sites, uptime | A, B |
| F. Knowledge & time | Docs, templates, Calendar, meeting notes | A, B |
| G. Reports & quality | KPI, JPA, JPR, My progress, exports, scheduled reports, backups, e2e, deploy | B, C, D |
| **H. People & time (v1.1)** | Task duration, full calendar, to-do, feedback, attendance, certificates | A–G (v1.0 complete) |

### 23.2 Phases (about 12 weeks for v1.0, plus about 4 weeks for v1.1)

| Phase | Weeks | Features | Exit test |
|---|---|---|---|
| 0 Setup | 1 | Repo, Docker Compose (app, worker, db, ollama), shell, RULES.md, CI script (lint/typecheck/test) | `docker compose up` shows the login page |
| 1 Foundation | 2 | F-AUTH-01…09, F-ORG-01…04, 07, seed | Log in as each role; sidebar differs; create team → chat group row exists |
| 2 Work engine | 3–4 | F-TASK-01…15, F-CON-01…06, F-MY-01…07, F-INBOX-01…09, F-UPD-01…07, F-CMD (rules, 150-sentence corpus ≥ 90%) | Sri runs his real day in it for 5 working days |
| 3 Talk | 5–6 | F-CHAT-01…17, F-INBOX-10, PWA install + offline outbox | Hari's team uses the app instead of WhatsApp for 5 working days |
| 4 Automation | 7–8 | F-FU-01…11, F-NOTIF-01…06, push, Ollama fallback, briefs | e2e flow 2 passes with a real phone |
| 5 Knowledge & Dev | 9–10 | F-CAL-01…07, F-DOC-01…08, F-DEV-01…11, F-ORG-05, 06 | Uptime alert reaches phone; meeting notes create tasks |
| 6 Reports & launch | 11–12 | F-RPT-01…10, §13 formulas with tests, backups + restore test, security headers, production deploy | Friday VC report downloaded from the app; restore test passed |
| **7 v1.1 additions** | **13–16** | Build in this order (each step is a separate session and commit): **7a** F-AUTH-10, 11 + v1.1 schema migration + `db:seed:v11` · **7b** F-DUR-01…08 (task duration) · **7c** F-CAL-08…16 (full calendar, date picker, holidays) · **7d** F-TODO-01…11 (to-do & schedule) · **7e** F-FB-01…10 (feedback) · **7f** F-ATT-01…14 + F-UPD-05 leave changes (attendance) · **7g** F-CERT-01…11 (certificates + public verify) · **7h** v1.1 intents (§8.3, corpus ≥ 210), KPIs/JPA/JPR/report sections (§13), notifications (§12.4), jobs (§17), My Space & Console cards (F-MY-08…11, F-CON-07, 08) | e2e flows 1–11 pass; Sri gives feedback on a real week of tasks; the team uses check-in for 5 working days; one real certificate verifies from a phone by scanning its QR code |

### 23.3 Rollout to the team (after Phase 3)

| Week | Action |
|---|---|
| R1 | Sri + Hari only. Fix friction daily. |
| R2 | Add Developers team. 20-minute demo; everyone installs the app on phone during the demo. |
| R3 | Add Interns batch + campus IT. WhatsApp groups renamed "(Personal/Emergency only)". Work instructions only in the app. |
| R4 | Remote-support campuses. Guests (leadership offices) get accounts for requests and shared reports. |
| Ongoing | Weekly 10-minute feedback in #it-team; top 3 fixes each week; publish "What's new" announcement. |

**(v1.1) Rollout of Phase 7 features**

| Step | Action |
|---|---|
| V1 | Release task duration, full calendar and to-do first (no rule changes for people). "What's new" announcement with a 2-minute screen recording. |
| V2 | Release feedback. Sri gives feedback on the last 2 weeks of done tasks so everyone sees how it works. |
| V3 | Attendance **trial week**: everyone checks in/out; records are kept but not reported. Fix IP ranges/geofence issues. |
| V4 | Attendance goes live on the 1st of the next month. Paper/Excel register stops. |
| V5 | Certificates: issue to the current intern batch at batch end; test the QR code from a phone outside the office network. |

**Adoption metrics to watch (Admin dashboard):** weekly active users %, messages/day in app, update compliance %, follow-ups answered %, median reply time, **(v1.1) check-in rate, feedback coverage %, % of tasks with an estimate**. Target by R4: ≥ 90% weekly active.

---

## 24. Later (not in v1)

- Personal request link `/request/sri` (no login, tracking link, PIN, spam limits) and per-team links.
- Voice note → task (local Whisper), and Telugu speech.
- Helpdesk with ticket numbers and SLAs per campus.
- Knowledge bot answering from Docs + Links (local embeddings).
- Optional GitHub/GitLab webhooks for commits and PRs.
- Dark mode, Telugu UI.
- Merge into UOS with single sign-on.
- **(v1.1 → Later)** Leave balances and accrual; payroll export; shift rosters; biometric device import; certificate "Add to LinkedIn" button; 360° peer feedback; to-do sharing between users.
- ~~Intern completion certificates (PDF from final JPA)~~ → **moved into v1.1 as F-CERT**.

---

## 25. Open decisions (answer before the named phase)

| # | Question | Default if not answered | Needed by |
|---|---|---|---|
| D1 | JPA/JPR meanings (Section 2) | Appraisal / Progress Report | Phase 6 |
| D2 | Working days & hours | Mon–Sat, 09:00–18:00 | Phase 2 |
| D3 | Senior people list | CEO, COO, VC, Janardhan sir | Phase 4 |
| D4 | JPA weights (13.2) | As listed (v1.1 weights) | Phase 6 / 7h |
| D5 | Server & domain for production | Any 4-core/16 GB Linux box; your domain | Phase 6 |
| D6 | Will leadership offices get Guest logins? | Yes, request-only | Rollout R4 |
| **D7 (v1.1)** | Attendance verification: office IP, location, both, or none? Office IP ranges per campus? | Office IP; location optional; Remote only with flag | Phase 7f |
| **D8 (v1.1)** | Certificate URL: which domain for verify links (A: app domain, B: sub-domain of college site such as `certificates.smru.edu.in`, C: redirect page on college site)? Which college website URL to print? | B if the college web team agrees, otherwise A; print `https://smru.edu.in` | Phase 7g |
| **D9 (v1.1)** | Who gives task feedback: Admin only, or Admin + Leads? | Admin + Leads (team only) | Phase 7e |
| **D10 (v1.1)** | Office start, grace minutes, half-day hours, absent cut-off | 09:00, 15 min, 4 h, 11:00 | Phase 7f |
| **D11 (v1.1)** | Is attendance tracked for Admin (Sri) too? | Yes (can be turned off per user) | Phase 7f |
| **D12 (v1.1)** | Certificate types, wording and signatories (names, designations, signature images, college logo) | Internship completion + Appreciation; signed by Sri (IT Manager) | Phase 7g |
| **D13 (v1.1)** | Holiday list for 2026–27 (national + regional + campus-specific) | Admin enters or imports CSV | Phase 7c |

---

## 26. Appendix

### 26.1 `.env.example`

```
DATABASE_URL=postgresql://icc:icc@db:5432/icc
AUTH_SECRET=generate-with-openssl-rand-base64-32
APP_URL=https://cc.example.in
TZ=Asia/Kolkata
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@example.in
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=qwen2.5:7b-instruct
AI_ENABLED=true
UPLOAD_DIR=/data/uploads
REPORT_DIR=/data/reports
SEED=false
# v1.1
CERT_DIR=/data/certificates
VERIFY_BASE_URL=https://cc.example.in/verify
COLLEGE_WEBSITE_URL=https://smru.edu.in
TRUST_PROXY=true
```

`VERIFY_BASE_URL` and `COLLEGE_WEBSITE_URL` are defaults; Admin can change them in Settings (Settings wins).

### 26.2 `docker-compose.yml` (outline)

```yaml
services:
  db:      { image: postgres:16, volumes: [pgdata:/var/lib/postgresql/data], env_file: .env, restart: unless-stopped }
  app:     { build: ., command: node server.js, ports: ["3000:3000"], depends_on: [db], volumes: [data:/data], env_file: .env, restart: unless-stopped }
  worker:  { build: ., command: node worker.js, depends_on: [db], volumes: [data:/data], env_file: .env, restart: unless-stopped }
  ollama:  { image: ollama/ollama, volumes: [ollama:/root/.ollama], restart: unless-stopped }
  backup:  { image: postgres:16, command: /backup.sh, volumes: [backups:/backups, data:/data:ro], depends_on: [db], restart: unless-stopped }
volumes: { pgdata: {}, data: {}, ollama: {}, backups: {} }
```

After first start: `docker compose exec ollama ollama pull qwen2.5:7b-instruct` and `npx web-push generate-vapid-keys` → put keys in `.env`.

**(v1.1)** No new containers are needed. `/data/certificates` lives on the existing `data` volume. If the app is private and only `/verify` must be public, configure the reverse proxy to forward only `/verify`, `/verify/*` and the static assets it uses (`/_next/static/*`, `/fonts/*`, `/brand/*`) from the public domain in D8.

### 26.3 First prompt to start coding (Phase 0)

```
Read SPEC.md and RULES.md fully. We are starting Phase 0 (Setup).
Create: Next.js 15 + TypeScript strict + Tailwind + shadcn/ui project; Prisma with the
schema in SPEC §15; server.ts (Next + Socket.IO) and worker.ts (pg-boss) entry points;
Dockerfile and docker-compose.yml per SPEC §26.2; .env.example; npm scripts for dev,
build, lint, typecheck, test, db:migrate, db:seed; an app shell with the sidebar from
SPEC §4.1 (pages can be empty) using tokens from SPEC §18; /api/health.
Give me a numbered plan and the file list. Do not write code until I say "go".
```

### 26.4 Prompt pattern for every later feature

```
Read SPEC.md and RULES.md. Phase N, Track X.
Build F-XXX-01 to F-XXX-0N only. Match the prototype screen "<name>".
Plan first: files, service functions, server actions, tests. Wait for "go".
Then build step by step; after each step run typecheck, lint and tests.
```

### 26.5 Prompts for Phase 7 (v1.1) — the app already exists

**Step 7a — schema & settings (run first, once):**

```
Read SPEC.md (v1.1) and RULES.md fully. The v1.0 app (Phases 0–6) is already built and working.
We are in Phase 7, step 7a, Track H.
1. Compare prisma/schema.prisma with SPEC §15. List every v1.1 difference (new enums, models,
   fields, indexes). Changes must be additive only (RULES 16).
2. Plan migrations in this order: v11_task_duration, v11_calendar_holidays, v11_todo,
   v11_feedback, v11_attendance, v11_certificates.
3. Plan F-AUTH-10 (v1.1 settings screen sections) and F-AUTH-11 (remote-allowed flag),
   and the npm script db:seed:v11 per SPEC §20.
Show the plan, the Prisma diff and the file list. Do not write code until I say "go".
After building, run typecheck, lint, all tests and e2e flows 1–6 and show me the results.
```

**Steps 7b–7g — one feature group per session:**

```
Read SPEC.md (v1.1) and RULES.md. Phase 7, step <7b|7c|7d|7e|7f|7g>, Track H.
The v1.0 app is live — do not change behaviour outside this scope (RULES 14, 16, 17).
Build <F-DUR-01…08 | F-CAL-08…16 | F-TODO-01…11 | F-FB-01…10 | F-ATT-01…14 + F-UPD-05 | F-CERT-01…11> only.
Also include, for this feature only: its permission rows (§3.2), nav item (§4.1),
command intents (§8.3) with corpus sentences (§8.6), notifications (§12.4), jobs (§17)
and seed data (§20).
Plan first: files, service functions, server actions, jobs, unit tests, and the e2e flow
from §21 that covers it. Wait for "go".
Then build step by step; after each step run typecheck, lint and tests.
Finish by running all tests and e2e flows 1–6 plus the new flow, and show me the results.
```

**Step 7h — reports & wiring:**

```
Read SPEC.md (v1.1) and RULES.md. Phase 7, step 7h.
Update KPIs (§13.1 v1.1 rows), JPA weights and components (§13.2), JPR columns (§13.3),
My progress (§13.4), report presets and sections (§13.5), Morning brief and Evening wrap
(F-NOTIF-04, 05), My Space cards F-MY-06…11 and Console cards F-CON-07, 08.
Every new formula needs Vitest tests with the seed data. Plan first; wait for "go".
Finish with all e2e flows 1–11 passing.
```

---

*End of SPEC.md — v1.1. Change log goes below this line.*

## Change log

**v1.1 — 28 Sep 2026** (requested by Sri after the v1.0 demo)
- Added **To-do list with schedule** (§10.4, F-TODO-01…11, `TodoItem`, `TodoList`).
- Added **Full calendar with all dates**: full month grid, year view, day panel, date navigation, shared date picker, holiday calendar, layers (§12.1, F-CAL-08…16; `Holiday.type`, `Holiday.campusIds`).
- Added **Attendance protocol**: check-in/out, verification, status rules, regularisation, leave types and approval, register and exports (§10.5, F-ATT-01…14; `AttendanceRecord`, `AttendanceRegularization`; `Leave` and `Campus` fields).
- Added **Task feedback by Admin** on tasks assigned to individuals (§7.5, F-FB-01…10, `TaskFeedback`, `Task.feedbackState`).
- Added **Dynamic certificates linked to a verification URL and the college website**, with QR code and public verify page (§13.6, F-CERT-01…11; `CertificateTemplate`, `Certificate`, `CertificateCounter`). Removed "Intern completion certificates" from Later.
- Added **Task duration**: estimates, planned span, timer, manual time logs, actual vs estimate, timesheets, work/lead time (§7.4, F-DUR-01…08; `TimeLog`, `Task.workStartedAt`, `Task.actualMinutes`).
- Updated: glossary, personas, permission matrix, navigation, settings (F-AUTH-10, 11), command intents and corpus (≥ 210), notifications, KPIs, JPA weights, JPR, report sections, jobs, design tokens, NFRs, seed, e2e flows 7–11, RULES 16–19, Track H and Phase 7, rollout steps V1–V5, open decisions D7–D13, Phase 7 prompts (§26.5).

**v1.0 — 24 Sep 2026** — first complete spec.
