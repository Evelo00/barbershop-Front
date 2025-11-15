// components/BarberoCalendar.tsx
"use client"

import React, { useEffect, useMemo, useState } from "react"
import { DayPicker } from "react-day-picker"
import { format, startOfToday, isSameDay, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2 } from "lucide-react"

type EstadoCita = "pendiente" | "confirmada" | "cancelada" | "completada"

type Cita = {
  id: string
  clienteId?: string
  barberoId: string
  servicioId?: string
  fechaHora: string // ISO
  estado: EstadoCita
}

export default function BarberoCalendar({
  barberoId,
  apiBaseUrl,
}: {
  barberoId: string
  apiBaseUrl?: string
}) {
  const API_BASE = apiBaseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)

  const statusToClass: Record<EstadoCita, string> = {
    pendiente: "bg-yellow-400",
    confirmada: "bg-green-500",
    cancelada: "bg-red-500",
    completada: "bg-green-700",
  }

  useEffect(() => {
    if (!barberoId) return
    let mounted = true
    const token = localStorage.getItem("token")

    const fetchCitas = async () => {
      setLoading(true)
      setError(null)
      try {
        const url = `${API_BASE}/citas?barberoId=${barberoId}`
        let res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })

        if (res.status === 404 || res.headers.get("content-type")?.includes("text/html")) {
          // fallback
          res = await fetch(`${API_BASE}/citas`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          })
        }

        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Error fetching citas: ${res.status} - ${text}`)
        }

        const data = await res.json()
        const lista: Cita[] = Array.isArray(data)
          ? // si el backend devolvió todas las citas, filtrar por barberoId
            data.filter((c) => c.barberoId === barberoId)
          : []

        if (mounted) setCitas(lista)
      } catch (err: any) {
        console.error(err)
        if (mounted) setError(err?.message ?? "Error al cargar citas")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchCitas()
    return () => {
      mounted = false
    }
  }, [barberoId, API_BASE])

  const citasPorDia = useMemo(() => {
    const map = new Map<string, Cita[]>()
    for (const c of citas) {
      try {
        const d = new Date(c.fechaHora)
        const key = format(d, "yyyy-MM-dd")
        const arr = map.get(key) ?? []
        arr.push(c)
        map.set(key, arr)
      } catch {
        // ignore malformed
      }
    }
    return map
  }, [citas])

  const statusesForDay = (date: Date) => {
    const key = format(date, "yyyy-MM-dd")
    const arr = citasPorDia.get(key) ?? []
    const set = new Set<EstadoCita>()
    for (const c of arr) set.add(c.estado)
    return Array.from(set)
  }

  const daysWithCitas = useMemo(() => {
    return Array.from(citasPorDia.keys()).map((k) => {
      const [y, m, d] = k.split("-").map(Number)
      return new Date(y, m - 1, d)
    })
  }, [citasPorDia])

  const citasDelDia = useMemo(() => {
    if (!selectedDay) return []
    const key = format(selectedDay, "yyyy-MM-dd")
    return (citasPorDia.get(key) ?? []).sort((a, b) =>
      new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime()
    )
  }, [selectedDay, citasPorDia])

  const renderDay = (date: Date) => {
    const day = date.getDate()
    const statuses = statusesForDay(date)
    return (
      <div className="flex flex-col items-center">
        <div className="text-sm leading-none">{day}</div>

        <div className="flex items-center gap-1 mt-1">
          {statuses.slice(0, 3).map((s) => (
            <span
              key={s}
              className={`w-2 h-2 rounded-full ${statusToClass[s as EstadoCita]}`}
              aria-hidden
            />
          ))}
          {statuses.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+</span>
          )}
        </div>
      </div>
    )
  }

  const handleDayClick = (day: Date) => {
    const key = format(day, "yyyy-MM-dd")
    if (citasPorDia.has(key)) {
      setSelectedDay((prev) => (prev && isSameDay(prev, day) ? undefined : day))
    } else {
      setSelectedDay(undefined)
    }
  }

  const start = startOfToday()

  return (
    <div className="w-full md:max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Calendario del barbero</h3>
        <div className="text-sm text-muted-foreground">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> cargando
            </span>
          ) : (
            <span>{barberoId ? "Barbero seleccionado" : "Sin barbero"}</span>
          )}
        </div>
      </div>

      <div className="rounded-md border bg-card p-3">
        <DayPicker
          locale={es}
          mode="single"
          selected={selectedDay}
          onDayClick={handleDayClick}
          disabled={{ before: start }}
          showOutsideDays
          modifiers={{
            withCitas: daysWithCitas,
          }}
          components={
            {
              DayContent: (props: any) => renderDay(props.date),
            } as any
          }
          styles={{
            caption: { display: "flex", justifyContent: "center" },
          }}
        />
      </div>

      <div className="mt-4">
        {selectedDay ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Citas — {format(selectedDay, "PPP", { locale: es })}</h4>
              <button
                type="button"
                className="text-sm text-muted-foreground underline"
                onClick={() => setSelectedDay(undefined)}
              >
                Cerrar
              </button>
            </div>

            {citasDelDia.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay citas este día.</p>
            ) : (
              <ul className="space-y-2">
                {citasDelDia.map((c) => (
                  <li
                    key={c.id}
                    className="p-3 bg-white/5 border rounded-md flex items-start justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {format(parseISO(c.fechaHora), "hh:mm aaaa", { locale: es })}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Estado:{" "}
                        <span className="font-medium capitalize">{c.estado}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${statusToClass[c.estado]}`}
                        title={c.estado}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Selecciona un día para ver las citas.</p>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-500">Error: {error}</p>}
    </div>
  )
}