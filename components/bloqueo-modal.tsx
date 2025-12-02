"use client";

import React, { useEffect, useRef } from "react";

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
    START_HOUR: number;
    END_HOUR: number;
    onApplyBloqueo: (data: {
        fechaInicio: string;
        fechaFin: string;
        duracionMinutos: number;
        notas?: string;
    }) => void;
}

export default function BloqueoModal({
    open,
    onClose,
    barbero,
    currentDate,
    START_HOUR,
    END_HOUR,
    onApplyBloqueo,
}: BloqueoModalProps) {

    const modalRef = useRef<HTMLDivElement>(null);

    /* === CERRAR AL PRESIONAR ESC === */
    useEffect(() => {
        if (!open) return;

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [open, onClose]);

    /* === CERRAR CON CLICK AFUERA === */
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === modalRef.current) onClose();
    };

    if (!open || !barbero) return null;

    /* === GENERAR HORAS EN INTERVALOS DE 10 MINUTOS === */
    const timeOptions: string[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
        for (let m = 0; m < 60; m += 10) {
            const hh = h.toString().padStart(2, "0");
            const mm = m.toString().padStart(2, "0");
            timeOptions.push(`${hh}:${mm}`);
        }
    }

    const dateStr = currentDate.toLocaleDateString("en-CA");

    /* === FUNCIÓN GENERAL DE CREACIÓN === */
    const createBloqueo = (start: string, end: string, notas?: string) => {
        const inicioISO = `${dateStr}T${start}:00-05:00`;
        const finISO = `${dateStr}T${end}:00-05:00`;

        const duracion =
            (new Date(finISO).getTime() - new Date(inicioISO).getTime()) / 60000;

        if (duracion <= 0) return;

        onApplyBloqueo({
            fechaInicio: inicioISO,
            fechaFin: finISO,
            duracionMinutos: duracion,
            notas,
        });
    };

    /* === PRESETS === */
    const createPresetMinutes = (start: string, minutes: number, notas: string) => {
        const inicioISO = `${dateStr}T${start}:00-05:00`;
        const fin = new Date(inicioISO);
        fin.setMinutes(fin.getMinutes() + minutes);

        const finISO = `${dateStr}T${String(fin.getHours()).padStart(2, "0")}:${String(
            fin.getMinutes()
        ).padStart(2, "0")}:00-05:00`;

        onApplyBloqueo({
            fechaInicio: inicioISO,
            fechaFin: finISO,
            duracionMinutos: minutes,
            notas,
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

                {/* === BLOQUEO GENERAL === */}
                <div className="text-center font-semibold mb-2">BLOQUEO GENERAL</div>

                <div className="flex gap-2 mb-4">
                    <select id="start" className="w-1/2 border rounded px-2 py-2">
                        {timeOptions.map((t) => (
                            <option key={t}>{t}</option>
                        ))}
                    </select>

                    <select id="end" className="w-1/2 border rounded px-2 py-2">
                        {timeOptions.map((t) => (
                            <option key={t}>{t}</option>
                        ))}
                    </select>
                </div>

                {/* === BOTÓN APLICAR === */}
                <button
                    onClick={() => {
                        const start = (
                            document.getElementById("start") as HTMLSelectElement
                        ).value;
                        const end = (document.getElementById("end") as HTMLSelectElement)
                            .value;
                        createBloqueo(start, end, "Bloqueo general");
                    }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold mb-4"
                >
                    APLICAR
                </button>

                <hr className="my-4" />

                {/* === PREESTABLECIDOS === */}
                <div className="text-center font-semibold mb-2">
                    BLOQUEOS PREESTABLECIDOS
                </div>

                {/* 40 MIN ALMUERZO */}
                <button
                    className="w-full border rounded-lg py-2 mb-3 font-semibold"
                    onClick={() => createPresetMinutes("12:00", 40, "Almuerzo")}
                >
                    40 MIN ALMUERZO
                </button>

                {/* 1 HORA / 2 HORAS / JORNADA */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <button
                        className="border rounded-lg py-2 font-semibold"
                        onClick={() => createPresetMinutes("12:00", 60, "Descanso 1h")}
                    >
                        1 HORA
                    </button>

                    <button
                        className="border rounded-lg py-2 font-semibold"
                        onClick={() => createPresetMinutes("12:00", 120, "Descanso 2h")}
                    >
                        2 HORAS
                    </button>

                    <button
                        className="border rounded-lg py-2 font-semibold"
                        onClick={() =>
                            createBloqueo("08:00", "20:00", "Día completo")
                        }
                    >
                        TODA LA JORNADA
                    </button>
                </div>

                {/* CANCELAR */}
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
