import { NextRequest, NextResponse } from 'next/server'
import { llmService } from '@/lib/llm/unified-service'
import { z } from 'zod'

const ContentGenerationRequestSchema = z.object({
  prompt: z.string().min(1),
  type: z.enum(['content', 'layout', 'design', 'analysis']),
  options: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional(),
    provider: z.string().optional(),
    model: z.string().optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = ContentGenerationRequestSchema.parse(body)

    const response = await llmService.generateContent(
      validatedData.prompt,
      validatedData.options
    )

    return NextResponse.json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('Content generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to generate content',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Content generation API is running',
    providers: llmService.getAvailableProviders().map(p => ({
      id: p.id,
      name: p.name,
      models: p.models.map(m => ({
        id: m.id,
        name: m.name,
        type: m.type,
        maxTokens: m.maxTokens
      }))
    }))
  })
}