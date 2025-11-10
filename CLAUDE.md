# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AgenticLanding AI** is a full-automatic brand-compliant landing page generation platform built as an end-to-end Agentic AI workflow. This is a **greenfield project** in the planning phase, designed to transform campaign context, historical data, and brand guidelines into SEO-optimized, responsive, and Sitecore-compatible landing pages.

### Core Technology Stack (Planned)
- **Frontend**: React 18 + Next.js 14, Tailwind CSS, Framer Motion
- **Backend**: Node.js + Express, MongoDB
- **AI Core**: GPT-4o, LangChain, Pandas
- **Deployment**: Vercel (primary), Azure (secondary)
- **Integration**: Sitecore Component SDK (BYOC compatibility)

## Project Structure

This repository is currently initialized with **BMad Method** - an agile AI-driven planning and development framework. The project structure follows BMad's organized approach:

```
.
├── .bmad-core/                  # BMad framework core
│   ├── user-guide.md           # Complete BMad workflow guide
│   ├── working-in-the-brownfield.md  # Brownfield project guidance
│   ├── enhanced-ide-development-workflow.md  # Development workflow
│   └── core-config.yaml        # BMad configuration
├── .claude/commands/BMad/       # Claude Code BMad commands
│   ├── agents/                 # 10 specialized AI agents
│   └── tasks/                  # 25 task commands
├── prd.md                      # Product Requirements Document
└── CLAUDE.md                   # This file
```

## BMad Method Workflow

### Planning Phase (Current Phase)
The project is currently in the **planning phase**. Use BMad agents for structured development:

1. **Start with BMad Orchestrator**: Run `/BMad:agents:bmad-orchestrator *help` to begin the workflow guidance
2. **Available Key Agents**:
   - `/BMad:agents:analyst` - Market research and competitor analysis
   - `/BMad:agents:pm` - Product management and PRD creation
   - `/BMad:agents:architect` - System architecture design
   - `/BMad:agents:ux-expert` - UX design and frontend specifications
   - `/BMad:agents:qa` - Quality assurance and testing strategy

### Key Task Commands
- `/BMad:tasks:create-next-story` - Create development stories
- `/BMad:tasks:document-project` - Generate project documentation
- `/BMad:tasks:shard-doc` - Break down large documents into manageable pieces
- `/BMad:tasks:risk-profile` - Analyze project risks
- `/BMad:tasks:nfr-assess` - Non-functional requirements assessment

## Development Workflow

### Current Project Status
- **Phase**: Planning/Architecture design
- **Codebase**: Not yet implemented
- **Next Steps**: Complete BMad planning workflow before development

### Development Commands (To Be Implemented)
Since this is a new project, build/test commands will be established during the architecture phase. Expected commands based on planned tech stack:

```bash
# Development (to be implemented)
npm run dev          # Start Next.js development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run test suite
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## Architecture Principles

### Modular Design (Sitecore BYOC Compatible)
- **Atomic Design Pattern**: Components organized as atoms, molecules, and organisms
- **Agentic Workflow**: Input → AI Analysis → Generation → Optimization → Deployment → Output
- **Six-Layer Architecture**:
  1. Input Layer (JSON configs, historical data, brand assets)
  2. AI Analysis Layer (data insights, brand compliance)
  3. Generation Layer (React components, HTML/CSS, APIs)
  4. Optimization Layer (SEO, responsive design)
  5. Deployment Layer (Vercel/Azure, Sitecore sync)
  6. Output Layer (live URL, rationale PDF, templates)

### Core Modules (Planned)
1. **Data-Driven Generation Module** - Multi-source data ingestion and analysis
2. **Section-by-Section Control Module** - Visual page management with 7 core sections
3. **Auto Form Builder Module** - Dynamic form generation with API endpoints
4. **Template Library Module** - Structured template output and management
5. **Explainability Module** - AI rationale PDF generation
6. **One-Click Deployment Module** - Vercel/Azure deployment with Sitecore integration

## Key Features to Implement

### Conversion Optimization
- Historical campaign data analysis for layout decisions
- Intelligent CTA optimization based on emotional triggers
- Trust signal placement (client logos, certifications)

### Enterprise Compliance
- WCAG 2.1 AA accessibility standards
- GDPR/CCPA compliance features
- Brand guideline validation engine

### Integration Capabilities
- Sitecore Component SDK compatibility
- CRM/Marketing automation API integration
- Analytics auto-configuration (GA/GTM)

## Getting Started

1. **Complete Planning Phase**: Use BMad orchestrator to guide through planning workflow
2. **Architecture Documentation**: Will be generated in `docs/architecture/` by BMad agents
3. **Development Stories**: Will be created in `docs/stories/` through BMad workflow
4. **Code Implementation**: Begin after planning phase completion

## Important Notes

- This project follows **BMad Method** - always consult BMad agents before making architectural decisions
- All development should align with the PRD specifications in `prd.md`
- Sitecore BYOC compatibility is a core requirement - ensure all components follow Sitecore Component SDK standards
- The project emphasizes **explainability** - every AI decision must be traceable in the generated rationale PDFs

## Documentation

- **BMad User Guide**: [`.bmad-core/user-guide.md`](.bmad-core/user-guide.md)
- **Product Requirements**: [`prd.md`](prd.md)
- **Enhanced Development Workflow**: [`.bmad-core/enhanced-ide-development-workflow.md`](.bmad-core/enhanced-ide-development-workflow.md)
- **Brownfield Development**: [`.bmad-core/working-in-the-brownfield.md`](.bmad-core/working-in-the-brownfield.md)