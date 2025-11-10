export interface CampaignData {
  campaignId: string
  name: string
  startDate: Date
  endDate: Date
  metrics: {
    traffic: number
    conversions: number
    conversionRate: number
    cac: number
    avgTimeOnPage: number
    bounceRate: number
  }
  targetAudience: AudienceSegment
  industry: string
  layoutPerformance: LayoutPerformance[]
  ctaPerformance: CTAPerformance[]
  createdAt: Date
  updatedAt: Date
}

export interface LandingPageData {
  pageId: string
  name: string
  url?: string
  campaignId: string
  templateId: string
  sections: SectionData[]
  brandConfig: BrandConfiguration
  seoConfig: SEOConfiguration
  status: 'draft' | 'published' | 'archived'
  deploymentInfo: DeploymentInfo
  performanceData: PagePerformanceData
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

export interface SectionData {
  id: string
  type: 'hero' | 'valueProposition' | 'features' | 'testimonials' | 'faq' | 'form' | 'cta'
  content: any
  styling: any
  responsiveBreakpoints: ResponsiveConfig[]
}

export interface BrandConfiguration {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fonts: FontConfiguration
  logo: LogoConfiguration
  brandGuidelines: BrandGuidelines
}

export interface SEOConfiguration {
  title: string
  description: string
  keywords: string[]
  canonicalUrl?: string
  metaTags: MetaTag[]
  structuredData: any
}

export interface LLMProvider {
  id: string
  name: string
  models: LLMModel[]
  apiKey?: string
  baseURL?: string
  config: ProviderConfig
}

export interface LLMModel {
  id: string
  name: string
  provider: string
  type: 'content' | 'code' | 'multimodal' | 'analysis'
  maxTokens: number
  costPerToken: number
}

export interface GenerationRequest {
  prompt: string
  type: 'content' | 'layout' | 'design' | 'analysis'
  options: GenerationOptions
  preferredProvider?: string
}

export interface GenerationOptions {
  temperature?: number
  maxTokens?: number
  responseFormat?: string
  context?: any
  constraints?: any
}

export interface GenerationResponse {
  content: string
  provider: string
  model: string
  usage: TokenUsage
  metadata: ResponseMetadata
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface ResponseMetadata {
  latency: number
  confidence: number
  safetyRatings?: SafetyRating[]
}

// Additional supporting types
export interface AudienceSegment {
  id: string
  name: string
  demographics: any
  psychographics: any
  behavior: any
}

export interface LayoutPerformance {
  layoutType: string
  conversionRate: number
  avgTimeOnPage: number
  bounceRate: number
  sampleSize: number
}

export interface CTAPerformance {
  ctaText: string
  color: string
  position: string
  clickThroughRate: number
  conversionRate: number
  sampleSize: number
}

export interface ResponsiveConfig {
  breakpoint: string
  layout: any
  styling: any
}

export interface DeploymentInfo {
  platform: 'vercel' | 'azure'
  url: string
  deploymentId: string
  deployedAt: Date
  environment: 'preview' | 'staging' | 'production'
}

export interface PagePerformanceData {
  pageViews: number
  uniqueVisitors: number
  bounceRate: number
  avgTimeOnPage: number
  conversionRate: number
  goalCompletions: number
}

export interface FontConfiguration {
  heading: string
  body: string
  sizes: FontSizes
  weights: FontWeights
}

export interface LogoConfiguration {
  url: string
  width: number
  height: number
  format: 'png' | 'svg' | 'jpg'
}

export interface BrandGuidelines {
  tone: string
  voice: string
  messaging: string[]
  prohibited: string[]
}

export interface MetaTag {
  name: string
  content: string
  property?: string
}

export interface ProviderConfig {
  rateLimit: RateLimit
  timeout: number
  retryPolicy: RetryPolicy
}

export interface RateLimit {
  requestsPerMinute: number
  tokensPerMinute: number
}

export interface RetryPolicy {
  maxRetries: number
  backoffMultiplier: number
  initialDelay: number
}

export interface SafetyRating {
  category: string
  severity: 'low' | 'medium' | 'high'
  confidence: number
}

// NextAuth type extensions
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      plan?: string
      company?: string
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    plan?: string
    company?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    plan?: string
    company?: string
  }
}