"use client";

import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, DollarSign, User, Calendar, Tag } from "lucide-react";

interface Cita {
  id: string;
  fechaHora: string;
  duracionMinutos: number;
  estado: "pendiente" | "confirmada" | "cancelada";
  precioFinal: number;

  servicioCita?: {
    nombre: string;
    duracion?: number; // Propiedad opcional
    precio?: number; // Propiedad opcional
  };
  clienteCita?: {
    nombre: string;
    apellido: string;
  };
}
// --------------------------------------------------------------------------

interface CitaModalContentProps {
  cita: Cita;
  onStatusChange: (citaId: string, nuevoEstado: "confirmada" | "cancelada") => Promise<void>;
  closeModal: () => void;
}

export function CitaModalContent({ cita, onStatusChange, closeModal }: CitaModalContentProps) {
  const { id, estado, fechaHora, clienteCita, servicioCita, precioFinal, duracionMinutos } = cita;
  const fecha = new Date(fechaHora);

  const isPending = estado === "pendiente";
  
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

  const handleAction = async (nuevoEstado: "confirmada" | "cancelada") => {
    await onStatusChange(id, nuevoEstado);
    closeModal(); // Cerrar el modal después de la acción
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
        <DialogTitle className="text-2xl font-bold">Solicitud de Cita</DialogTitle>
        <DialogDescription>
          Detalles de la cita solicitada por el cliente.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        
        <div className="flex justify-between items-center pb-2 border-b">
          <h3 className="text-xl font-bold text-gray-800">{servicioCita?.nombre || "Servicio Desconocido"}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[estado]}`}>
            {statusTextMap[estado]}
          </span>
        </div>

        <div className="grid grid-cols-[25px_1fr] gap-y-3 text-sm">
          
          <User className="w-5 h-5 text-blue-500" />
          <p>
            Cliente: <strong>{clienteCita?.nombre || "N/A"} {clienteCita?.apellido || ""}</strong>
          </p>

          <Calendar className="w-5 h-5 text-blue-500" />
          <p>
            Día: <strong>{fecha.toLocaleDateString("es-CO", { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
          </p>

          <Clock className="w-5 h-5 text-blue-500" />
          <p>
            Hora: <strong>{format12h(fecha)}</strong>
            <span className="text-muted-foreground ml-2">({duracionMinutos} min)</span>
          </p>

          <DollarSign className="w-5 h-5 text-blue-500" />
          <p>
            Precio: <strong>${precioFinal.toLocaleString("es-CO")}</strong>
          </p>
          
          <Tag className="w-5 h-5 text-blue-500" />
          <p>
            ID: <span className="font-mono text-xs text-muted-foreground">{id}</span>
          </p>

        </div>
      </div>

      {isPending && (
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleAction("cancelada")} 
            className="w-full sm:w-auto text-red-500 border-red-200 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-2" />
            Rechazar
          </Button>
          <Button 
            onClick={() => handleAction("confirmada")} 
            className="w-full sm:w-auto bg-green-500 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Confirmar
          </Button>
        </DialogFooter>
      )}
    </DialogContent>
  );
}