import { redirect } from 'next/navigation'

// Legacy step route — flow is now a single page at /onboarding
export default function OnboardingStepPage() {
  redirect('/onboarding')
}
