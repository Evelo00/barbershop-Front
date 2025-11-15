"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuth(requiredRole?: string) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (!userData) {
      router.push("/login");
      return;
    }

    const parsed = JSON.parse(userData);

    if (requiredRole && parsed.rol !== requiredRole) {
      router.push("/dashboard");
      return;
    }

    setUser(parsed);
  }, [requiredRole, router]);

  return user;
}
