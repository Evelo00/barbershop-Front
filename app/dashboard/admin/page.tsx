"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Menu,
  Slash,
  Plus,
} from "lucide-react";

import { Dialog } from "@/components/ui/dialog";
import { CitaModalContent } from "@/components/cita-modal-content";
import CreateCitaModal from "@/components/createCitaModal";
import BloqueoModal from "@/components/bloqueo-modal";
import { useToast } from "@/hooks/use-toast";
import AgregarCliente from "@/components/agregarCliente";
import { toZonedTime } from "date-fns-tz";

interface Cita {
  id: string;
  barberoId: string;
  clienteId: string | null;

  fechaHora: string;
  fechaFin: string;
  duracionMinutos: number;

  estado: "pendiente" | "confirmada" | "cancelada" | "bloqueo";

  nombreCliente?: string | null;
  emailCliente?: string | null;
  whatsappCliente?: string | null;

  precioFinal: number;
  notas?: string | null;

  servicioCita?: {
    id: string;
    nombre: string;
    precio: number;
    duracionMinutos: number;
  };

  serviciosCita?: {
    id: string;
    nombre: string;
    precio: number;
    duracionMinutos: number;
  }[];

  clienteCita?: {
    nombre: string;
    apellido: string;
  };

  barberoCita?: {
    id: string;
    nombre: string;
    apellido: string;
    avatar?: string | null;
  };

  fechaLocal?: Date;
}

interface UserData {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: "superadmin" | "caja" | "barbero" | "cliente";
  activo: boolean;
  telefono: string;
  avatar?: string | null;
  silla?: number | null;
}

export default function SuperadminDashboard() {
  const { toast } = useToast();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const [isMobile, setIsMobile] = useState(false);
  const [selectedMobileBarber, setSelectedMobileBarber] =
    useState<string | null>(null);

  const [users, setUsers] = useState<UserData[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [blockModal, setBlockModal] = useState(false);
  const [blockBarbero, setBlockBarbero] = useState<UserData | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [addClienteModal, setAddClienteModal] = useState(false);
  const [sedes, setSedes] = useState<{ id: string; nombre: string }[]>([]);
  const [selectedSedeId, setSelectedSedeId] = useState<string | null>(null);
  const [quickCreate, setQuickCreate] = useState<{
    barberoId: string;
    fecha: Date;
  } | null>(null);
  const day = currentDate.getDay(); // 0 = domingo

  const START_HOUR = day === 0 ? 9 : 8;
  const END_HOUR = day === 0 ? 19 : 20;
  const SLOT_MINUTES = 30;
  const TOTAL_SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;

  const slotRef = useRef<HTMLDivElement | null>(null);
  const [slotHeight, setSlotHeight] = useState(48);

  const [now, setNow] = useState(new Date());

  /* Detectar móvil */
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /* Tamaño real del slot */
  useEffect(() => {
    if (slotRef.current)
      setSlotHeight(slotRef.current.getBoundingClientRect().height);
  }, []);

  /* Actualización del reloj */
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  /* Fetch USERS */
  const fetchUsers = async () => {
    if (!selectedSedeId) {
      setUsers([]);
      return;
    }
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_BASE_URL}/api/users?rol=barbero&sedeId=${selectedSedeId}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await res.json();

      const normalized = Array.isArray(data)
        ? data
        : Array.isArray(data.users)
          ? data.users
          : [];

      setUsers(normalized);
    } catch {
      setUsers([]);
    }
  };
  /* Fetch SERVICIOS */
  const fetchServicios = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/services`);
      const data = await res.json();

      const normalized = Array.isArray(data)
        ? data
        : Array.isArray(data.services)
          ? data.services
          : [];

      setServicios(normalized);
    } catch {
      setServicios([]);
    }
  };

  /* Fetch CITAS (CON FIX) */
  const fetchCitas = async (): Promise<Cita[]> => {
    try {
      const token = localStorage.getItem("token");
      const week = new Date(currentDate);
      week.setHours(0, 0, 0, 0);

      const weekStr = week.toISOString().slice(0, 10);

      const res = await fetch(
        `${API_BASE_URL}/api/citas?sedeId=${selectedSedeId}&week=${weekStr}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data: Cita[] = await res.json();

      const mapped = data.map((cita) => {
        const barbero = users.find((u) => u.id === cita.barberoId);
        const cliente = users.find((u) => u.id === cita.clienteId);

        return {
          ...cita,
          serviciosCita: Array.isArray(cita.serviciosCita)
            ? cita.serviciosCita
            : cita.servicioCita
              ? [cita.servicioCita]
              : [],
          barberoCita: barbero || undefined,
          clienteCita: cliente || undefined,

          // 🔥 FIX que garantiza rerender correctos
          fechaLocal: new Date(
            toZonedTime(cita.fechaHora, "America/Bogota").getTime()
          ),
        };
      });

      setCitas(mapped);
      return mapped;
    } catch {
      setCitas([]);
      return [];
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchServicios();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      fetchCitas();
      const first = users.find((u) => u.rol === "barbero" && u.activo);
      if (first && !selectedMobileBarber) setSelectedMobileBarber(first.id);
    }
  }, [users]);

  useEffect(() => {
    if (!selectedSedeId) return;

    fetchUsers();
    // limpia selección móvil para que se reasigne
    setSelectedMobileBarber(null);

  }, [selectedSedeId]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/sedes`)
      .then(res => res.json())
      .then(data => {
        setSedes(data);
        setSelectedSedeId(data[0]?.id ?? null);
      });
  }, []);

  const barberos = useMemo(
    () =>
      users
        .filter((u) => u.rol === "barbero" && u.activo)
        .sort((a, b) => (a.silla ?? 999) - (b.silla ?? 999)),
    [users]
  );

  const citasDelDia = useMemo(() => {
    return citas.filter((c) => {
      if (!c.fechaLocal) return false;
      const d = c.fechaLocal;
      return (
        d.getDate() === currentDate.getDate() &&
        d.getMonth() === currentDate.getMonth() &&
        d.getFullYear() === currentDate.getFullYear()
      );
    });
  }, [citas, currentDate]);

  const currentTimeTop = useMemo(() => {
    const today = new Date();
    if (
      today.getDate() !== currentDate.getDate() ||
      today.getMonth() !== currentDate.getMonth() ||
      today.getFullYear() !== currentDate.getFullYear()
    )
      return null;

    const hour = now.getHours();
    const minute = now.getMinutes();
    const totalMinutes = (hour - START_HOUR) * 60 + minute;

    if (totalMinutes < 0 || hour > END_HOUR) return null;

    return (totalMinutes * slotHeight) / 30;
  }, [now, currentDate, slotHeight]);

  const format12h = (d: Date) => {
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  const onApplyBloqueo = async (data: {
    fechaInicio: string;
    fechaFin: string;
    duracionMinutos: number;
    notas?: string;
  }) => {
    if (!blockBarbero) return;

    const body = {
      sedeId: selectedSedeId,
      barberoId: blockBarbero.id,
      clienteId: null,
      servicioId: "00000000-0000-0000-0000-000000000999",
      fechaHora: data.fechaInicio,
      fechaFin: data.fechaFin,
      duracionMinutos: data.duracionMinutos,
      precioFinal: 0,
      estado: "bloqueo",
      notas: data.notas ?? null,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/citas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({
          title: "Bloqueo creado",
          description: `${blockBarbero.nombre} — ${data.notas ?? "bloqueo general"
            }`,
        });

        setBlockModal(false);
        fetchCitas();
      } else {
        toast({
          title: "Error al crear bloqueo",
          variant: "destructive",
        });
      }
    } catch { }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-[Avenir]">
      {/* HEADER */}
      <header className="border-b bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Menu className="w-6 h-6 text-gray-500" />
          <h1 className="text-lg md:text-xl font-semibold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-500" />
            Administración
          </h1>
        </div>
        <select
          value={selectedSedeId ?? ""}
          onChange={(e) => setSelectedSedeId(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="" disabled>
            Seleccionar sede
          </option>

          {sedes.map((sede) => (
            <option key={sede.id} value={sede.id}>
              {sede.nombre}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 text-sm md:text-base"
          >
            <Plus className="w-4 h-4 mr-1" /> Crear
          </Button>

          <Button
            onClick={() => setAddClienteModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 text-sm md:text-base"
          >
            <Plus className="w-4 h-4 mr-1" /> Agregar cliente
          </Button>

          <Button
            onClick={fetchCitas}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 text-sm md:text-base"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* SELECTOR FECHA */}
      <div className="px-4 py-2 flex items-center justify-between text-sm border-b bg-white sticky top-[64px] md:top-[70px] z-40">
        <button
          onClick={() =>
            setCurrentDate(new Date(currentDate.getTime() - 86400000))
          }
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>

        <span className="font-medium text-gray-800">
          {currentDate.toLocaleDateString("es-CO", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>

        <button
          onClick={() =>
            setCurrentDate(new Date(currentDate.getTime() + 86400000))
          }
        >
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* HEADER BARBEROS */}
      {!isMobile && (
        <div
          className="grid border-b bg-white py-4 px-4 shadow-sm
               sticky top-[105px] z-30 backdrop-blur bg-white/95"
          style={{
            gridTemplateColumns: `80px repeat(${barberos.length}, 1fr)`,
          }}
        >
          <div></div>

          {barberos.map((b) => (
            <div key={b.id} className="text-center">
              <img
                src={
                  b.avatar
                    ? `${API_BASE_URL}/public/${b.avatar}`
                    : `https://ui-avatars.com/api/?name=${b.nombre}+${b.apellido}&background=EEE&color=555&bold=true`
                }
                className="w-16 h-16 rounded-full mx-auto border shadow-sm"
              />

              <div className="mt-1 font-medium text-sm text-gray-800">
                {b.nombre} {b.apellido?.split(" ")[0]}
              </div>

              <div className="text-xs text-gray-500">Silla {b.silla}</div>

              <button
                onClick={() => {
                  setBlockBarbero(b);
                  setBlockModal(true);
                }}
                className="mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-full flex items-center gap-1 mx-auto"
              >
                <Slash className="w-3 h-3" />
                Bloquear
              </button>
            </div>
          ))}
        </div>
      )}

      {/* GRID PRINCIPAL */}
      <main className="flex-1 overflow-y-auto relative bg-white">
        {/* Línea roja */}
        {currentTimeTop !== null && (
          <>
            <div
              className="absolute left-0 right-0 z-40 pointer-events-none"
              style={{
                top: currentTimeTop,
                height: "2px",
                background: "red",
              }}
            />

            <div
              className="absolute z-50 pointer-events-none"
              style={{
                top: currentTimeTop - 4,
                left: 72,
                width: "10px",
                height: "10px",
                background: "red",
                borderRadius: "50%",
              }}
            />
          </>
        )}

        <div
          className="grid"
          style={{
            gridTemplateColumns: `80px repeat(${barberos.length}, 1fr)`,
          }}
        >
          {/* Horas */}
          <div className="border-r text-[10px] md:text-xs text-gray-600 pt-4">
            {Array.from({
              length: TOTAL_SLOTS,
            }).map((_, i) => {
              const hour = START_HOUR + Math.floor(i / 2);
              const minute = i % 2 === 0 ? "00" : "30";

              return (
                <div
                  key={i}
                  ref={i === 0 ? slotRef : null}
                  className="h-12 md:h-16 relative border-b"
                >
                  <span className="absolute -top-2 left-1">
                    {(() => {
                      let h = hour;
                      const ampm = h >= 12 ? "PM" : "AM";
                      h = h % 12 || 12;
                      return `${h}:${minute} ${ampm}`;
                    })()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Columnas de barberos */}
          {barberos.map((barbero) => (
            <div key={barbero.id} className="border-r relative">
              {/* Slots vacíos */}
              {Array.from({ length: TOTAL_SLOTS }).map((_, i) => {
                const hour = START_HOUR + Math.floor(i / 2);
                const minute = i % 2 === 0 ? 0 : 30;

                const slotDate = new Date(currentDate);
                slotDate.setHours(hour, minute, 0, 0);

                return (
                  <div
                    key={i}
                    onClick={() => {
                      setQuickCreate({
                        barberoId: barbero.id,
                        fecha: slotDate,
                      });
                      setCreateModal(true);
                    }}
                    className="h-12 md:h-16 border-b border-gray-100
                 hover:bg-green-50 cursor-pointer
                 transition-colors"
                  />
                );
              })}


              {/* Citas */}
              {citasDelDia
                .filter((c) => c.barberoId === barbero.id)
                .map((cita) => {
                  const fecha = cita.fechaLocal!;
                  const duracion =
                    cita.duracionMinutos ??
                    cita.serviciosCita?.reduce(
                      (acc, s) => acc + s.duracionMinutos,
                      0
                    ) ??
                    0;

                  const horaFin = new Date(
                    fecha.getTime() + duracion * 60000
                  );

                  const pxPerMinute = slotHeight / 30;
                  const startMin =
                    (fecha.getHours() - START_HOUR) * 60 +
                    fecha.getMinutes();

                  const topPx = startMin * pxPerMinute;
                  const heightPx = Math.max(
                    cita.duracionMinutos * pxPerMinute,
                    slotHeight
                  );

                  return (
                    <div
                      key={cita.id}
                      onClick={() => setSelectedCita(cita)}
                      className={`
                        absolute left-0 right-0 md:left-1 md:right-1
                        rounded-xl p-2 cursor-pointer shadow-sm 
                        hover:shadow-md transition-all duration-150

                        ${cita.estado === "bloqueo"
                          ? "bg-gray-300 text-gray-900 border border-gray-400"
                          : cita.estado === "confirmada"
                            ? "bg-[#0A84FF] text-white"
                            : cita.estado === "cancelada"
                              ? "bg-[#FEE2E2] text-red-700 border border-red-400"
                              : cita.serviciosCita
                                ? "bg-white text-gray-800 border border-gray-300"
                                : "bg-white"
                        }
                      `}
                      style={{
                        top: topPx,
                        height: heightPx,
                        overflowY: "auto",
                        scrollbarWidth: "none",
                      }}
                    >
                      <div className="text-[11px] font-semibold mb-1">
                        {format12h(fecha)} – {format12h(horaFin)}
                      </div>

                      <div className="text-[11px] font-semibold mb-1 truncate">
                        {duracion} min
                      </div>

                      {cita.nombreCliente && (
                        <div className="text-[12px] font-bold truncate">
                          {cita.nombreCliente}
                        </div>
                      )}

                      {cita.serviciosCita && cita.serviciosCita.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {cita.serviciosCita.map((s) => (
                            <div
                              key={s.id}
                              className="text-[10px] opacity-90 leading-tight truncate"
                            >
                              • {s.nombre}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </main>

      {/* MODAL DETALLE CITA */}
      <Dialog
        modal={false}
        open={!!selectedCita}
        onOpenChange={() => setSelectedCita(null)}
      >
        {selectedCita && (
          <CitaModalContent
            cita={selectedCita}
            closeModal={() => setSelectedCita(null)}
            servicios={servicios}
            onUpdated={async (updatedId) => {
              const listaNueva = await fetchCitas();

              if (updatedId) {
                const refreshed = listaNueva.find(
                  (c) => c.id === updatedId
                );
                setSelectedCita(refreshed ?? null);
              } else {
                setSelectedCita(null);
              }
            }}
          />
        )}
      </Dialog>

      {/* MODAL BLOQUEO */}
      <Dialog modal={false} open={blockModal} onOpenChange={() => setBlockModal(false)}>
        <BloqueoModal
          open={blockModal}
          onClose={() => setBlockModal(false)}
          barbero={blockBarbero}
          currentDate={currentDate}
          onApplyBloqueo={onApplyBloqueo}
        />
      </Dialog>

      {/* MODAL CREAR CITA */}
      <Dialog modal={false} open={createModal} onOpenChange={setCreateModal}>
        <CreateCitaModal
          open={createModal}
          onClose={() => {
            setCreateModal(false);
            setQuickCreate(null);
          }}
          onCreated={fetchCitas}
          barberos={barberos}
          servicios={servicios}
          apiUrl={API_BASE_URL || ""}
          sedeId={selectedSedeId}
          defaultBarberoId={quickCreate?.barberoId}
          defaultFecha={quickCreate?.fecha}
        />
      </Dialog>

      {/* MODAL AGREGAR CLIENTE */}
      <Dialog
        modal={false}
        open={addClienteModal}
        onOpenChange={setAddClienteModal}
      >
        <AgregarCliente
          open={addClienteModal}
          onClose={() => setAddClienteModal(false)}
          apiUrl={API_BASE_URL || ""}
        />
      </Dialog>
    </div>
  );
}
