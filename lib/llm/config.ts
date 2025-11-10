import { LLMProvider } from '@/types/api'

export const LLM_PROVIDERS: LLMProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        type: 'content',
        maxTokens: 128000,
        costPerToken: 0.000005,
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openai',
        type: 'content',
        maxTokens: 128000,
        costPerToken: 0.00000015,
      },
    ],
    config: {
      rateLimit: {
        requestsPerMinute: 500,
        tokensPerMinute: 200000,
      },
      timeout: 60000,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000,
      },
    },
  },
  {
    id: 'google',
    name: 'Google',
    models: [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'google',
        type: 'content',
        maxTokens: 8192,
        costPerToken: 0.0035,
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'google',
        type: 'content',
        maxTokens: 8192,
        costPerToken: 0.00015,
      },
      {
        id: 'gemini-1.0-pro',
        name: 'Gemini 1.0 Pro',
        provider: 'google',
        type: 'content',
        maxTokens: 2048,
        costPerToken: 0.0005,
      },
    ],
    config: {
      rateLimit: {
        requestsPerMinute: 60,
        tokensPerMinute: 32000,
      },
      timeout: 60000,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000,
      },
    },
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        provider: 'deepseek',
        type: 'content',
        maxTokens: 32768,
        costPerToken: 0.00000014,
      },
      {
        id: 'deepseek-coder',
        name: 'DeepSeek Coder',
        provider: 'deepseek',
        type: 'code',
        maxTokens: 16384,
        costPerToken: 0.00000014,
      },
    ],
    config: {
      rateLimit: {
        requestsPerMinute: 100,
        tokensPerMinute: 100000,
      },
      timeout: 60000,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000,
      },
    },
  },
  {
    id: 'qwen3',
    name: 'Qwen3',
    models: [
      {
        id: 'qwen-max',
        name: 'Qwen Max',
        provider: 'qwen3',
        type: 'content',
        maxTokens: 6144,
        costPerToken: 0.02,
      },
      {
        id: 'qwen-plus',
        name: 'Qwen Plus',
        provider: 'qwen3',
        type: 'content',
        maxTokens: 30720,
        costPerToken: 0.004,
      },
      {
        id: 'qwen-turbo',
        name: 'Qwen Turbo',
        provider: 'qwen3',
        type: 'content',
        maxTokens: 6144,
        costPerToken: 0.002,
      },
      {
        id: 'qwen-max-longcontext',
        name: 'Qwen Max Long Context',
        provider: 'qwen3',
        type: 'content',
        maxTokens: 30720,
        costPerToken: 0.03,
      },
    ],
    config: {
      rateLimit: {
        requestsPerMinute: 100,
        tokensPerMinute: 80000,
      },
      timeout: 60000,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000,
      },
    },
  },
]

export const getProviderConfig = (providerId: string) => {
  return LLM_PROVIDERS.find(p => p.id === providerId)
}

export const getModelConfig = (providerId: string, modelId: string) => {
  const provider = getProviderConfig(providerId)
  return provider?.models.find(m => m.id === modelId)
}

export const getOptimalProvider = (taskType: string, complexity: 'simple' | 'medium' | 'complex') => {
  // Logic to select optimal provider based on task type and complexity
  switch (taskType) {
    case 'landing_page_generation':
      if (complexity === 'complex') return { provider: 'openai', model: 'gpt-4o' }
      return { provider: 'openai', model: 'gpt-4o-mini' }

    case 'content_optimization':
      return { provider: 'openai', model: 'gpt-4o-mini' }

    case 'brand_compliance':
      return { provider: 'openai', model: 'gpt-4o' }

    case 'form_generation':
      return { provider: 'openai', model: 'gpt-4o-mini' }

    case 'code_generation':
      return { provider: 'deepseek', model: 'deepseek-coder' }

    case 'chinese_content':
      return { provider: 'qwen3', model: 'qwen-plus' }

    case 'analysis':
      return { provider: 'openai', model: 'gpt-4o-mini' }

    case 'multimodal':
      return { provider: 'google', model: 'gemini-1.5-pro' }

    case 'content_generation':
    default:
      if (complexity === 'complex') return { provider: 'openai', model: 'gpt-4o' }
      return { provider: 'openai', model: 'gpt-4o-mini' }
  }
}