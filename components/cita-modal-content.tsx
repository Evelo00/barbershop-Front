"use client";

import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, DollarSign, User, Calendar, Tag, Mail, Smartphone } from "lucide-react";

interface Cita {
  id: string;
  fechaHora: string;
  duracionMinutos: number;
  estado: "pendiente" | "confirmada" | "cancelada";
  precioFinal: number;

  servicioCita?: {
    nombre?: string;
    duracion?: number;
    precio?: number;
  };

  nombreCliente?: string;
  apellidoCliente?: string;
  emailCliente?: string;
  whatsappCliente?: string;
  nombreServicio?: string;
  duracionServicio?: number;
  precioServicio?: number;
}

interface CitaModalContentProps {
  cita: Cita;
  closeModal: () => void;
}

export function CitaModalContent({ cita }: CitaModalContentProps) {
  const {
    id,
    estado,
    fechaHora,
    duracionMinutos,
    precioFinal,
    servicioCita,
    nombreCliente,
    apellidoCliente,
    emailCliente,
    whatsappCliente,
    nombreServicio,
  } = cita;

  const fecha = new Date(fechaHora);
  const duracion = servicioCita?.duracion || duracionMinutos;
  const precio = servicioCita?.precio || precioFinal;

  const horaFin = new Date(fecha.getTime() + duracion * 60000);

  const statusColors = {
    pendiente: "text-yellow-600 bg-yellow-100",
    confirmada: "text-green-600 bg-green-100",
    cancelada: "text-red-600 bg-red-100",
  };

  const statusTextMap = {
    pendiente: "Pendiente",
    confirmada: "Confirmada",
    cancelada: "Cancelada",
  };

  const format12h = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  return (
    <DialogContent className="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold">Detalle de Cita</DialogTitle>
        <DialogDescription>
          Información de la cita solicitada por el cliente.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="flex justify-between items-center pb-2 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            {servicioCita?.nombre || nombreServicio || "Servicio Desconocido"}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[estado]}`}>
            {statusTextMap[estado]}
          </span>
        </div>

        <div className="grid grid-cols-[25px_1fr] gap-y-3 text-sm">
          <User className="w-5 h-5 text-blue-500" />
          <p>
            Cliente: <strong>{nombreCliente || "N/A"} {apellidoCliente || ""}</strong>
          </p>

          <Mail className="w-5 h-5 text-blue-500" />
          <p>{emailCliente || "N/A"}</p>

          <Smartphone className="w-5 h-5 text-blue-500" />
          <p>{whatsappCliente || "N/A"}</p>

          <Calendar className="w-5 h-5 text-blue-500" />
          <p>
            Día: <strong>{fecha.toLocaleDateString("es-CO", { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
          </p>

          <Clock className="w-5 h-5 text-blue-500" />
          <p>
            Hora: <strong>{format12h(fecha)} - {format12h(horaFin)}</strong>
            <span className="text-muted-foreground ml-2">({duracion} min)</span>
          </p>

          <DollarSign className="w-5 h-5 text-blue-500" />
          <p>
            Precio: <strong>${precio.toLocaleString("es-CO")}</strong>
          </p>

          <Tag className="w-5 h-5 text-blue-500" />
          <p>
            ID: <span className="font-mono text-xs text-muted-foreground">{id}</span>
          </p>
        </div>
      </div>
    </DialogContent>
  );
}
