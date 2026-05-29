# User Personas for AI Agent Studio

## Overview

This document defines the primary user personas for the AI Agent Studio and validates the Information Architecture against their needs, goals, and workflows.

---

## Persona 1: Admin (Sarah)

### Profile
- **Role**: Contact Center Administrator
- **Experience**: 5+ years in contact center operations
- **Technical Level**: Moderate - comfortable with configuration UIs, not a developer
- **Primary Goal**: Ensure AI agents are properly configured, published, and monitored across the organization

### Key Responsibilities
- Manage team access and permissions
- Review and approve agent publications
- Monitor overall agent performance
- Configure organization-wide settings
- Manage third-party service connections (Salesforce, ServiceNow)

### Pain Points
- Needs visibility into what agents are deployed and where
- Wants to ensure consistency across multiple agents
- Needs to quickly identify underperforming agents
- Concerned about security and access control

### IA Validation Checklist

| IA Element | Supports Persona? | Notes |
|------------|-------------------|-------|
| Dashboard with all agents overview | ✅ Yes | Quick visibility into all agents and their status |
| Role-based access (Admin role) | ✅ Yes | Full access to all features including Org Settings |
| Publish Agents permission | ✅ Yes | Only Admins can publish - appropriate control |
| Deployments (read-only) | ✅ Yes | Shows where agents are used in FlowBuilder |
| Organization Settings | ✅ Yes | Dedicated section for admin-only tasks |
| Knowledge Pool (global) | ✅ Yes | Centralized management reduces duplication |
| Connections (global) | ✅ Yes | Manage third-party services centrally |
| Audit Log | ✅ Yes | Track changes for compliance |

### Primary Workflows

1. **Review and Publish Agent**
   - Navigate: Dashboard → Agents → Select Agent → Overview
   - Review: Configuration Summary, Deployments, Quick Stats
   - Action: Click "Publish" or "Request Changes"
   - IA Support: ✅ All elements accessible from Agent Overview

2. **Monitor Agent Performance**
   - Navigate: Dashboard (quick view) OR Agents → Select Agent → Monitor → Analytics
   - Review: Usage metrics, success rates, response times
   - IA Support: ✅ Dashboard provides overview, Agent Analytics provides detail

3. **Manage Team Permissions**
   - Navigate: Organization Settings → Team Members
   - Action: Invite users, assign roles
   - IA Support: ✅ Clear path to team management

---

## Persona 2: Developer (Marcus)

### Profile
- **Role**: AI/ML Engineer or Solutions Developer
- **Experience**: 3+ years in software development
- **Technical Level**: High - comfortable with APIs, MCP, prompt engineering
- **Primary Goal**: Build and configure high-quality AI agents with the right capabilities

### Key Responsibilities
- Design and write system prompts
- Configure agent capabilities (Actions, MCP Servers, Skills)
- Set up knowledge sources
- Test agent behavior
- Debug issues using session logs

### Pain Points
- Needs efficient workflow for iterating on prompts
- Wants to easily add and configure capabilities
- Needs detailed session logs for debugging
- Frustrated by context-switching between tools

### IA Validation Checklist

| IA Element | Supports Persona? | Notes |
|------------|-------------------|-------|
| Configure > Prompt | ✅ Yes | Dedicated prompt editor with version history |
| Configure > Capabilities (unified) | ✅ Yes | Single place for Actions, MCP, Skills |
| Configure > Knowledge (assignment) | ✅ Yes | Easy assignment from global pool |
| Configure > Testing | ✅ Yes | Chat playground for quick iteration |
| Monitor > Sessions | ✅ Yes | Detailed session logs with debug info |
| Changelog | ✅ Yes | Version history for tracking changes |
| MCP Servers | ✅ Yes | First-class support for MCP protocol |

### Primary Workflows

1. **Create and Configure New Agent**
   - Navigate: Agents → + Create New Agent
   - Flow: General → Prompt → Knowledge → Capabilities → Testing
   - IA Support: ✅ Logical flow through Configure sub-sections

2. **Add Custom Action**
   - Navigate: Agents → Select Agent → Configure → Capabilities → Actions → + Create Action
   - Action: Define API endpoint, parameters, authentication
   - IA Support: ✅ Unified Capabilities section with clear sub-navigation

3. **Debug Agent Issue**
   - Navigate: Agents → Select Agent → Monitor → Sessions → Select Session
   - Review: Conversation transcript, tool calls, knowledge retrieval, latency
   - IA Support: ✅ Comprehensive session detail view

4. **Iterate on Prompt**
   - Navigate: Agents → Select Agent → Configure → Prompt
   - Action: Edit prompt → Save → Test in playground
   - Quick switch: Configure → Testing (same agent context)
   - IA Support: ✅ Agent-centric context maintained

---

## Persona 3: Viewer (Jennifer)

### Profile
- **Role**: Business Analyst or QA Specialist
- **Experience**: 2+ years in business analysis
- **Technical Level**: Low to Moderate - can navigate UIs but doesn't configure
- **Primary Goal**: Review agent performance and provide feedback

### Key Responsibilities
- Review agent analytics
- Analyze conversation sessions
- Identify areas for improvement
- Report issues to developers

### Pain Points
- Needs easy access to performance data
- Wants to understand agent behavior without technical details
- Needs to export data for reports
- Should not accidentally change configurations

### IA Validation Checklist

| IA Element | Supports Persona? | Notes |
|------------|-------------------|-------|
| Dashboard (view) | ✅ Yes | Overview without edit capabilities |
| Agents List (view) | ✅ Yes | Can browse and select agents |
| Monitor > Analytics | ✅ Yes | Access to performance metrics |
| Monitor > Sessions (limited) | ✅ Yes | Can view sessions with limited detail |
| Export reports | ✅ Yes | Can export analytics data |
| Read-only deployments | ✅ Yes | See where agents are used |
| No edit permissions | ✅ Yes | Role-based access prevents accidental changes |

### Primary Workflows

1. **Review Weekly Performance**
   - Navigate: Dashboard OR Agents → Select Agent → Monitor → Analytics
   - Review: Usage trends, success rates, message volume
   - Action: Export report
   - IA Support: ✅ Clear path to analytics with export option

2. **Analyze Specific Conversation**
   - Navigate: Agents → Select Agent → Monitor → Sessions → Select Session
   - Review: Conversation transcript
   - Note: Limited access to debug information (appropriate for role)
   - IA Support: ✅ Sessions accessible with role-appropriate detail level

---

## Cross-Persona Validation

### Shared Workflows

| Workflow | Admin | Developer | Viewer |
|----------|-------|-----------|--------|
| View Dashboard | ✅ | ✅ | ✅ |
| Browse Agents | ✅ | ✅ | ✅ |
| View Agent Analytics | ✅ | ✅ | ✅ |
| Configure Agent | ✅ | ✅ | ❌ |
| Publish Agent | ✅ | ❌ | ❌ |
| Manage Connections | ✅ | ❌ | ❌ |
| View Deployments | ✅ | ✅ | ✅ |

### Multi-Portal Awareness

| Portal | Admin | Developer | Viewer |
|--------|-------|-----------|--------|
| AI Agent Studio | Primary | Primary | Primary |
| Control Hub | Links out | N/A | N/A |
| FlowBuilder | Links out from Deployments | Links out from Deployments | Links out from Deployments |

---

## Validation Summary

### Strengths
1. **Clear role separation**: IA respects role-based access control
2. **Agent-centric navigation**: All personas can easily find and work with agents
3. **Unified Capabilities**: Developers benefit from consolidated Actions/MCP/Skills
4. **Multi-portal awareness**: Clear boundaries with Control Hub and FlowBuilder
5. **Progressive disclosure**: Complex features don't overwhelm simpler use cases

### Potential Improvements
1. Consider adding "quick actions" on Dashboard for common tasks per role
2. Add "recently viewed agents" for faster navigation
3. Consider role-specific dashboard views
4. Add onboarding tour for new users

### Conclusion
The Information Architecture effectively supports all three primary personas. The two-tier navigation (global + agent-level) provides appropriate structure, and the unified Capabilities section simplifies the developer workflow. The read-only Deployments feature appropriately addresses the multi-portal ecosystem.

**Validation Status**: ✅ PASSED
