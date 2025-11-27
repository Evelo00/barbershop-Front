"use client";

import React, { useState, useEffect } from "react";
// Reemplazando 'next/navigation' con una implementación nativa de React para el entorno
const useRouter = () => {
    return {
        push: (path: string) => {
            if (typeof window !== 'undefined') {
                window.location.href = path;
            }
        },
    };
};
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    isSameDay,
    isBefore,
} from "date-fns";
import { es } from 'date-fns/locale';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Service {
    id: string;
    name: string;
    price: number;
    duration: number;
}

const customColors = {
    "barber-dark": "#2A2A2A",
    "barber-black": "#1c1c1c",
};

const ALL_TIME_SLOTS = [
    { display: "9:00 am", value: "09:00" },
    { display: "9:30 am", value: "09:30" },
    { display: "10:00 am", value: "10:00" },
    { display: "10:30 am", value: "10:30" },
    { display: "11:00 am", value: "11:00" },
    { display: "11:30 am", value: "11:30" },
    { display: "12:00 pm", value: "12:00" },
    { display: "12:30 pm", value: "12:30" },
    { display: "1:00 pm", value: "13:00" },
    { display: "1:30 pm", value: "13:30" },
    { display: "2:00 pm", value: "14:00" },
    { display: "2:30 pm", value: "14:30" },
    { display: "3:00 pm", value: "15:00" },
    { display: "3:30 pm", value: "15:30" },
    { display: "4:00 pm", value: "16:00" },
    { display: "4:30 pm", value: "16:30" },
    { display: "5:00 pm", value: "17:00" },
    { display: "5:30 pm", value: "17:30" },
    { display: "6:00 pm", value: "18:00" },
    { display: "6:30 pm", value: "18:30" },
    { display: "7:00 pm", value: "19:00" },
    { display: "7:30 pm", value: "19:30" },
    { display: "8:00 pm", value: "20:00" },
    { display: "8:30 pm", value: "20:30" },
];


const View5Page: React.FC = () => {
    const router = useRouter();
    const [service, setService] = useState<Service | null>(null);
    const [barber, setBarber] = useState<string | null>(null);
    const [barberName, setBarberName] = useState<string | null>(null);

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // Estado para saber si la inicialización (carga de localStorage y disponibilidad) ha terminado
    const [isInitialized, setIsInitialized] = useState(false);

    const showMessage = (text: string) => {
        setMessage(text);
        setTimeout(() => setMessage(null), 3500); // Aumento de tiempo para mensajes de error
    };

    // Fetch de horarios disponibles
    const fetchAvailableSlots = async (date: Date, currentBarber: string, currentService: Service) => {
        // Validación extra: no cargar si no hay datos
        if (!currentService || !currentBarber) return;

        setIsLoading(true);
        setAvailableSlots([]);
        try {
            const dateStr = format(date, "yyyy-MM-dd");
            // Se asegura de enviar barberId y serviceDuration (ya implementado)
            const res = await fetch(
                `${API_BASE_URL}/api/citas/availability?date=${dateStr}&serviceDuration=${currentService.duration}&barberoId=${currentBarber}`
            );

            if (!res.ok) {
                showMessage("Error: No se pudo verificar la disponibilidad. Intenta nuevamente.");
                return;
            }

            const data = await res.json();
            setAvailableSlots(data.availableSlots || []);
        } catch (error) {
            console.error(error);
            showMessage("Error al obtener horarios disponibles.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- EFECTO DE INICIALIZACIÓN Y CARGA DE DATOS ---
    useEffect(() => {
        const storedService = localStorage.getItem("abalvi_reserva_servicio");
        const storedBarberId = localStorage.getItem("abalvi_reserva_barbero");
        const storedBarberName = localStorage.getItem(
            "abalvi_reserva_barbero_nombre"
        );

        let s: Service | null = null;
        let b: string | null = null;

        if (storedService) {
            s = JSON.parse(storedService);
            setService(s);
        }
        if (storedBarberId) {
            b = storedBarberId;
            setBarber(b);
        }
        if (storedBarberName) setBarberName(storedBarberName);

        // --- LÓGICA: Cargar slots para HOY si los datos están disponibles ---
        if (s && b) {
            const today = new Date();
            // Poner el selectedDate al día de hoy e iniciar la carga
            setSelectedDate(today);
            fetchAvailableSlots(today, b, s);
        }

        setIsInitialized(true);
    }, []);

    // Se asegura que handleDaySelect use los estados internos después de la inicialización
    const handleDaySelect = (day: Date) => {
        if (!service || !barber) return;

        // Solo seleccionar y cargar slots si no es el día ya seleccionado
        if (!selectedDate || !isSameDay(day, selectedDate)) {
            setSelectedDate(day);
            setSelectedTime(null);
            fetchAvailableSlots(day, barber, service);
        }
    };

    const handleMonthChange = (direction: "prev" | "next") => {
        setCurrentMonth(
            direction === "prev" ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1)
        );
        setSelectedDate(null); // Deseleccionar día al cambiar de mes
        setSelectedTime(null);
        setAvailableSlots([]);
    };

    const handleFinalize = async () => {
        if (!selectedDate || !selectedTime || !service || !barber) {
            showMessage("Selecciona fecha y hora válidas.");
            return;
        }

        setIsLoading(true);

        try {
            const [h, m] = selectedTime.split(":").map(Number);
            const BOGOTA_UTC_OFFSET = 5; // Colombia/Bogotá es UTC-5

            // Crear la fecha en UTC (el backend recibe y almacena UTC)
            const fechaHoraUTC = new Date(Date.UTC(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate(),
                h + BOGOTA_UTC_OFFSET, // Ajustar la hora local (09:00 BOG) al UTC (14:00 UTC)
                m,
                0,
                0
            ));

            // Obtener datos del cliente desde localStorage
            const storedCliente = JSON.parse(localStorage.getItem('abalvi_reserva_cliente') || '{}');

            const finalAppointment = {
                clienteId: localStorage.getItem("abalvi_user_id") || null,
                barberoId: barber,
                servicioId: service.id,
                fechaHora: fechaHoraUTC.toISOString(),
                precioFinal: service.price,
                duracionMinutos: service.duration,
                nombreCliente: storedCliente.nombre || null,
                emailCliente: storedCliente.correo || null,
                whatsappCliente: storedCliente.whatsapp || null,
                notas: null,
            };

            console.log("🚀 Enviando a Backend:", finalAppointment);

            const res = await fetch(`${API_BASE_URL}/api/citas/public`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalAppointment),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("❌ Error de respuesta del servidor:", res.status, errorData);

                if (res.status === 409) {
                    showMessage("¡Conflicto! Este turno acaba de ser tomado por otra persona.");

                    // 1. Bloquearlo inmediatamente en UI
                    if (selectedTime) {
                        setAvailableSlots(prev => prev.filter(t => t !== selectedTime));
                        setSelectedTime(null);
                    }

                    // 2. Sincronizar con backend
                    if (selectedDate) {
                        fetchAvailableSlots(selectedDate, barber, service);
                    }

                    return;
                }

                throw new Error(errorData.message || `Error al crear cita. Estado: ${res.status}`);
            }

            showMessage("🎉 Cita agendada con éxito!");

            // Limpiar localStorage
            localStorage.removeItem("abalvi_reserva_servicio");
            localStorage.removeItem("abalvi_reserva_barbero");
            localStorage.removeItem("abalvi_reserva_cliente");

            setTimeout(() => router.push("/view6"), 1000);

        } catch (error) {
            console.error(error);
            showMessage(`Hubo un error al agendar la cita: ${(error as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };


    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);

        // Ajuste para que la semana empiece el Lunes (1 = Lunes, 0 = Domingo)
        const startDayIndex = startOfMonth(currentMonth).getDay(); // 0 (Dom) a 6 (Sab)
        const startDayAdjusted = startDayIndex === 0 ? 6 : startDayIndex - 1; // 0 (Lun) a 6 (Dom)


        const totalDays = monthEnd.getDate();
        const rows: JSX.Element[] = [];
        let days: JSX.Element[] = [];

        // Días vacíos al inicio del mes
        for (let i = 0; i < startDayAdjusted; i++) {
            days.push(<div key={`empty-start-${i}`} className="h-10 w-10" />);
        }

        // Días del mes
        for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
            const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum);
            // Comparar solo el día (hora 00:00) con el día actual (hora actual)
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const isPast = isBefore(dayDate, todayStart);
            const isSelected = selectedDate && isSameDay(dayDate, selectedDate);

            // Check if the day is the actual today (for styling)
            const isToday = isSameDay(dayDate, new Date());


            days.push(
                <div
                    key={dayDate.toISOString()}
                    onClick={() => !isPast && handleDaySelect(dayDate)}
                    className={`flex items-center justify-center cursor-pointer h-10 w-10 text-sm font-semibold transition
                    ${isPast ? "opacity-30 pointer-events-none" : ""}
                    ${isSelected ? "bg-white text-black rounded-full shadow-lg" : "hover:bg-gray-700 rounded-full text-white"}
                    ${isToday && !isSelected && !isPast ? "border-2 border-white" : ""}
                `}
                >
                    {dayNum}
                </div>
            );

            // Si es domingo ((dayDate.getDay() + 6) % 7 === 6 en Lunes-Domingo) o el último día del mes
            if ((dayDate.getDay() + 6) % 7 === 6 || dayNum === totalDays) {
                rows.push(
                    <div key={`week-${rows.length}`} className="grid grid-cols-7 gap-1 mb-1">
                        {days}
                    </div>
                );
                days = [];
            }

        }

        // Agregar días restantes si el mes no termina en Domingo
        if (days.length > 0) {
            // Llenar los espacios vacíos al final de la última semana
            const remainingEmptySlots = 7 - days.length;
            for (let i = 0; i < remainingEmptySlots; i++) {
                days.push(<div key={`empty-end-${i}`} className="h-10 w-10" />);
            }

            rows.push(
                <div key={`week-final`} className="grid grid-cols-7 gap-1 mb-1">
                    {days}
                </div>
            );
        }


        const weekDays = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"]; // Empezando el Lunes

        return (
            <div className="p-6 pb-20 rounded-b-[40px] shadow-xl w-full" style={{ backgroundColor: customColors['barber-dark'] }}>
                <div className="flex justify-between items-center mb-4">
                    <p className="text-xs tracking-widest font-light text-gray-400">ABALVI BARBER</p>
                    <button onClick={() => router.push("/view4")} disabled={isLoading} className="flex items-center text-sm text-gray-400 hover:text-white transition">
                        <ArrowLeft className="w-3 h-3 mr-1" /> Volver
                    </button>
                </div>

                <h2 className="text-2xl font-extrabold text-white mb-6 text-center">ELIGE LA FECHA</h2>

                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => handleMonthChange("prev")}
                        // Deshabilitar el botón si el mes actual es el mismo que el mes de hoy
                        disabled={isLoading || isSameDay(startOfMonth(currentMonth), startOfMonth(new Date()))}
                        className="text-white text-2xl p-2 rounded-full hover:bg-gray-700 transition disabled:opacity-50"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="text-white font-bold text-lg tracking-wider">{format(currentMonth, "MMMM yyyy", { locale: es }).toUpperCase()}</span>
                    <button onClick={() => handleMonthChange("next")} disabled={isLoading} className="text-white text-2xl p-2 rounded-full hover:bg-gray-700 transition">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map((d) => <div key={d} className="text-gray-400 text-center font-semibold text-xs">{d}</div>)}
                </div>

                {/* Días del mes */}
                {rows}
            </div>
        );
    };


    return (
        <div className="w-full min-h-screen flex justify-center items-stretch bg-gray-100 sm:p-8">
            <div className="w-full max-w-sm sm:max-w-xl md:max-w-2xl shadow-2xl relative bg-white min-h-screen sm:min-h-[90vh] sm:rounded-xl">

                {renderCalendar()}

                <div className="relative -top-12 px-6">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold mb-4 text-center" style={{ color: customColors['barber-black'] }}>ELIGE LA HORA</h3>

                        {/* Mostrar carga si está cargando O si no se ha inicializado y no hay slots aún */}
                        {isLoading || !isInitialized ? (
                            <p className="text-center text-gray-500">Cargando datos y horarios...</p>
                        ) : selectedDate && availableSlots.length === 0 ? (
                            <p className="text-center text-gray-500">No hay horarios disponibles para la fecha seleccionada.</p>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {ALL_TIME_SLOTS.map((slot) => {

                                    // Normaliza HH:mm (ej: "9:00" → "09:00")
                                    const normalize = (t: string) =>
                                        t.length === 4 ? "0" + t : t;

                                    const slotNormalized = normalize(slot.value);

                                    // Normalizar TODO lo que llega del backend
                                    const availableNormalized = availableSlots.map(normalize);

                                    const isAvailable = availableNormalized.includes(slotNormalized);
                                    const isSelected = selectedTime === slotNormalized;

                                    return (
                                        <button
                                            key={slotNormalized}
                                            onClick={() => isAvailable && setSelectedTime(slotNormalized)}
                                            disabled={!isAvailable || isLoading || !selectedDate}
                                            className={`py-3 rounded-lg font-semibold transition text-sm sm:text-base
                    ${isSelected
                                                    ? "bg-black text-white shadow-lg border-2 border-black"
                                                    : isAvailable
                                                        ? "bg-white text-black border border-gray-400 hover:bg-gray-100"
                                                        : "bg-gray-100 text-gray-400 cursor-not-allowed line-through border border-gray-300"
                                                }`}
                                        >
                                            {slot.display}
                                        </button>
                                    );
                                })}
                            </div>

                        )}
                        {!selectedDate && isInitialized && ( // Mostrar este mensaje solo si ya terminó la inicialización y no hay fecha seleccionada
                            <p className="text-center text-gray-500 mt-4">Por favor, selecciona una fecha primero.</p>
                        )}
                    </div>
                </div>

                <div className="px-6 pt-0 text-center relative -top-6">
                    <p className="text-sm text-gray-600 mb-4">
                        <span className="font-semibold">Barbero:</span> {barberName} | <span className="font-semibold">Servicio:</span> {service?.name} - ${service?.price?.toLocaleString("es-CO")}
                    </p>
                </div>

                <div className="p-6 pt-0 relative -top-6">
                    <button
                        onClick={handleFinalize}
                        disabled={!selectedTime || isLoading}
                        className="w-full py-3 rounded-lg text-white font-semibold transition disabled:opacity-50"
                        style={{ backgroundColor: customColors['barber-dark'] }}
                    >
                        {isLoading ? "Agendando..." : "Agendar"}
                    </button>
                </div>
            </div>

            {message && (
                <div
                    className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full text-white shadow-xl z-50 transition duration-300"
                    style={{ backgroundColor: customColors['barber-dark'] }}
                >
                    {message}
                </div>
            )}
        </div>
    );
};

export default View5Page;