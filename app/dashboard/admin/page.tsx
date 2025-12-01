"use client";

import { useEffect, useState, useMemo } from "react";
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
import { useToast } from "@/hooks/use-toast";
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
        nombre: string;
        duracion?: number;
        precio?: number;
    };

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
    const [selectedMobileBarber, setSelectedMobileBarber] = useState<string | null>(null);

    const [citas, setCitas] = useState<Cita[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    const [blockModal, setBlockModal] = useState(false);
    const [blockBarbero, setBlockBarbero] = useState<UserData | null>(null);
    const [blockStart, setBlockStart] = useState<string>("08:00");
    const [blockEnd, setBlockEnd] = useState<string>("09:00");

    const [createModal, setCreateModal] = useState(false);
    const [servicios, setServicios] = useState<any[]>([]);

    const START_HOUR = 8;
    const END_HOUR = 20;

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(`${API_BASE_URL}/api/users`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            const data = await res.json();
            setUsers(data);
        } catch { }
    };

    const fetchServicios = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/services`);
            const data = await res.json();
            setServicios(data);
        } catch { }
    };

    const fetchCitas = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(`${API_BASE_URL}/api/citas`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            const data: Cita[] = await res.json();

            const mapped = data.map((cita) => {
                const barbero = users.find((u) => u.id === cita.barberoId);
                const cliente = users.find((u) => u.id === cita.clienteId);

                return {
                    ...cita,
                    barberoCita: barbero
                        ? {
                            id: barbero.id,
                            nombre: barbero.nombre,
                            apellido: barbero.apellido,
                            avatar: barbero.avatar,
                        }
                        : undefined,
                    clienteCita: cliente
                        ? {
                            nombre: cliente.nombre,
                            apellido: cliente.apellido,
                        }
                        : undefined,
                    fechaLocal: toZonedTime(cita.fechaHora, "America/Bogota"),
                };
            });

            setCitas(mapped);
        } catch { }
    };

    useEffect(() => {
        fetchUsers();
        fetchServicios();
    }, []);

    useEffect(() => {
        if (users.length > 0) {
            fetchCitas();
            if (!selectedMobileBarber) {
                const first = users.find((u) => u.rol === "barbero" && u.activo);
                if (first) setSelectedMobileBarber(first.id);
            }
        }
    }, [users]);

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


    const abrirBloqueo = (barbero: UserData) => {
        setBlockBarbero(barbero);
        setBlockModal(true);
    };

    const confirmarBloqueo = async () => {
        if (!blockBarbero) return;

        const dateStr = currentDate.toLocaleDateString("en-CA");

        const fechaInicio = `${dateStr}T${blockStart}:00-05:00`;
        const fechaFin = `${dateStr}T${blockEnd}:00-05:00`;

        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);

        const duracion = (fin.getTime() - inicio.getTime()) / 60000;

        const body = {
            barberoId: blockBarbero.id,
            clienteId: null,
            servicioId: "00000000-0000-0000-0000-000000000999",
            fechaHora: fechaInicio,
            duracionMinutos: duracion,
            precioFinal: 0,
            estado: "bloqueo",
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/citas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setBlockModal(false);
                fetchCitas();
            }
        } catch { }
    };

    const crearAlmuerzo = async () => {
        if (!blockBarbero) return;

        const dateStr = currentDate.toLocaleDateString("en-CA");

        const fechaInicio = `${dateStr}T${blockStart}:00-05:00`;

        const [hStr, mStr] = blockStart.split(":");
        const inicio = new Date(fechaInicio);
        const fin = new Date(inicio.getTime() + 40 * 60000);

        const finH = fin.getHours().toString().padStart(2, "0");
        const finM = fin.getMinutes().toString().padStart(2, "0");

        const fechaFin = `${dateStr}T${finH}:${finM}:00-05:00`;

        const duracion = 40;

        const body = {
            barberoId: blockBarbero.id,
            clienteId: null,
            servicioId: "00000000-0000-0000-0000-000000000999",
            fechaHora: fechaInicio,
            fechaFin: fechaFin,
            duracionMinutos: duracion,
            precioFinal: 0,
            estado: "bloqueo",
            notas: "Almuerzo",
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/citas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast({
                    title: "Bloqueo de almuerzo creado",
                    description: `${blockStart} → ${finH}:${finM}`,
                });

                setBlockModal(false);
                fetchCitas();
            } else {
                toast({
                    title: "Error al crear bloqueo",
                    variant: "destructive",
                });
            }
        } catch (err) {
            console.error("ERROR almuerzo:", err);
            toast({
                title: "Error de red o servidor",
                variant: "destructive",
            });
        }
    };
    const format12h = (d: Date) => {
        let h = d.getHours();
        const m = d.getMinutes().toString().padStart(2, "0");
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
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

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setCreateModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 text-sm md:text-base"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Crear
                    </Button>

                    <Button
                        onClick={fetchCitas}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 text-sm md:text-base"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            {/* FECHA */}
            <div className="px-4 py-2 flex items-center justify-between text-sm border-b bg-white sticky top-[64px] md:top-[72px] z-40">
                <button onClick={() => setCurrentDate(new Date(currentDate.getTime() - 86400000))}>
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

                <button onClick={() => setCurrentDate(new Date(currentDate.getTime() + 86400000))}>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {!isMobile && (
                <div
                    className="grid border-b bg-white py-4 px-4 shadow-sm"
                    style={{
                        gridTemplateColumns: `80px repeat(${barberos.length}, 1fr)`,
                    }}
                >
                    {/* Primera columna (vacía para horas) */}
                    <div></div>

                    {/* Columnas dinámicas para barberos */}
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
                                onClick={() => abrirBloqueo(b)}
                                className="mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-full flex items-center gap-1 mx-auto"
                            >
                                <Slash className="w-3 h-3" />
                                Bloquear
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Calendario */}
            <main className="flex-1 overflow-y-auto relative bg-white">
                <div
                    className="grid"
                    style={{
                        gridTemplateColumns: `80px repeat(${barberos.length}, 1fr)`,
                    }}
                >
                    <div className="border-r text-[10px] md:text-xs text-gray-600 pt-4">
                        {Array.from({ length: (END_HOUR - START_HOUR + 1) * 2 }).map((_, i) => {
                            const hour = START_HOUR + Math.floor(i / 2);
                            const minute = i % 2 === 0 ? "00" : "30";

                            return (
                                <div key={i} className="h-12 md:h-16 relative border-b">
                                    <span className="absolute -top-2 left-1">
                                        {hour}:{minute}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {barberos.map((barbero) => (
                        <div key={barbero.id} className="border-r relative">
                            {Array.from({ length: (END_HOUR - START_HOUR + 1) * 2 }).map(
                                (_, i) => (
                                    <div
                                        key={i}
                                        className="h-12 md:h-16 border-b border-gray-100"
                                    ></div>
                                )
                            )}

                            {/* CITAS */}
                            {citasDelDia
                                .filter((c) => c.barberoId === barbero.id)
                                .map((cita) => {
                                    const fecha = cita.fechaLocal!;
                                    const horaFin = new Date(
                                        fecha.getTime() +
                                        cita.duracionMinutos * 60000
                                    );

                                    const startMin =
                                        (fecha.getHours() - START_HOUR) * 60 +
                                        fecha.getMinutes();

                                    const topPx = (startMin / 30) * 48;

                                    const heightPx = Math.max(
                                        (cita.duracionMinutos / 30) * 48,
                                        48
                                    );

                                    return (
                                        <div
                                            key={cita.id}
                                            onClick={() => setSelectedCita(cita)}
                                            className={`
                                                absolute 
                                                left-0 right-0 md:left-1 md:right-1
                                                rounded-xl 
                                                p-2 
                                                cursor-pointer 
                                                shadow-sm hover:shadow-md 
                                                transition-all duration-150
                                                ${cita.estado === "confirmada"
                                                    ? "bg-[#0A84FF] text-white"
                                                    : cita.estado === "cancelada"
                                                        ? "bg-[#FEE2E2] text-red-700 border border-red-400"
                                                        : !cita.servicioCita
                                                            ? "bg-[#E5E7EB] text-gray-800 border border-black"
                                                            : "bg-white text-gray-800 border border-gray-300"
                                                }
                                            `}
                                            style={{
                                                top: topPx,
                                                height: heightPx,
                                                overflowY: "auto",
                                                scrollbarWidth: "none",
                                            }}
                                        >
                                            <style jsx>{`
                                                div::-webkit-scrollbar {
                                                    display: none;
                                                }
                                            `}</style>

                                            <div className="text-[11px] font-semibold mb-1">
                                                {format12h(fecha)} – {format12h(horaFin)}
                                            </div>

                                            {cita.nombreCliente && (
                                                <div className="text-[12px] font-bold truncate">
                                                    {cita.nombreCliente}
                                                </div>
                                            )}

                                            {cita.servicioCita && (
                                                <div className="text-[11px] opacity-90 truncate">
                                                    {cita.servicioCita.nombre}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    ))}
                </div>
            </main>

            {/* MODAL CITAS */}
            <Dialog
                open={!!selectedCita}
                onOpenChange={() => setSelectedCita(null)}
            >
                {selectedCita && (
                    <CitaModalContent
                        cita={selectedCita}
                        closeModal={() => setSelectedCita(null)}
                        onUpdated={fetchCitas}
                    />
                )}
            </Dialog>

            {/* MODAL BLOQUEO */}
            {blockModal && blockBarbero && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-80 max-h-[90vh] overflow-y-auto">

                        <h3 className="text-lg font-bold mb-4 text-gray-800 text-center">
                            Bloquear agenda de {blockBarbero.nombre}
                        </h3>

                        <div className="space-y-4">

                            <div>
                                <label className="text-sm font-semibold">Hora inicio</label>
                                <select
                                    className="w-full mt-1 border rounded px-3 py-2"
                                    value={blockStart}
                                    onChange={(e) => setBlockStart(e.target.value)}
                                >
                                    {Array.from({
                                        length: (END_HOUR - START_HOUR + 1) * 2,
                                    }).map((_, i) => {
                                        const h = START_HOUR + Math.floor(i / 2);
                                        const m = i % 2 === 0 ? "00" : "30";
                                        return (
                                            <option key={i} value={`${h}:${m}`}>
                                                {h}:{m}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* FIN */}
                            <div>
                                <label className="text-sm font-semibold">Hora fin</label>
                                <select
                                    className="w-full mt-1 border rounded px-3 py-2"
                                    value={blockEnd}
                                    onChange={(e) => setBlockEnd(e.target.value)}
                                >
                                    {Array.from({
                                        length: (END_HOUR - START_HOUR + 1) * 2,
                                    }).map((_, i) => {
                                        const h = START_HOUR + Math.floor(i / 2);
                                        const m = i % 2 === 0 ? "00" : "30";
                                        return (
                                            <option key={i} value={`${h}:${m}`}>
                                                {h}:{m}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <button
                                onClick={crearAlmuerzo}
                                className="w-full bg-blue-300 hover:bg-blue-400 text-blue-900 py-2 rounded-lg font-semibold transition"
                            >
                                Almuerzo (40 min)
                            </button>


                            {/* ACCIONES */}
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={confirmarBloqueo}
                                    className="flex-1 bg-red-300 hover:bg-red-400 text-red-900 py-2 rounded-lg font-semibold"
                                >
                                    Bloquear
                                </button>

                                <button
                                    onClick={() => setBlockModal(false)}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <CreateCitaModal
                open={createModal}
                onClose={() => setCreateModal(false)}
                onCreated={fetchCitas}
                barberos={barberos}
                servicios={servicios}
                apiUrl={API_BASE_URL || ""}
            />
        </div>
    );
}
