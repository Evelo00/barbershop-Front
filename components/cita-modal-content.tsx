"use client";

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useState } from "react";
import {
  Clock,
  DollarSign,
  User,
  Calendar,
  Tag,
  Mail,
  Smartphone,
  XCircle,
  Trash2,
  Pencil,
  Check,
} from "lucide-react";

interface CitaModalContentProps {
  cita: any;
  closeModal: () => void;
  onUpdated?: () => void;
}

function utcToLocalInput(datetime: string) {
  const date = new Date(datetime); // JS ya convierte a local
  const localISO = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  return localISO;
}

export function CitaModalContent({
  cita,
  closeModal,
  onUpdated,
}: CitaModalContentProps) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    nombreCliente: cita.nombreCliente || "",
    emailCliente: cita.emailCliente || "",
    whatsappCliente: cita.whatsappCliente || "",
    precioFinal: cita.precioFinal ?? 0,
    notas: cita.notas || "",
    fechaHora: utcToLocalInput(cita.fechaHora),
  });

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const guardarCambios = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/citas/${cita.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("No autorizado");

      onUpdated?.();
      closeModal();
    } catch {
      alert("Error guardando cambios.");
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

      const res = await fetch(`${API_BASE_URL}/api/citas/${cita.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("No autorizado");

      onUpdated?.();
      closeModal();
    } catch {
      alert("Error eliminando cita.");
    }

    setLoading(false);
  };

  const inicio = new Date(cita.fechaHora);
  const fin = new Date(cita.fechaFin);

  const format12 = (d: Date) => {
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  if (!editMode)
    return (
      <DialogContent
        showCloseButton={false}
        className="
          bg-white rounded-2xl shadow-xl 
          w-full max-w-md max-h-[85vh] 
          overflow-y-auto p-6
          animate-[fadeIn_0.2s_ease-out]
          font-[Avenir]
        "
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
        </DialogHeader>

        <div className="space-y-5 py-2 text-gray-800">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-lg font-semibold">
              {cita.servicioCita?.nombre || "Servicio no disponible"}
            </h3>

            <span
              className={`px-3 py-1 text-xs rounded-full font-semibold ${
                cita.estado === "confirmada"
                  ? "bg-green-100 text-green-700"
                  : cita.estado === "cancelada"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {cita.estado}
            </span>
          </div>

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
              {format12(inicio)} - {format12(fin)}{" "}
              <span className="opacity-60 ml-1">
                ({cita.duracionMinutos} min)
              </span>
            </p>

            <DollarSign className="text-blue-600 w-5 h-5" />
            <p>${cita.precioFinal?.toLocaleString("es-CO")}</p>

            <Tag className="text-blue-600 w-5 h-5" />
            <p className="font-mono text-xs">{cita.id}</p>
          </div>
        </div>
      </DialogContent>
    );

  return (
    <DialogContent
      showCloseButton={false}
      className="
        bg-white rounded-2xl shadow-xl 
        w-full max-w-md max-h-[85vh] 
        overflow-y-auto p-6
        animate-[fadeIn_0.2s_ease-out]
        font-[Avenir]
      "
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
      </DialogHeader>

      <div className="space-y-5 py-2 text-gray-800">

        {/* Fecha */}
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Fecha y hora
          </label>
          <input
            type="datetime-local"
            className="w-full border mt-1 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
            value={form.fechaHora}
            onChange={(e) => handleChange("fechaHora", e.target.value)}
          />
        </div>

        {/* Cliente */}
        <div>
          <label className="text-sm font-semibold text-gray-700">Cliente</label>

          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-400"
            value={form.nombreCliente}
            onChange={(e) => handleChange("nombreCliente", e.target.value)}
          />

          <input
            type="email"
            className="w-full border rounded-lg px-3 py-2 mt-2 focus:ring-2 focus:ring-indigo-400"
            value={form.emailCliente}
            onChange={(e) => handleChange("emailCliente", e.target.value)}
          />

          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 mt-2 focus:ring-2 focus:ring-indigo-400"
            value={form.whatsappCliente}
            onChange={(e) => handleChange("whatsappCliente", e.target.value)}
          />
        </div>

        {/* Precio */}
        <div>
          <label className="text-sm font-semibold text-gray-700">Precio</label>
          <input
            type="number"
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-400"
            value={form.precioFinal}
            onChange={(e) =>
              handleChange("precioFinal", Number(e.target.value))
            }
          />
        </div>

        {/* Notas */}
        <div>
          <label className="text-sm font-semibold text-gray-700">Notas</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-400"
            rows={3}
            value={form.notas}
            onChange={(e) => handleChange("notas", e.target.value)}
          />
        </div>

        {/* Guardar */}
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
