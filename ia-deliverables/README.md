# AI Agent Studio - Information Architecture Deliverables

This folder contains the IA deliverables for the AI Agent Studio product design.

## Deliverables Overview

### 1. Validation (`/validation/`)

- **[user-personas.md](validation/user-personas.md)** - Defines three primary user personas (Admin, Developer, Viewer) and validates the IA against their needs
- **[workflow-validation.md](validation/workflow-validation.md)** - Validates 5 key workflows against the IA to ensure efficient task completion

### 2. Wireframes (`/wireframes/`)

Low-fidelity HTML wireframes for all major pages:

- **[index.html](wireframes/index.html)** - Wireframe index/navigation
- **[01-dashboard.html](wireframes/01-dashboard.html)** - Dashboard overview
- **[02-agents-list.html](wireframes/02-agents-list.html)** - Agents list with filtering
- **[03-agent-overview.html](wireframes/03-agent-overview.html)** - Agent overview with deployments
- **[04-agent-configure.html](wireframes/04-agent-configure.html)** - Agent configuration (all tabs)
- **[05-agent-monitor.html](wireframes/05-agent-monitor.html)** - Analytics and sessions
- **[06-knowledge-pool.html](wireframes/06-knowledge-pool.html)** - Knowledge pool management
- **[07-connections.html](wireframes/07-connections.html)** - Third-party connections

Open any HTML file in a browser to view the wireframe.

### 3. Interactive Prototype (`/prototype/`)

- **[index.html](prototype/index.html)** - Single-page interactive prototype for usability testing

Features:
- Working navigation between all pages
- Clickable tabs and sections
- Agent selection flow
- Configuration section switching
- Toast notifications for save actions

## Key IA Decisions

### Multi-Portal Ecosystem
- AI Agent Studio is one of several standalone portals
- Channels are managed in Control Hub (not here)
- Agents are published to FlowBuilder (Digital/Voice)
- Deployments shown as read-only in agent overview

### Global Navigation
1. Dashboard - Overview of all agents and health
2. Agents - List and manage agents
3. Knowledge - Shared knowledge pool
4. Connections - Third-party services (NOT channels)
5. Organization Settings - Admin-only

### Agent Navigation
1. Overview - Status, stats, deployments (read-only)
2. Configure
   - General
   - Prompt
   - Knowledge (assignment)
   - Capabilities (Actions + MCP + Skills unified)
   - Connections (assignment)
   - Testing
3. Monitor
   - Analytics
   - Sessions
4. Changelog

### Design Principles
1. Multi-Portal Ecosystem Awareness
2. Shared Resources Model (Knowledge, Connections)
3. Unified Capabilities (Actions + MCP + Skills)
4. Read-Only Deployments
5. Agent-Centric Context
6. Assignment vs. Management pattern
7. Progressive Disclosure
8. Status Visibility
9. Separation of Concerns
10. Changelog as First-Class

## How to Use

### Viewing Wireframes
1. Open `/wireframes/index.html` in a browser
2. Click on any wireframe card to view that page
3. Use the sidebar navigation to move between pages

### Testing the Prototype
1. Open `/prototype/index.html` in a browser
2. Interact with the navigation, tabs, and buttons
3. Click on "Customer Support Bot" row to enter agent context
4. Navigate through Configure sections
5. Click "Save Changes" to see toast notification

## Next Steps

1. Review wireframes with stakeholders
2. Conduct usability testing with the interactive prototype
3. Gather feedback on the unified Capabilities concept
4. Test multi-portal mental model with users
5. Iterate based on findings
