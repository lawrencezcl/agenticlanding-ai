import { HeroSection } from '@/components/sections/HeroSection'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
import { CTASection } from '@/components/sections/CTASection'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <HeroSection />
      <FeaturesSection />
      <CTASection />
    </main>
  )
}