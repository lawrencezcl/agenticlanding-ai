'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowRight, Rocket } from 'lucide-react'

export function CTASection() {
  const router = useRouter()

  const handleStartTrial = () => {
    router.push('/auth/signin')
  }

  const handleScheduleDemo = () => {
    // For now, navigate to signin - can add demo scheduling later
    router.push('/auth/signin')
  }
  return (
    <section className="py-20 bg-gradient-to-r from-brand-main to-brand-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium mb-6"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Ready to Launch?
          </motion.div>

          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Start Creating High-Converting Landing Pages Today
          </h2>

          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of marketers who are already using AI to create landing pages
            that drive real business results.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={handleStartTrial}
              className="bg-white text-brand-main hover:bg-gray-100 transition-colors duration-200 font-bold py-4 px-8 rounded-lg text-lg flex items-center hover:scale-105 transition-transform"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button
              onClick={handleScheduleDemo}
              className="border-2 border-white text-white hover:bg-white hover:text-brand-main transition-all duration-200 font-bold py-4 px-8 rounded-lg text-lg hover:scale-105 transition-transform"
            >
              Schedule Demo
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-12 text-white/80 text-sm"
          >
            No credit card required • 14-day free trial • Cancel anytime
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}