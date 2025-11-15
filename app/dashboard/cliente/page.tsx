"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, LogOut, User } from "lucide-react"
import Link from "next/link"
import { BookingCard } from "@/components/booking-cards"

interface Booking {
  id: string
  estado: "pendiente" | "confirmada" | "cancelada" | "completada"
  fechaHora: string
  servicioId: string
  barberoId: string
  clienteId: string
}

interface Service {
  id: string
  nombre: string
  precio: number
}

interface Barber {
  id: string
  nombre: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

  // Cargar info del usuario
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(userData))
  }, [router])

  useEffect(() => {
    if (!user) return

    const fetchAll = async () => {
      setLoading(true)
      const token = localStorage.getItem("token")

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

        const userBookings = Array.isArray(bookingsData)
          ? bookingsData.filter((b: Booking) => b.clienteId === user.id)
          : []

        setServices(Array.isArray(servicesData) ? servicesData : [])
        setBarbers(Array.isArray(barbersData) ? barbersData : [])
        setBookings(userBookings)
      } catch (error) {
        console.error("Error cargando datos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    router.push("/login")
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">BarberShop</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Bienvenido, {user.nombre}</h2>
            <p className="text-muted-foreground">Gestiona tus citas y perfil</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary text-primary-foreground p-3 rounded-lg">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle>Agendar Cita</CardTitle>
                    <CardDescription>Reserva tu próxima cita</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href="/booking">
                  <Button className="w-full border border-foreground">Nueva Cita</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-secondary text-secondary-foreground p-3 rounded-lg">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle>Mi Perfil</CardTitle>
                    <CardDescription>Ver y editar información</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rol:</span>
                    <span className="font-medium capitalize">{user.rol}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Tus próximas citas</h3>

            {loading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : bookings.length === 0 ? (
              <p className="text-muted-foreground">No tienes citas programadas.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {bookings.map((booking) => {
                  const service = services.find((s) => s.id === booking.servicioId)
                  const barber = barbers.find((b) => b.id === booking.barberoId)

                  return (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      service={service}
                      barber={barber}
                    />
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}