import OpenAI from 'openai'
import { GenerationResponse } from '@/types/api'

export class OpenAIService {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async generateContent(prompt: string, options: any = {}): Promise<GenerationResponse> {
    try {
      const startTime = Date.now()

      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        response_format: options.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      })

      const endTime = Date.now()
      const latency = endTime - startTime

      return {
        content: response.choices[0]?.message?.content || '',
        provider: 'openai',
        model: options.model || 'gpt-4o-mini',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        metadata: {
          latency,
          confidence: 0.95, // OpenAI typically has high confidence
          safetyRatings: [], // Can be added if needed
        },
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw error
    }
  }

  async generateForTask(taskType: string, input: any, options: any = {}): Promise<any> {
    const taskPrompts = {
      'headline_generation': `Generate 3 compelling headlines for a landing page with the following details: ${JSON.stringify(input)}. Format as JSON with an array of headlines.`,
      'body_copy': `Generate persuasive body copy for a landing page section with: ${JSON.stringify(input)}. Format as JSON with copy and metadata.`,
      'form_fields': `Recommend form fields for a ${input.campaignType} campaign targeting ${input.industry}. Format as JSON with field recommendations.`,
      'cta_text': `Generate compelling CTA text for a ${input.offerType} with urgency: ${input.urgency}. Format as JSON with CTA variations.`,
      'seo_meta': `Generate SEO metadata for a landing page about: ${JSON.stringify(input)}. Format as JSON with title, description, and keywords.`,
    }

    const prompt = taskPrompts[taskType as keyof typeof taskPrompts] || `Complete the following task: ${taskType} with input: ${JSON.stringify(input)}.`

    return await this.generateContent(prompt, {
      ...options,
      responseFormat: 'json',
      temperature: options.temperature || 0.7
    })
  }

  async generateStream(
    prompt: string,
    options: any = {},
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const stream = await this.client.chat.completions.create({
        model: options.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        stream: true,
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          onChunk(content)
        }
      }
    } catch (error) {
      console.error('OpenAI streaming error:', error)
      throw error
    }
  }

  async generateCode(requirements: any): Promise<any> {
    const prompt = `Generate clean, modern React/TypeScript code for: ${JSON.stringify(requirements)}.
    Include proper TypeScript types and follow best practices. Format as JSON with code and explanation.`

    return await this.generateContent(prompt, {
      model: 'gpt-4o',
      temperature: 0.2,
      responseFormat: 'json'
    })
  }

  async performAnalysis(data: any): Promise<any> {
    const prompt = `Analyze the following campaign data and provide insights: ${JSON.stringify(data)}.
    Identify high-conversion patterns, optimization opportunities, and recommendations. Format as JSON.`

    return await this.generateContent(prompt, {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      responseFormat: 'json'
    })
  }

  async generateStructuredOutput(prompt: string, schema: any): Promise<any> {
    try {
      const response = await this.client.beta.chat.completions.parse({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: {
          type: 'json_schema',
          json_schema: schema
        },
        temperature: 0.2,
      })

      return {
        content: response.choices[0]?.message?.content || '',
        provider: 'openai',
        model: 'gpt-4o',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        metadata: {
          latency: 0, // Will be calculated
          confidence: 0.95,
          safetyRatings: [],
        },
      }
    } catch (error) {
      console.error('OpenAI structured output error:', error)
      throw error
    }
  }
}