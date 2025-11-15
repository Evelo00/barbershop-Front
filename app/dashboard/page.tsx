"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (!userData) {
      router.push("/login");
      return;
    }

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
