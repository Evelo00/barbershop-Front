"use client";

import { useState } from "react";
import { Slash } from "lucide-react";

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
    const [newNotas, setNewNotas] = useState("");

    if (!open) return null;

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
            nombreCliente: newNombre,
            emailCliente: newEmail,
            whatsappCliente: newWhatsapp,
            notas: newNotas
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">

            <div className="
            bg-white 
            rounded-2xl 
            shadow-2xl 
            w-full 
            max-w-md 
            max-h-[85vh] 
            overflow-y-auto 
            p-6
            animate-[fadeIn_0.2s_ease-out]
        ">

                <h3 className="text-2xl font-bold mb-6 text-center text-gray-900">
                    Crear nueva cita
                </h3>

                <div className="space-y-5">

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

                    <hr className="border-gray-300" />

                    {/* Precio */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Precio</label>
                        <input
                            type="number"
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                            value={newPrecio}
                            onChange={(e) => setNewPrecio(Number(e.target.value))}
                        />
                    </div>

                    {/* Notas */}
                    <textarea
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                        rows={3}
                        placeholder="Notas..."
                        value={newNotas}
                        onChange={(e) => setNewNotas(e.target.value)}
                    />

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

            </div>
        </div>
    );
}
