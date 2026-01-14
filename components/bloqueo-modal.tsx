"use client";

import React, { useEffect, useRef, useState } from "react";

interface UserData {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    activo: boolean;
    telefono: string;
    avatar?: string | null;
    silla?: number | null;
}

interface BloqueoModalProps {
    open: boolean;
    onClose: () => void;
    barbero: UserData | null;
    currentDate: Date;
    onApplyBloqueo: (data: {
        fechaInicio: string;
        fechaFin: string;
        duracionMinutos: number;
        notas?: string;
    }) => void;
}

function getScheduleForDay(date: Date) {
    const day = date.getDay();

    if (day === 0) {
        return { start: 9, end: 19 }; // domingo 9–19
    }

    return { start: 8, end: 20 }; // lunes a sábado 8–20
}


const pad = (n: number) => String(n).padStart(2, "0");

export default function BloqueoModal({
    open,
    onClose,
    barbero,
    currentDate,
    onApplyBloqueo,
}: BloqueoModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    /* HORARIO REAL DEL DÍA */
    const { start, end } = getScheduleForDay(currentDate);

    const startHour = Math.floor(start);
    const endHour = Math.floor(end);
    const endMinute = Math.round((end % 1) * 60);

    /* ESTADOS */
    const [startTime, setStartTime] = useState("12:00");
    const [endTime, setEndTime] = useState("12:10");

    /* Cerrar con ESC */
    useEffect(() => {
        if (!open) return;
        const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, [open]);
    // Auto ajustar endTime
    useEffect(() => {
        if (endTime <= startTime) {
            setEndTime(startTime);
        }
    }, [startTime]);


    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === modalRef.current) onClose();
    };

    if (!open || !barbero) return null;

    const timeOptions: string[] = [];

    for (let h = startHour; h < endHour; h++) {
        for (let m of [0, 10, 20, 30, 40, 50]) {
            timeOptions.push(`${pad(h)}:${pad(m)}`);
        }
    }

    const dateStr = currentDate.toLocaleDateString("en-CA");

    const createBloqueo = (notas?: string) => {
        const inicioISO = `${dateStr}T${startTime}:00-05:00`;
        const finISO = `${dateStr}T${endTime}:00-05:00`;

        const duracion = (new Date(finISO).getTime() - new Date(inicioISO).getTime()) / 60000;

        if (duracion <= 0) return;

        onApplyBloqueo({
            fechaInicio: inicioISO,
            fechaFin: finISO,
            duracionMinutos: duracion,
            notas,
        });
    };

    const createPresetMinutes = (minutes: number, notas: string) => {
        const inicioISO = `${dateStr}T${startTime}:00-05:00`;

        const fin = new Date(inicioISO);
        fin.setMinutes(fin.getMinutes() + minutes);

        const finISO = `${dateStr}T${pad(fin.getHours())}:${pad(fin.getMinutes())}:00-05:00`;

        onApplyBloqueo({
            fechaInicio: inicioISO,
            fechaFin: finISO,
            duracionMinutos: minutes,
            notas,
        });
    };

    const applyFullDay = () => {
        const fechaInicio = `${dateStr}T${pad(startHour)}:00-05:00`;
        const fechaFin = `${dateStr}T${pad(endHour)}:00-05:00`;

        const totalMin = (endHour - startHour) * 60;

        onApplyBloqueo({
            fechaInicio,
            fechaFin,
            duracionMinutos: totalMin,
            notas: "Jornada completa",
        });
    };

    return (
        <div
            ref={modalRef}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        >
            <div className="bg-white p-6 rounded-xl shadow-xl w-auto max-h-[90vh] overflow-y-auto">

                <h3 className="text-lg font-bold mb-4 text-center text-gray-800">
                    Bloquear agenda de {barbero.nombre}
                </h3>

                {/* BLOQUEO MANUAL */}
                <div className="text-center font-semibold mb-2">BLOQUEO GENERAL</div>

                <div className="flex gap-2 mb-4">
                    <select
                        className="w-1/2 border rounded px-2 py-2"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                    >
                        {timeOptions.map((t) => (
                            <option key={t}>{t}</option>
                        ))}
                    </select>

                    <select
                        className="w-1/2 border rounded px-2 py-2"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                    >
                        {timeOptions.map((t) => (
                            <option key={t}>{t}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={() => createBloqueo("Bloqueo general")}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold mb-4"
                >
                    APLICAR
                </button>

                <hr className="my-4" />

                {/* PRESETS */}
                <div className="text-center font-semibold mb-2">BLOQUEOS PREESTABLECIDOS</div>

                <button
                    className="w-full border rounded-lg py-2 mb-3 font-semibold"
                    onClick={() => createPresetMinutes(40, "Almuerzo")}
                >
                    40 MIN ALMUERZO (desde {startTime})
                </button>

                <div className="grid grid-cols-3 gap-2 mb-4">
                    <button
                        className="border rounded-lg py-2 font-semibold"
                        onClick={() => createPresetMinutes(60, "Descanso 1h")}
                    >
                        1 HORA
                    </button>

                    <button
                        className="border rounded-lg py-2 font-semibold"
                        onClick={() => createPresetMinutes(120, "Descanso 2h")}
                    >
                        2 HORAS
                    </button>

                    <button
                        className="border rounded-lg py-2 font-semibold"
                        onClick={applyFullDay}
                    >
                        TODA LA JORNADA
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-gray-200 hover:bg-gray-300 py-2 rounded-lg"
                >
                    CANCELAR
                </button>
            </div>
        </div>
    );
}
