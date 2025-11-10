import { GoogleGenerativeAI } from '@google/generative-ai'
import { GenerationResponse } from '@/types/api'

export class GoogleService {
  private genAI: GoogleGenerativeAI | null = null
  private apiKey: string | null = null

  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY || null
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey)
    }
  }

  private async ensureInitialized() {
    if (!this.genAI || !this.apiKey) {
      throw new Error('Google AI API key not configured')
    }
  }

  async generateContent(
    prompt: string,
    options: any = {}
  ): Promise<GenerationResponse> {
    await this.ensureInitialized()

    try {
      const model = this.genAI!.getGenerativeModel({
        model: options.model || 'gemini-1.5-flash',
      })

      const startTime = Date.now()
      const result = await model.generateContent(prompt)
      const response = result.response
      const endTime = Date.now()

      return {
        content: response.text(),
        provider: 'google',
        model: options.model || 'gemini-1.5-flash',
        usage: {
          promptTokens: 0, // Gemini doesn't provide token counts in the same way
          completionTokens: 0,
          totalTokens: 0,
        },
        latency: endTime - startTime,
        metadata: {
          finishReason: response.candidates?.[0]?.finishReason || 'stop',
          safetyRatings: response.candidates?.[0]?.safetyRatings || [],
        },
      }
    } catch (error: any) {
      console.error('Google AI API error:', error)
      throw new Error(`Google AI API error: ${error.message}`)
    }
  }

  async generateForTask(
    taskType: string,
    input: any,
    options: any = {}
  ): Promise<any> {
    await this.ensureInitialized()

    const taskPrompts = {
      landing_page_generation: `Generate a complete landing page based on this brief: ${JSON.stringify(input)}. Include headline, subheadline, hero section description, features, benefits, and call-to-action.`,
      content_optimization: `Optimize this content for better conversion: ${JSON.stringify(input)}. Provide specific improvements and A/B test suggestions.`,
      brand_compliance: `Review this content for brand compliance: ${JSON.stringify(input)}. Check against standard brand guidelines and suggest improvements.`,
      form_generation: `Generate a lead capture form based on this requirements: ${JSON.stringify(input)}. Include form fields, validation rules, and submission handling.`,
    }

    const prompt = taskPrompts[taskType as keyof typeof taskPrompts] ||
      `Process this ${taskType} task: ${JSON.stringify(input)}`

    return this.generateContent(prompt, options)
  }

  async generateStream(
    prompt: string,
    options: any = {},
    onChunk: (chunk: string) => void
  ): Promise<void> {
    await this.ensureInitialized()

    try {
      const model = this.genAI!.getGenerativeModel({
        model: options.model || 'gemini-1.5-flash',
      })

      const result = await model.generateContentStream(prompt)

      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        if (chunkText) {
          onChunk(chunkText)
        }
      }
    } catch (error: any) {
      console.error('Google AI streaming error:', error)
      throw new Error(`Google AI streaming error: ${error.message}`)
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false

    try {
      await this.ensureInitialized()
      const model = this.genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const result = await model.generateContent('Hello')
      return !!result.response.text()
    } catch (error) {
      console.error('Google AI connection test failed:', error)
      return false
    }
  }

  getAvailableModels(): string[] {
    return [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
      'gemini-pro-vision',
    ]
  }

  getModelInfo(model: string): any {
    const models: Record<string, any> = {
      'gemini-1.5-pro': {
        maxTokens: 8192,
        contextWindow: 32768,
        costPer1kTokens: 0.0035,
        capabilities: ['text-generation', 'multimodal'],
      },
      'gemini-1.5-flash': {
        maxTokens: 8192,
        contextWindow: 1048576,
        costPer1kTokens: 0.00015,
        capabilities: ['text-generation', 'multimodal', 'fast'],
      },
      'gemini-1.0-pro': {
        maxTokens: 2048,
        contextWindow: 32768,
        costPer1kTokens: 0.0005,
        capabilities: ['text-generation'],
      },
      'gemini-pro-vision': {
        maxTokens: 2048,
        contextWindow: 16384,
        costPer1kTokens: 0.0025,
        capabilities: ['text-generation', 'image-understanding'],
      },
    }
    return models[model] || null
  }
}