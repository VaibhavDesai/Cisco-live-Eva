# Webex AI Agent Studio

A front-end prototype for designing, configuring, and managing AI agents within the Cisco Webex ecosystem. Built with React 19, TypeScript, and the [Momentum Design System](https://momentum.design).

## Prerequisites

- **Node.js** >= 18 (LTS recommended)
- **npm** >= 9

## Getting Started

### 1. Clone the repository

```bash
git clone git@github-cisco:webexdesign/ai-agent-studio.git
cd ai-agent-studio
```

### 2. Install root dependencies

The root `package.json` contains Momentum Design packages used across the project.

```bash
npm install
```

### 3. Install and run the web app

```bash
cd web
npm install
npm run dev
```

The dev server starts at **http://localhost:5173** (or the next available port).

### 4. Build for production

```bash
cd web
npm run build
```

Output is written to `web/dist/`.

### 5. Preview production build

```bash
cd web
npm run preview
```

## Available Scripts (inside `web/`)

| Script        | Description                                 |
| ------------- | ------------------------------------------- |
| `npm run dev` | Start Vite dev server with HMR              |
| `npm run build` | Type-check and build for production       |
| `npm run preview` | Preview the production build locally    |
| `npm run lint` | Run ESLint                                 |
| `npm run deploy` | Build and deploy to GitHub Pages         |

## Project Structure

```
ai-agent-studio/
├── web/                    # Primary application
│   ├── src/
│   │   ├── assets/         # Images, illustrations, SVGs
│   │   ├── components/     # Reusable UI components
│   │   │   ├── brand/      # Cisco/Webex logos and marks
│   │   │   ├── layout/     # Header, Sidebar, MainLayout
│   │   │   ├── shared/     # Design system primitives (Button, Modal, Table, etc.)
│   │   │   └── agents/     # Agent-specific components
│   │   ├── contexts/       # React context (AppContext)
│   │   ├── icons/          # Momentum icon loader and catalog
│   │   ├── pages/          # Route-level page components
│   │   │   └── agent/      # Agent configuration, sessions, history, analytics
│   │   ├── tokens/         # CSS custom property token files
│   │   ├── index.css       # CSS entry point (imports all layers)
│   │   ├── tokens.css      # Semantic token aliases
│   │   ├── components.css  # Component and layout styles
│   │   ├── app-background.css
│   │   ├── App.tsx         # Root component with routing
│   │   └── main.tsx        # Application entry point
│   ├── public/             # Static assets
│   ├── vite.config.ts      # Vite configuration
│   ├── tsconfig.json       # TypeScript configuration
│   ├── vercel.json         # Vercel SPA routing config
│   └── package.json
├── web-v1/                 # Archived v1 of the UI (not actively deployed)
├── ia-deliverables/        # Design deliverables and wireframes
├── .cursor/                # Cursor IDE rules and skills
└── package.json            # Root dependencies (Momentum Design packages)
```

## Design System

The app uses the **Momentum Design System** (dark Webex theme):

- **Tokens**: CSS custom properties from `@momentum-design/tokens`, extended with local aliases in `src/tokens/` and `src/tokens.css`.
- **Icons**: SVGs from `@momentum-design/icons`, loaded at runtime via a custom `<Icon>` component (avoids Lit web components in React 19).
- **Fonts**: CiscoSans via `@momentum-design/fonts`.
- **Components**: Custom React components in `src/components/shared/` built on top of Momentum tokens.

## Deployment

The app is configured for deployment on **Vercel** (see `web/vercel.json`). An alternative GitHub Pages deploy is also available via `npm run deploy`.

## Tech Stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Framework      | React 19 + TypeScript                           |
| Build          | Vite 7                                          |
| Routing        | React Router v7                                 |
| Design System  | Momentum Design (Webex dark theme)              |
| Deployment     | Vercel / GitHub Pages                           |
