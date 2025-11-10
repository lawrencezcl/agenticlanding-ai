import { GenerationResponse } from '@/types/api'

export class QwenService {
  private apiKey: string | null = null
  private baseURL: string = 'https://dashscope.aliyuncs.com/api/v1'

  constructor() {
    this.apiKey = process.env.QWEN_API_KEY || null
  }

  private async ensureInitialized() {
    if (!this.apiKey) {
      throw new Error('Qwen API key not configured')
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
      throw new Error(`Qwen API error: ${response.status} - ${errorData.message || response.statusText}`)
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
        model: options.model || 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        parameters: {
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048,
          top_p: options.topP || 0.8,
          repetition_penalty: options.repetitionPenalty || 1.1,
        },
      }

      const response = await this.makeRequest('/services/aigc/text-generation/generation', data)
      const endTime = Date.now()

      if (response.output?.choices?.length > 0) {
        const choice = response.output.choices[0]
        return {
          content: choice.message.content,
          provider: 'qwen3',
          model: options.model || 'qwen-turbo',
          usage: {
            promptTokens: response.usage?.input_tokens || 0,
            completionTokens: response.usage?.output_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0,
          },
          latency: endTime - startTime,
          metadata: {
            finishReason: choice.finish_reason,
            requestId: response.request_id,
          },
        }
      } else {
        throw new Error('No response from Qwen API')
      }
    } catch (error: any) {
      console.error('Qwen API error:', error)
      throw new Error(`Qwen API error: ${error.message}`)
    }
  }

  async generateForTask(
    taskType: string,
    input: any,
    options: any = {}
  ): Promise<any> {
    await this.ensureInitialized()

    const taskPrompts = {
      landing_page_generation: `作为专业的营销文案专家，请根据以下需求生成完整的落地页内容：${JSON.stringify(input)}。请包含标题、副标题、产品介绍、功能特点、用户收益和行动号召。内容要具有说服力，符合中文用户的阅读习惯。`,
      content_optimization: `作为内容优化专家，请优化以下内容以提升转化率：${JSON.stringify(input)}。提供具体的改进建议、A/B测试方案，并解释每个改动的理由。`,
      brand_compliance: `作为品牌合规专家，请审查以下内容的品牌合规性：${JSON.stringify(input)}。检查品牌指南一致性、语调统一性，并提出改进建议。`,
      form_generation: `作为表单设计专家，请根据以下需求生成潜在客户获取表单：${JSON.stringify(input)}。包含表单字段、验证规则、用户友好的标签和提交处理说明。`,
      chinese_content: `作为中文内容创作专家，请为以下需求创作高质量的中文内容：${JSON.stringify(input)}。确保内容地道、专业，符合目标用户群体的语言习惯。`,
    }

    const prompt = taskPrompts[taskType as keyof typeof taskPrompts] ||
      `请处理这个${taskType}任务：${JSON.stringify(input)}`

    // For Chinese content tasks, prefer Qwen models
    let model = options.model || 'qwen-turbo'
    if (taskType === 'chinese_content' || taskType === 'landing_page_generation') {
      model = 'qwen-plus' // Better for Chinese content
    }

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
        model: options.model || 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        parameters: {
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048,
          incremental_output: true,
        },
      }

      const response = await fetch(`${this.baseURL}/services/aigc/text-generation/generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Qwen streaming error: ${response.status}`)
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
        try {
          const parsed = JSON.parse(chunk)
          if (parsed.output?.choices?.length > 0) {
            const content = parsed.output.choices[0].message?.content
            if (content) {
              onChunk(content)
            }
          }
        } catch (e) {
          // Skip invalid JSON or incomplete chunks
        }
      }
    } catch (error: any) {
      console.error('Qwen streaming error:', error)
      throw new Error(`Qwen streaming error: ${error.message}`)
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false

    try {
      await this.ensureInitialized()
      const response = await this.generateContent('你好，请回复"连接成功"', { maxTokens: 20 })
      return response.content.includes('连接成功') || response.content.length > 0
    } catch (error) {
      console.error('Qwen connection test failed:', error)
      return false
    }
  }

  getAvailableModels(): string[] {
    return [
      'qwen-turbo',
      'qwen-plus',
      'qwen-max',
      'qwen-max-longcontext',
    ]
  }

  getModelInfo(model: string): any {
    const models: Record<string, any> = {
      'qwen-turbo': {
        maxTokens: 6144,
        contextWindow: 8192,
        costPer1kTokens: 0.002,
        capabilities: ['text-generation', 'chinese', 'fast'],
        language: ['Chinese', 'English'],
      },
      'qwen-plus': {
        maxTokens: 30720,
        contextWindow: 32768,
        costPer1kTokens: 0.004,
        capabilities: ['text-generation', 'chinese', 'reasoning'],
        language: ['Chinese', 'English'],
      },
      'qwen-max': {
        maxTokens: 6144,
        contextWindow: 8192,
        costPer1kTokens: 0.02,
        capabilities: ['text-generation', 'chinese', 'reasoning', 'complex-tasks'],
        language: ['Chinese', 'English'],
      },
      'qwen-max-longcontext': {
        maxTokens: 30720,
        contextWindow: 32768,
        costPer1kTokens: 0.03,
        capabilities: ['text-generation', 'chinese', 'long-context'],
        language: ['Chinese', 'English'],
      },
    }
    return models[model] || null
  }
}