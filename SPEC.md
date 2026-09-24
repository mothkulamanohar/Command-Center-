# IT Command Center — Final Product & Build Spec (v1.0)

> **Read this first, every session.** This file is the single source of truth for building the IT Command Center. If code and this spec disagree, the spec wins until the spec is changed. Owner: **Sri (IT Manager)**. Last updated: 24 Sep 2026.

---

## 0. How to use this file

- Put this file in the repo root as `SPEC.md`. Put `RULES.md` (Section 22) next to it.
- Every AI coding session starts with: *"Read SPEC.md and RULES.md. We are in Phase N. Build feature X only. Plan first, no code."*
- Every feature has **IDs** (e.g. `F-TASK-03`). Use them in branch names, commit messages and task titles: `git commit -m "F-TASK-03: whose-turn toggle"`.
- Every feature has **acceptance criteria (AC)**. A feature is done only when all its AC pass and the Definition of Done (Section 21) is met.
- Words in **bold monospace** like **`Task`** are database models (Section 15).

---

## 1. Product in one paragraph

A private, self-hosted web app (installable on phones as a PWA) where Sri and his team run all their work: tasks from anyone, follow-ups sent automatically on Sri's behalf, teams and campuses, group chat, daily updates, calendar, docs, a Dev Hub for software work, and reports (weekly KPI, JPA, JPR, personal progress) that download in one click for the CEO, COO and VC. Everything is typed in plain English through a command bar. It replaces WhatsApp groups, Excel trackers and hand-made weekly reports for the team.

### 1.1 Goals (measurable)

| # | Goal | Target | Measured by |
|---|---|---|---|
| G1 | Nothing asked of Sri gets lost | 100% of leadership asks logged as tasks | Tasks with `source=LEADERSHIP` vs asks |
| G2 | Less chasing by hand | 80% of follow-ups sent by the app, not Sri | `FollowUp` sent count |
| G3 | Weekly report time | < 5 minutes (was hours) | Time from open Reports → download |
| G4 | Team moves off WhatsApp for work | 90% of work messages inside the app by week 4 of rollout | Messages/day in app |
| G5 | Daily update compliance | ≥ 90% | Section 13 KPI |

### 1.2 Non-goals for v1

- No WhatsApp, Telegram, SMS, Google, Microsoft or paid AI APIs. **Zero external services.**
- No student records, fee data, exam data or passwords stored in this app.
- No public sign-up. Accounts are created by an Admin.
- No native iOS/Android app (PWA only).
- Personal request link, voice-to-task, GitHub sync, helpdesk ticket numbers, UOS merge → **Later** (Section 24).

### 1.3 Hard constraints

1. **Self-contained:** runs with `docker compose up` on one machine: app + PostgreSQL + Ollama. Works with no internet except to reach the server.
2. **Private:** Sri's own app, not an SMRU system. Keep university-sensitive data out.
3. **Plain English first:** every create/read/update/delete and every follow-up can be done from the command bar.
4. **Works without AI:** a rule-based parser handles all standard sentences. The local model is only a fallback. If Ollama is down, nothing breaks.
5. **Mobile first for team members,** desktop first for Sri's console.

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

> ⚠️ **Confirm with Sri:** JPA = Job Performance Appraisal and JPR = Job Progress Report. If SMRU uses different meanings, change Section 13 only.

---

## 3. Users and roles

### 3.1 Personas

| Persona | Example | What they need | Main screen |
|---|---|---|---|
| **Admin / Owner** | Sri | See everything, capture asks from leadership, delegate, chase, report upward | Console |
| **Lead** | Hari (IT Coordinator), campus leads | Run their team, review updates, assign tasks, see team progress | My Space + Teams |
| **Developer** | Dev · Web, Dev · Backend | Know what to build, report progress, log bugs, get reviews | My Space + Dev Hub |
| **Intern** | Web batch interns | Clear tasks, learning docs, a mentor, credit for work | My Space |
| **Member** | Support staff, campus IT | Tasks, updates, chat | My Space |
| **Guest** | CEO/COO/VC office, other departments, vendors (optional) | Raise requests, see status of their requests, view shared reports | Requests page |

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

Implement as `can(user, action, resource?)` in `lib/auth/can.ts`. **Every** server action and API route calls it. UI hides what `can` denies, but the server is the real guard.

---

## 4. Information architecture

### 4.1 Navigation (desktop sidebar / phone bottom bar)

| Order | Item | Admin | Lead | Dev | Member | Intern | Guest | Phase |
|---|---|---|---|---|---|---|---|---|
| 1 | Console | ✔ | – | – | – | – | – | 2 |
| 2 | My Space | ✔ | ✔ | ✔ | ✔ | ✔ | – | 2 |
| 3 | Inbox | ✔ | ✔ | ✔ | ✔ | ✔ | – | 2 |
| 4 | Teams | ✔ | ✔ | ✔ | ✔ | ✔ | – | 1 |
| 5 | Chat | ✔ | ✔ | ✔ | ✔ | ✔ | limited | 3 |
| 6 | Calendar | ✔ | ✔ | ✔ | ✔ | ✔ | – | 5 |
| 7 | Dev Hub | ✔ | ✔ | ✔ | view | view | – | 5 |
| 8 | Docs | ✔ | ✔ | ✔ | ✔ | ✔ | shared | 5 |
| 9 | Reports | ✔ | ✔ | own | own | own | shared | 6 |
| 10 | Setup | ✔ | teams | – | – | – | – | 1 |
| 11 | Settings | ✔ | – | – | – | – | – | 1 |
| – | Requests (guest home) | – | – | – | – | – | ✔ | 2 |

Phone bottom bar shows 4 items + "More": Home (Console or My Space), Inbox, Chat, More.

### 4.2 Global UI elements (on every screen)

- **Command bar** (`/` or `Ctrl/Cmd+K`, and a fixed input on Console).
- **Notification bell** with unread count.
- **Quick add (+)**: Task, Request, Update, Message.
- **Search** (inside command bar: typing `?` or "find ...").
- **Toast** area for confirmations with **Undo** (10 seconds) on every delete, done, delegate, decline.

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

---

## 6. Module: Setup — Campuses, Team types, Teams (`F-ORG`)

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-ORG-01 | Campuses CRUD | Fields: name, short code, support mode (On-site / Remote), lead, address (optional). Can't delete a campus that has teams; archive instead. |
| F-ORG-02 | Team types CRUD | Built-in: Campus team, Implementation, Dev team, Interns, Support. Admin adds custom types with: name, color, **stages** (e.g. "Data collected → Trained → Go-live") and **custom fields** (text, number, date, select). |
| F-ORG-03 | Teams CRUD | Fields: name, type, campus (or "All campuses"), lead, members, start/end date (interns), description. **Creating a team auto-creates its chat group** (`#team-slug`) and a Docs folder. |
| F-ORG-04 | Team membership | Roles inside team: Lead, Member. One user can be in many teams. Leaving a team keeps their history. |
| F-ORG-05 | Implementation tracker | For Implementation-type teams: rows = campuses, columns = the type's stages; each cell has status (Not started / In progress / Done / Blocked), date and owner. Shows % complete per campus. |
| F-ORG-06 | Intern batches | Interns-type teams show batch dates, mentor per intern, days left, evaluation due date (end date − 7 days → task for lead to complete JPA). |
| F-ORG-07 | Teams screen | Card per team: type chip, campus, lead, members count, progress %, open tasks, flags (overdue, blocked, missed updates), last update time. Click → Team page with tabs: Board, Members, Updates, Chat, Links, Docs, Reports. |
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
| estimateHours | number (optional) | |
| checklist | JSON | [{text, done}] |

### 7.2 The three lists (computed, never stored)

For the signed-in user **me**, open = status not in (DONE, CANCELLED):

- **I owe** = open tasks where (`mode=SOLO` and `ownerId=me`) or (`mode=SHARED` and `turnUserId=me`).
- **I'm chasing** = open tasks where (`requesterId=me` or `createdById=me`) and `ownerId≠me` and `mode=SOLO`.
- **Shared** = open tasks where `mode=SHARED` and me ∈ {ownerId, partnerId}. Card shows "Your turn: …" or "Their turn: …".

Sort each list: overdue first → due soonest → priority → oldest.

### 7.3 Features

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-TASK-01 | Create task | From Quick add, command bar, inbox, chat message ("Make task"), Dev Hub bug, or recurring rule. Only title is required. |
| F-TASK-02 | Edit inline | Click title/due/owner/status on any card to edit in place. Saves on blur. Shows "Saved". |
| F-TASK-03 | Whose-turn toggle | On a SHARED task, "Pass the ball" button flips `turnUserId` and asks for a one-line note. The other side gets a notification. |
| F-TASK-04 | Status flow | TODO → IN_PROGRESS → IN_REVIEW → DONE. BLOCKED from any state (reason required). Reopen DONE → TODO (logs reason). |
| F-TASK-05 | Mark done | Checkbox or "done" command. Stops all follow-ups on that task. Notifies requester: "✔ Done: <title> by <name>". Undo within 10 s. |
| F-TASK-06 | Delete | Soft delete (`deletedAt`). "Are you sure?" dialog. Undo 10 s. Admin can restore from Trash for 30 days. |
| F-TASK-07 | Comments & activity | Thread under each task: comments, @mentions, attachments, and an automatic activity log (status changes, due changes, follow-ups sent, replies). |
| F-TASK-08 | Subtasks & checklist | One level of subtasks with their own owner/due. Parent shows "3/5 done". |
| F-TASK-09 | Recurring tasks | Daily / weekdays / weekly on day X / monthly on day N. Next instance is created when the current one is done or at its due time, whichever is first. |
| F-TASK-10 | Views | List (default), Board (by status), Calendar, and "By person" (for leads). Filters: owner, requester, team, campus, project, status, priority, due range, tag, source. Save a filter as a named view. |
| F-TASK-11 | Bulk actions | Select many → change owner, due date, status, priority, delete. |
| F-TASK-12 | Due-date rules | Past due and open → red "Overdue by N days". Due today → amber. Due in ≤ 2 days → shows on Morning brief. |
| F-TASK-13 | Task link | Every task has a short ID (`T-1042`) and a URL. Typing `T-1042` in chat or docs makes a live link chip showing status. |
| F-TASK-14 | Leadership asks | Tasks with requesterName/requester in the **Senior people list** get `source=LEADERSHIP`, priority HIGH, and appear in the "Leadership requests" report section. |
| F-TASK-15 | Stale detection | Open task with no activity for 3 working days → "Stale" badge; appears in Morning brief under "Stuck". |

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
7. **Destructive intents** (delete, remove member, decline) always show a confirm step.
8. **Execute** through the same service functions the UI uses (never separate logic).

### 8.3 Intents (must all be supported by the rule parser)

| Intent | Example sentences | Result |
|---|---|---|
| ADD_TASK | "Add: VC wants placement report by Monday", "todo renew smru.in SSL", "remind me to call CTPL tomorrow 11am" | Task owner=me; requesterName from "X wants" pattern; due parsed |
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
| QUERY_DAY | "What's my day?", "today", "what's due tomorrow" | Answer card: meetings, I owe due, chases going out |
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
| REPORT | "Download weekly report for VC", "export monthly KPI for CEO as excel", "JPA for Hari this quarter" | Report generated + download |
| OPEN | "open reports", "go to Hari's tasks" | Navigate |
| UNDO | "undo" | Undo last command (within 10 min, if reversible) |
| HELP | "help", "what can I type?" | Cheat sheet |

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
    "text": null
  }
}
```

- Validate with Zod. Reject unknown user IDs. Never execute a DELETE from LLM output without the confirm step.
- Log every LLM call (input, output, ms) in `AiLog` for tuning. Keep 30 days.

### 8.6 Test corpus

`tests/cmd/corpus.json` holds **at least 150** example sentences with expected intent + slots, including Tenglish variants ("Hari ki cheppu fee page fix cheyyi by Friday" → ASSIGN). The rule parser must pass ≥ 90% of them before Phase 2 is done.

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
| F-FU-11 | No spam | Max 1 follow-up per person per task per day; max 5 follow-ups per person per day across all tasks (bundle extras into one digest message). Quiet hours respected. |

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

## 10. Module: Console, My Space & Daily updates (`F-CON`, `F-MY`, `F-UPD`)

### 10.1 Console (Admin home)

Layout (desktop 1280+): header (date + greeting + bell) → command bar → 3 columns (I owe / I'm chasing / Shared) → row of 3 cards (Morning brief · Inbox · Follow-ups awaiting approval).

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-CON-01 | Three columns | Per Section 7.2. Each card: checkbox, title, who, due, note line (chase status / whose turn), tag. Count of open items in header. Max 8 visible, "Show all" link. |
| F-CON-02 | Chasing note | Shows cadence and last/next nudge ("Daily · next 09:30"), or red "No reply 3 days". |
| F-CON-03 | Morning brief card | Generated 08:00 daily (Section 12.4). Refresh button. |
| F-CON-04 | Today strip | Today's events and due items in time order. |
| F-CON-05 | Leadership strip | Open leadership asks with due dates, always visible at the top of I owe with a "Leadership" tag. |
| F-CON-06 | Week at a glance | Mini KPIs: tasks done this week, on-time %, chases open, requests waiting. Click → Reports. |

### 10.2 My Space (everyone's home)

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-MY-01 | My tasks | I owe list for this user, grouped Today / This week / Later / No date. |
| F-MY-02 | Follow-ups to me | Section 9.2 F-FU-10 with quick replies inline. |
| F-MY-03 | My requests | Requests I raised and their status. |
| F-MY-04 | Daily update box | Section 10.3. Shows "Posted ✔" after posting. |
| F-MY-05 | My calendar | Next 7 days list. |
| F-MY-06 | My progress | This week: done count, on-time %, update streak, kudos received. |
| F-MY-07 | My team | Team chips → team page; lead's name and a "Message lead" button. |

### 10.3 Daily updates

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-UPD-01 | Post update | Three fields: **Done**, **Next**, **Blockers** (optional). **Pre-filled** with tasks the user marked done today and tasks due tomorrow — user edits and posts. Takes < 30 seconds. |
| F-UPD-02 | Where it goes | Saved as **`DailyUpdate`**, posted as a card in each of the user's team chats (one card per day, edited in place if updated). |
| F-UPD-03 | Blockers | Each blocker line can be turned into a task for the lead with one tap. Blockers appear in the lead's and Sri's Morning brief. |
| F-UPD-04 | Reminders | 17:00 push "Post your update"; 18:00 deadline; 18:30 missed → flagged on team card and in lead's evening wrap. Not sent on holidays, leave days or for deactivated users. |
| F-UPD-05 | Leave | User marks leave (dates, optional reason). No update reminders; shows "On leave" on their avatar; follow-ups to them pause and are re-routed to their lead if urgent. |
| F-UPD-06 | Lead review | Lead sees a Team Updates page: one row per member per day, ✔/✗, and can react or comment. |
| F-UPD-07 | Streak | Consecutive working days with an update. Shown on profile and My progress. |

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
| F-CHAT-07 | Message → task/request | Action menu on any message: Make task, Make request, Add to doc. Keeps a link both ways. |
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

---

## 12. Module: Calendar, Docs, Dev Hub, Notifications

### 12.1 Calendar (`F-CAL`)

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-CAL-01 | Views | Day, Week (default), Month, Agenda. Filter: me / team / all (admin). |
| F-CAL-02 | Event types | Meeting, Deadline (from task due), Go-live, Renewal (from Dev Hub sites), Leave, Holiday. Color-coded. |
| F-CAL-03 | Create event | Title, start/end, all-day, attendees (users), location/room, notes, linked task. Attendees get an in-app invite with Accept/Decline. |
| F-CAL-04 | Tasks on calendar | Tasks with due dates appear on the due day; dragging changes the due date. |
| F-CAL-05 | Reminders | 15 min before meetings (configurable). |
| F-CAL-06 | Meeting notes | "Start notes" on an event creates a Doc from the Meeting template with attendees and open tasks between them pre-filled. Action items in notes → tasks with one click. |
| F-CAL-07 | Export | Download .ics for any event or a personal feed file (no external sync in v1). |

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
| F-DEV-02 | Build map | Table: developer · project · feature · stack · status · started · expected. One row per active feature (a task with `projectId` and tag `feature`). |
| F-DEV-03 | Sprints | 1–2 week sprints per project; board columns Backlog / In progress / Code review / Testing / Deployed. Sprint burndown (tasks remaining per day). |
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
| F-NOTIF-01 | In-app bell | Unread count; list with filters (All / Mentions / Tasks / Follow-ups / System); mark all read. |
| F-NOTIF-02 | Web Push | Self-generated VAPID keys (no outside account). Works on Android Chrome and iPhone (iOS 16.4+, app added to Home Screen). Tapping opens the exact item. |
| F-NOTIF-03 | Preferences | Per type: push / in-app only / off. Quiet hours. Digest mode (bundle non-urgent every 2 h). |
| F-NOTIF-04 | Morning brief (08:00) | For Admin and Leads: meetings today; I owe due today/overdue; leadership asks; chases going out today; replies received overnight; stuck items (stale ≥ 3 days); blockers from yesterday's updates; sites down/expiring; new requests. Text from template; optional local-AI polish (never invents numbers — numbers are filled by code). |
| F-NOTIF-05 | Evening wrap (18:30) | Done today, slipped today, missed updates, tomorrow's top 3. |
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

---

## 13. Module: Reports — KPI, JPA, JPR, My progress (`F-RPT`)

All numbers are **computed from data**, never typed in (except the lead's JPA review score and comments). Every formula has a unit test.

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

Each KPI tile shows: value, change vs previous period (↑/↓ and amount), and a sparkline of the last 8 periods.

### 13.2 JPA — Job Performance Appraisal (per person)

| Component | Source | Weight (editable in Settings) |
|---|---|---|
| Delivery | Tasks done in period vs team median (capped 0–5 scale) | 25% |
| Timeliness | On-time % → 5-point scale (≥95% = 5, ≥85 = 4, ≥70 = 3, ≥50 = 2, else 1) | 25% |
| Reliability | Daily-update compliance % → same scale | 15% |
| Responsiveness | Follow-ups answered % and avg reply time → scale | 10% |
| Quality | Reopened tasks and bugs reopened (fewer = higher) → scale | 10% |
| Lead review | Lead's score 1–5 + comments (entered in app) | 15% |

- **Overall score** = weighted average (1–5, one decimal). **Rating:** ≥ 4.3 Exceeds · ≥ 3.5 Meets · ≥ 2.5 Developing · else Needs support.
- **Recognition line:** kudos received, highlights (tasks tagged `highlight`).
- **Auto-drafted strengths & improvement areas:** generated by rules (e.g. timeliness ≥ 4 → "Consistently on time"), editable by lead.
- **Workflow:** Draft (auto) → Lead reviews and adds score/comments → Shared with person (they can add a response) → Final (locked, PDF saved).
- Interns: JPA due automatically 7 days before batch end; final JPA can generate a **completion certificate** (Later).
- Privacy: a person sees only their own JPA; leads see their team; Admin sees all.

### 13.3 JPR — Job Progress Report (per team)

| Column | Source |
|---|---|
| Team, lead | Team |
| Done / planned | tasks done in period ÷ tasks due in period |
| Progress % | done ÷ planned |
| Highlights | Top 3: tasks tagged `highlight`, go-lives, leadership asks closed (lead can edit) |
| Risks | Blocked tasks, overdue > 3 days, stale tasks, missed updates (auto) + lead notes |
| Next period plan | Tasks due next period (top 5 by priority) |
| Health | Good (no flags) · Watch (1 flag type) · Needs attention (2+) |

Implementation teams also show the stage tracker (F-ORG-05) per campus.

### 13.4 My progress (for every user; Sri's is the headline)

- Tasks completed per week (bar chart, last 12 weeks), on-time % line.
- Leadership asks: received vs closed this month.
- Areas: progress % per project/area (Websites & SEO, UOS, Voucher software, Helpdesk, Intern programme — driven by projects/tags).
- Time to first response on requests.
- Personal streak and kudos.

### 13.5 Downloads

| ID | Feature | Acceptance criteria |
|---|---|---|
| F-RPT-01 | One-click presets | **Weekly report · VC · PDF**, **Monthly report · CEO · PDF**, **Weekly pack · COO · PDF**, **Team KPI + JPR · Excel**, **JPA · person · Word/PDF**, **My progress · PDF**. One click → file downloads in < 10 s. |
| F-RPT-02 | Custom download | Choose: period (this week / last week / this month / last month / this quarter / custom dates), audience (VC / CEO / COO / Internal), scope (all / campus / team / person), sections (tick list below), written summary on/off, format (PDF / Excel / Word / CSV). Live file-name preview. "Save as preset". |
| F-RPT-03 | Sections available | Executive summary · KPIs · Leadership requests · Projects & areas · JPR per team · JPA per person · Implementation tracker · Dev Hub (builds, bugs, deployments) · Websites & renewals · Risks & blockers · Next period plan · Appendix: task list. |
| F-RPT-04 | Executive summary | 3–5 sentences built from a template with real numbers ("This week the IT team closed 38 tasks, 86% on time…"). Optional local-AI rewording; numbers are locked. Editable before download. |
| F-RPT-05 | Branding | Header: report title, period, "Prepared by Sri, IT Manager", date. Footer: page numbers. Clean A4 layout. Logo optional (Settings upload). |
| F-RPT-06 | Formats | PDF via Playwright (print HTML template), Excel via ExcelJS (one sheet per section, formatted tables, frozen header), Word via `docx`, CSV raw. |
| F-RPT-07 | Scheduled reports | Friday 17:00 prepares the weekly VC/COO pack and notifies Sri: "Weekly pack ready — review & download". (No auto-sending to leadership.) |
| F-RPT-08 | History | Every generated file saved as **`ReportRun`** with its settings; re-download or regenerate. |
| F-RPT-09 | Share inside app | Share a report with a Guest user (e.g. VC office account) → they see it in their Reports list. |
| F-RPT-10 | Command | "Download weekly report for VC", "export monthly KPI for CEO as Excel", "JPA for Hari this quarter". |

**File naming:** `IT_{Type}_{Audience}_{Scope}_{PeriodTag}.{ext}` → `IT_Weekly_VC_All_W39-2026.pdf`, `IT_JPA_Hari_Q3-2026.docx`.

---

## 14. Why the team will choose this over WhatsApp (adoption design)

The team will only switch if the app is **easier, faster and better for them**, not just for Sri. These are product requirements, not marketing.

### 14.1 What each person gets

| Person | What's better than WhatsApp |
|---|---|
| Team member / intern | One list of *exactly* what's expected and by when; no scrolling through groups to find instructions. Quick-reply buttons ("Done", "New date", "Blocked") instead of typing explanations. Work stays off their personal WhatsApp and personal number; quiet hours are respected. |
| Lead (Hari) | Sees who posted updates without asking; blockers arrive as a list; follow-ups are sent by the app so he stops being the "reminder person". |
| Developer | Build map shows their work to leadership; review requests are chased automatically; bug reports come with steps and screenshots. |
| Intern | Credit is visible: kudos, streak, JPA built from real work — useful for their certificate and CV. Onboarding guide and docs in one place. |
| Sri | Everything in one place; weekly reports in one click. |

### 14.2 Must-have "feels like WhatsApp" features (all in v1)

- Installable app icon on phone (PWA), opens straight into chat/My Space, **stays signed in** for 30 days.
- Push notifications that arrive like WhatsApp and open the exact message.
- Send a message in **≤ 2 taps** from the home screen; voice notes; photo from camera; reactions; reply; forward to another channel.
- Works on slow networks: messages queue offline and send when back (service worker + IndexedDB outbox).
- Fast: home screen interactive in < 2 s on a mid-range Android over 4G.
- Telugu/Tenglish friendly: any text accepted; command parser handles common Tenglish verbs (Section 8.6).

### 14.3 Things that make people *want* to open it

- **Streaks & kudos** (F-UPD-07, F-CHAT-14) shown on profile.
- **"My week" card** every Friday: what you finished, kudos, on-time %.
- **Less nagging:** one follow-up message with buttons replaces multiple WhatsApp pings and calls.
- **Clear credit:** "Done by Hari" appears in reports that go to the VC.
- **Fair rules:** everyone sees the same due dates, and follow-ups stop the moment work is done.

### 14.4 Rollout rules (Section 23 has the plan)

- From go-live day, **work instructions are given only in the app**; WhatsApp groups are renamed "(Personal/Emergency only)".
- Sri and leads reply to work WhatsApp messages with "Please post in the app" + the link.
- First two weeks: leads praise good updates publicly in the app (kudos).

---

## 15. Data model (Prisma schema — authoritative)

Only **Track A** edits `prisma/schema.prisma`. All IDs are `cuid()`. All tables have `createdAt`, `updatedAt`; soft-deletable tables have `deletedAt`. Times are stored in UTC and shown in the org timezone.

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
  lastActivityAt DateTime  @default(now())
  reopenCount   Int        @default(0)
  requestId     String?    @unique
  messageId     String?
  deletedAt     DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  comments      TaskComment[]
  followUps     FollowUp[]
  @@index([ownerId, status])
  @@index([requesterId, status])
  @@index([dueAt])
}

model TaskComment {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id])
  authorId  String?            // null = system/assistant
  kind      String   @default("COMMENT") // COMMENT|ACTIVITY|FOLLOWUP|REPLY
  body      Json
  createdAt DateTime @default(now())
}

model Attachment {
  id        String   @id @default(cuid())
  ownerType String   // TASK|MESSAGE|DOC|REQUEST|BUG
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
  id      String   @id @default(cuid())
  userId  String
  from    DateTime @db.Date
  to      DateTime @db.Date
  reason  String?
}

model Holiday {
  id    String   @id @default(cuid())
  date  DateTime @db.Date @unique
  name  String
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
  kind       String   @default("TEXT") // TEXT|VOICE|FILE|UPDATE|KUDOS|POLL|ANNOUNCE|FOLLOWUP|SYSTEM
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
  action    String   // CREATE|UPDATE|DELETE|LOGIN|...
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
```

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
| Calendar UI | **FullCalendar** (MIT core) |
| Charts | **Recharts** |
| Exports | **Playwright** (PDF), **ExcelJS**, **docx** |
| Search | Postgres full-text (`tsvector` + GIN index) |
| Files | Local volume `/data/uploads` (swap to MinIO later) |
| PWA | `@serwist/next` (service worker, offline shell, outbox) |
| Tests | **Vitest** (unit), **Playwright** (e2e) |
| Deploy | **Docker Compose**: `app`, `worker`, `db`, `ollama`, `backup` |

### 16.2 Folder structure

```
/app
  /(auth)/login, /change-password
  /(app)/console, /my, /inbox, /teams/[slug], /chat/[slug], /calendar,
         /docs/[space]/[doc], /dev, /dev/projects/[id], /dev/sites,
         /reports, /reports/jpa/[userId], /setup, /settings, /trash, /audit
  /api/push, /api/upload, /api/reports/[id]/download, /api/health
/components        (ui/ from shadcn, plus feature components by module)
/lib
  /auth (can.ts, session.ts)
  /db.ts
  /services  (task.ts, request.ts, followup.ts, update.ts, chat.ts, team.ts,
              event.ts, doc.ts, dev.ts, report.ts, notify.ts, kpi.ts, jpa.ts)
  /cmd (parse.ts, intents.ts, dates.ts, resolve.ts, llm.ts, execute.ts)
  /jobs (definitions + handlers)
  /ai (ollama.ts, prompts.ts)
  /export (pdf.ts, xlsx.ts, docx.ts, templates/)
/server.ts         (Next + Socket.IO)
/worker.ts         (pg-boss jobs)
/prisma/schema.prisma, /prisma/seed.ts
/tests/unit, /tests/e2e, /tests/cmd/corpus.json
SPEC.md  RULES.md  docker-compose.yml  .env.example
```

### 16.3 Service-layer rule

UI, command bar, jobs and API all call the **same functions in `/lib/services`**. Each service function: validates input (Zod) → checks `can()` → runs in a Prisma transaction → writes `AuditLog` → emits real-time events → queues notifications. No business logic in components.

### 16.4 Real-time events (Socket.IO)

Rooms: `user:{id}`, `channel:{id}`, `team:{id}`. Events: `message:new|edit|delete`, `reaction`, `typing`, `task:changed`, `notification:new`, `followup:approval`, `presence`.

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
| `backup` | daily 02:00 (backup container) | `pg_dump` + uploads tar → `/backups`, keep 14 daily + 8 weekly |

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
| Fonts | **IBM Plex Sans** (UI), **IBM Plex Mono** (IDs, command bar, times) — self-host the font files |
| Radius | 8 (controls), 10 (cards inside), 14 (panels) |
| Spacing | 4-pt scale; panel padding 18; page padding 24–32 |
| Touch targets | ≥ 44 px |
| Dark mode | v1.1 (tokens ready) |

Rules: no emoji in UI chrome (reactions are fine), status always shown as text + color, every icon-only button has `aria-label`, empty states say what to do next ("No tasks. Type one above or press +").

---

## 19. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Page interactive < 2 s on mid-range Android 4G; command bar result < 300 ms (rules), < 8 s (LLM); list queries < 200 ms at 50k tasks |
| Scale (v1) | 100 users, 50k tasks, 500k messages on a 4-core / 16 GB server (Ollama needs 8 GB) |
| Availability | Docker `restart: unless-stopped`; `/api/health` checks DB + worker heartbeat |
| Security | HTTPS only (reverse proxy with your own certificate); bcrypt; CSRF protection (Auth.js); rate-limit login & API (per IP + user); file type/size checks, files served with `Content-Disposition` and never executed; no secrets in DB; `.env` not committed; security headers (CSP, HSTS, X-Frame-Options) |
| Privacy | JPA visible only per permission matrix; audit log for every change; export of a user's own data on request |
| Backups | Daily + weekly (Section 17); **restore test once a month** (checklist task auto-created) |
| Accessibility | WCAG 2.1 AA: keyboard reachable, visible focus, labels, contrast |
| Browsers | Latest Chrome, Edge, Safari (iOS 16.4+), Firefox |
| Offline | App shell + last-loaded lists readable offline; chat messages and task checkboxes queue and sync |
| Localisation | English UI; any Unicode text (Telugu) accepted everywhere; dates DD MMM YYYY; Indian number grouping in reports |
| Logs | Structured JSON logs (pino) with request IDs; keep 14 days |

---

## 20. Seed data (for development and demo)

- Campuses: SMRU (on-site), Hyderabad group (on-site), St. Mary's Group Chebrol (remote), Guntur (remote), St. Mary's Women's (remote).
- Team types: built-ins (Section 6); UOS rollout stages: Data collected → Accounts created → Trained → Go-live → First-week support.
- Teams: SMRU campus IT (lead Hari), Hyderabad group (lead Sri), Remote support (lead Hari), UOS rollout (Implementation), Developers (Dev team), Interns · Web batch Sep '26.
- Users: Sri (Admin), Hari (Lead), Janardhan sir (Member, isSenior), Dev Web, Dev Backend (Developer), Intern Web A, Intern Web B (Intern), VC office, COO office, CEO office (Guest, isSenior).
- Sites: smru.edu.in, smru.in, St. Mary's Women's, St. Mary's Group Chebrol, St. Mary's Group (real domains filled by Sri).
- ~40 tasks across all lists and statuses, 3 requests, 3 follow-ups (one needing approval), 2 weeks of daily updates, channels with sample messages.
- All seed passwords = `ChangeMe!2026` with `mustChangePw=true`. Seed never runs in production unless `SEED=true`.

---

## 21. Definition of Done & testing

A feature is **done** only when all of these are true:

- [ ] All its acceptance criteria pass.
- [ ] Server checks `can()`; tested as Admin, Lead, Intern, Guest.
- [ ] Works on phone (390 px) and desktop (1280 px).
- [ ] Loading, empty and error states exist.
- [ ] Destructive actions confirm and offer Undo.
- [ ] Unit tests for logic (parser, dates, KPI/JPA formulas, follow-up scheduler) pass: `npm test`.
- [ ] One Playwright e2e test for the main happy path.
- [ ] No console errors; `npm run lint` and `npm run typecheck` clean.
- [ ] Audit log entry written for changes.
- [ ] Committed with the feature ID in the message.

**Critical e2e flows (must always pass before a release):**
1. Login → change password → onboarding checklist.
2. Sri types "Ask Hari to fix the fee page by Friday, chase daily" → task in Sri's I'm chasing and Hari's I owe → worker sends follow-up → Hari taps "Done" → task done, follow-up stopped, Sri notified.
3. Guest raises request → Sri delegates to Hari → guest sees "Delegated".
4. Intern posts daily update → card in team chat → lead sees ✔.
5. Sri downloads "Weekly report · VC · PDF" → file opens with correct numbers for seed data.
6. Site goes down (mock) → alert → recovers → recovery alert.

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

### 23.2 Phases (about 12 weeks, one builder with AI; faster with helpers)

| Phase | Weeks | Features | Exit test |
|---|---|---|---|
| 0 Setup | 1 | Repo, Docker Compose (app, worker, db, ollama), shell, RULES.md, CI script (lint/typecheck/test) | `docker compose up` shows the login page |
| 1 Foundation | 2 | F-AUTH-01…09, F-ORG-01…04, 07, seed | Log in as each role; sidebar differs; create team → chat group row exists |
| 2 Work engine | 3–4 | F-TASK-01…15, F-CON-01…06, F-MY-01…07, F-INBOX-01…09, F-UPD-01…07, F-CMD (rules, 150-sentence corpus ≥ 90%) | Sri runs his real day in it for 5 working days |
| 3 Talk | 5–6 | F-CHAT-01…17, F-INBOX-10, PWA install + offline outbox | Hari's team uses the app instead of WhatsApp for 5 working days |
| 4 Automation | 7–8 | F-FU-01…11, F-NOTIF-01…06, push, Ollama fallback, briefs | e2e flow 2 passes with a real phone |
| 5 Knowledge & Dev | 9–10 | F-CAL-01…07, F-DOC-01…08, F-DEV-01…11, F-ORG-05, 06 | Uptime alert reaches phone; meeting notes create tasks |
| 6 Reports & launch | 11–12 | F-RPT-01…10, §13 formulas with tests, backups + restore test, security headers, production deploy | Friday VC report downloaded from the app; restore test passed |

### 23.3 Rollout to the team (after Phase 3)

| Week | Action |
|---|---|
| R1 | Sri + Hari only. Fix friction daily. |
| R2 | Add Developers team. 20-minute demo; everyone installs the app on phone during the demo. |
| R3 | Add Interns batch + campus IT. WhatsApp groups renamed "(Personal/Emergency only)". Work instructions only in the app. |
| R4 | Remote-support campuses. Guests (leadership offices) get accounts for requests and shared reports. |
| Ongoing | Weekly 10-minute feedback in #it-team; top 3 fixes each week; publish "What's new" announcement. |

**Adoption metrics to watch (Admin dashboard):** weekly active users %, messages/day in app, update compliance %, follow-ups answered %, median reply time. Target by R4: ≥ 90% weekly active.

---

## 24. Later (not in v1)

- Personal request link `/request/sri` (no login, tracking link, PIN, spam limits) and per-team links.
- Voice note → task (local Whisper), and Telugu speech.
- Helpdesk with ticket numbers and SLAs per campus.
- Intern completion certificates (PDF from final JPA).
- Knowledge bot answering from Docs + Links (local embeddings).
- Optional GitHub/GitLab webhooks for commits and PRs.
- Dark mode, Telugu UI.
- Merge into UOS with single sign-on.

---

## 25. Open decisions (answer before the named phase)

| # | Question | Default if not answered | Needed by |
|---|---|---|---|
| D1 | JPA/JPR meanings (Section 2) | Appraisal / Progress Report | Phase 6 |
| D2 | Working days & hours | Mon–Sat, 09:00–18:00 | Phase 2 |
| D3 | Senior people list | CEO, COO, VC, Janardhan sir | Phase 4 |
| D4 | JPA weights (13.2) | As listed | Phase 6 |
| D5 | Server & domain for production | Any 4-core/16 GB Linux box; your domain | Phase 6 |
| D6 | Will leadership offices get Guest logins? | Yes, request-only | Rollout R4 |

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
```

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

---

*End of SPEC.md — v1.0. Change log goes below this line.*
