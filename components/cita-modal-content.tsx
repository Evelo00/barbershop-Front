"use client";

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { useState } from "react";
import {
  Clock,
  DollarSign,
  User,
  Calendar,
  Mail,
  Smartphone,
  XCircle,
  Trash2,
  Pencil,
  Check,
} from "lucide-react";

interface ServicioCita {
  id: string;
  servicioId: string;
  precio: number;
  duracion: number;
  servicio?: {
    id: string;
    nombre: string;
    duracion: number;
    precio: number;
  };
}

interface CitaModalContentProps {
  cita: any;
  closeModal: () => void;
  onUpdated?: (id?: string) => void;
  servicios: any[];
}

function utcToLocalInput(datetime: string) {
  const date = new Date(datetime);
  // Pasar de UTC a local "naive" para datetime-local (YYYY-MM-DDTHH:mm)
  const localISO = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16);
  return localISO;
}

// 👉 Normaliza string de datetime-local a ISO con zona de Bogotá
function withBogotaOffset(datetimeLocal: string) {
  // viene como "2025-12-27T09:00"
  if (!datetimeLocal) return datetimeLocal;
  // si ya trae un + o - en la parte final, no tocar
  if (datetimeLocal.includes("+") || datetimeLocal.includes("-")) {
    return datetimeLocal;
  }
  // agregar segundos y offset -05:00
  return `${datetimeLocal}:00-05:00`;
}

export function CitaModalContent({
  cita,
  closeModal,
  onUpdated,
  servicios,
}: CitaModalContentProps) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [localServicios, setLocalServicios] = useState<ServicioCita[]>(
    cita.servicios || []
  );

  const [form, setForm] = useState({
    nombreCliente: cita.nombreCliente || "",
    emailCliente: cita.emailCliente || "",
    whatsappCliente: cita.whatsappCliente || "",
    precioFinal: cita.precioFinal ?? 0,
    notas: cita.notas || "",
    fechaHora: utcToLocalInput(cita.fechaHora),
    duracionMinutos: cita.duracionMinutos,
  });

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const recalcTotals = (items: ServicioCita[]) => {
    const totalPrecio = items.reduce((sum, s) => sum + s.precio, 0);
    const totalDur = items.reduce((sum, s) => sum + s.duracion, 0);

    setForm((prev) => ({
      ...prev,
      precioFinal: totalPrecio,
      duracionMinutos: totalDur,
    }));
  };

  const guardarCambios = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // 🔥 convertir datetime-local a ISO con zona de Bogotá
      const fechaHoraNormalizada = withBogotaOffset(form.fechaHora);

      const payload = {
        ...form,
        fechaHora: fechaHoraNormalizada,
        servicios: localServicios.map((s) => ({
          servicioId: s.servicioId ?? s.servicio?.id,
          precio: s.precio,
          duracion: s.duracion,
        })),
      };

      const res = await fetch(`${API_BASE_URL}/api/citas/${cita.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error actualizando cita");

      onUpdated?.(cita.id);
      closeModal();
    } catch (err) {
      console.error("🔥 Error actualizar cita:", err);
      alert("Error actualizando cita");
    }
    setLoading(false);
  };

  const cancelarCita = async () => {
    if (!confirm("¿Cancelar esta cita?")) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      await fetch(`${API_BASE_URL}/api/citas/${cita.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: "cancelada" }),
      });

      onUpdated?.();
      closeModal();
    } catch {
      alert("Error cancelando cita.");
    }
    setLoading(false);
  };

  const eliminarCita = async () => {
    if (!confirm("¿Eliminar esta cita DEFINITIVAMENTE?")) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      await fetch(`${API_BASE_URL}/api/citas/${cita.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      onUpdated?.();
      closeModal();
    } catch {
      alert("Error eliminando cita.");
    }
    setLoading(false);
  };

  // ⏱ Para mostrar: usamos fechaHora que viene de la DB (UTC) + duración
  const inicio = new Date(cita.fechaHora);
  const fin = new Date(inicio.getTime() + form.duracionMinutos * 60000);

  const format12 = (d: Date) => {
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  /* ===================== MODO LECTURA ===================== */
  if (!editMode)
    return (
      <DialogContent
        showCloseButton={false}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 font-[Avenir]"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex justify-between items-center">
            Detalle de Cita
            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(true)}
                className="p-2 rounded-lg bg-yellow-200 text-yellow-800 hover:bg-yellow-300"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={cancelarCita}
                className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
              >
                <XCircle className="w-4 h-4" />
              </button>
              <button
                onClick={eliminarCita}
                className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Información detallada de la cita seleccionada.
          </DialogDescription>
        </DialogHeader>

        {/* SERVICIOS */}
        <div className="space-y-5 py-2 text-gray-800">
          <div className="border-b pb-3">
            <h3 className="text-lg font-semibold mb-2">Servicios</h3>

            {localServicios.length > 0 ? (
              <div className="space-y-2">
                {localServicios.map((s) => (
                  <div
                    key={s.id}
                    className="px-3 py-2 rounded-lg bg-gray-100 border text-sm flex flex-col"
                  >
                    <span className="font-semibold">
                      {s.servicio?.nombre}
                    </span>
                    <span className="text-gray-600 text-xs">
                      {s.duracion} min — ${s.precio.toLocaleString("es-CO")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No hay servicios asociados
              </p>
            )}
          </div>

          {/* INFO */}
          <div className="grid grid-cols-[25px_1fr] text-sm gap-y-4">
            <User className="text-blue-600 w-5 h-5" />
            <p>{cita.nombreCliente || "Cliente externo"}</p>

            <Mail className="text-blue-600 w-5 h-5" />
            <p>{cita.emailCliente || "N/A"}</p>

            <Smartphone className="text-blue-600 w-5 h-5" />
            <p>{cita.whatsappCliente || "N/A"}</p>

            <Calendar className="text-blue-600 w-5 h-5" />
            <p>
              {inicio.toLocaleDateString("es-CO", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>

            <Clock className="text-blue-600 w-5 h-5" />
            <p>
              {format12(inicio)} – {format12(fin)}{" "}
              <span className="opacity-60 ml-1">
                ({form.duracionMinutos} min)
              </span>
            </p>

            <DollarSign className="text-blue-600 w-5 h-5" />
            <p>${form.precioFinal.toLocaleString("es-CO")}</p>
          </div>
        </div>
      </DialogContent>
    );

  /* ===================== MODO EDICIÓN ===================== */
  return (
    <DialogContent
      showCloseButton={false}
      className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 font-[Avenir]"
    >
      <DialogHeader>
        <DialogTitle className="text-xl font-bold flex justify-between items-center">
          Editar Cita
          <button
            onClick={() => setEditMode(false)}
            className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm"
          >
            Cancelar
          </button>
        </DialogTitle>

        <DialogDescription className="sr-only">
          Formulario para editar los datos y servicios de la cita.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 py-2 text-gray-800">
        {/* SERVICIOS */}
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Servicios de la cita
          </label>

          <div className="space-y-2 mt-2">
            {localServicios.map((s, index) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2 border rounded-lg bg-gray-50"
              >
                <div>
                  <p className="font-semibold text-sm">
                    {s.servicio?.nombre}
                  </p>
                  <p className="text-xs text-gray-500">
                    {s.duracion} min — ${s.precio.toLocaleString("es-CO")}
                  </p>
                </div>

                <button
                  className="text-red-600 text-sm font-bold"
                  onClick={() => {
                    const nuevos = [...localServicios];
                    nuevos.splice(index, 1);
                    setLocalServicios(nuevos);
                    recalcTotals(nuevos);
                  }}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>

          {/* Agregar servicio */}
          <div className="mt-4">
            <label className="text-sm text-gray-700">Agregar servicio</label>

            <select
              className="w-full border mt-1 rounded-lg px-3 py-2"
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;

                const serv = servicios.find((s: any) => s.id === id);
                if (!serv) return;

                if (localServicios.some((sv) => sv.servicioId === serv.id)) {
                  e.target.value = "";
                  return;
                }

                const nuevos = [
                  ...localServicios,
                  {
                    id: crypto.randomUUID(),
                    servicioId: serv.id,
                    precio: serv.precio,
                    duracion: serv.duracion,
                    servicio: serv,
                  },
                ];

                setLocalServicios(nuevos);
                recalcTotals(nuevos);

                e.target.value = "";
              }}
            >
              <option value="">Seleccione un servicio</option>

              {servicios.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} — {s.duracion} min / $
                  {s.precio.toLocaleString("es-CO")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* FECHA */}
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Fecha y hora
          </label>
          <input
            type="datetime-local"
            className="w-full border mt-1 rounded-lg px-3 py-2"
            value={form.fechaHora}
            onChange={(e) => handleChange("fechaHora", e.target.value)}
          />
        </div>

        {/* CLIENTE */}
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Cliente
          </label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={form.nombreCliente}
            onChange={(e) => handleChange("nombreCliente", e.target.value)}
          />
          <input
            type="email"
            className="w-full border rounded-lg px-3 py-2 mt-2"
            value={form.emailCliente}
            onChange={(e) => handleChange("emailCliente", e.target.value)}
          />
          <input
            type="tel"
            className="w-full border rounded-lg px-3 py-2 mt-2"
            value={form.whatsappCliente}
            onChange={(e) =>
              handleChange("whatsappCliente", e.target.value)
            }
          />
        </div>

        {/* PRECIO */}
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Precio total
          </label>
          <input
            type="number"
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={form.precioFinal}
            onChange={(e) =>
              handleChange("precioFinal", Number(e.target.value))
            }
          />
        </div>

        {/* NOTAS */}
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Notas
          </label>
          <textarea
            rows={3}
            className="w-full border rounded-lg px-3 py-2 mt-1"
            value={form.notas}
            onChange={(e) => handleChange("notas", e.target.value)}
          />
        </div>

        {/* GUARDAR */}
        <button
          onClick={guardarCambios}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition font-semibold mt-4"
        >
          <Check className="inline-block w-4 h-4 mr-1" />
          Guardar cambios
        </button>
      </div>
    </DialogContent>
  );
}
