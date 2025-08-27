# 🛠️ Developer Onboarding Guide

## 1. Prerequisites

- **Git** (with access to your GitHub repo)
- **Node.js** (v18+ recommended)
- **npm** (v8+ recommended)
- **WSL** (Windows Subsystem for Linux, Ubuntu or similar)
- (Optional) **VS Code** with the Remote - WSL extension

---

## 2. Clone the Repository

```sh
git clone https://github.com/Darlinghurst56/Master.git
cd Master/y
```

---

## 3. Install Dependencies (in WSL)

```sh
cd /mnt/d/Projects/y   # Or wherever you cloned the repo
rm -rf node_modules package-lock.json
npm install
```

---

## 4. Build All Apps

```sh
npm run build
```

---

## 5. Run in Development Mode

To start all apps in dev mode:
```sh
npm run dev
```
To run a specific app (e.g., TaskmasterAI):
```sh
cd apps/taskmaster-ai
npm install
npm start
```
Or, from the monorepo root:
```sh
npm run dev -- --filter=taskmaster-ai
```

---

## 6. Testing

To run all tests:
```sh
npm test
```
To test a specific app:
```sh
npm test -- --filter=houseai
```
(See TESTING.md for more details.)

---

## 7. Project Structure

- `apps/houseai` – Google integration, home server logic
- `apps/family-dashboard` – Family dashboard UI, DNS widgets
- `apps/taskmaster-ai` – Multi-agent coordination, agent registry
- `packages/` – Shared UI, config, and linting packages
- `README.md`, `ARCHITECTURE.md`, `TESTING.md` – Documentation

---

## 8. Best Practices

- Always work in a new branch for features or fixes.
- Run `npm install` after pulling new changes.
- Use `npm run build` and `npm test` before pushing.
- Keep documentation up to date.
- Use the task list to track progress and avoid duplication.

---

## 9. Troubleshooting

- If you see errors about missing binaries or dependencies, run `rm -rf node_modules package-lock.json && npm install` in WSL.
- For platform-specific issues, always prefer WSL over native Windows for this repo.
- If you have issues with scripts, check the `package.json` in the app or root.

---

## 10. CI/CD

- The repo includes a CI/CD pipeline for automated testing and deployment (see `.github/workflows/` or ask the team for details).

---

## 11. Getting Help

- Check the README.md and ARCHITECTURE.md for project details.
- Use the task list for current priorities.
- Ask in the team chat or open a GitHub issue for support.

---

**Welcome aboard! 🚀** 