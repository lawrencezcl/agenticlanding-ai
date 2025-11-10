'use client'

import { motion } from 'framer-motion'
import { Brain, Palette, BarChart, Globe, Lock, Zap, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'Multi-LLM Intelligence',
    description: 'Powered by OpenAI GPT-4o, Google Gemini, DeepSeek, and Qwen3 for optimal content generation.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Palette,
    title: 'Brand Compliance',
    description: 'AI ensures every landing page matches your brand guidelines perfectly, every time.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: BarChart,
    title: 'Data-Driven',
    description: 'Leverage historical campaign data and A/B test results for maximum conversions.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Globe,
    title: 'Global Deployment',
    description: 'One-click deployment to Vercel with automatic CDN and SSL configuration.',
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'GDPR/CCPA compliant with enterprise-grade security and data protection.',
    color: 'from-indigo-500 to-blue-500'
  },
  {
    icon: Zap,
    title: 'Real-time Preview',
    description: 'See changes instantly with our section-by-section control and live preview system.',
    color: 'from-yellow-500 to-orange-500'
  }
]

export function FeaturesSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Convert
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI-powered platform combines cutting-edge technology with proven marketing principles
            to deliver landing pages that drive results.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <div className="card card-hover h-full">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center px-6 py-3 bg-brand-main/10 text-brand-main rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4 mr-2" />
            Powered by Full Vercel Technology Stack
          </div>
        </motion.div>
      </div>
    </section>
  )
}