import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Scissors } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="bg-primary text-primary-foreground p-6 rounded-full">
            <Scissors className="w-12 h-12" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-balance">BarberShop</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Reserva tu cita con los mejores barberos profesionales
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Link href="/login" className="block">
            <Button size="lg" className="w-full">
              Iniciar Sesión
            </Button>
          </Link>

          <Link href="/register" className="block">
            <Button size="lg" variant="outline" className="w-full bg-transparent">
              Crear Cuenta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
