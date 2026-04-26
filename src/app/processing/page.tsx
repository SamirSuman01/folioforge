import { redirect } from 'next/navigation'

// Old processing flow replaced by /onboarding/step/5 (StepGenerate)
export default function ProcessingPage() {
  redirect('/onboarding')
}
