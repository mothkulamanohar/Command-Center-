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
20. PROTECTED DATA: Treat all existing database records, storage (localStorage, sessionStorage, IndexedDB), and user data as strictly protected. Never run destructive db resets, seed over existing data, delete, or replace records. Fix code errors without modifying existing data. Any potentially destructive DB operation must be halted for explicit user approval.
