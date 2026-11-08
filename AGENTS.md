# AGENTS.md — Developer Handbook

## 1. Project purpose

This repository contains **Developer Handbook**, a personal technical documentation website built with VitePress and Markdown. It is a practical reference for learning, installing, configuring, running, maintaining, and troubleshooting development tools and project stacks.

**This is a documentation website, not a project generator or automation CLI.** Avoid adding a backend, database, login system, or project-generation workflow unless explicitly requested.

## 2. Language and terminology

- Write all user-facing documentation, tutorials, troubleshooting guides, reviews, navigation, labels, and interface text in **Vietnamese**.
- Respond to the repository owner in **Vietnamese**, including plans, change summaries, and test results.
- Keep code, commands, package names, filenames, paths, environment variables, configuration keys, API endpoints, and technical identifiers in their original form.
- Retain common English technical terms where that is clearer (e.g., component, hook, middleware, container, image, dependency). Explain unfamiliar terms in Vietnamese.
- Use Vietnamese comments in original code examples when they help comprehension; do not translate third-party code or machine-readable syntax.
- Prefer natural, precise Vietnamese over word-for-word translations.

## 3. Repository conventions

- Documentation source: `docs/`.
- Technology guides: `docs/technologies/<technology>/`.
- Cross-stack project tutorials: `docs/project-guides/`.
- Commands, errors, and reusable references: `docs/references/`.
- VitePress config/theme: `docs/.vitepress/`.
- Prefer Markdown (`.md`) for documentation. Use Vue/VitePress components or TypeScript only when necessary for reusable functionality.
- Follow the repository's existing conventions before introducing a new structure.
- Use lowercase kebab-case for new documentation filenames and directories unless an existing convention differs.
- Keep internal links and VitePress navigation/sidebar in sync with actual pages.

## 4. Standard technology guide

When a section is relevant, cover:

1. **Overview:** What it is, its role, and when to use it.
2. **Prerequisites:** Required software, OS assumptions, and supported versions.
3. **Installation:** Commands in execution order and the directory to run them from.
4. **Project setup:** A minimal working example from an empty workspace.
5. **Configuration:** Explain important files, options, and environment variables.
6. **Project structure:** A directory tree and the purpose of key files.
7. **Common commands:** Copyable commands with short explanations.
8. **Verification:** What to run and what successful output or behavior looks like.
9. **Troubleshooting:** Symptoms, likely causes, fixes, and verification after fixing.
10. **Best practices and review:** Tradeoffs, limitations, suitable use cases, and official references.

Do not force empty sections onto topics where they do not apply. Prefer a useful, focused guide over a long but shallow one.

## 5. Project tutorial standard

A multi-technology guide should state its outcome, stack, prerequisites, exact setup sequence, working-directory context, sample environment configuration, launch commands, verification steps, and common failure cases. Link to individual technology guides rather than copying large sections.

Clearly distinguish **local development**, **testing**, and **production deployment**. Where setup differs by operating system or shell, label the examples (for example, Windows PowerShell versus macOS/Linux Bash).

## 6. Technical accuracy and references

- Prioritize official documentation and primary sources. Provide links to the relevant official pages.
- Check current commands, package versions, and compatibility when source access is available. Do not assume an old tutorial remains correct.
- State version assumptions where relevant, and avoid hardcoding an unverified "latest" version.
- Never invent commands, flags, APIs, error messages, benchmark results, or source citations.
- Label unexecuted examples **"Chưa kiểm thử"**; do not describe them as validated.
- Explain *why* important commands are run and how to check whether each major step succeeded.
- Do not create superficial placeholder pages and present them as completed documentation. Mark unfinished sections clearly as **"Đang biên soạn"**.
- Reuse explanations via links rather than duplicating or contradicting content.

## 7. Security and safe examples

- Never commit or display real secrets, credentials, tokens, private keys, or personal data.
- Use `.env.example` with non-sensitive placeholder values, and keep `.env` out of version control.
- Prefer least-privilege, secure-by-default examples. Do not normalize exposing admin dashboards or databases to the public internet.
- For n8n, Docker, PostgreSQL, and deployment guides, explain persistent storage, backups, secret management, and network exposure when applicable.
- Clearly warn before destructive commands (e.g., removing volumes, resetting databases, force deletion) and explain their impact.
- Separate demo-only configurations from production recommendations.

## 8. UX and accessibility

- Keep a clean, responsive, readable documentation interface with light/dark modes.
- Use descriptive titles, logical heading levels, accessible links, and syntax-highlighted copyable code blocks.
- Use Vietnamese UI labels and keep the sidebar, table of contents, search, and cross-links consistent.
- Avoid unnecessary animations, dependencies, and complex custom UI when built-in VitePress features suffice.

## 9. Implementation workflow

**Before editing**
1. Inspect the requested area, relevant `AGENTS.md` files, current configuration, and nearby documentation.
2. Identify the smallest change that satisfies the task.
3. Reuse existing patterns; do not refactor unrelated code.

**While editing**
1. Keep changes scoped and maintainable.
2. Update links, navigation, or references affected by new or renamed pages.
3. Do not overwrite substantial existing documentation without checking its purpose.
4. Avoid adding dependencies without a clear reason.

**After editing**
1. Run relevant available checks. For site/navigation changes, run `npm run build` if that script exists.
2. Review any broken links, Markdown rendering, and sample commands that can safely be tested.
3. Do not claim a check passed unless it actually ran and passed.
4. Summarize the results and any limitations in Vietnamese.

## 10. Completion report

Respond in Vietnamese with these concise sections when relevant:

- **Đã thực hiện:** What changed.
- **File liên quan:** Important files added or edited.
- **Kiểm tra:** Commands executed and their actual results.
- **Còn tồn tại:** Unverified items, limitations, or next steps.

These rules apply to all work in this repository unless a more specific nested `AGENTS.md` adds applicable local instructions. Higher-priority instructions always take precedence.
