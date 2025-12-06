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
    apiUrl,
}: CreateCitaModalProps) {
    // CAMPOS BÁSICOS
    const [newBarbero, setNewBarbero] = useState("");
    const [selectedServicios, setSelectedServicios] = useState<any[]>([]);
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("09:00");
    const [newNombre, setNewNombre] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newWhatsapp, setNewWhatsapp] = useState("");
    const totalPrecio = selectedServicios.reduce((acc, s) => acc + s.precio, 0);
    const totalDuracion = selectedServicios.reduce(
        (acc, s) => acc + s.duracion,
        0
    );

    const [errors, setErrors] = useState({
        nombre: "",
        whatsapp: "",
        servicios: "",
    });

    useEffect(() => {
        if (open) {
            const today = new Date().toISOString().slice(0, 10);
            setNewDate(today);
            setErrors({ nombre: "", whatsapp: "", servicios: "" });
        }
    }, [open]);

    const validar = () => {
        let ok = true;
        let errs: any = { nombre: "", whatsapp: "", servicios: "" };

        if (newNombre.trim().length < 2) {
            errs.nombre = "El nombre es obligatorio.";
            ok = false;
        }

        if (!/^[0-9]{7,15}$/.test(newWhatsapp)) {
            errs.whatsapp = "Debe ser un número válido (solo dígitos).";
            ok = false;
        }

        if (selectedServicios.length === 0) {
            errs.servicios = "Selecciona al menos un servicio.";
            ok = false;
        }

        setErrors(errs);
        return ok;
    };

    const addServicio = (id: string) => {
        const serv = servicios.find((s) => s.id === id);
        if (!serv) return;

        if (selectedServicios.some((s) => s.id === serv.id)) return;

        setSelectedServicios((prev) => [...prev, serv]);

        setErrors((prev) => ({ ...prev, servicios: "" }));
    };

    const removeServicio = (id: string) => {
        setSelectedServicios((prev) => prev.filter((s) => s.id !== id));
    };

    const crearCita = async () => {
        if (!validar()) return;

        if (!newBarbero || !newDate || !newTime) {
            alert("Completa los campos requeridos.");
            return;
        }

        const fechaHoraUTC = fechaLocalAUTC(newDate, newTime);

        const body = {
            barberoId: newBarbero,
            servicios: selectedServicios.map((s) => s.id),
            fechaHora: fechaHoraUTC,
            precioFinal: totalPrecio,
            nombreCliente: newNombre,
            emailCliente: newEmail || null,
            whatsappCliente: newWhatsapp,
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

    const isSubmitDisabled =
        !newBarbero ||
        !newDate ||
        !newTime ||
        selectedServicios.length === 0 ||
        newNombre.trim().length < 2 ||
        !/^[0-9]{7,15}$/.test(newWhatsapp);

    function fechaLocalAUTC(date: string, time: string) {
        const local = new Date(`${date}T${time}:00-05:00`);
        return local.toISOString();
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
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
                    {/* BARBERO */}
                    <div>
                        <label className="text-sm font-semibold">Barbero</label>
                        <select
                            className="w-full mt-1 border rounded-lg px-3 py-2"
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

                    {/* SERVICIOS MULTIPLE */}
                    <div>
                        <label className="text-sm font-semibold">
                            Servicios <span className="text-red-600">*</span>
                        </label>

                        <select
                            className="w-full mt-1 border rounded-lg px-3 py-2"
                            onChange={(e) => {
                                addServicio(e.target.value);
                                e.target.value = "";
                            }}
                        >
                            <option value="">Agregar servicio...</option>
                            {servicios.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.nombre} – {s.duracion} min / $
                                    {s.precio.toLocaleString("es-CO")}
                                </option>
                            ))}
                        </select>

                        {/* Lista de servicios agregados */}
                        <div className="mt-2 space-y-2">
                            {selectedServicios.map((s) => (
                                <div
                                    key={s.id}
                                    className="flex items-center justify-between bg-gray-100 border rounded-lg p-2"
                                >
                                    <div>
                                        <p className="font-semibold text-sm">{s.nombre}</p>
                                        <p className="text-xs text-gray-500">
                                            {s.duracion} min – ${s.precio.toLocaleString("es-CO")}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => removeServicio(s.id)}
                                        className="text-red-600 font-bold text-sm"
                                    >
                                        X
                                    </button>
                                </div>
                            ))}
                        </div>

                        {errors.servicios && (
                            <p className="text-red-600 text-xs mt-1">{errors.servicios}</p>
                        )}

                        {/* Totales */}
                        {selectedServicios.length > 0 && (
                            <div className="mt-3 text-sm font-semibold bg-gray-50 p-3 rounded-lg border">
                                <p>Duración total: {totalDuracion} min</p>
                                <p>Precio total: ${totalPrecio.toLocaleString("es-CO")}</p>
                            </div>
                        )}
                    </div>

                    {/* FECHA */}
                    <div>
                        <label className="text-sm font-semibold">Fecha</label>
                        <input
                            type="date"
                            className="w-full border mt-1 rounded-lg px-3 py-2"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                        />
                    </div>

                    {/* HORA */}
                    <div>
                        <label className="text-sm font-semibold">Hora</label>
                        <input
                            type="time"
                            className="w-full border mt-1 rounded-lg px-3 py-2"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                        />
                    </div>

                    <hr />

                    {/* DATOS DEL CLIENTE */}
                    <div>
                        <label className="text-sm font-semibold">
                            Datos del cliente (requeridos)
                        </label>
                    </div>

                    <div>
                        <input
                            type="text"
                            placeholder="Nombre *"
                            className={`w-full border rounded-lg px-3 py-2 ${errors.nombre ? "border-red-500" : ""
                                }`}
                            value={newNombre}
                            onChange={(e) => setNewNombre(e.target.value)}
                        />
                        {errors.nombre && (
                            <p className="text-red-600 text-xs">{errors.nombre}</p>
                        )}
                    </div>

                    <div>
                        <input
                            type="text"
                            placeholder="Telefono *"
                            className={`w-full border rounded-lg px-3 py-2 ${errors.whatsapp ? "border-red-500" : ""
                                }`}
                            value={newWhatsapp}
                            onChange={(e) => setNewWhatsapp(e.target.value)}
                        />
                        {errors.whatsapp && (
                            <p className="text-red-600 text-xs">{errors.whatsapp}</p>
                        )}
                    </div>

                    <div>
                        <input
                            type="email"
                            placeholder="Correo (opcional)"
                            className="w-full border rounded-lg px-3 py-2"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                        />
                    </div>

                    {/* BOTONES */}
                    <div className="flex gap-3 pt-4">
                        <button
                            disabled={isSubmitDisabled}
                            onClick={crearCita}
                            className={`flex-1 py-2 rounded-lg text-white font-semibold transition ${isSubmitDisabled
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
                        >
                            Crear
                        </button>

                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 font-semibold"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
