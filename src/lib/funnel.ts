export function track(event: string, properties?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[track]', event, properties)
  }
}
