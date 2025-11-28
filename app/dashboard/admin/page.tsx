"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Menu,
    Clock,
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

    // Fechas
    fechaHora: string;
    fechaFin: string;
    duracionMinutos: number;

    // Estado
    estado: "pendiente" | "confirmada" | "cancelada" | "bloqueo";

    // Datos del cliente (externo o registrado)
    nombreCliente?: string | null;
    emailCliente?: string | null;
    whatsappCliente?: string | null;

    // Información adicional
    precioFinal: number;
    notas?: string | null;

    // Relaciones (cuando haces include en el backend)
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

    // Fecha convertida a Bogotá
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

            if (!selectedMobileBarber && users.length > 0) {
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
            fechaHora: fechaInicio,       // ✔ ENVÍA LOCAL, NO UTC
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

            {/* SELECTOR COMPACTO DE BARBEROS - MÓVIL */}
            {isMobile && (
                <div className="flex gap-2 overflow-x-auto p-2 sticky top-[110px] bg-white z-40 border-b">
                    {barberos.map((b) => (
                        <button
                            key={b.id}
                            className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap ${selectedMobileBarber === b.id
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 text-gray-700"
                                }`}
                            onClick={() => setSelectedMobileBarber(b.id)}
                        >
                            {b.nombre.split(" ")[0]}
                        </button>
                    ))}
                </div>
            )}

            {/* BARBEROS - DESKTOP */}
            {!isMobile && (
                <div className="flex overflow-x-auto border-b bg-white py-3 px-6 pl-20 shadow-sm">
                    <div className="flex">
                        {barberos.map((b) => (
                            <div key={b.id} className="min-w-[140px] text-center relative">
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
                </div>
            )}

            {/* CALENDARIO */}
            <main className="flex-1 overflow-y-auto relative bg-white">
                <div className="flex">

                    {/* HORAS */}
                    <div className="w-14 md:w-20 border-r text-[10px] md:text-xs text-gray-600 pt-4">
                        {Array.from({ length: (END_HOUR - START_HOUR + 1) * 2 }).map((_, i) => {
                            const hour = START_HOUR + Math.floor(i / 2);
                            const minute = i % 2 === 0 ? "00" : "30";
                            return (
                                <div key={`hr-${i}`} className="h-8 md:h-10 relative border-b">
                                    <span className="absolute -top-2 left-1">
                                        {hour}:{minute}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* COLUMNAS */}
                    <div className="flex-1 flex">

                        {(isMobile
                            ? barberos.filter((b) => b.id === selectedMobileBarber)
                            : barberos
                        ).map((barbero) => (
                            <div key={barbero.id} className="flex-1 border-r relative">

                                {Array.from({ length: (END_HOUR - START_HOUR + 1) * 2 }).map(
                                    (_, i) => (
                                        <div
                                            key={`grid-${barbero.id}-${i}`}
                                            className="h-8 md:h-10 border-b border-gray-100"
                                        ></div>
                                    )
                                )}

                                {citasDelDia
                                    .filter((c) => c.barberoId === barbero.id)
                                    .map((cita) => {
                                        const fecha = cita.fechaLocal!;
                                        const horaFin = new Date(fecha.getTime() + cita.duracionMinutos * 60000);

                                        const format12h = (d: Date) => {
                                            let h = d.getHours();
                                            const m = d.getMinutes().toString().padStart(2, "0");
                                            const ampm = h >= 12 ? "PM" : "AM";
                                            h = h % 12 || 12;
                                            return `${h}:${m} ${ampm}`;
                                        };

                                        const startMin =
                                            (fecha.getHours() - START_HOUR) * 60 + fecha.getMinutes();
                                        const topPx = (startMin / 30) * 40;
                                        const heightPx = Math.max(
                                            (cita.duracionMinutos / 30) * 40,
                                            40
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
                                                        ? "bg-[#0A84FF] text-white border-none"
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
                                                    scrollbarWidth: "none",        // Firefox
                                                }}
                                            >
                                                {/* Ocultar scroll en Webkit (Chrome, Safari) */}
                                                <style jsx>{`
        div::-webkit-scrollbar {
            display: none;
        }
    `}</style>

                                                {/* HORA */}
                                                <div className="text-[11px] font-semibold mb-1">
                                                    {format12h(fecha)} – {format12h(horaFin)}
                                                </div>

                                                {/* NOMBRE CLIENTE */}
                                                {cita.nombreCliente && (
                                                    <div className="text-[12px] font-bold truncate">
                                                        {cita.nombreCliente}
                                                    </div>
                                                )}

                                                {/* SERVICIO */}
                                                {cita.servicioCita && (
                                                    <div className="text-[11px] opacity-90 truncate">
                                                        {cita.servicioCita.nombre}
                                                    </div>
                                                )}

                                                {/* NOMBRE BARBERO */}
                                                {cita.barberoCita && (
                                                    <div className="text-[10px] opacity-80 truncate mt-1">
                                                        {cita.barberoCita.nombre} {cita.barberoCita.apellido}
                                                    </div>
                                                )}

                                                {/* BLOQUEO */}
                                                {!cita.servicioCita && (
                                                    <div className="text-[12px] font-bold flex items-center gap-1 mt-1">
                                                        <Slash className="w-4 h-4" /> BLOQUEO
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* MODAL DE CITA */}
            <Dialog open={!!selectedCita} onOpenChange={() => setSelectedCita(null)}>
                {selectedCita && (
                    <CitaModalContent
                        cita={selectedCita}
                        closeModal={() => setSelectedCita(null)}
                        onUpdated={fetchCitas}
                    />
                )}
            </Dialog>

            {/* MODAL BLOQUEAR */}
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
                                            <option key={`start-${i}`} value={`${h}:${m}`}>
                                                {h}:{m}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

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
                                            <option key={`end-${i}`} value={`${h}:${m}`}>
                                                {h}:{m}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={confirmarBloqueo}
                                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                                >
                                    Bloquear
                                </button>

                                <button
                                    onClick={() => setBlockModal(false)}
                                    className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
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
