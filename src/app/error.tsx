'use client'

import { Button } from '@/components/ui/button'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center" dir="rtl">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">שגיאה</h1>
        <p className="text-muted-foreground">משהו השתבש. אנא נסה שוב.</p>
        <Button onClick={reset}>נסה שוב</Button>
      </div>
    </div>
  )
}
