"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, CalendarDays, Users, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { getWeekDays } from "@/app/utils/getWeekDays";
import { Dialog } from "@/components/ui/dialog";
import { CitaModalContent } from "@/components/cita-modal-content";
import { useToast } from "@/hooks/use-toast";
import UserManagementTable from "@/components/user-management-table";

interface Cita {
    id: string;
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
        nombre: string;
        apellido: string;
    };
    barberoCita?: {
        nombre: string;
        apellido: string;
    };
}

interface UserData {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: "superadmin" | "caja" | "barbero" | "cliente";
    activo: boolean;
    telefono: string;
}

export default function SuperadminDashboard() {
    const router = useRouter();
    const { toast } = useToast();

    // Estados
    const [citas, setCitas] = useState<Cita[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
    const [activeView, setActiveView] = useState<"calendar" | "users">("calendar");

    const weekDays = getWeekDays();
    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8am – 8pm
    const API_BASE_URL = "http://localhost:4000";

    const todayIndex = weekDays.findIndex(
        (d) => d.toDateString() === new Date().toDateString()
    );
    const [selectedDayIndex, setSelectedDayIndex] = useState(
        todayIndex > -1 ? todayIndex : 0
    );


    const fetchCitas = async () => {
        const token = localStorage.getItem("token");
        const API_URL = `${API_BASE_URL}/api/superadmin/citas`;

        try {
            const response = await fetch(API_URL, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Error al cargar citas globales.");
            const data = await response.json();
            setCitas(data);
        } catch (err) {
            console.error("Error fetching citas:", err);
            toast({
                title: "Error de conexión",
                description: "No se pudieron cargar las citas del sistema.",
                variant: "destructive",
            });
        }
    };

    const fetchUsers = async () => {
        const token = localStorage.getItem("token");
        const API_URL = `${API_BASE_URL}/api/superadmin/users`;

        try {
            const response = await fetch(API_URL, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Error al cargar usuarios.");
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            console.error("Error fetching usuarios:", err);
            toast({
                title: "Error de conexión",
                description: "No se pudieron cargar los usuarios del sistema.",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        fetchCitas();
        fetchUsers();
    }, []);


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

            await fetchCitas();

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


    const handleUserUpdate = async (userId: string, updates: Partial<UserData>) => {
        const token = localStorage.getItem("token");
        const API_URL = `${API_BASE_URL}/api/superadmin/users/${userId}`;

        try {
            const response = await fetch(API_URL, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                throw new Error("Error al actualizar el usuario.");
            }

            toast({
                title: "Éxito",
                description: `Usuario ${userId.substring(0, 4)} actualizado.`,
            });

            await fetchUsers();

        } catch (error) {
            console.error("Fallo la actualización de usuario:", error);
            toast({
                title: "Error",
                description: "No se pudo actualizar el usuario.",
                variant: "destructive",
            });
        }
    }


    const citasPorDia = useMemo(() => {
        return weekDays.map((day) =>
            citas.filter((c) => {
                const fecha = new Date(c.fechaHora);
                return (
                    fecha.getFullYear() === day.getFullYear() &&
                    fecha.getMonth() === day.getMonth() &&
                    fecha.getDate() === day.getDate()
                );
            })
        );
    }, [citas, weekDays]);

    const totalPendingCitas = citas.filter(c => c.estado === 'pendiente').length;

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold">Panel de Control (Superadmin)</h1>

                    <div className="flex items-center gap-4">
                        <Button
                            variant={activeView === "calendar" ? "default" : "outline"}
                            onClick={() => setActiveView("calendar")}
                        >
                            <CalendarDays className="w-5 h-5 mr-2" />
                            Calendario Global ({totalPendingCitas})
                        </Button>
                        <Button
                            variant={activeView === "users" ? "default" : "outline"}
                            onClick={() => setActiveView("users")}
                        >
                            <Users className="w-5 h-5 mr-2" />
                            Usuarios
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar Sesión">
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 space-y-6">

                {activeView === "calendar" && (
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center">
                            <Clock className="w-6 h-6 mr-2 text-blue-500" />
                            Gestión de Citas Pendientes ({totalPendingCitas})
                        </h2>

                        <div className="md:hidden flex overflow-x-auto border-b bg-white rounded-t">
                            {weekDays.map((day, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDayIndex(idx)}
                                    className={`flex-shrink-0 py-3 px-4 text-sm font-medium ${selectedDayIndex === idx
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
                                        className={`p-2 text-center font-semibold border-l ${selectedDayIndex === i ? "block" : "hidden"
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
                                        className={`relative border-l ${selectedDayIndex === idx ? "block" : "hidden"
                                            } md:block`}
                                    >
                                        {/* Líneas de división de media hora */}
                                        {hours.map((h) => (
                                            <div key={h} className="h-20 border-b border-dashed border-gray-200">
                                                <div className="h-1/4 border-b border-dotted border-gray-100"></div>
                                                <div className="h-1/4 border-b border-dotted border-gray-100"></div>
                                                <div className="h-1/4 border-b border-dotted border-gray-100"></div>
                                            </div>
                                        ))}

                                        {/* Slots de Citas */}
                                        {citasDia.map((cita) => {
                                            const fecha = new Date(cita.fechaHora);
                                            const hour = fecha.getHours();
                                            const minutes = fecha.getMinutes();
                                            const topPx = (hour - 8) * 80 + (minutes / 60) * 80;
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
                                                        {cita.servicioCita?.nombre || "Servicio"} - {cita.barberoCita?.nombre}
                                                    </strong>
                                                    <span className="opacity-90">
                                                        {hour}:{String(minutes).padStart(2, "0")} |
                                                        {cita.clienteCita?.nombre || "Cliente"}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {activeView === "users" && (
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center">
                            <Users className="w-6 h-6 mr-2 text-blue-500" />
                            Gestión de Usuarios y Roles
                        </h2>

                        <div className="p-4 border rounded bg-white shadow-sm">
                            <p className="text-muted-foreground mb-4">Tabla de gestión de usuarios (Barberos, Cajeros, Clientes, Admins).</p>
                            <UserManagementTable users={users} onUserUpdate={handleUserUpdate} onRefresh={fetchUsers} />
                        </div>
                    </section>
                )}

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
