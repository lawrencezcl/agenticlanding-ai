#!/usr/bin/env node

const https = require('https')
const { execSync } = require('child_process')

const notifyDeployment = async (environment = 'production') => {
  try {
    console.log(`🚀 Notifying deployment to ${environment}...`)

    // Get current git info
    const gitBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()
    const gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
    const gitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim()

    // Get deployment info
    const deploymentTime = new Date().toISOString()
    const deploymentUrl = environment === 'production'
      ? 'https://agenticlanding.vercel.app'
      : `https://staging.agenticlanding.vercel.app`

    const deploymentData = {
      environment,
      deploymentTime,
      gitBranch,
      gitCommit,
      gitMessage,
      deploymentUrl,
      version: process.env.npm_package_version || '0.1.0',
      features: [
        'Multi-LLM Integration',
        'Vercel Stack',
        'Real-time Preview',
        'Brand Compliance',
        'Analytics Integration',
        'Sitecore BYOC'
      ]
    }

    console.log('📊 Deployment Information:')
    console.log(`  Environment: ${environment}`)
    console.log(`  URL: ${deploymentUrl}`)
    console.log(`  Branch: ${gitBranch}`)
    console.log(`  Commit: ${gitCommit.substring(0, 7)}`)
    console.log(`  Time: ${deploymentTime}`)

    // Send notification to webhook (placeholder for actual integration)
    if (process.env.DEPLOYMENT_WEBHOOK_URL) {
      console.log('📡 Sending webhook notification...')

      const response = await fetch(process.env.DEPLOYMENT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deploymentData)
      })

      if (response.ok) {
        console.log('✅ Webhook notification sent successfully')
      } else {
        console.log('⚠️  Webhook notification failed')
      }
    } else {
      console.log('ℹ️  No webhook URL configured, skipping notification')
    }

    // Check deployment health
    console.log('\n🔍 Checking deployment health...')
    const maxAttempts = 30
    let attempts = 0
    let healthy = false

    while (attempts < maxAttempts && !healthy) {
      attempts++
      console.log(`  Attempt ${attempts}/${maxAttempts}...`)

      try {
        const response = await fetch(deploymentUrl, {
          timeout: 5000,
          signal: AbortSignal.timeout(5000)
        })

        if (response.ok) {
          healthy = true
          console.log(`✅ Deployment is healthy after ${attempts} attempts`)
        }
      } catch (error) {
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }

    if (!healthy) {
      console.log('⚠️  Deployment health check failed, but deployment may still be starting up')
    }

    console.log('\n🎉 Deployment notification completed!')

    // Return success for CI/CD systems
    process.exit(0)

  } catch (error) {
    console.error('❌ Deployment notification failed:', error.message)
    process.exit(1)
  }
}

// Simple fetch implementation
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
        'User-Agent': 'AgenticLanding-Deploy/1.0',
        ...options.headers
      }
    }

    const req = https.request(requestOptions, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: () => Promise.resolve(data ? JSON.parse(data) : {}),
          text: () => Promise.resolve(data)
        })
      })
    })

    req.on('error', reject)

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    }

    req.end()
  })
}

// Get environment from command line arguments
const environment = process.argv[2] || 'production'
notifyDeployment(environment)