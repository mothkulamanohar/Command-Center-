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
