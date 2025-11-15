"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BookingForm } from "@/components/booking-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Clock } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { isPast, startOfDay } from "date-fns"

interface Service {
  id: string
  nombre: string
  precio: number
}

interface Barber {
  id: string
  nombre: string
  apellido: string
  rol: "superadmin" | "caja" | "barbero" | "cliente"
  fotoUrl?: string
}

interface User {
  id: string
  nombre: string
  apellido?: string
  rol: "superadmin" | "caja" | "barbero" | "cliente"
}

interface Booking {
  id: string
  estado: "pendiente" | "confirmada" | "cancelada"
  fechaHora: string
  servicioId: string
  barberoId: string
}

export default function BookingPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [user, setUser] = useState<User | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

  const format12h = (iso: string) => {
    const date = new Date(iso)
    let hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12 || 12
    return `${hours}:${minutes} ${ampm}`
  }

  const getStatusColor = (estado: string) => {
    if (estado === "pendiente") return "bg-yellow-500"
    if (estado === "cancelada") return "bg-red-500"
    return "bg-green-500"
  }

  // Cargar usuario
  useEffect(() => {
    const userData = localStorage.getItem("user")
    const token = localStorage.getItem("token")

    if (!userData || !token) {
      router.replace("/login")
      return
    }

    try {
      setUser(JSON.parse(userData))
    } catch {
      router.replace("/login")
    }
  }, [router])

// Cargar servicios, barberos y citas
useEffect(() => {
  if (!user) return

  const fetchAll = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
    
    const today = new Date()

    try {
      const [servicesRes, barbersRes, bookingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/services`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/users?rol=barbero`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/citas`, {
        headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const servicesData = await servicesRes.json()
      const barbersData = await barbersRes.json()
      const bookingsData = await bookingsRes.json()

      const allUserBookings = Array.isArray(bookingsData)
        ? bookingsData.filter((b) => b.clienteId === user.id)
        : []

      const futureUserBookings = allUserBookings
        .filter((b) => {
          const bookingDate = new Date(b.fechaHora)
          
          const todayStart = startOfDay(today) 
          
          const bookingStartOfDay = startOfDay(bookingDate)
          
          if (bookingStartOfDay < todayStart) {
            return false
          }
          
          return !isPast(bookingDate)
        })
        .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime()) 

      setServices(Array.isArray(servicesData) ? servicesData : [])
      setBarbers(Array.isArray(barbersData) ? barbersData : [])
      setBookings(futureUserBookings)
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  fetchAll()
}, [user, API_BASE_URL])

  if (!user) return <p className="p-4 text-center">Cargando usuario...</p>

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Título */}
          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Agendar Cita</h1>
            <p className="text-muted-foreground">
              Selecciona el servicio, barbero y horario de tu preferencia
            </p>
          </div>

          {loading && <p>Cargando datos...</p>}

          {!loading && (
            <>
              {/* Booking Form */}
              <BookingForm userId={user.id} services={services} barbers={barbers} />

              {/* Citas del usuario */}
              <h2 className="text-xl font-bold mt-10 mb-4">Tus Citas</h2>

              <div className="space-y-4">
                {bookings.length === 0 && (
                  <p className="text-muted-foreground">Aún no tienes citas.</p>
                )}

                {bookings.map((booking) => {
                  const service = services.find((s) => s.id === booking.servicioId)
                  const barber = barbers.find((b) => b.id === booking.barberoId)

                  return (
                    <div
                      key={booking.id}
                      className="relative p-4 border rounded-lg bg-card shadow-sm"
                    >
                      {/* Estado indicator */}
                      <span
                        className={`absolute right-2 top-2 w-3 h-3 rounded-full ${getStatusColor(
                          booking.estado
                        )}`}
                      ></span>

                      <p className="font-semibold">{service?.nombre || "Servicio"}</p>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {new Date(booking.fechaHora).toLocaleDateString("es-CO")}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="w-4 h-4" />
                        {format12h(booking.fechaHora)}
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Barbero: <span className="font-medium">{barber?.nombre}</span>
                      </p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}