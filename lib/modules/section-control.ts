import { llmService } from '@/lib/llm/unified-service'
import { databaseService } from '@/lib/database'

export interface SectionDefinition {
  id: string
  type: 'hero' | 'features' | 'benefits' | 'testimonials' | 'pricing' | 'faq' | 'cta' | 'footer'
  title: string
  description: string
  required: boolean
  order: number
  configurable: boolean
  templates: SectionTemplate[]
}

export interface SectionTemplate {
  id: string
  name: string
  description: string
  layout: string
  defaultContent: any
  customizable: boolean
}

export interface SectionContent {
  id: string
  type: string
  content: any
  metadata: {
    lastModified: string
    modifiedBy: string
    version: number
  }
  styling: {
    layout: string
    colors: string
    typography: string
    spacing: string
  }
  settings: {
    visible: boolean
    animations: boolean
    background: string
  }
}

export interface SectionGenerationRequest {
  sectionType: string
  context: {
    productInfo: any
    targetAudience: any
    brandGuidelines: any
    campaignObjective: string
  }
  requirements: {
    tone: string
    length: string
    focus: string[]
    constraints: string[]
  }
  template?: string
  variations: number
}

export interface SectionModificationRequest {
  sectionId: string
  modifications: {
    content?: any
    styling?: any
    settings?: any
  }
  reason: string
  applyToSimilar: boolean
}

export class SectionControlModule {
  private static instance: SectionControlModule

  static getInstance(): SectionControlModule {
    if (!SectionControlModule.instance) {
      SectionControlModule.instance = new SectionControlModule()
    }
    return SectionControlModule.instance
  }

  // Get available section definitions
  getSectionDefinitions(): SectionDefinition[] {
    return [
      {
        id: 'hero',
        type: 'hero',
        title: 'Hero Section',
        description: 'Main headline and value proposition',
        required: true,
        order: 1,
        configurable: true,
        templates: this.getHeroTemplates()
      },
      {
        id: 'features',
        type: 'features',
        title: 'Features Section',
        description: 'Product or service features',
        required: true,
        order: 2,
        configurable: true,
        templates: this.getFeaturesTemplates()
      },
      {
        id: 'benefits',
        type: 'benefits',
        title: 'Benefits Section',
        description: 'Customer benefits and value propositions',
        required: false,
        order: 3,
        configurable: true,
        templates: this.getBenefitsTemplates()
      },
      {
        id: 'testimonials',
        type: 'testimonials',
        title: 'Testimonials Section',
        description: 'Customer testimonials and social proof',
        required: false,
        order: 4,
        configurable: true,
        templates: this.getTestimonialsTemplates()
      },
      {
        id: 'pricing',
        type: 'pricing',
        title: 'Pricing Section',
        description: 'Pricing plans and options',
        required: false,
        order: 5,
        configurable: true,
        templates: this.getPricingTemplates()
      },
      {
        id: 'faq',
        type: 'faq',
        title: 'FAQ Section',
        description: 'Frequently asked questions',
        required: false,
        order: 6,
        configurable: true,
        templates: this.getFAQTemplates()
      },
      {
        id: 'cta',
        type: 'cta',
        title: 'Call-to-Action Section',
        description: 'Final conversion-focused section',
        required: true,
        order: 7,
        configurable: true,
        templates: this.getCTATemplates()
      },
      {
        id: 'footer',
        type: 'footer',
        title: 'Footer Section',
        description: 'Site footer with links and information',
        required: true,
        order: 8,
        configurable: true,
        templates: this.getFooterTemplates()
      }
    ]
  }

  // Generate section content
  async generateSection(request: SectionGenerationRequest): Promise<{
    content: SectionContent[]
    rationale: string
    alternatives: SectionContent[]
  }> {
    try {
      const sectionDef = this.getSectionDefinitions().find(s => s.type === request.sectionType)
      if (!sectionDef) {
        throw new Error(`Unknown section type: ${request.sectionType}`)
      }

      // Generate primary content
      const primaryContent = await this.generateSingleSection(request, sectionDef)

      // Generate alternatives if requested
      const alternatives = []
      for (let i = 1; i < request.variations; i++) {
        const altContent = await this.generateSingleSection(request, sectionDef, `variation_${i}`)
        alternatives.push(altContent)
      }

      // Generate rationale
      const rationale = await this.generateSectionRationale(request, primaryContent)

      return {
        content: [primaryContent],
        rationale,
        alternatives
      }
    } catch (error) {
      console.error('Section generation error:', error)
      throw error
    }
  }

  // Generate single section
  private async generateSingleSection(
    request: SectionGenerationRequest,
    sectionDef: SectionDefinition,
    variation = 'primary'
  ): Promise<SectionContent> {
    try {
      const template = request.template
        ? sectionDef.templates.find(t => t.id === request.template)
        : sectionDef.templates[0]

      const prompt = this.buildSectionPrompt(request, sectionDef, template, variation)

      const response = await llmService.generateForTask(
        'content_generation',
        {
          sectionType: request.sectionType,
          context: request.context,
          requirements: request.requirements,
          template: template,
          prompt
        },
        { complexity: 'medium' }
      )

      const content = this.parseSectionContent(response.content, sectionDef.type)

      return {
        id: `${sectionDef.type}_${Date.now()}`,
        type: sectionDef.type,
        content,
        metadata: {
          lastModified: new Date().toISOString(),
          modifiedBy: 'ai_generator',
          version: 1
        },
        styling: {
          layout: template.layout,
          colors: 'default',
          typography: 'default',
          spacing: 'default'
        },
        settings: {
          visible: true,
          animations: true,
          background: 'default'
        }
      }
    } catch (error) {
      console.error('Single section generation error:', error)
      throw error
    }
  }

  // Build section prompt
  private buildSectionPrompt(
    request: SectionGenerationRequest,
    sectionDef: SectionDefinition,
    template: SectionTemplate,
    variation: string
  ): string {
    return `
Generate a ${sectionDef.type} section for a landing page with the following context:

CONTEXT:
${JSON.stringify(request.context, null, 2)}

REQUIREMENTS:
- Tone: ${request.requirements.tone}
- Length: ${request.requirements.length}
- Focus: ${request.requirements.focus.join(', ')}
- Constraints: ${request.requirements.constraints.join(', ')}

SECTION DETAILS:
- Type: ${sectionDef.type}
- Title: ${sectionDef.title}
- Description: ${sectionDef.description}
- Template: ${template.name}
- Layout: ${template.layout}
- Variation: ${variation}

TEMPLATE STRUCTURE:
${JSON.stringify(template.defaultContent, null, 2)}

REQUIREMENTS:
1. Generate content that fits the ${sectionDef.type} section type
2. Follow the provided template structure
3. Match the required tone and style
4. Address the target audience's needs and pain points
5. Align with the brand guidelines
6. Focus on: ${request.requirements.focus.join(', ')}
7. Consider constraints: ${request.requirements.constraints.join(', ')}
8. Create content optimized for conversion

${variation !== 'primary' ? `
9. Create a variation that differs from the standard approach:
   - Use different messaging angles
   - Try alternative layouts or formats
   - Test different emotional appeals
   - Vary the call-to-action approach
` : ''}

Return the response as a JSON object with the content structure matching the template.
`
  }

  // Parse section content
  private parseSectionContent(content: string, sectionType: string): any {
    try {
      if (content.trim().startsWith('{')) {
        return JSON.parse(content)
      }

      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }

      return this.createFallbackSectionContent(sectionType, content)
    } catch (error) {
      console.error('Section content parsing error:', error)
      return this.createFallbackSectionContent(sectionType, content)
    }
  }

  // Create fallback section content
  private createFallbackSectionContent(sectionType: string, rawContent: string): any {
    const baseContent = {
      headline: 'Transform Your Business Today',
      subheadline: 'Discover the power of innovative solutions',
      description: rawContent.slice(0, 200)
    }

    switch (sectionType) {
      case 'hero':
        return {
          ...baseContent,
          primaryCTA: { text: 'Get Started', link: '#' },
          secondaryCTA: { text: 'Learn More', link: '#' },
          background: { type: 'image', src: '/hero-bg.jpg' }
        }

      case 'features':
        return {
          title: 'Powerful Features',
          subtitle: 'Everything you need to succeed',
          features: [
            { title: 'Feature 1', description: 'Description for feature 1', icon: '🚀' },
            { title: 'Feature 2', description: 'Description for feature 2', icon: '⚡' },
            { title: 'Feature 3', description: 'Description for feature 3', icon: '🎯' }
          ]
        }

      case 'benefits':
        return {
          title: 'Why Choose Us',
          subtitle: 'Experience the difference',
          benefits: [
            { title: 'Benefit 1', description: 'Description for benefit 1', icon: '✨' },
            { title: 'Benefit 2', description: 'Description for benefit 2', icon: '📈' },
            { title: 'Benefit 3', description: 'Description for benefit 3', icon: '🔒' }
          ]
        }

      case 'testimonials':
        return {
          title: 'What Our Customers Say',
          subtitle: 'Real stories from real customers',
          testimonials: [
            {
              text: 'This product transformed our business',
              author: 'John Doe',
              role: 'CEO',
              company: 'Tech Corp',
              rating: 5
            }
          ]
        }

      case 'cta':
        return {
          title: 'Ready to Get Started?',
          subtitle: 'Join thousands of satisfied customers',
          primaryCTA: { text: 'Start Free Trial', link: '#' },
          secondaryCTA: { text: 'Schedule Demo', link: '#' }
        }

      default:
        return baseContent
    }
  }

  // Modify existing section
  async modifySection(request: SectionModificationRequest): Promise<{
    updatedSection: SectionContent
    rationale: string
    impact: string[]
  }> {
    try {
      // Get current section
      const currentSection = await databaseService.getLandingPage(request.sectionId)
      if (!currentSection) {
        throw new Error('Section not found')
      }

      // Generate modification rationale
      const modificationRationale = await this.generateModificationRationale(
        currentSection,
        request.modifications,
        request.reason
      )

      // Apply modifications
      const updatedSection = this.applyModifications(currentSection, request.modifications)

      // Generate impact analysis
      const impact = await this.analyzeModificationImpact(
        currentSection,
        updatedSection,
        request.modifications
      )

      // Save updated section
      await databaseService.updateLandingPage(request.sectionId, {
        content: updatedSection,
        metadata: {
          lastModified: new Date().toISOString(),
          modifiedBy: 'user',
          reason: request.reason
        }
      })

      return {
        updatedSection,
        rationale: modificationRationale,
        impact
      }
    } catch (error) {
      console.error('Section modification error:', error)
      throw error
    }
  }

  // Generate section rationale
  private async generateSectionRationale(
    request: SectionGenerationRequest,
    content: SectionContent
  ): Promise<string> {
    try {
      const prompt = `
Explain the rationale for this ${request.sectionType} section:

SECTION CONTENT:
${JSON.stringify(content, null, 2)}

CAMPAIGN CONTEXT:
${JSON.stringify(request.context, null, 2)}

REQUIREMENTS:
${JSON.stringify(request.requirements, null, 2)}

Explain:
1. Why this content structure was chosen
2. How it addresses the target audience's needs
3. How it aligns with the campaign objectives
4. Why this approach is likely to convert well
`

      const response = await llmService.generateContent(prompt, {
        temperature: 0.3,
        maxTokens: 800
      })

      return response.content
    } catch (error) {
      console.error('Section rationale generation error:', error)
      return `Generated ${request.sectionType} section based on campaign requirements and best practices.`
    }
  }

  // Template getters
  private getHeroTemplates(): SectionTemplate[] {
    return [
      {
        id: 'hero_classic',
        name: 'Classic Hero',
        description: 'Traditional hero with headline, subheadline, and CTAs',
        layout: 'centered',
        defaultContent: {
          headline: '',
          subheadline: '',
          description: '',
          primaryCTA: { text: '', link: '' },
          secondaryCTA: { text: '', link: '' }
        },
        customizable: true
      },
      {
        id: 'hero_video',
        name: 'Video Hero',
        description: 'Hero section with background video',
        layout: 'fullscreen',
        defaultContent: {
          headline: '',
          subheadline: '',
          video: { src: '', autoplay: true, muted: true },
          primaryCTA: { text: '', link: '' }
        },
        customizable: true
      }
    ]
  }

  private getFeaturesTemplates(): SectionTemplate[] {
    return [
      {
        id: 'features_grid',
        name: 'Feature Grid',
        description: 'Features displayed in a grid layout',
        layout: 'grid',
        defaultContent: {
          title: '',
          subtitle: '',
          features: []
        },
        customizable: true
      },
      {
        id: 'features_list',
        name: 'Feature List',
        description: 'Features displayed in a vertical list',
        layout: 'list',
        defaultContent: {
          title: '',
          subtitle: '',
          features: []
        },
        customizable: true
      }
    ]
  }

  private getBenefitsTemplates(): SectionTemplate[] {
    return [
      {
        id: 'benefits_icons',
        name: 'Icon Benefits',
        description: 'Benefits with icons and descriptions',
        layout: 'grid',
        defaultContent: {
          title: '',
          subtitle: '',
          benefits: []
        },
        customizable: true
      }
    ]
  }

  private getTestimonialsTemplates(): SectionTemplate[] {
    return [
      {
        id: 'testimonials_grid',
        name: 'Testimonial Grid',
        description: 'Customer testimonials in a grid',
        layout: 'grid',
        defaultContent: {
          title: '',
          subtitle: '',
          testimonials: []
        },
        customizable: true
      }
    ]
  }

  private getPricingTemplates(): SectionTemplate[] {
    return [
      {
        id: 'pricing_cards',
        name: 'Pricing Cards',
        description: 'Pricing plans displayed as cards',
        layout: 'cards',
        defaultContent: {
          title: '',
          subtitle: '',
          plans: []
        },
        customizable: true
      }
    ]
  }

  private getFAQTemplates(): SectionTemplate[] {
    return [
      {
        id: 'faq_accordion',
        name: 'FAQ Accordion',
        description: 'FAQ in collapsible accordion format',
        layout: 'accordion',
        defaultContent: {
          title: '',
          subtitle: '',
          questions: []
        },
        customizable: true
      }
    ]
  }

  private getCTATemplates(): SectionTemplate[] {
    return [
      {
        id: 'cta_standard',
        name: 'Standard CTA',
        description: 'Standard call-to-action section',
        layout: 'centered',
        defaultContent: {
          title: '',
          subtitle: '',
          primaryCTA: { text: '', link: '' },
          secondaryCTA: { text: '', link: '' }
        },
        customizable: true
      }
    ]
  }

  private getFooterTemplates(): SectionTemplate[] {
    return [
      {
        id: 'footer_standard',
        name: 'Standard Footer',
        description: 'Standard site footer',
        layout: 'standard',
        defaultContent: {
          logo: '',
          links: [],
          social: [],
          copyright: ''
        },
        customizable: true
      }
    ]
  }

  // Helper methods
  private async generateModificationRationale(
    currentSection: any,
    modifications: any,
    reason: string
  ): Promise<string> {
    const prompt = `
Explain the rationale for these section modifications:

CURRENT SECTION:
${JSON.stringify(currentSection, null, 2)}

REQUESTED MODIFICATIONS:
${JSON.stringify(modifications, null, 2)}

REASON FOR CHANGE:
${reason}

Explain:
1. Why these changes make sense
2. How they improve the section
3. Expected impact on performance
`

    const response = await llmService.generateContent(prompt, {
      temperature: 0.3,
      maxTokens: 600
    })

    return response.content
  }

  private applyModifications(section: any, modifications: any): SectionContent {
    const updated = { ...section }

    if (modifications.content) {
      updated.content = { ...updated.content, ...modifications.content }
    }

    if (modifications.styling) {
      updated.styling = { ...updated.styling, ...modifications.styling }
    }

    if (modifications.settings) {
      updated.settings = { ...updated.settings, ...modifications.settings }
    }

    updated.metadata.lastModified = new Date().toISOString()
    updated.metadata.version += 1

    return updated
  }

  private async analyzeModificationImpact(
    original: any,
    modified: any,
    modifications: any
  ): Promise<string[]> {
    // Analyze the impact of modifications
    const impact = []

    if (modifications.content?.headline) {
      impact.push('Headline change may affect first impressions and click-through rates')
    }

    if (modifications.content?.callToAction) {
      impact.push('CTA changes may directly impact conversion rates')
    }

    if (modifications.styling) {
      impact.push('Styling changes may affect user engagement and time on page')
    }

    if (impact.length === 0) {
      impact.push('Minor changes that should not significantly impact performance')
    }

    return impact
  }
}

export const sectionControlModule = SectionControlModule.getInstance()