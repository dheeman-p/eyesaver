<!-- SYNC IMPACT REPORT
Version change: N/A (initial ratification) → 1.0.0
Modified principles: N/A — initial constitution
Added sections: Core Principles (I–IV), Technology Standards, Development Workflow, Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ reviewed — Testing field MUST be set to "Manual QA only" in plans
  - .specify/templates/spec-template.md ✅ reviewed — acceptance scenarios are manual; no automation implied
  - .specify/templates/tasks-template.md ✅ reviewed — tests are already OPTIONAL; constitution enforces exclusion
Follow-up TODOs: None
-->

# EyeSaver Constitution

## Core Principles

### I. Keep It Simple (KISS)

Every feature MUST be implemented in the simplest way that satisfies its requirements. Complexity MUST be explicitly justified — if a simpler alternative exists, it MUST be chosen. No pre-optimization, no over-abstraction, no gold-plating. Every module MUST be readable and self-evident to any frontend developer without additional explanation.

**Rationale**: A simple codebase is easier to maintain, debug, and extend. Complexity is a form of technical debt that compounds over time.

### II. Modular Architecture

The UI MUST be organized into self-contained, reusable components and modules. Each module MUST have a single, clearly defined responsibility. Shared logic MUST be extracted into utilities, hooks, or composables. Modules MUST NOT reach into the internals of sibling or unrelated modules — communication happens via explicit interfaces only.

**Rationale**: Modular code enables independent development, clear ownership, and prevents the tight coupling that makes systems brittle and hard to change.

### III. Frontend-First Development

All implementation MUST target the browser as the primary runtime. Features MUST be deliverable as pure frontend code wherever possible. Any dependency on backend services MUST be isolated into dedicated service/API modules with clearly defined interfaces, keeping UI components free of network or data-fetching logic.

**Rationale**: Separating frontend concerns from backend integration allows faster iteration, clearer boundaries, and reduces the blast radius of backend changes.

### IV. No Automated Testing

This project does NOT include unit tests, integration tests, or end-to-end automation tests. Validation MUST be performed through manual acceptance testing using the acceptance scenarios defined in each feature spec. Tasks MUST NOT include test file creation, test runner setup, or CI testing configuration. Test libraries MUST NOT be installed as dependencies.

**Rationale**: For this project scope, the overhead of test infrastructure outweighs the benefit. Correctness is validated via human review against spec acceptance criteria.

## Technology Standards

Frontend technology choices MUST follow these constraints:

- Standard web technologies (HTML, CSS, JavaScript/TypeScript) are the baseline
- Framework or library additions MUST be justified by a concrete complexity reduction
- No testing libraries, test runners, or coverage tools are to be installed
- All external dependencies MUST be evaluated for bundle size and active maintenance status before adoption
- CSS MUST follow a consistent naming convention across the entire project (BEM or utility-first — one approach per project, not mixed)
- No server-side rendering unless a clear user-facing requirement demands it

## Development Workflow

- Feature branches MUST be created before any implementation begins
- Each feature MUST have a corresponding `spec.md` approved before implementation tasks are created
- Code MUST be reviewed for KISS compliance — if a reviewer cannot understand a module's purpose within 2 minutes, it MUST be simplified
- Commits MUST be atomic and describe the intent (the "why"), not just the mechanical change
- UI changes MUST be manually validated against the acceptance scenarios in the feature spec before merging

## Governance

This constitution supersedes all other development practices for the EyeSaver project. Amendments MUST be documented with a version increment and committed to the repository. Amendments follow semantic versioning:

- **MAJOR**: Removal or fundamental redefinition of a core principle
- **MINOR**: Addition of a new principle or material expansion of existing guidance
- **PATCH**: Clarifications, wording corrections, and non-semantic refinements

All pull requests MUST include a constitution compliance check before merge. Violations MUST be resolved, not bypassed. The constitution is the single source of truth for architectural and process decisions.

**Version**: 1.0.0 | **Ratified**: 2026-05-27 | **Last Amended**: 2026-05-27
