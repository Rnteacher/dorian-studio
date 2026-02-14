import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center" dir="rtl">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-xl font-semibold">הדף לא נמצא</h2>
        <p className="text-muted-foreground">
          הדף שחיפשת אינו קיים או שהוסר.
        </p>
        <Button asChild>
          <Link href="/projects">חזרה לפרויקטים</Link>
        </Button>
      </div>
    </div>
  )
}
