# Agent Development & Execution Guide

> **Framework**: UPER-S ⚡ | Goal-Oriented Agents 🎯 | Analysis Swarm 🐝 | Testdata-Builder 🧪

This document defines how AI agents interact with, analyze, and extend the codebase in this repository — ensuring **clarity**, **security**, **repeatability**, and **testability**.

---

## 🧭 1. Core Methodology: UPER-S

| Phase          | Description                                                          | Agent Focus                                                                      |
| -------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Understand** | Read and interpret existing code/configuration before acting.        | Context gathering (imports, dependencies, architecture).                         |
| **Plan**       | Define clear goals, constraints, and change boundaries.              | Task breakdown, impact analysis, risk mapping.                                   |
| **Execute**    | Implement minimal, high-quality, traceable changes.                  | Code modifications, refactoring, feature injection.                              |
| **Review**     | Validate correctness, run tests, document results.                   | Structured test execution, error logging, reporting.                             |
| **Secure**     | Apply security, performance, and stability checks before finalizing. | Validate input handling, serialization, error boundaries, and hashing protocols. |

> 🔐 _No agent modifies code without going through all UPER-S steps._

---

## 🧠 2. Goal-Oriented Agents

Agents must work with **specific, measurable objectives**, never with vague intentions.
Each agent declares:

- **Objective:** Clear, outcome-based goal
- **Scope:** File(s), component(s), or layer(s) affected
- **Constraints:** Security, performance, UX, regulatory requirements
- **Validation:** How correctness is verified

### Analysis Swarm Roles

| Agent        | Purpose                                                                  | Typical Use Case                                                      |
| ------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **RYAN**     | Rapid Yield Analysis Node                                                | Fast context scanning, dependency mapping                             |
| **FLASH**    | Focused Logic Analyzer for Systemic Heuristics                           | Identifies optimization opportunities, anti-patterns                  |
| **SOCRATES** | Semantic Operations & Code Reasoning Agent for Traceable Execution Steps | In-depth reasoning, architectural decisions, documentation generation |

---

## 🧪 3. Testdata-Builder Pattern

All tests and generated data must be:

- **Deterministic** – predictable and reproducible
- **Composable** – reusable for multiple scenarios
- **Isolated** – no leaking state across tests
- **Documented** – clear builders for entities and edge cases

✅ Use `TestdataBuilder` utilities for:

- Database test records
- Authentication flows
- E2E scenario seeding
- Frontend state snapshots

> ❌ Never hardcode raw test data inside test files.

---

## ⚡ 4. Commands & Execution

| Task                     | Command(s)                                  | Notes                                                  |
| ------------------------ | ------------------------------------------- | ------------------------------------------------------ |
| Run worker tests         | `npm run test:worker`                       | Do not use bare `vitest` commands.                     |
| Run frontend tests       | `npm run test:frontend`                     | Uses structured test configuration.                    |
| E2E tests (requires dev) | `npm run dev:frontend` → `npm run test:e2e` | Uses fixed `http://localhost:5173`.                    |
| Linting & formatting     | `npm run lint`                              | Enforced via prettier config (double quotes required). |

---

## 🧰 5. Code Style, File Size & Security Standards

- Use **double quotes** for strings → enforced by Prettier.
- Use `safeJsonParse()` from `worker/src/lib/json.ts` for all DB column deserialization.
- Use `serializeError()` from `worker/src/lib/json.ts` to log errors with structured metadata.
- Password hashing uses **PBKDF2 with 100,000 iterations** in `worker/src/auth.ts` → do **not** replace with default crypto libs.

### 📏 File Size Limit

- **Maximum 500 lines of code (LOC) per file.** This repository enforces a hard guideline: keep each source file ≤ **500 LOC**.
- **Rationale:** smaller files improve readability, make code reviews faster, reduce cognitive load for agents (and humans), and align with modular design principles.
- **If a file grows beyond 500 LOC:**
  - Split responsibilities into modules (e.g., utils, services, adapters, components).
  - Extract complex logic into well-named functions or classes and place them in separate files.
  - Add higher-level orchestration files that compose smaller modules.

> Tip: When splitting frontend components, prefer composition over large monolithic components. For backend, separate database access, business logic, and HTTP handlers.

---

## 📊 6. Review & Verification Checklist

- [ ] UPER-S phases completed
- [ ] Agent objective declared and logged
- [ ] All changes covered by tests using Testdata-Builder
- [ ] No direct `JSON.parse` or unstructured error logs
- [ ] Security & hashing rules respected
- [ ] Prettier & lint checks passed
- [ ] Swarm analysis report (RYAN → FLASH → SOCRATES) recorded if applicable
- [ ] **All modified or new files ≤ 500 LOC**

---

## 🧭 7. Recommended Workflow

```
[Understand]
   ↓
[Plan Goal & Constraints]
   ↓
[Execute Small, Traceable Change]
   ↓
[Run Testdata-Builder Tests]
   ↓
[Review + Swarm Analysis]
   ↓
[Secure + Merge]
```

> 🪐 _Agents act as specialists in a coordinated swarm, not generalists acting blindly._
