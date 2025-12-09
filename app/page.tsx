import { MarketingLayout } from '@/components/marketing/MarketingLayout'
import { HeroSection } from '@/components/marketing/HeroSection'
import { FeaturesSection } from '@/components/marketing/FeaturesSection'
import { ToolCategoriesSection } from '@/components/marketing/ToolCategoriesSection'
import { PricingSection } from '@/components/marketing/PricingSection'
import { FAQSection } from '@/components/marketing/FAQSection'
import { CTASection } from '@/components/marketing/CTASection'

export default function Home() {
  return (
    <MarketingLayout>
      <HeroSection />
      <FeaturesSection />
      <ToolCategoriesSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </MarketingLayout>
  )
}
