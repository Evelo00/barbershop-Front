"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { getWeekDays } from "@/app/utils/getWeekDays";
import { Dialog } from "@/components/ui/dialog"; 
import { CitaModalContent } from "@/components/cita-modal-content";
import { useToast } from "@/hooks/use-toast";

// --- INTERFAZ COMPLETA DE CITA AJUSTADA A LOS ALIAS DEL BACKEND (servicioCita, clienteCita) ---
interface Cita {
  id: string;
  fechaHora: string;
  duracionMinutos: number;
  estado: "pendiente" | "confirmada" | "cancelada";
  precioFinal: number;
  
  // Usamos los alias definidos en Sequelize Include y en el archivo index.ts
  servicioCita?: { // <-- CORREGIDO: Usamos 'servicioCita'
    nombre: string;
    duracion?: number; 
    precio?: number;
  };
  clienteCita?: { // <-- CORREGIDO: Usamos 'clienteCita'
    nombre: string;
    apellido: string;
  };
}

export default function BarberoDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [citas, setCitas] = useState<Cita[]>([]);
  const [ganancias, setGanancias] = useState(0);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);

  const weekDays = getWeekDays();
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8am – 8pm
  const API_BASE_URL = "http://localhost:4000";

  const todayIndex = weekDays.findIndex(
    (d) => d.toDateString() === new Date().toDateString()
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState(
    todayIndex > -1 ? todayIndex : 0
  );

  const handleStatusChange = async (
    citaId: string,
    nuevoEstado: "confirmada" | "cancelada"
  ) => {
    const token = localStorage.getItem("token");
    const API_URL = `${API_BASE_URL}/api/citas/${citaId}`;

    try {
      const response = await fetch(API_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar la cita.");
      }
      
      // Actualizar el estado local (Mantiene los datos anidados ya cargados)
      setCitas((prevCitas) =>
        prevCitas.map((c) => (c.id === citaId ? { ...c, estado: nuevoEstado } : c))
      );
      
      toast({
        title: "Éxito",
        description: `Cita ${citaId.substring(0, 4)} ${nuevoEstado}.`,
      });

    } catch (error) {
      console.error("Fallo la actualización:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la cita.",
        variant: "destructive",
      });
    }
  };
  
  const handleCitaClick = (cita: Cita) => {
    setSelectedCita(cita);
  };
    
  const closeCitaModal = () => {
    setSelectedCita(null);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Lógica para cargar Citas
    fetch(`${API_BASE_URL}/api/barbero/citas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setCitas)
      .catch((err) => console.error("Error fetching citas:", err));

    // Lógica para cargar Ganancias
    fetch(`${API_BASE_URL}/api/barbero/ganancias`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setGanancias(d.total))
      .catch((err) => console.error("Error fetching ganancias:", err));
  }, [API_BASE_URL]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  const citasPorDia = weekDays.map((day) =>
    citas.filter((c) => {
      const fecha = new Date(c.fechaHora);
      return (
        fecha.getFullYear() === day.getFullYear() &&
        fecha.getMonth() === day.getMonth() &&
        fecha.getDate() === day.getDate()
      );
    })
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Agenda Semanal</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Ganancias */}
        <div className="p-4 border rounded bg-white shadow-sm">
          <h2 className="text-xl font-semibold text-gray-700">Ganancias de la semana</h2>
          <p className="text-3xl font-extrabold text-blue-600">${ganancias.toLocaleString("es-CO")}</p>
        </div>

        <div className="md:hidden flex overflow-x-auto border-b bg-white rounded-t">
          {weekDays.map((day, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDayIndex(idx)}
              className={`flex-shrink-0 py-3 px-4 text-sm font-medium ${
                selectedDayIndex === idx
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {day.toLocaleDateString("es-CO", {
                weekday: "short",
                day: "numeric",
              })}
            </button>
          ))}
        </div>

        <div className="border rounded overflow-hidden bg-white shadow-lg">
          
          <div className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_repeat(7,minmax(0,1fr))] border-b bg-gray-100">
            <div className="p-2 text-right pr-2 font-semibold border-r">Hora</div>
            
            {weekDays.map((d, i) => (
              <div
                key={i}
                className={`p-2 text-center font-semibold border-l ${
                  selectedDayIndex === i ? "block" : "hidden"
                } md:block`}
              >
                {d.toLocaleDateString("es-CO", {
                  weekday: "short",
                  day: "numeric",
                })}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_repeat(7,minmax(0,1fr))] relative">
            
            <div className="flex flex-col border-r">
              {hours.map((h) => (
                <div key={h} className="h-20 text-[16px] content-center text-right pr-2 border-b text-gray-500">
                  {h}:00
                </div>
              ))}
            </div>

            {citasPorDia.map((citasDia, idx) => (
              <div
                key={idx}
                className={`relative border-l ${
                  selectedDayIndex === idx ? "block" : "hidden"
                } md:block`}
              >
                {hours.map((h) => (
                  <div key={h} className="h-20 border-b border-dashed border-gray-200">
                    <div className="h-1/4 border-b border-dotted border-gray-100"></div>
                    <div className="h-1/4 border-b border-dotted border-gray-100"></div>
                    <div className="h-1/4 border-b border-dotted border-gray-100"></div>
                  </div>
                ))}

                {citasDia.map((cita) => {
                  const fecha = new Date(cita.fechaHora);
                  const hour = fecha.getHours();
                  const minutes = fecha.getMinutes();
                  const topPx = (hour - 8) * 80 + (minutes / 60) * 80; // 80px = h-20
                  const heightPx = (cita.duracionMinutos / 60) * 80;
                  
                  const isPending = cita.estado === 'pendiente';
                  const bgColor = isPending ? 'bg-yellow-500 hover:bg-yellow-600' : 
                                  cita.estado === 'confirmada' ? 'bg-green-600 hover:bg-green-700' : 
                                  'bg-red-600';

                  return (
                    <div
                      key={cita.id}
                      className={`absolute left-1 right-1 text-white rounded p-2 shadow text-xs transition-colors cursor-pointer z-10 ${bgColor}`}
                      style={{ top: topPx, height: heightPx }}
                      onClick={() => handleCitaClick(cita)}
                    >
                      <strong className="block truncate">
                        {/* CORREGIDO: Usamos el alias servicioCita */}
                        {cita.servicioCita?.nombre || "Servicio"} 
                      </strong>
                      <span className="opacity-90">
                        {hour}:{String(minutes).padStart(2, "0")} | 
                        {/* CORREGIDO: Usamos el alias clienteCita */}
                        {cita.clienteCita?.nombre || "Cliente"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <Dialog open={!!selectedCita} onOpenChange={closeCitaModal}>
          {selectedCita && (
              <CitaModalContent 
                  cita={selectedCita} 
                  onStatusChange={handleStatusChange} 
                  closeModal={closeCitaModal} 
              />
          )}
      </Dialog>
    </div>
  );
}