import { ShieldX } from 'lucide-react'

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-4">
        <ShieldX className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">אין גישה למערכת</h1>
        <p className="text-muted-foreground">
          החשבון שלך עדיין לא אושר על ידי מנהל המערכת.
          <br />
          פנה למנהל כדי לקבל הרשאת גישה.
        </p>
      </div>
    </div>
  )
}
