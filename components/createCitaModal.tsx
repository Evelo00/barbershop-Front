"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface CreateCitaModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    barberos: any[];
    servicios: any[];
    apiUrl: string;
}

export default function CreateCitaModal({
    open,
    onClose,
    onCreated,
    barberos,
    servicios,
    apiUrl
}: CreateCitaModalProps) {

    const [newBarbero, setNewBarbero] = useState("");
    const [newServicio, setNewServicio] = useState("");
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("09:00");
    const [newNombre, setNewNombre] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newWhatsapp, setNewWhatsapp] = useState("");
    const [newPrecio, setNewPrecio] = useState<number>(0);

    useEffect(() => {
        if (open) {
            // Fecha actual
            const today = new Date().toISOString().slice(0, 10);
            setNewDate(today);
        }
    }, [open]);

    const crearCita = async () => {
        if (!newBarbero || !newServicio || !newDate || !newTime) {
            alert("Completa todos los campos requeridos.");
            return;
        }

        const fechaCompleta = `${newDate}T${newTime}:00-05:00`;

        const body = {
            barberoId: newBarbero,
            servicioId: newServicio,
            fechaHora: fechaCompleta,
            precioFinal: newPrecio,
            nombreCliente: newNombre || null,
            emailCliente: newEmail || null,
            whatsappCliente: newWhatsapp || null,
            notas: null
        };

        try {
            const res = await fetch(`${apiUrl}/api/citas/public`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error();

            onCreated();
            onClose();

        } catch {
            alert("No se pudo crear la cita.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose} >
            <DialogContent
                className="max-w-md max-h-[85vh] overflow-y-auto"
                onInteractOutside={onClose}
                onEscapeKeyDown={onClose}
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold">
                        Crear nueva cita
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 pt-2">

                    {/* Barbero */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Barbero</label>
                        <select
                            className="w-full mt-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                            value={newBarbero}
                            onChange={(e) => setNewBarbero(e.target.value)}
                        >
                            <option value="">Selecciona...</option>
                            {barberos.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.nombre} {b.apellido}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Servicio */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Servicio</label>
                        <select
                            className="w-full mt-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                            value={newServicio}
                            onChange={(e) => {
                                const id = e.target.value;
                                setNewServicio(id);
                                const serv = servicios.find((s) => s.id === id);
                                if (serv) setNewPrecio(serv.precio);
                            }}
                        >
                            <option value="">Selecciona...</option>
                            {servicios.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.nombre} – ${s.precio.toLocaleString("es-CO")}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Fecha */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Fecha</label>
                        <input
                            type="date"
                            className="w-full border mt-1 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                        />
                    </div>

                    {/* Hora */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Hora</label>
                        <input
                            type="time"
                            className="w-full border mt-1 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                        />
                    </div>

                    <hr className="border-gray-300" />

                    {/* CLIENTE */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Cliente (opcional)</label>
                    </div>

                    <input
                        type="text"
                        placeholder="Nombre"
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                        value={newNombre}
                        onChange={(e) => setNewNombre(e.target.value)}
                    />

                    <input
                        type="email"
                        placeholder="Correo"
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                    />

                    <input
                        type="text"
                        placeholder="Whatsapp"
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                        value={newWhatsapp}
                        onChange={(e) => setNewWhatsapp(e.target.value)}
                    />

                    {/* Precio oculto */}
                    <input type="hidden" value={newPrecio} />

                    {/* Botones */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={crearCita}
                            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-semibold"
                        >
                            Crear
                        </button>

                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-semibold"
                        >
                            Cancelar
                        </button>
                    </div>

                </div>

            </DialogContent>
        </Dialog>
    );
}
