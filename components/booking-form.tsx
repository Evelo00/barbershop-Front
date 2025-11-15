"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image" // <-- 1. IMPORTAR IMAGE
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DayPicker } from "react-day-picker"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Service {
  id: string
  nombre: string
  precio: number
}

// --- 2. INTERFAZ ACTUALIZADA (basada en tu modelo User) ---
interface Barber {
  id: string
  nombre: string
  apellido: string
  rol: "superadmin" | "caja" | "barbero" | "cliente"
  fotoUrl?: string // Opcional, para la foto
}
// ---

interface BookingFormProps {
  userId: string
  services?: Service[]
  barbers?: Barber[] // Ahora espera la lista de usuarios
}

export function BookingForm({
  userId,
  services = [],
  barbers = [], // Recibe la lista completa de usuarios
}: BookingFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [formData, setFormData] = useState({ servicioId: "", barberoId: "" })

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!

  // --- 3. FILTRAR BARBEROS ---
  // Filtramos la lista de usuarios para quedarnos solo con los barberos
  const barberosDisponibles = barbers.filter((user) => user.rol === "barbero")
  // ---

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  ]

  // Convertir hora 24h -> 12h
  const formatHour = (hour: string) => {
    const [h, m] = hour.split(":").map(Number)
    const ampm = h >= 12 ? "PM" : "AM"
    const hour12 = h % 12 === 0 ? 12 : h % 12
    return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.servicioId || !formData.barberoId || !selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Crear ISO string de la fecha + hora
      const dateTime = new Date(selectedDate)
      const [hours, minutes] = selectedTime.split(":").map(Number)
      dateTime.setHours(hours, minutes, 0, 0)

      const appointmentData = {
        clienteId: userId,
        barberoId: formData.barberoId,
        servicioId: formData.servicioId,
        fechaHora: dateTime.toISOString(),
      }

      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/citas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(appointmentData),
      })

      if (!res.ok) throw new Error("Error al crear la cita")

      toast({
        title: "¡Cita agendada!",
        description: "Tu cita ha sido reservada exitosamente",
      })
      router.push("/dashboard")
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudo agendar la cita. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* --- 4. SELECCIÓN DE BARBERO (NUEVO GRID) --- */}
          <div className="space-y-2">
            <Label>Barbero</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {barberosDisponibles.length > 0 ? (
                barberosDisponibles.map((barber) => (
                  <button
                    type="button" // Importante para no enviar el form
                    key={barber.id}
                    onClick={() => setFormData({ ...formData, barberoId: barber.id })}
                    className={`border rounded-lg p-3 text-center transition-all flex flex-col items-center ${
                      formData.barberoId === barber.id
                        ? "ring-2 ring-blue-500 border-blue-500" // Estilo seleccionado
                        : "border-input hover:bg-gray-50"
                    }`}
                  >
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden mb-2">
                      <Image
                        // Usa la foto del barbero o un placeholder
                        src={barber.fotoUrl || `https://i.pravatar.cc/150?u=${barber.id}`}
                        alt={`${barber.nombre} ${barber.apellido}`}
                        layout="fill"
                        objectFit="cover"
                        className="bg-gray-200"
                      />
                    </div>
                    <span className="font-medium text-sm">
                      {barber.nombre} {barber.apellido}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground col-span-full">
                  No hay barberos disponibles.
                </p>
              )}
            </div>
          </div>
          {/* --- FIN GRID BARBEROS --- */}


          {/* --- 5. SELECCIÓN DE SERVICIO (AHORA SEGUNDO) --- */}
          <div className="space-y-2">
            <Label htmlFor="servicio">Servicio</Label>
            <Select
              value={formData.servicioId}
              onValueChange={(value) => setFormData({ ...formData, servicioId: value })}
              required
            >
              <SelectTrigger id="servicio" className="bg-white">
                <SelectValue placeholder="Selecciona un servicio" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {services.length > 0 ? (
                  services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.nombre} - ${service.precio.toLocaleString()}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No hay servicios disponibles
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          {/* --- FIN SERVICIO --- */}

          {/* Fecha */}
          <div className="space-y-2">
            <Label>Fecha</Label>
            <div className="border border-input rounded-lg p-3 bg-white overflow-x-auto">
              <div className="w-full flex justify-center">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date: any) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  locale={es}
                  className="rounded-md"
                />
              </div>
            </div>
            {selectedDate && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {format(selectedDate, "PPP", { locale: es })}
              </p>
            )}
          </div>

          {/* Hora */}
          <div className="space-y-2">
            <Label htmlFor="hora">Hora</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime} required>
              <SelectTrigger id="hora" className="bg-white">
                <SelectValue placeholder="Selecciona una hora" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {formatHour(time)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Confirmar Cita"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}