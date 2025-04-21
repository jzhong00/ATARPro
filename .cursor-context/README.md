# .cursor-context – Project Context for Cursor AI

This folder contains project-specific context files used by Cursor AI to provide accurate, structured, and consistent help during development.

Each file in this folder plays a unique role in defining how the AI understands the architecture, rules, and logic of this project.

---

## 📁 Files Overview

### `architecture.md`
Describes the overall software architecture, including:
- Layered structure (utils, services, components, store)
- Rules for component flow and separation of concerns
- Migration do's and don'ts
- Mermaid diagrams showing UI-to-service-to-utils flow

### `dev_guide.md`
Outlines core business rules and technical logic:
- Domain-specific knowledge (ATAR eligibility, scaling logic)
- Mathematical formulas for score calculation
- Data structure and CSV expectations
- Validation rules and error handling
- Performance best practices and Redux store structure

### `dev_log.md`
Chronological development journal with:
- Features implemented and in-progress
- Design decisions and known issues
- Architectural changes and rationale
- Next steps for developers

### `cursorrules.json`
Compact ruleset for Cursor AI that enforces:
- Architecture boundaries
- Testing expectations
- Validation conventions
- Naming and code structure standards
- What to always do (or never do)

---

## 🧠 How Cursor Uses These

- **architecture.md** and **dev_guide.md** inform architectural and domain-specific LLM responses.
- **cursorrules.json** is always active — guiding every chat.
- **dev_log.md** helps Cursor maintain continuity and context in long projects.

---

## 💡 Tip for Collaborators

These files are your source of truth. When in doubt:
- Check `dev_guide.md` for rules
- Check `architecture.md` for structure
- Check `cursorrules.json` for AI instructions
- Log updates to `dev_log.md` as you go

