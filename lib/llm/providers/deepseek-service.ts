import { GenerationResponse } from '@/types/api'

export class DeepSeekService {
  private apiKey: string | null = null
  private baseURL: string = 'https://api.deepseek.com'

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || null
  }

  private async ensureInitialized() {
    if (!this.apiKey) {
      throw new Error('DeepSeek API key not configured')
    }
  }

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    await this.ensureInitialized()

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`DeepSeek API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    return response.json()
  }

  async generateContent(
    prompt: string,
    options: any = {}
  ): Promise<GenerationResponse> {
    const startTime = Date.now()

    try {
      const data = {
        model: options.model || 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        stream: false,
      }

      const response = await this.makeRequest('/chat/completions', data)
      const endTime = Date.now()

      return {
        content: response.choices[0].message.content,
        provider: 'deepseek',
        model: options.model || 'deepseek-chat',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        latency: endTime - startTime,
        metadata: {
          finishReason: response.choices[0].finish_reason,
          index: response.choices[0].index,
        },
      }
    } catch (error: any) {
      console.error('DeepSeek API error:', error)
      throw new Error(`DeepSeek API error: ${error.message}`)
    }
  }

  async generateForTask(
    taskType: string,
    input: any,
    options: any = {}
  ): Promise<any> {
    await this.ensureInitialized()

    const taskPrompts = {
      landing_page_generation: `Generate a complete landing page based on this brief: ${JSON.stringify(input)}. Include headline, subheadline, hero section description, features, benefits, and call-to-action. Focus on clear, persuasive copy that converts.`,
      content_optimization: `Optimize this content for better conversion: ${JSON.stringify(input)}. Provide specific improvements, A/B test suggestions, and explain the reasoning behind each change.`,
      brand_compliance: `Review this content for brand compliance: ${JSON.stringify(input)}. Check against standard brand guidelines, tone of voice, and suggest improvements to maintain consistency.`,
      form_generation: `Generate a lead capture form based on this requirements: ${JSON.stringify(input)}. Include form fields, validation rules, user-friendly labels, and submission handling instructions.`,
      code_generation: `Generate clean, production-ready code based on this specification: ${JSON.stringify(input)}. Include comments, error handling, and follow best practices.`,
    }

    const prompt = taskPrompts[taskType as keyof typeof taskPrompts] ||
      `Process this ${taskType} task: ${JSON.stringify(input)}`

    // For coding tasks, use DeepSeek Coder model
    const model = taskType === 'code_generation' ? 'deepseek-coder' : (options.model || 'deepseek-chat')

    return this.generateContent(prompt, { ...options, model })
  }

  async generateStream(
    prompt: string,
    options: any = {},
    onChunk: (chunk: string) => void
  ): Promise<void> {
    await this.ensureInitialized()

    try {
      const data = {
        model: options.model || 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        stream: true,
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`DeepSeek streaming error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Response body is not readable')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') return

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content
              if (content) {
                onChunk(content)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      console.error('DeepSeek streaming error:', error)
      throw new Error(`DeepSeek streaming error: ${error.message}`)
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false

    try {
      await this.ensureInitialized()
      const response = await this.generateContent('Hello', { maxTokens: 10 })
      return !!response.content
    } catch (error) {
      console.error('DeepSeek connection test failed:', error)
      return false
    }
  }

  getAvailableModels(): string[] {
    return [
      'deepseek-chat',
      'deepseek-coder',
    ]
  }

  getModelInfo(model: string): any {
    const models: Record<string, any> = {
      'deepseek-chat': {
        maxTokens: 4096,
        contextWindow: 32768,
        costPer1kTokens: 0.0014,
        capabilities: ['text-generation', 'reasoning'],
      },
      'deepseek-coder': {
        maxTokens: 4096,
        contextWindow: 16384,
        costPer1kTokens: 0.0014,
        capabilities: ['code-generation', 'text-generation'],
      },
    }
    return models[model] || null
  }
}