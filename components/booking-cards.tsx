"use client"

import { Calendar, Clock } from "lucide-react"

interface Service {
  id: string
  nombre: string
  precio: number
}

interface Barber {
  id: string
  nombre: string
}

interface Booking {
  id: string
  estado: "pendiente" | "confirmada" | "cancelada" | "completada"
  fechaHora: string
  servicioId: string
  barberoId: string
}

export function BookingCard({
  booking,
  service,
  barber,
}: {
  booking: Booking
  service: Service | undefined
  barber: Barber | undefined
}) {
  const format12h = (iso: string) => {
    const date = new Date(iso)
    let hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12 || 12
    return `${hours}:${minutes} ${ampm}`
  }

  const getStatusInfo = (estado: Booking["estado"]) => {
    switch (estado) {
      case "pendiente":
        return {
          label: "Pendiente",
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          dot: "bg-yellow-500",
        }

      case "confirmada":
        return {
          label: "Confirmada",
          bg: "bg-green-100",
          text: "text-green-700",
          dot: "bg-green-500",
        }

      case "cancelada":
        return {
          label: "Cancelada",
          bg: "bg-red-100",
          text: "text-red-700",
          dot: "bg-red-500",
        }

      case "completada":
        return {
          label: "Completada",
          bg: "bg-blue-100",
          text: "text-blue-700",
          dot: "bg-blue-500",
        }

      default:
        return {
          label: "Desconocido",
          bg: "bg-gray-200",
          text: "text-gray-700",
          dot: "bg-gray-500",
        }
    }
  }

  const status = getStatusInfo(booking.estado)

  return (
    <div className="relative p-4 border rounded-lg bg-card shadow-sm">
      {/* Badge de estado */}
      <div
        className={`absolute right-2 top-2 flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
      >
        <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
        {status.label}
      </div>

      {/* Servicio */}
      <p className="font-semibold">{service?.nombre || "Servicio desconocido"}</p>

      {/* Fecha */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="w-4 h-4" />
        {new Date(booking.fechaHora).toLocaleDateString("es-CO")}
      </div>

      {/* Hora */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
        <Clock className="w-4 h-4" />
        {format12h(booking.fechaHora)}
      </div>

      {/* Barbero */}
      <p className="mt-1 text-sm text-muted-foreground">
        Barbero:{" "}
        <span className="font-medium">{barber?.nombre || "Sin asignar"}</span>
      </p>
    </div>
  )
}
