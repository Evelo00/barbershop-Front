// components/CitaBarberoCard.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface CitaBarberoCardProps {
  cita: Cita;
  onStatusChange: (citaId: string, nuevoEstado: "confirmada" | "cancelada") => void;
  top: number;
  height: number;
}

interface Cita {
  id: string;
  fechaHora: string;
  duracionMinutos: number;
  estado: "pendiente" | "confirmada" | "cancelada";
  servicio: { nombre: string };
  cliente: { nombre: string; apellido: string };
  precioFinal: number;
}

export function CitaBarberoCard({ cita, onStatusChange, top, height }: CitaBarberoCardProps) {
  const { estado, fechaHora, duracionMinutos, cliente, servicio, precioFinal } = cita;
  const fecha = new Date(fechaHora);
  const hour = fecha.getHours();
  const minutes = fecha.getMinutes();

  const isPending = estado === "pendiente";
  
  let bgColor = "bg-blue-500";
  if (estado === "confirmada") bgColor = "bg-green-600";
  if (estado === "cancelada") bgColor = "bg-red-600";
  if (isPending) bgColor = "bg-yellow-500/80 border border-yellow-700";

  return (
    <div
      key={cita.id}
      className={`absolute left-1 right-1 text-white rounded p-1 shadow text-[10px] sm:text-xs z-10 
                  ${bgColor} transition-all duration-200`}
      style={{ top: top, height: height }}
    >
      <div className="font-semibold leading-tight mb-1">
        {servicio.nombre}
      </div>
      <div className="leading-tight">
        {cliente.nombre} {cliente.apellido}
      </div>
      <div className="text-[10px] mt-1 opacity-90">
        {hour}:{String(minutes).padStart(2, "0")} | ${precioFinal}
      </div>

      {isPending && (
        <div className="absolute inset-x-0 bottom-0 flex h-6 bg-black/30 rounded-b">
          <Button
            size="default"
            className="flex-1 rounded-none rounded-bl bg-green-500 hover:bg-green-700 h-full"
            onClick={() => onStatusChange(cita.id, "confirmada")}
          >
            <Check className="w-3 h-3" />
          </Button>
          <Button
            size="default"
            className="flex-1 rounded-none rounded-br bg-red-500 hover:bg-red-700 h-full"
            onClick={() => onStatusChange(cita.id, "cancelada")}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}