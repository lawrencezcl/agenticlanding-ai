import { GenerationRequest, GenerationResponse, LLMProvider } from '@/types/api'
import { getOptimalProvider, getProviderConfig } from './config'
import { OpenAIService } from './providers/openai-service'
import { GoogleService } from './providers/google-service'
import { DeepSeekService } from './providers/deepseek-service'
import { QwenService } from './providers/qwen-service'

export class UnifiedLLMService {
  private openaiService?: OpenAIService
  private googleService?: GoogleService
  private deepSeekService?: DeepSeekService
  private qwenService?: QwenService

  private getOpenAIService(): OpenAIService {
    if (!this.openaiService) {
      this.openaiService = new OpenAIService()
    }
    return this.openaiService
  }

  private getGoogleService(): GoogleService {
    if (!this.googleService) {
      this.googleService = new GoogleService()
    }
    return this.googleService
  }

  private getDeepSeekService(): DeepSeekService {
    if (!this.deepSeekService) {
      this.deepSeekService = new DeepSeekService()
    }
    return this.deepSeekService
  }

  private getQwenService(): QwenService {
    if (!this.qwenService) {
      this.qwenService = new QwenService()
    }
    return this.qwenService
  }

  async generateContent(
    prompt: string,
    options: any = {},
    preferredProvider?: string
  ): Promise<GenerationResponse> {
    const provider = preferredProvider || getOptimalProvider('content_generation', 'medium').provider
    const model = options.model || getOptimalProvider('content_generation', 'medium').model

    try {
      switch (provider) {
        case 'openai':
          return await this.getOpenAIService().generateContent(prompt, { ...options, model })
        case 'google':
          return await this.getGoogleService().generateContent(prompt, { ...options, model })
        case 'deepseek':
          return await this.getDeepSeekService().generateContent(prompt, { ...options, model })
        case 'qwen3':
          return await this.getQwenService().generateContent(prompt, { ...options, model })
        default:
          throw new Error(`Unsupported provider: ${provider}`)
      }
    } catch (error) {
      console.error(`Error with provider ${provider}:`, error)
      // Fallback to OpenAI if available
      if (provider !== 'openai') {
        return await this.getOpenAIService().generateContent(prompt, options)
      }
      throw error
    }
  }

  async generateForTask(
    taskType: string,
    input: any,
    options: any = {}
  ): Promise<any> {
    const { provider, model } = getOptimalProvider(taskType, options.complexity || 'medium')

    try {
      switch (provider) {
        case 'openai':
          return await this.getOpenAIService().generateForTask(taskType, input, { ...options, model })
        case 'google':
          return await this.getGoogleService().generateForTask(taskType, input, { ...options, model })
        case 'deepseek':
          return await this.getDeepSeekService().generateForTask(taskType, input, { ...options, model })
        case 'qwen3':
          return await this.getQwenService().generateForTask(taskType, input, { ...options, model })
        default:
          throw new Error(`Unsupported provider: ${provider}`)
      }
    } catch (error) {
      console.error(`Error with provider ${provider}:`, error)
      throw error
    }
  }

  async generateStream(
    prompt: string,
    options: any = {},
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const provider = options.provider || 'openai'
    const model = options.model || 'gpt-4o-mini'

    try {
      switch (provider) {
        case 'openai':
          await this.getOpenAIService().generateStream(prompt, { ...options, model }, onChunk)
          break
        case 'google':
          await this.getGoogleService().generateStream(prompt, { ...options, model }, onChunk)
          break
        case 'deepseek':
          await this.getDeepSeekService().generateStream(prompt, { ...options, model }, onChunk)
          break
        case 'qwen3':
          await this.getQwenService().generateStream(prompt, { ...options, model }, onChunk)
          break
        default:
          throw new Error(`Streaming not supported by provider: ${provider}`)
      }
    } catch (error) {
      console.error(`Error streaming with provider ${provider}:`, error)
      throw error
    }
  }

  async trackProviderPerformance(
    provider: string,
    taskType: string,
    metrics: any
  ): Promise<void> {
    // Store performance metrics in database or analytics service
    // This will be implemented when we set up the database layer
    console.log(`Tracking performance for ${provider} - ${taskType}:`, metrics)
  }

  getAvailableProviders(): LLMProvider[] {
    return [
      getProviderConfig('openai'),
      getProviderConfig('google'),
      getProviderConfig('deepseek'),
      getProviderConfig('qwen3'),
    ].filter(Boolean) as LLMProvider[]
  }

  async testProvider(providerId: string): Promise<boolean> {
    try {
      const testPrompt = "Hello, please respond with 'OK' to confirm you're working."
      const response = await this.generateContent(testPrompt, { provider: providerId })
      return response.content.includes('OK')
    } catch (error) {
      console.error(`Provider ${providerId} test failed:`, error)
      return false
    }
  }
}

// Singleton instance
export const llmService = new UnifiedLLMService()