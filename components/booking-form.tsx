"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const API_BASE_URL = "http://localhost:3000/api"

interface BookingFormProps {
  userId: string
}

export function BookingForm({ userId }: BookingFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [barbers, setBarbers] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [formData, setFormData] = useState({
    servicioId: "",
    barberoId: "",
  })

  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"]

  useEffect(() => {
    fetchServices()
    fetchBarbers()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/services`)
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      }
    } catch (error) {
      console.error("Error fetching services:", error)
    }
  }

  const fetchBarbers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`)
      if (response.ok) {
        const data = await response.json()
        const barberUsers = data.filter((user: any) => user.rol === "barbero")
        setBarbers(barberUsers)
      }
    } catch (error) {
      console.error("Error fetching barbers:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Por favor selecciona fecha y hora",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const dateTime = new Date(selectedDate)
      const [hours, minutes] = selectedTime.split(":")
      dateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

      const appointmentData = {
        clienteId: userId,
        barberoId: formData.barberoId,
        servicioId: formData.servicioId,
        fechaHora: dateTime.toISOString(),
      }

      const response = await fetch(`${API_BASE_URL}/citas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      })

      if (!response.ok) {
        throw new Error("Error al crear la cita")
      }

      toast({
        title: "¡Cita agendada!",
        description: "Tu cita ha sido reservada exitosamente",
      })

      router.push("/dashboard")
    } catch (error) {
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
          <div className="space-y-2">
            <Label htmlFor="servicio">Servicio</Label>
            <Select
              value={formData.servicioId}
              onValueChange={(value) => setFormData({ ...formData, servicioId: value })}
              required
            >
              <SelectTrigger id="servicio">
                <SelectValue placeholder="Selecciona un servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.nombre} - ${service.precio?.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="barbero">Barbero</Label>
            <Select
              value={formData.barberoId}
              onValueChange={(value) => setFormData({ ...formData, barberoId: value })}
              required
            >
              <SelectTrigger id="barbero">
                <SelectValue placeholder="Selecciona un barbero" />
              </SelectTrigger>
              <SelectContent>
                {barbers.map((barber) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    {barber.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fecha</Label>
            <div className="border border-input rounded-lg p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date < new Date(new Date().setHours(0, 0, 0, 0))}
                locale={es}
                className="rounded-md"
              />
            </div>
            {selectedDate && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {format(selectedDate, "PPP", { locale: es })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hora">Hora</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime} required>
              <SelectTrigger id="hora">
                <SelectValue placeholder="Selecciona una hora" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? "Agendando..." : "Confirmar Cita"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
