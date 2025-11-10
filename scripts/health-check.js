#!/usr/bin/env node

const https = require('https')

const healthCheck = async () => {
  const startTime = Date.now()

  try {
    console.log('🏥 Starting AgenticLanding AI Health Check...\n')

    // Check if the application is running
    const response = await fetch('http://localhost:3000/api/health')

    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`)
    }

    const data = await response.json()
    const responseTime = Date.now() - startTime

    console.log('✅ Application Status: Healthy')
    console.log(`⚡ Response Time: ${responseTime}ms`)
    console.log(`📅 Timestamp: ${new Date().toISOString()}`)

    if (data.services) {
      console.log('\n🔧 Services Status:')
      Object.entries(data.services).forEach(([service, status]) => {
        const icon = status.healthy ? '✅' : '❌'
        console.log(`  ${icon} ${service}: ${status.message}`)
      })
    }

    if (data.version) {
      console.log(`\n📦 Version: ${data.version}`)
    }

    if (data.environment) {
      console.log(`🌍 Environment: ${data.environment}`)
    }

    console.log('\n🎉 Health check completed successfully!')

    process.exit(0)
  } catch (error) {
    console.error('❌ Health check failed:', error.message)
    console.error('Please ensure the application is running on localhost:3000')

    process.exit(1)
  }
}

// Simple fetch implementation for Node.js environments
global.fetch = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AgenticLanding-Health-Check/1.0',
        ...options.headers
      }
    }

    const req = https.request(requestOptions, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: () => Promise.resolve(jsonData)
          })
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: () => Promise.resolve({})
          })
        }
      })
    })

    req.on('error', reject)

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    }

    req.end()
  })
}

healthCheck()