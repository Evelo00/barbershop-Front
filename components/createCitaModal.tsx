"use client";

import { useState, useEffect, useRef } from "react";
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
  sedeId?: string | null;
}

export default function CreateCitaModal({
  open,
  onClose,
  onCreated,
  barberos,
  servicios,
  apiUrl,
  sedeId,
}: CreateCitaModalProps) {
    // CAMPOS BÁSICOS
  const [newBarbero, setNewBarbero] = useState("");
  const [selectedServicios, setSelectedServicios] = useState<any[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("09:00");

  const [newNombre, setNewNombre] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");

  const [clienteId, setClienteId] = useState<string | null>(null);

  const [searchCliente, setSearchCliente] = useState("");
  const [clientes, setClientes] = useState<any[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [errors, setErrors] = useState({
    nombre: "",
    whatsapp: "",
    servicios: "",
  });

  useEffect(() => {
    if (open) {
      setNewDate(new Date().toISOString().slice(0, 10));
      setNewTime("09:00");
      setSearchCliente("");
      setClientes([]);
      setActiveIndex(-1);
      setClienteId(null);
      setErrors({ nombre: "", whatsapp: "", servicios: "" });
    }
  }, [open]);

  useEffect(() => {
    if (searchCliente.trim().length < 2) {
      setClientes([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoadingClientes(true);
        const res = await fetch(
          `${apiUrl}/api/citas/clientes/buscar?q=${encodeURIComponent(
            searchCliente
          )}`
        );
        const data = await res.json();
        setClientes(Array.isArray(data) ? data : []);
        setActiveIndex(-1);
      } catch {
        setClientes([]);
      } finally {
        setLoadingClientes(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchCliente, apiUrl]);

  const resetForm = () => {
    setNewBarbero("");
    setSelectedServicios([]);
    setNewDate(new Date().toISOString().slice(0, 10));
    setNewTime("09:00");

    setNewNombre("");
    setNewEmail("");
    setNewWhatsapp("");

    setClienteId(null);

    setSearchCliente("");
    setClientes([]);
    setActiveIndex(-1);

    setErrors({ nombre: "", whatsapp: "", servicios: "" });
  };


  /* =========================
     HANDLERS
  ========================= */

  const onKeyDownSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!clientes.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % clientes.length);
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + clientes.length) % clientes.length);
    }

    if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      seleccionarCliente(clientes[activeIndex]);
    }

    if (e.key === "Escape") {
      setClientes([]);
      setActiveIndex(-1);
    }
  };

  const seleccionarCliente = (c: any) => {
    setNewNombre(c.nombre || "");
    setNewWhatsapp(c.telefono || "");
    setNewEmail(c.email || "");
    setClienteId(c.id ?? null);

    setSearchCliente("");
    setClientes([]);
    setActiveIndex(-1);
  };

  const validar = () => {
    let ok = true;
    let errs: any = { nombre: "", whatsapp: "", servicios: "" };

    if (newNombre.trim().length < 2) {
      errs.nombre = "El nombre es obligatorio.";
      ok = false;
    }

    if (!/^[0-9]{7,15}$/.test(newWhatsapp)) {
      errs.whatsapp = "Debe ser un número válido.";
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
    if (!newBarbero || !newDate || !newTime) return;

    const local = new Date(`${newDate}T${newTime}:00-05:00`);

    const body: any = {
      sedeId,
      barberoId: newBarbero,
      servicios: selectedServicios.map((s) => s.id),
      fechaHora: local.toISOString(),
      nombreCliente: newNombre,
      emailCliente: newEmail || null,
      whatsappCliente: newWhatsapp,
    };

    if (clienteId) {
      body.clienteId = clienteId;
    }

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

  /* =========================
     RENDER
  ========================= */

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Crear nueva cita
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* BARBERO */}
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={newBarbero}
            onChange={(e) => setNewBarbero(e.target.value)}
          >
            <option value="">Selecciona barbero...</option>
            {barberos.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre} {b.apellido}
              </option>
            ))}
          </select>

          {/* SERVICIOS */}
          <select
            className="w-full border rounded-lg px-3 py-2"
            onChange={(e) => {
              addServicio(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="">Agregar servicio...</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} – {s.duracion} min / ${s.precio}
              </option>
            ))}
          </select>
          {/* SERVICIOS SELECCIONADOS */}
          {selectedServicios.length > 0 && (
            <div className="space-y-2">
              {selectedServicios.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-semibold">{s.nombre}</div>
                    <div className="text-xs text-gray-500">
                      {s.duracion} min · ${s.precio}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeServicio(s.id)}
                    className="text-red-600 text-sm font-bold hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {errors.servicios && (
            <p className="text-red-600 text-xs">{errors.servicios}</p>
          )}

          {/* FECHA */}
          <div>
            <label className="text-sm font-semibold">Fecha</label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>

          {/* HORA */}
          <div>
            <label className="text-sm font-semibold">Hora</label>
            <input
              type="time"
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </div>

          <hr />

          {/* BUSCADOR CLIENTE */}
          <div className="relative">
            <label className="text-sm font-semibold">
              Buscar cliente existente
            </label>

            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 mt-1"
              placeholder="Nombre o teléfono"
              value={searchCliente}
              onChange={(e) => setSearchCliente(e.target.value)}
              onKeyDown={onKeyDownSearch}
            />

            {loadingClientes && (
              <div className="text-xs text-gray-500 mt-1">Buscando…</div>
            )}

            {clientes.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow max-h-40 overflow-y-auto"
              >
                {clientes.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => seleccionarCliente(c)}
                    className={`w-full text-left px-3 py-2 text-sm ${i === activeIndex
                      ? "bg-gray-200"
                      : "hover:bg-gray-100"
                      }`}
                  >
                    <div className="font-semibold">{c.nombre}</div>
                    <div className="text-xs text-gray-500">
                      {c.telefono}
                      {c.source === "clientes" && (
                        <span className="ml-2 text-[10px] text-emerald-600 font-semibold">
                          • Registrado
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DATOS CLIENTE */}
          <input
            type="text"
            placeholder="Nombre *"
            className="w-full border rounded-lg px-3 py-2"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
          />

          <input
            type="text"
            placeholder="Teléfono *"
            className="w-full border rounded-lg px-3 py-2"
            value={newWhatsapp}
            onChange={(e) => setNewWhatsapp(e.target.value)}
          />

          <input
            type="email"
            placeholder="Correo (opcional)"
            className="w-full border rounded-lg px-3 py-2"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />

          {/* BOTONES */}
          <div className="flex gap-3 pt-4">
            <button
              disabled={isSubmitDisabled}
              onClick={crearCita}
              className={`flex-1 py-2 rounded-lg text-white font-semibold ${isSubmitDisabled
                ? "bg-gray-400"
                : "bg-indigo-600 hover:bg-indigo-700"
                }`}
            >
              Crear
            </button>

            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1 bg-gray-200 py-2 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
