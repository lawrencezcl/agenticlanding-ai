# II. Core Function Design (1:1 Alignment with Competition Core Capabilities)

## 1. Data-Driven Generation Module

- Multi-source data ingestion: Automatically syncs historical campaign data (traffic, conversions, CAC, etc.), A/B test results, and marketer wireframes (supports Figma/FigJam imports or manual uploads).
- Intelligent analysis engine: Identifies high-conversion key elements (e.g., top-performing layouts, CTA copy, color schemes) and generates data insight reports (e.g., "In the last 3 lead gen campaigns, left-text-right-image layouts achieved 18% higher conversion rates than right-text-left-image").
- Auto-content generation: Creates headlines, subheadlines, body copy, FAQs, etc., based on input parameters (UVP, selling points, audience pain points) and brand tone, while embedding target SEO keywords.

## 2. Section-by-Section Control Module

- Visual section management: Splits landing pages into 7 core modules—Hero Section, Value Proposition, Features, Testimonials, FAQ, Form Section, and CTA Section.
- Targeted Prompt interaction: Supports directional instructions for individual modules (e.g., "Change Hero button color to brand secondary color and emphasize 'limited-time discount' in copy" or "Restructure FAQ section into 'question + concise answer' format") without affecting other areas.
- Real-time preview sync: Instantly refreshes previews after modifications, supporting simultaneous mobile/desktop view.

## 3. Auto Form Builder Module

- Dynamic form generation: Automatically recommends form fields based on campaign goals (lead gen/sales)—e.g., lead gen defaults to "Name + Email + Company," while sales adds "Budget Range." Supports custom field types (input/dropdown/radio).
- API-ready endpoint configuration: Auto-generates RESTful API interfaces for direct integration with CRMs (e.g., Salesforce) and marketing automation tools (e.g., HubSpot), with configurable data sync frequency.
- Compliance auto-adaptation: Embeds GDPR/CCPA consent text, links to privacy policy URLs, and binds "accept terms" logic to form submission buttons by default.

## 4. Template Library Module

- Structured template output: Generates JSON/schematic templates containing full configurations (layout structure, component mapping, brand parameters, SEO settings) for one-click import and reuse.
- Categorized management: Auto-classifies templates by campaign type (lead gen/sales/signup), industry, and layout preference (scrolling/modular/storytelling) for quick retrieval.
- Template iteration: Supports "intelligent optimization" of existing templates using new campaign data to update high-conversion elements.

## 5. Explainability Module (AI Rationale PDF Generation)

- Full-cycle decision mapping: The PDF automatically includes a complete "data source → analysis conclusion → design choice" link. Examples:
  - Layout choice: "Adopted Hero + Features section structure because historical data shows 'modular layouts' drive 22% longer average time on page in B2B campaigns (Reference Campaign ID: DIFC-2024-Q1-003)."
  - Color choice: "Primary button uses #0066CC (DIFC brand primary color) as A/B test results show 15% higher click-through rates than competitor colors (Reference Experiment ID: AB-2024-042)."
- Compliance & SEO explanation: Dedicated sections for privacy policy embedding logic and SEO keyword placement strategies (e.g., core keywords in H1 tags, image ALT text optimization).

## 6. One-Click Deployment & Sitecore Integration Module

- Dual-platform deployment: Supports 1-click publishing to Vercel (default, optimized for Next.js) or Azure (App Service/Static Web Apps). Auto-configures SSL certificates and CDN.
- Sitecore BYOC compatibility: Exports modular React/Web components (compliant with Sitecore Component SDK standards) for drag-and-drop integration, including component metadata (name, description, use cases).
- Analytics auto-integration: Embeds GA/GTM IDs during deployment and configures preset event tracking (page load, scroll depth, CTA clicks, form submissions).