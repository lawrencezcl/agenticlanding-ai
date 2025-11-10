import { llmService } from '@/lib/llm/unified-service'
import { databaseService } from '@/lib/database'
import { vectorService } from '@/lib/database/vector'
import { blobService } from '@/lib/database/blob'

export interface Template {
  id: string
  name: string
  description: string
  category: 'business' | 'ecommerce' | 'saas' | 'startup' | 'corporate' | 'creative' | 'landing' | 'portfolio'
  tags: string[]
  industry: string[]
  targetAudience: string[]
  conversionOptimized: boolean
  mobileResponsive: boolean
  sections: TemplateSection[]
  customization: {
    colors: boolean
    fonts: boolean
    layout: boolean
    content: boolean
    images: boolean
  }
  performance: {
    avgConversionRate: number
    avgTimeOnPage: number
    totalUses: number
    rating: number
  }
  metadata: {
    createdAt: string
    updatedAt: string
    createdBy: string
    version: string
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    estimatedTime: string
  }
  preview: {
    thumbnail: string
    livePreview: string
    screenshots: string[]
  }
  pricing: {
    free: boolean
    proRequired: boolean
    enterpriseRequired: boolean
  }
}

export interface TemplateSection {
  id: string
  type: string
  name: string
  description: string
  required: boolean
  customizable: boolean
  content: any
  styling: any
}

export interface TemplateSearchRequest {
  query: string
  category?: string
  industry?: string
  tags?: string[]
  features?: string[]
  priceRange?: 'free' | 'paid' | 'all'
  rating?: number
  sortBy: 'relevance' | 'popularity' | 'rating' | 'newest' | 'conversion_rate'
  limit?: number
  offset?: number
}

export interface TemplateCustomizationRequest {
  templateId: string
  customizations: {
    brandColors: string[]
    fonts: string[]
    logo: string
    companyInfo: any
    content: Record<string, any>
    images: Record<string, string>
    layout: string
  }
  purpose: string
  targetAudience: string
  brandGuidelines: any
}

export interface GeneratedTemplate {
  template: Template
  customizedContent: any
  htmlCode: string
  cssCode: string
  assets: string[]
  rationale: string
  confidence: number
}

export class TemplateLibraryModule {
  private static instance: TemplateLibraryModule

  static getInstance(): TemplateLibraryModule {
    if (!TemplateLibraryModule.instance) {
      TemplateLibraryModule.instance = new TemplateLibraryModule()
    }
    return TemplateLibraryModule.instance
  }

  // Search templates
  async searchTemplates(request: TemplateSearchRequest): Promise<{
    templates: Template[]
    total: number
    facets: any
  }> {
    try {
      // Use vector search for semantic matching
      const vectorResults = await vectorService.searchTemplates(
        request.query,
        request.category,
        request.tags,
        request.limit || 20
      )

      // Enrich with full template data
      const enrichedTemplates = []
      for (const result of vectorResults) {
        const templateData = await this.getTemplateData(result.id)
        if (templateData) {
          enrichedTemplates.push({
            ...templateData,
            relevanceScore: result.score
          })
        }
      }

      // Apply filters and sorting
      let filteredTemplates = this.applyFilters(enrichedTemplates, request)
      filteredTemplates = this.sortTemplates(filteredTemplates, request.sortBy)

      // Generate facets
      const facets = await this.generateFacets(filteredTemplates)

      return {
        templates: filteredTemplates.slice(request.offset || 0, request.limit || 20),
        total: filteredTemplates.length,
        facets
      }
    } catch (error) {
      console.error('Template search error:', error)
      return { templates: [], total: 0, facets: {} }
    }
  }

  // Get template by ID
  async getTemplate(templateId: string): Promise<Template | null> {
    try {
      const templateData = await this.getTemplateData(templateId)
      if (!templateData) return null

      // Update usage statistics
      await this.updateTemplateUsage(templateId)

      return templateData
    } catch (error) {
      console.error('Get template error:', error)
      return null
    }
  }

  // Customize template
  async customizeTemplate(request: TemplateCustomizationRequest): Promise<GeneratedTemplate> {
    try {
      // Get original template
      const template = await this.getTemplate(request.templateId)
      if (!template) {
        throw new Error('Template not found')
      }

      // Generate customized content
      const customizedContent = await this.generateCustomizedContent(template, request)

      // Generate code implementations
      const code = await this.generateTemplateCode(template, customizedContent, request)

      // Collect assets
      const assets = await this.collectTemplateAssets(template, request)

      // Generate rationale
      const rationale = await this.generateCustomizationRationale(template, request)

      return {
        template,
        customizedContent,
        htmlCode: code.html,
        cssCode: code.css,
        assets,
        rationale,
        confidence: this.calculateCustomizationConfidence(template, request)
      }
    } catch (error) {
      console.error('Template customization error:', error)
      throw error
    }
  }

  // Create new template
  async createTemplate(templateData: Omit<Template, 'id' | 'metadata' | 'performance'>): Promise<Template> {
    try {
      const template: Template = {
        ...templateData,
        id: `template_${Date.now()}`,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          version: '1.0.0',
          difficulty: 'intermediate',
          estimatedTime: '30 minutes'
        },
        performance: {
          avgConversionRate: 0,
          avgTimeOnPage: 0,
          totalUses: 0,
          rating: 0
        }
      }

      // Store template metadata
      await this.storeTemplateMetadata(template)

      // Index for search
      await vectorService.indexTemplate({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        tags: template.tags,
        content: template.sections
      })

      return template
    } catch (error) {
      console.error('Create template error:', error)
      throw error
    }
  }

  // Generate template from example
  async generateTemplateFromExample(
    exampleUrl: string,
    purpose: string,
    targetAudience: string
  ): Promise<Template> {
    try {
      // Analyze the example URL (would need web scraping implementation)
      const analysis = await this.analyzeExampleWebsite(exampleUrl)

      // Generate template structure based on analysis
      const templateStructure = await this.generateTemplateStructure(analysis, purpose, targetAudience)

      // Create template
      const template = await this.createTemplate(templateStructure)

      return template
    } catch (error) {
      console.error('Generate template from example error:', error)
      throw error
    }
  }

  // Get template recommendations
  async getTemplateRecommendations(
    userId: string,
    context: {
      industry: string
      purpose: string
      targetAudience: string
      skillLevel: string
    }
  ): Promise<Template[]> {
    try {
      // Get user's history and preferences
      const userHistory = await this.getUserTemplateHistory(userId)

      // Generate recommendations based on collaborative filtering
      const collaborativeRecommendations = await this.getCollaborativeRecommendations(userId, context)

      // Generate content-based recommendations
      const contentRecommendations = await this.getContentBasedRecommendations(context)

      // Combine and rank recommendations
      const recommendations = this.combineRecommendations(
        collaborativeRecommendations,
        contentRecommendations,
        userHistory
      )

      return recommendations.slice(0, 10)
    } catch (error) {
      console.error('Get template recommendations error:', error)
      return []
    }
  }

  // Rate template
  async rateTemplate(templateId: string, userId: string, rating: number, review?: string): Promise<void> {
    try {
      // Store rating
      await this.storeTemplateRating(templateId, userId, rating, review)

      // Update template average rating
      await this.updateTemplateRating(templateId)
    } catch (error) {
      console.error('Rate template error:', error)
      throw error
    }
  }

  // Private helper methods
  private async getTemplateData(templateId: string): Promise<Template | null> {
    try {
      // Try to get from cache first
      const cached = await databaseService.getUserPreference(`template:${templateId}`)
      if (cached) {
        return JSON.parse(cached)
      }

      // Get from database or blob storage
      const templateData = await this.fetchTemplateFromStorage(templateId)
      if (!templateData) return null

      // Cache the result
      await databaseService.setUserPreference(`template:${templateId}`, JSON.stringify(templateData))

      return templateData
    } catch (error) {
      console.error('Get template data error:', error)
      return null
    }
  }

  private async storeTemplateMetadata(template: Template): Promise<void> {
    try {
      // Store in database
      await databaseService.createUserProfile({
        id: template.id,
        email: `template-${template.id}@system.local`,
        name: template.name,
        plan: 'free'
      })

      // Store full template data in blob storage
      await blobService.uploadTemplate(template.sections, template.id)
    } catch (error) {
      console.error('Store template metadata error:', error)
    }
  }

  private async fetchTemplateFromStorage(templateId: string): Promise<Template | null> {
    // This would implement fetching from database or blob storage
    // For now, return a mock template
    return {
      id: templateId,
      name: 'Sample Template',
      description: 'A sample landing page template',
      category: 'business',
      tags: ['modern', 'professional'],
      industry: ['technology'],
      targetAudience: ['B2B'],
      conversionOptimized: true,
      mobileResponsive: true,
      sections: [],
      customization: {
        colors: true,
        fonts: true,
        layout: true,
        content: true,
        images: true
      },
      performance: {
        avgConversionRate: 3.5,
        avgTimeOnPage: 120,
        totalUses: 150,
        rating: 4.2
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        version: '1.0.0',
        difficulty: 'intermediate',
        estimatedTime: '30 minutes'
      },
      preview: {
        thumbnail: '/templates/thumbnails/sample.jpg',
        livePreview: '/templates/preview/sample',
        screenshots: []
      },
      pricing: {
        free: true,
        proRequired: false,
        enterpriseRequired: false
      }
    }
  }

  private applyFilters(templates: Template[], request: TemplateSearchRequest): Template[] {
    let filtered = [...templates]

    if (request.category) {
      filtered = filtered.filter(t => t.category === request.category)
    }

    if (request.industry) {
      filtered = filtered.filter(t => t.industry.includes(request.industry!))
    }

    if (request.tags && request.tags.length > 0) {
      filtered = filtered.filter(t =>
        request.tags!.some(tag => t.tags.includes(tag))
      )
    }

    if (request.rating) {
      filtered = filtered.filter(t => t.performance.rating >= request.rating!)
    }

    if (request.priceRange && request.priceRange !== 'all') {
      filtered = filtered.filter(t => {
        switch (request.priceRange) {
          case 'free':
            return t.pricing.free
          case 'paid':
            return !t.pricing.free
          default:
            return true
        }
      })
    }

    return filtered
  }

  private sortTemplates(templates: Template[], sortBy: string): Template[] {
    switch (sortBy) {
      case 'popularity':
        return templates.sort((a, b) => b.performance.totalUses - a.performance.totalUses)
      case 'rating':
        return templates.sort((a, b) => b.performance.rating - a.performance.rating)
      case 'conversion_rate':
        return templates.sort((a, b) => b.performance.avgConversionRate - a.performance.avgConversionRate)
      case 'newest':
        return templates.sort((a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime())
      case 'relevance':
      default:
        return templates.sort((a, b) => (b as any).relevanceScore - (a as any).relevanceScore)
    }
  }

  private async generateFacets(templates: Template[]): Promise<any> {
    const facets = {
      categories: {},
      industries: {},
      tags: {},
      priceRanges: {
        free: templates.filter(t => t.pricing.free).length,
        paid: templates.filter(t => !t.pricing.free).length
      }
    }

    templates.forEach(template => {
      // Category facets
      if (!facets.categories[template.category]) {
        facets.categories[template.category] = 0
      }
      facets.categories[template.category]++

      // Industry facets
      template.industry.forEach(industry => {
        if (!facets.industries[industry]) {
          facets.industries[industry] = 0
        }
        facets.industries[industry]++
      })

      // Tag facets
      template.tags.forEach(tag => {
        if (!facets.tags[tag]) {
          facets.tags[tag] = 0
        }
        facets.tags[tag]++
      })
    })

    return facets
  }

  private async updateTemplateUsage(templateId: string): Promise<void> {
    // Update usage statistics
    const template = await this.getTemplateData(templateId)
    if (template) {
      template.performance.totalUses++
      await this.storeTemplateMetadata(template)
    }
  }

  private async generateCustomizedContent(
    template: Template,
    request: TemplateCustomizationRequest
  ): Promise<any> {
    try {
      const prompt = `
Customize this template content based on the requirements:

TEMPLATE:
${JSON.stringify(template, null, 2)}

CUSTOMIZATIONS:
${JSON.stringify(request.customizations, null, 2)}

PURPOSE: ${request.purpose}
TARGET AUDIENCE: ${request.targetAudience}

Generate customized content that:
1. Incorporates the brand colors and fonts
2. Adapts the content to the target audience
3. Maintains the template's conversion-optimized structure
4. Applies the company information appropriately
5. Replaces placeholder content with specific details

Return the customized sections as JSON.
`

      const response = await llmService.generateContent(prompt, {
        temperature: 0.3,
        maxTokens: 2000
      })

      return JSON.parse(response.content)
    } catch (error) {
      console.error('Customized content generation error:', error)
      return template.sections
    }
  }

  private async generateTemplateCode(
    template: Template,
    customizedContent: any,
    request: TemplateCustomizationRequest
  ): Promise<{ html: string; css: string }> {
    // Generate HTML and CSS based on template and customizations
    const html = this.generateTemplateHTML(template, customizedContent, request)
    const css = this.generateTemplateCSS(template, request.customizations)

    return { html, css }
  }

  private generateTemplateHTML(
    template: Template,
    customizedContent: any,
    request: TemplateCustomizationRequest
  ): string {
    // Generate HTML structure
    const sections = customizedContent.sections || template.sections
    const sectionHTML = sections.map((section: any) =>
      this.generateSectionHTML(section, request.customizations)
    ).join('\n')

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${request.customizations.companyInfo.name || 'Landing Page'}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="template-container" data-template="${template.id}">
    ${sectionHTML}
  </div>
  <script src="script.js"></script>
</body>
</html>
`
  }

  private generateSectionHTML(section: any, customizations: any): string {
    // Generate HTML for individual sections
    return `
    <section class="section-${section.type}" id="${section.id}">
      <div class="container">
        ${this.generateSectionContent(section, customizations)}
      </div>
    </section>
    `
  }

  private generateSectionContent(section: any, customizations: any): string {
    // Generate content based on section type
    switch (section.type) {
      case 'hero':
        return `
        <div class="hero-content">
          <h1>${section.content?.headline || 'Your Headline Here'}</h1>
          <p>${section.content?.subheadline || 'Your subheadline here'}</p>
          <div class="cta-buttons">
            <button class="btn btn-primary">${section.content?.primaryCTA || 'Get Started'}</button>
            <button class="btn btn-secondary">${section.content?.secondaryCTA || 'Learn More'}</button>
          </div>
        </div>
        `
      default:
        return `<div class="section-content"><!-- ${section.type} content --></div>`
    }
  }

  private generateTemplateCSS(template: Template, customizations: any): string {
    return `
/* Custom Template Styles */
:root {
  --primary-color: ${customizations.brandColors[0] || '#007bff'};
  --secondary-color: ${customizations.brandColors[1] || '#6c757d'};
  --accent-color: ${customizations.brandColors[2] || '#28a745'};
  --text-color: #333;
  --bg-color: #fff;
  --light-gray: #f8f9fa;
}

body {
  font-family: ${customizations.fonts[0] || 'Inter, sans-serif'};
  color: var(--text-color);
  background-color: var(--bg-color);
  margin: 0;
  padding: 0;
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Hero Section */
.section-hero {
  padding: 80px 0;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  text-align: center;
}

.hero-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.hero-content p {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s ease;
}

.btn-primary {
  background: var(--accent-color);
  color: white;
}

.btn-primary:hover {
  background: #218838;
  transform: translateY(-2px);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background: white;
  color: var(--primary-color);
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 2rem;
  }

  .hero-content p {
    font-size: 1rem;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }
}

/* Section Styles */
section {
  padding: 60px 0;
}

.section-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.section-content h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.section-content p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.8;
}
`
  }

  private async collectTemplateAssets(template: Template, request: TemplateCustomizationRequest): Promise<string[]> {
    const assets = []

    // Add logo if provided
    if (request.customizations.logo) {
      assets.push(request.customizations.logo)
    }

    // Add images from customizations
    Object.values(request.customizations.images).forEach(image => {
      if (image) assets.push(image)
    })

    return assets
  }

  private async generateCustomizationRationale(
    template: Template,
    request: TemplateCustomizationRequest
  ): Promise<string> {
    try {
      const prompt = `
Explain the rationale for this template customization:

TEMPLATE: ${template.name} (${template.category})
CUSTOMIZATIONS: ${JSON.stringify(request.customizations, null, 2)}
PURPOSE: ${request.purpose}
TARGET AUDIENCE: ${request.targetAudience}

Explain:
1. How the customizations improve the template for the specific purpose
2. Why certain design choices were made
3. How the brand identity is incorporated
4. How the content is adapted for the target audience
5. Expected impact on conversion and user experience
`

      const response = await llmService.generateContent(prompt, {
        temperature: 0.3,
        maxTokens: 800
      })

      return response.content
    } catch (error) {
      console.error('Customization rationale generation error:', error)
      return 'Template customized to match brand requirements and target audience preferences.'
    }
  }

  private calculateCustomizationConfidence(template: Template, request: TemplateCustomizationRequest): number {
    let confidence = 0.8 // Base confidence

    // Increase confidence based on customization completeness
    if (request.customizations.brandColors.length > 0) confidence += 0.05
    if (request.customizations.fonts.length > 0) confidence += 0.05
    if (request.customizations.logo) confidence += 0.05
    if (Object.keys(request.customizations.content).length > 0) confidence += 0.05

    return Math.min(confidence, 1.0)
  }

  private async analyzeExampleWebsite(url: string): Promise<any> {
    // This would implement web scraping and analysis
    // For now, return mock analysis
    return {
      structure: ['hero', 'features', 'testimonials', 'cta'],
      design: {
        colors: ['#007bff', '#6c757d', '#28a745'],
        fonts: ['Inter', 'Roboto'],
        layout: 'modern'
      },
      content: {
        tone: 'professional',
        sections: 5,
        avgWordCount: 1500
      }
    }
  }

  private async generateTemplateStructure(
    analysis: any,
    purpose: string,
    targetAudience: string
  ): Promise<any> {
    // Generate template structure based on analysis
    return {
      name: `Generated ${purpose} Template`,
      description: `Template for ${targetAudience} focused on ${purpose}`,
      category: 'business',
      tags: ['generated', purpose, targetAudience],
      industry: ['general'],
      targetAudience: [targetAudience],
      conversionOptimized: true,
      mobileResponsive: true,
      sections: analysis.structure.map((sectionType: string, index: number) => ({
        id: `section_${index}`,
        type: sectionType,
        name: sectionType.charAt(0).toUpperCase() + sectionType.slice(1),
        description: `${sectionType} section`,
        required: true,
        customizable: true,
        content: {},
        styling: {}
      })),
      customization: {
        colors: true,
        fonts: true,
        layout: true,
        content: true,
        images: true
      }
    }
  }

  private async getUserTemplateHistory(userId: string): Promise<any[]> {
    // Get user's template usage history
    return []
  }

  private async getCollaborativeRecommendations(userId: string, context: any): Promise<Template[]> {
    // Generate recommendations based on similar users
    return []
  }

  private async getContentBasedRecommendations(context: any): Promise<Template[]> {
    // Generate recommendations based on content similarity
    return []
  }

  private combineRecommendations(
    collaborative: Template[],
    content: Template[],
    history: any[]
  ): Template[] {
    // Combine and rank different recommendation sources
    const allTemplates = [...collaborative, ...content]
    const uniqueTemplates = allTemplates.filter((template, index, self) =>
      index === self.findIndex(t => t.id === template.id)
    )
    return uniqueTemplates
  }

  private async storeTemplateRating(templateId: string, userId: string, rating: number, review?: string): Promise<void> {
    // Store rating in database
  }

  private async updateTemplateRating(templateId: string): Promise<void> {
    // Update average rating
  }
}

export const templateLibraryModule = TemplateLibraryModule.getInstance()