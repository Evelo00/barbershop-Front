"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AgregarClienteProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (cliente: any) => void;
  apiUrl: string;
}

export default function AgregarCliente({
  open,
  onClose,
  onCreated,
  apiUrl,
}: AgregarClienteProps) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setNombre("");
    setTelefono("");
    setEmail("");
    setError(null);
    setLoading(false);
  };

  const cerrar = () => {
    reset();
    onClose();
  };

  const validar = () => {
    if (nombre.trim().length < 2) {
      setError("El nombre es obligatorio.");
      return false;
    }

    if (!/^[0-9]{7,15}$/.test(telefono)) {
      setError("El teléfono debe contener solo números (7 a 15 dígitos).");
      return false;
    }

    return true;
  };

  const crearCliente = async () => {
    if (!validar()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          telefono,
          email: email || null,
        }),
      });

      if (res.status === 409) {
        setError("Ya existe un cliente con este teléfono.");
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error();

      const cliente = await res.json();

      onCreated?.(cliente);
      cerrar();
    } catch {
      setError("No se pudo crear el cliente.");
      setLoading(false);
    }
  };

  const isDisabled =
    loading ||
    nombre.trim().length < 2 ||
    !/^[0-9]{7,15}$/.test(telefono);

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent
        className="max-w-sm"
        onInteractOutside={cerrar}
        onEscapeKeyDown={cerrar}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Agregar cliente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Nombre */}
          <input
            type="text"
            placeholder="Nombre *"
            className="w-full border rounded-lg px-3 py-2"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          {/* Teléfono */}
          <input
            type="text"
            placeholder="Teléfono *"
            className="w-full border rounded-lg px-3 py-2"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />

          {/* Email */}
          <input
            type="email"
            placeholder="Correo (opcional)"
            className="w-full border rounded-lg px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-3">
            <button
              disabled={isDisabled}
              onClick={crearCliente}
              className={`flex-1 py-2 rounded-lg text-white font-semibold transition
                ${
                  isDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }
              `}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>

            <button
              onClick={cerrar}
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
