"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    addMonths,
    subMonths,
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    isSameDay,
    isBefore,
} from "date-fns";
import { es } from 'date-fns/locale'; // Importar locale español para los meses
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

/** Genera slots de 9:00 a 19:00 */
const generateTimeSlots = (): { display: string; value: string }[] => {
    const slots = [];
    for (let h = 9; h <= 19; h++) {
        const display =
            h < 12 ? `${h}:00 am` : h === 12 ? `12:00 pm` : `${h - 12}:00 pm`;
        const value = `${h.toString().padStart(2, "0")}:00`;
        slots.push({ display, value });
    }
    return slots;
};

const ALL_TIME_SLOTS = generateTimeSlots();

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

    // Cargar datos de servicio y barbero desde localStorage
    useEffect(() => {
        const storedService = localStorage.getItem("abalvi_reserva_servicio");
        const storedBarberId = localStorage.getItem("abalvi_reserva_barbero");
        const storedBarberName = localStorage.getItem(
            "abalvi_reserva_barbero_nombre"
        );

        if (storedService) setService(JSON.parse(storedService));
        if (storedBarberId) setBarber(storedBarberId);
        if (storedBarberName) setBarberName(storedBarberName);
    }, []);

    const showMessage = (text: string) => {
        setMessage(text);
        setTimeout(() => setMessage(null), 2500);
    };

    // Fetch de horarios disponibles
    const fetchAvailableSlots = async (date: Date) => {
        if (!service || !barber) return;
        setIsLoading(true);
        setAvailableSlots([]); // Limpiar slots al cambiar de día
        try {
            const dateStr = format(date, "yyyy-MM-dd"); // Usar date-fns para formato
            const res = await fetch(
                `${API_BASE_URL}/api/citas/availability?date=${dateStr}&serviceDuration=${service.duration}&barberId=${barber}`
            );
            const data = await res.json();
            setAvailableSlots(data.availableSlots || []);
        } catch (error) {
            console.error(error);
            showMessage("Error al obtener horarios disponibles.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDaySelect = (day: Date) => {
        // Solo seleccionar y cargar slots si no es el día ya seleccionado
        if (!selectedDate || !isSameDay(day, selectedDate)) {
            setSelectedDate(day);
            setSelectedTime(null);
            fetchAvailableSlots(day);
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

    // Finalizar cita y enviar al backend
    const handleFinalize = async () => {
        if (!selectedDate || !selectedTime || !service || !barber) {
            showMessage("Selecciona fecha y hora válidas.");
            return;
        }

        setIsLoading(true);

        try {
            // ... (Lógica de handleFinalize se mantiene igual)
            const dateTime = new Date(selectedDate);
            const [hours, minutes] = selectedTime.split(":").map(Number);
            dateTime.setHours(hours, minutes, 0, 0);

            const finalAppointment = {
                clienteId: localStorage.getItem("abalvi_user_id") || null,
                barberoId: barber,
                servicioId: service.id,
                fechaHora: dateTime.toISOString(),
                fechaFin: new Date(dateTime.getTime() + service.duration * 60000).toISOString(),
                precioFinal: service.price,
                duracionMinutos: service.duration,
                nombreCliente: localStorage.getItem("abalvi_cliente_nombre") || null,
                emailCliente: localStorage.getItem("abalvi_cliente_email") || null,
                whatsappCliente: localStorage.getItem("abalvi_cliente_whatsapp") || null,
                notas: null,
            };

            const res = await fetch(`${API_BASE_URL}/api/citas/public`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalAppointment),
            });

            if (!res.ok) throw new Error("Error al crear cita");

            showMessage("🎉 Cita agendada con éxito!");

            localStorage.removeItem("abalvi_reserva_servicio");
            localStorage.removeItem("abalvi_reserva_barbero");

            setTimeout(() => router.push("/view6"), 1000);
        } catch (error) {
            console.error(error);
            showMessage("Hubo un error al agendar la cita.");
        } finally {
            setIsLoading(false);
        }
    };

    // Render calendario
    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const dateFormat = "d";

        // Calculamos el día de la semana del primer día del mes (0 = domingo)
        const startDay = monthStart.getDay();

        const totalDays = monthEnd.getDate();
        const rows: JSX.Element[] = [];
        let days: JSX.Element[] = [];

        // Rellenamos el inicio de la primera semana con días vacíos si el mes no empieza en domingo
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-start-${i}`} className="h-10 w-10" />);
        }

        for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
            const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum);
            const isPast = isBefore(dayDate, new Date());
            const isSelected = selectedDate && isSameDay(dayDate, selectedDate);

            days.push(
                <div
                    key={dayDate.toISOString()}
                    onClick={() => !isPast && handleDaySelect(dayDate)}
                    className={`flex items-center justify-center cursor-pointer h-10 w-10 text-sm font-semibold transition
                    ${isPast ? "opacity-30 pointer-events-none" : ""}
                    ${isSelected ? "bg-white text-black rounded-full shadow-lg" : "hover:bg-gray-700 rounded-full text-white"}
                `}
                >
                    {dayNum}
                </div>
            );

            // Cuando se completa la semana, la agregamos a rows y reiniciamos days
            if ((days.length) % 7 === 0 || dayNum === totalDays) {
                rows.push(
                    <div key={`week-${dayNum}`} className="grid grid-cols-7 gap-1 mb-1">
                        {days}
                    </div>
                );
                days = [];
            }
        }

        const weekDays = ["DO", "LU", "MA", "MI", "JU", "VI", "SA"];

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
                    <button onClick={() => handleMonthChange("prev")} disabled={isLoading} className="text-white text-2xl p-2 rounded-full hover:bg-gray-700 transition">
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
            {/* Contenedor principal: define el ancho máximo, mantiene la curva en móvil y se redondea en PC */}
            <div className="w-full max-w-sm sm:max-w-xl md:max-w-2xl shadow-2xl relative bg-white min-h-screen sm:min-h-[90vh] sm:rounded-xl">

                {/* 1. CALENDARIO */}
                {renderCalendar()}

                {/* 2. HORARIOS */}
                <div className="relative -top-12 px-6">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold mb-4 text-center" style={{ color: customColors['barber-black'] }}>ELIGE LA HORA</h3>

                        {selectedDate && isLoading ? (
                            <p className="text-center text-gray-500">Buscando horarios...</p>
                        ) : selectedDate && availableSlots.length === 0 ? (
                            <p className="text-center text-gray-500">No hay horarios disponibles para la fecha seleccionada.</p>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {ALL_TIME_SLOTS.map((slot) => {
                                    const isAvailable = availableSlots.includes(slot.value);
                                    const isSelected = selectedTime === slot.value;

                                    return (
                                        <button
                                            key={slot.value}
                                            onClick={() => isAvailable && setSelectedTime(slot.value)}
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
                        {!selectedDate && (
                            <p className="text-center text-gray-500 mt-4">Por favor, selecciona una fecha primero.</p>
                        )}
                    </div>
                </div>

                {/* INFO (Barbero/Servicio) */}
                <div className="px-6 pt-0 text-center relative -top-6">
                    <p className="text-sm text-gray-600 mb-4">
                        <span className="font-semibold">Barbero:</span> {barberName} | <span className="font-semibold">Servicio:</span> {service?.name} - ${service?.price?.toLocaleString("es-CO")}
                    </p>
                </div>

                {/* 3. BOTÓN AGENDAR */}
                <div className="p-6 pt-0 relative -top-6">
                    <button
                        onClick={handleFinalize}
                        disabled={!selectedTime || isLoading}
                        className="w-full py-3 rounded-lg text-white font-semibold transition"
                        style={{ backgroundColor: customColors['barber-dark'] }}
                    >
                        {isLoading ? "Agendando..." : "Agendar"}
                    </button>
                </div>
            </div>

            {/* Mensaje Flotante */}
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