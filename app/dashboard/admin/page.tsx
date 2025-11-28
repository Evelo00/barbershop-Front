"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    LogOut,
    CalendarDays,
    Users,
    ChevronLeft,
    ChevronRight,
    Search,
    EyeOff,
    UserX,
    RefreshCw,
    Plus,
    Menu,
    Clock,
    DollarSign,
    CheckCircle,
    XCircle,
    User
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { CitaModalContent } from "@/components/cita-modal-content";
import { useToast } from "@/hooks/use-toast";
import UserManagementTable from "@/components/user-management-table";
import { toZonedTime } from "date-fns-tz";

// --- Interfaces ---
interface Cita {
    id: string;
    barberoId: string;
    clienteId: string | null;
    fechaHora: string;
    duracionMinutos: number;
    estado: "pendiente" | "confirmada" | "cancelada";
    precioFinal: number;
    servicioCita?: {
        nombre: string;
        duracion?: number;
        precio?: number;
    };
    clienteCita?: {
        id: string;
        nombre: string;
        apellido: string;
    };
    barberoCita?: {
        id: string;
        nombre: string;
        apellido: string;
        avatar?: string | null;
    };
    fechaLocal?: Date; // <-- hora convertida a Bogotá
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
}

// --- Helper para colores de estado ---
const getStatusClasses = (status: Cita["estado"]) => {
    switch (status) {
        case "confirmada":
            return { bg: "bg-green-600 hover:bg-green-700 border-l-4 border-green-800", icon: <CheckCircle className="w-3 h-3 mr-1" /> };
        case "cancelada":
            return { bg: "bg-red-600 hover:bg-red-700 border-l-4 border-red-800", icon: <XCircle className="w-3 h-3 mr-1" /> };
        case "pendiente":
        default:
            return { bg: "bg-amber-500 hover:bg-amber-600 border-l-4 border-amber-700", icon: <Clock className="w-3 h-3 mr-1" /> };
    }
};

export default function SuperadminDashboard() {
    const router = useRouter();
    const { toast } = useToast();
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    const [citas, setCitas] = useState<Cita[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
    const [activeView, setActiveView] = useState<"calendar" | "users">("calendar");
    const [currentDate, setCurrentDate] = useState(new Date());

    const START_HOUR = 8;
    const END_HOUR = 20;
    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

    // --- Fetch Users ---
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/users`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (res.status === 401) {
                toast({ title: "No autorizado", description: "Tu sesión expiró." });
                router.push("/login");
                return;
            }

            if (!res.ok) throw new Error("Error al cargar usuarios.");
            const data: UserData[] = await res.json();
            setUsers(data);
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "No se pudieron cargar los usuarios." });
        }
    };

    // --- Fetch Citas ---
    const fetchCitas = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/citas`, {
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            });
            if (!res.ok) throw new Error("Error al cargar citas.");
            const data: Cita[] = await res.json();

            // Mapear barbero y cliente + convertir fecha a Bogotá
            const citasMapeadas = data.map(cita => {
                const barbero = users.find(u => u.id === cita.barberoId);
                const cliente = users.find(u => u.id === cita.clienteId);
                return {
                    ...cita,
                    barberoCita: barbero ? { id: barbero.id, nombre: barbero.nombre, apellido: barbero.apellido, avatar: barbero.avatar } : undefined,
                    clienteCita: cliente ? { id: cliente.id, nombre: cliente.nombre, apellido: cliente.apellido } : undefined,
                    fechaLocal: toZonedTime(cita.fechaHora, "America/Bogota"),
                };
            });

            setCitas(citasMapeadas);
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "No se pudieron cargar las citas." });
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (users.length > 0) fetchCitas();
    }, [users.length]);

    const barberos = useMemo(() => users.filter(u => u.rol === "barbero" && u.activo), [users]);

    const citasDelDia = useMemo(() => {
        return citas.filter(c => {
            if (!c.fechaLocal) return false;
            const fecha = c.fechaLocal;
            return (
                fecha.getDate() === currentDate.getDate() &&
                fecha.getMonth() === currentDate.getMonth() &&
                fecha.getFullYear() === currentDate.getFullYear()
            );
        });
    }, [citas, currentDate]);

    const getCurrentTimePosition = () => {
        const now = toZonedTime(new Date(), "America/Bogota");
        if (now.getDate() !== currentDate.getDate()) return -1;
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        if (currentHour < START_HOUR || currentHour > END_HOUR) return -1;
        const pixelsPerHour = 80;
        return (currentHour - START_HOUR) * pixelsPerHour + (currentMinutes / 60) * pixelsPerHour;
    };
    const currentTimeTop = getCurrentTimePosition();

    const handlePrevDay = () => { const prev = new Date(currentDate); prev.setDate(prev.getDate() - 1); setCurrentDate(prev); };
    const handleNextDay = () => { const next = new Date(currentDate); next.setDate(next.getDate() + 1); setCurrentDate(next); };
    const handleLogout = () => { localStorage.removeItem("token"); router.push("/login"); };

    const handleStatusChange = async (citaId: string, nuevoEstado: "confirmada" | "cancelada") => {
        setCitas(prev => prev.map(c => c.id === citaId ? { ...c, estado: nuevoEstado } : c));
        setSelectedCita(null);
        try {
            const token = localStorage.getItem("token");
            await fetch(`${API_BASE_URL}/api/citas/${citaId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ estado: nuevoEstado }),
            });
            await fetchCitas();
            toast({ title: "Cita Actualizada", description: `Cita ${citaId} marcada como ${nuevoEstado}.`, variant: nuevoEstado === "confirmada" ? "default" : "destructive" });
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "No se pudo actualizar la cita en el servidor.", variant: "destructive" });
        }
    };

    const formattedDate = currentDate.toLocaleDateString("es-CO", { weekday: "short", month: "long", day: "numeric", year: "numeric" });

    const getAvatar = (barbero: { nombre: string; apellido: string; avatar?: string | null }) =>
        barbero.avatar
            ? `${API_BASE_URL}/public/${barbero.avatar}`
            : `https://ui-avatars.com/api/?name=${barbero.nombre}+${barbero.apellido.split(" ")[0]}&background=1f2937&color=ffffff&bold=true`;

    return (
        <div className="min-h-screen bg-gray-900 font-sans text-white">
            {/* HEADER */}
            <header className="border-b border-gray-700 bg-gray-800 px-6 py-3 flex items-center justify-between shadow-lg sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700"><Menu className="w-6 h-6" /></Button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-extrabold text-white tracking-wider">
                            <CalendarDays className="inline-block w-6 h-6 mr-2 text-primary" />
                            ADMIN DASHBOARD
                        </h1>
                        <span className="text-gray-600">|</span>
                        <div className="flex items-center gap-3 text-gray-400 text-sm font-semibold uppercase">
                            <span className="text-lg text-primary">{formattedDate}</span>
                            <div className="flex gap-1 ml-2">
                                <button onClick={handlePrevDay} className="hover:bg-gray-700 p-2 rounded-full transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={handleNextDay} className="hover:bg-gray-700 p-2 rounded-full transition-colors"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="mr-4 flex bg-gray-700 rounded-lg p-1">
                        <button onClick={() => setActiveView("calendar")} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2 ${activeView === 'calendar' ? 'bg-indigo-600 shadow-md text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600'}`}>
                            <CalendarDays className="w-4 h-4" /> Calendario
                        </button>
                        <button onClick={() => setActiveView("users")} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2 ${activeView === 'users' ? 'bg-indigo-600 shadow-md text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600'}`}>
                            <Users className="w-4 h-4" /> Usuarios
                        </button>
                    </div>

                    <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700"><Search className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700"><EyeOff className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700"><UserX className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700" onClick={fetchCitas}><RefreshCw className="w-5 h-5" /></Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white ml-2 h-10 w-10 p-0 rounded-lg shadow-lg"><Plus className="w-6 h-6" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-400 hover:bg-red-900/50 ml-4" onClick={handleLogout}><LogOut className="w-5 h-5" /></Button>
                </div>
            </header>

            <main className="flex-1 overflow-hidden h-[calc(100vh-74px)]">
                {activeView === "calendar" && (
                    <div className="flex flex-col h-full">
                        {/* BARBER STRIP */}
                        <div className="flex overflow-x-auto border-b border-gray-700 py-4 px-8 bg-gray-800 shadow-md shrink-0 min-h-[140px] items-center">
                            <div className="flex gap-8 min-w-full">
                                {barberos.length === 0 ? (
                                    <div className="w-full text-center text-gray-500 italic p-4">No hay barberos activos configurados.</div>
                                ) : (
                                    barberos.map((barbero) => (
                                        <div key={barbero.id} className="flex flex-col items-center justify-center min-w-[120px] w-full max-w-[200px] text-center transition-transform hover:scale-105 cursor-pointer">
                                            <div className="w-20 h-20 bg-gray-600 rounded-full mb-2 overflow-hidden shadow-xl relative">
                                                <img src={getAvatar(barbero)} alt={barbero.nombre} className="w-full h-full object-cover" />
                                            </div>
                                            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">{barbero.nombre} {barbero.apellido.split(" ")[0]}</h3>
                                            <p className="text-xs text-indigo-400 font-medium">Barbero</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* CALENDARIO GRID */}
                        <div className="flex-1 overflow-y-auto relative bg-gray-900">
                            <div className="flex min-w-full">
                                <div className="flex flex-col w-16 shrink-0 border-r border-gray-700 bg-gray-800 sticky left-0 z-20 text-xs text-gray-400 font-bold pt-0 shadow-lg">
                                    {hours.map(h => [0, 30].map(m => (
                                        <div key={`${h}-${m}`} className="h-10 border-b border-gray-700 relative group">
                                            <span className="absolute -top-2 right-2 bg-gray-800 px-1 transform -translate-y-1/2">{h > 12 ? h - 12 : h}:{String(m).padStart(2, "0")} {h >= 12 ? "pm" : "am"}</span>
                                        </div>
                                    )))}
                                </div>

                                <div className="flex-1 flex relative">
                                    {currentTimeTop !== -1 && (
                                        <div className="absolute left-0 right-0 z-30 border-t-2 border-red-500 pointer-events-none opacity-90" style={{ top: `${currentTimeTop}px` }}>
                                            <div className="absolute -left-1 -top-[5px] w-2 h-2 bg-red-500 rounded-full"></div>
                                        </div>
                                    )}

                                    {barberos.map(barbero => (
                                        <div key={barbero.id} className="flex-1 min-w-[150px] border-r border-gray-700 relative">
                                            {hours.map(h => [0, 30].map(m => <div key={`${h}-${m}-line`} className="h-10 border-b border-dashed border-gray-800 w-full"></div>))}

                                            {citasDelDia.filter(c => c.barberoId === barbero.id).map(cita => {
                                                const fecha = cita.fechaLocal!;
                                                const startMinutes = (fecha.getHours() - START_HOUR) * 60 + fecha.getMinutes();
                                                const topPx = (startMinutes / 30) * 40;
                                                const heightPx = Math.max((cita.duracionMinutos / 30) * 40, 40);
                                                const status = getStatusClasses(cita.estado);
                                                const isSmall = heightPx < 50;

                                                return (
                                                    <div key={cita.id} onClick={() => setSelectedCita(cita)}
                                                        className={`absolute left-2 right-2 rounded-lg px-2 py-1 text-white shadow-lg cursor-pointer transition-transform hover:scale-[1.02] z-40 ${status.bg} overflow-hidden flex flex-col justify-center`}
                                                        style={{ top: `${topPx}px`, minHeight: heightPx }}>
                                                        <span className={`font-bold truncate leading-tight ${isSmall ? 'text-[10px]' : 'text-sm'}`}>
                                                            {status.icon} {cita.clienteCita ? `${cita.clienteCita.nombre} ${cita.clienteCita.apellido}` : "Confirmada"}
                                                        </span>
                                                        {!isSmall && (
                                                            <div className="text-xs opacity-90 truncate leading-tight mt-0.5 flex items-center">
                                                                <Clock className="w-3 h-3 mr-1" />
                                                                {fecha.getHours()}:{String(fecha.getMinutes()).padStart(2, '0')} | {cita.servicioCita?.nombre || "Servicio no listado"}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === "users" && (
                    <div className="container mx-auto p-8 overflow-y-auto h-full bg-gray-900">
                        <div className="flex items-center gap-3 mb-8 border-b border-gray-700 pb-2">
                            <h2 className="text-xl font-bold text-white">Usuarios</h2>
                            <Button className="ml-auto" onClick={fetchUsers}>Actualizar</Button>
                        </div>
                        <UserManagementTable users={users} onUserUpdate={fetchUsers} onRefresh={fetchUsers} />
                    </div>
                )}

                {/* MODAL CITA */}
                <Dialog open={!!selectedCita} onOpenChange={() => setSelectedCita(null)}>
                    {selectedCita && <CitaModalContent cita={selectedCita} closeModal={() => setSelectedCita(null)} />}
                </Dialog>
            </main>
        </div>
    );
}
