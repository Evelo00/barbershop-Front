"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (!userData) {
      // Si no hay usuario logueado, redirigimos directamente a la página de agendamiento público.
      // Esto implementa el "agendamiento como ventana principal para el cliente" sin login.
      router.replace("/booking-publica"); // Usa una nueva ruta para el flujo de agendamiento
      return;
    }

    // Si hay usuario logueado, se mantiene la lógica de redirección por rol
    const user = JSON.parse(userData);
    const rol = user.rol;

    switch (rol) {
      case "superadmin":
        router.replace("/dashboard/admin");
        break;

      case "barbero":
        router.replace("/dashboard/barbero");
        break;

      case "caja":
        router.replace("/dashboard/caja");
        break;

      case "cliente":
      default:
        // Los clientes logueados pueden ver su dashboard si existe, o ir a la vista pública.
        router.replace("/dashboard/cliente");
        break;
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg text-muted-foreground">Cargando dashboard...</p>
    </div>
  );
}