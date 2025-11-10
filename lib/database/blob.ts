import { put, del, head, list } from '@vercel/blob'

// Blob service for file storage
export class BlobService {
  private static instance: BlobService

  static getInstance(): BlobService {
    if (!BlobService.instance) {
      BlobService.instance = new BlobService()
    }
    return BlobService.instance
  }

  // Upload landing page assets (images, videos, etc.)
  async uploadAsset(
    file: File | Buffer,
    filename: string,
    options: {
      contentType?: string
      addRandomSuffix?: boolean
    } = {}
  ): Promise<{
    url: string
    pathname: string
    contentType: string
    size: number
  }> {
    try {
      const blob = await put(filename, file, {
        access: 'public',
        contentType: options.contentType,
        addRandomSuffix: options.addRandomSuffix ?? true,
      })

      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType || '',
        size: blob.size || 0,
      }
    } catch (error) {
      console.error('Upload asset error:', error)
      throw error
    }
  }

  // Upload generated landing page HTML
  async uploadLandingPage(
    html: string,
    pageId: string,
    options: {
      isDraft?: boolean
    } = {}
  ): Promise<{
    url: string
    pathname: string
  }> {
    try {
      const filename = options.isDraft
        ? `landing-pages/${pageId}/draft/index.html`
        : `landing-pages/${pageId}/index.html`

      const blob = await put(filename, html, {
        access: 'public',
        contentType: 'text/html',
        addRandomSuffix: false,
      })

      return {
        url: blob.url,
        pathname: blob.pathname,
      }
    } catch (error) {
      console.error('Upload landing page error:', error)
      throw error
    }
  }

  // Upload brand assets (logos, fonts, guidelines)
  async uploadBrandAsset(
    file: File | Buffer,
    brandId: string,
    assetType: 'logo' | 'font' | 'guideline' | 'other',
    filename: string
  ): Promise<{
    url: string
    pathname: string
    contentType: string
    size: number
  }> {
    try {
      const pathname = `brands/${brandId}/${assetType}s/${filename}`
      const blob = await put(pathname, file, {
        access: 'public',
        addRandomSuffix: false,
      })

      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType || '',
        size: blob.size || 0,
      }
    } catch (error) {
      console.error('Upload brand asset error:', error)
      throw error
    }
  }

  // Upload analytics export files
  async uploadAnalyticsExport(
    data: any,
    format: 'json' | 'csv' | 'pdf',
    pageId: string,
    dateRange: string
  ): Promise<{
    url: string
    pathname: string
  }> {
    try {
      const filename = `analytics/${pageId}/${dateRange}/export.${format}`
      let content: string
      let contentType: string

      switch (format) {
        case 'json':
          content = JSON.stringify(data, null, 2)
          contentType = 'application/json'
          break
        case 'csv':
          content = this.convertToCSV(data)
          contentType = 'text/csv'
          break
        case 'pdf':
          content = await this.generatePDF(data)
          contentType = 'application/pdf'
          break
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }

      const blob = await put(filename, content, {
        access: 'public',
        contentType,
        addRandomSuffix: false,
      })

      return {
        url: blob.url,
        pathname: blob.pathname,
      }
    } catch (error) {
      console.error('Upload analytics export error:', error)
      throw error
    }
  }

  // Upload template files
  async uploadTemplate(
    templateData: any,
    templateId: string,
    previewImage?: File | Buffer
  ): Promise<{
    templateUrl: string
    previewUrl?: string
  }> {
    try {
      // Upload template JSON
      const templatePathname = `templates/${templateId}/template.json`
      const templateBlob = await put(templatePathname, JSON.stringify(templateData, null, 2), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      })

      let previewUrl: string | undefined

      // Upload preview image if provided
      if (previewImage) {
        const previewPathname = `templates/${templateId}/preview.png`
        const previewBlob = await put(previewPathname, previewImage, {
          access: 'public',
          contentType: 'image/png',
          addRandomSuffix: false,
        })
        previewUrl = previewBlob.url
      }

      return {
        templateUrl: templateBlob.url,
        previewUrl,
      }
    } catch (error) {
      console.error('Upload template error:', error)
      throw error
    }
  }

  // Upload A/B test results
  async uploadABTestResults(
    results: any,
    testId: string
  ): Promise<{
    url: string
    pathname: string
  }> {
    try {
      const filename = `ab-tests/${testId}/results.json`
      const blob = await put(filename, JSON.stringify(results, null, 2), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      })

      return {
        url: blob.url,
        pathname: blob.pathname,
      }
    } catch (error) {
      console.error('Upload A/B test results error:', error)
      throw error
    }
  }

  // Get file metadata
  async getFileInfo(pathname: string): Promise<{
    size: number
    uploadedAt: Date
    contentType: string
  } | null> {
    try {
      const blob = await head(pathname)
      if (!blob) return null

      return {
        size: blob.size || 0,
        uploadedAt: blob.uploadedAt || new Date(),
        contentType: blob.contentType || '',
      }
    } catch (error) {
      console.error('Get file info error:', error)
      return null
    }
  }

  // Delete file
  async deleteFile(pathname: string): Promise<void> {
    try {
      await del(pathname)
    } catch (error) {
      console.error('Delete file error:', error)
      throw error
    }
  }

  // List files in a directory
  async listFiles(prefix: string, limit: number = 100): Promise<Array<{
    pathname: string
    size: number
    uploadedAt: Date
    contentType: string
  }>> {
    try {
      const blobs = await list({
        prefix,
        limit,
      })

      return blobs.blobs.map(blob => ({
        pathname: blob.pathname,
        size: blob.size || 0,
        uploadedAt: blob.uploadedAt || new Date(),
        contentType: blob.contentType || '',
      }))
    } catch (error) {
      console.error('List files error:', error)
      return []
    }
  }

  // Upload user-generated content
  async uploadUserContent(
    file: File | Buffer,
    userId: string,
    contentType: string,
    filename: string
  ): Promise<{
    url: string
    pathname: string
    size: number
  }> {
    try {
      const pathname = `user-content/${userId}/${filename}`
      const blob = await put(pathname, file, {
        access: 'public',
        contentType,
        addRandomSuffix: true,
      })

      return {
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size || 0,
      }
    } catch (error) {
      console.error('Upload user content error:', error)
      throw error
    }
  }

  // Upload backup files
  async uploadBackup(
    data: any,
    backupType: string,
    date: string
  ): Promise<{
    url: string
    pathname: string
  }> {
    try {
      const filename = `backups/${backupType}/${date}.json`
      const blob = await put(filename, JSON.stringify(data, null, 2), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
      })

      return {
        url: blob.url,
        pathname: blob.pathname,
      }
    } catch (error) {
      console.error('Upload backup error:', error)
      throw error
    }
  }

  // Helper methods
  private convertToCSV(data: any): string {
    if (!Array.isArray(data) || data.length === 0) {
      return ''
    }

    const headers = Object.keys(data[0])
    const csvRows = [headers.join(',')]

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header]
        return typeof value === 'string' && value.includes(',')
          ? `"${value.replace(/"/g, '""')}"`
          : value
      })
      csvRows.push(values.join(','))
    }

    return csvRows.join('\n')
  }

  private async generatePDF(data: any): Promise<string> {
    // This is a placeholder - would need to implement PDF generation
    // using a library like pdf-lib or puppeteer
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792]) // Letter size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const fontSize = 12
    const lineHeight = fontSize * 1.2
    let y = 750

    page.drawText('Analytics Report', {
      x: 50,
      y,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    })

    y -= lineHeight * 2

    const jsonText = JSON.stringify(data, null, 2)
    const lines = jsonText.split('\n')

    for (const line of lines) {
      if (y < 50) {
        // Add new page if we run out of space
        const newPage = pdfDoc.addPage([612, 792])
        page.drawText(line, {
          x: 50,
          y: 750,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        })
        y = 750
      } else {
        page.drawText(line, {
          x: 50,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        })
        y -= lineHeight
      }
    }

    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes).toString('base64')
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const testFiles = await this.listFiles('health-check', 1)
      return true // If we can list files, Blob storage is working
    } catch (error) {
      console.error('Blob health check failed:', error)
      return false
    }
  }
}

export const blobService = BlobService.getInstance()