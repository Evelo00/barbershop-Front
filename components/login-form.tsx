"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Scissors } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = "http://localhost:3000/api"

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    correo: "",
    contraseña: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Fetch all users and find matching credentials
      const response = await fetch(`${API_BASE_URL}/users`)

      if (!response.ok) {
        throw new Error("Error al conectar con el servidor")
      }

      const users = await response.json()
      const user = users.find((u: any) => u.correo === formData.correo && u.contraseña === formData.contraseña)

      if (user) {
        localStorage.setItem("user", JSON.stringify(user))
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente",
        })
        router.push("/dashboard")
      } else {
        toast({
          title: "Error",
          description: "Correo o contraseña incorrectos",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-4">
        <div className="flex justify-center">
          <div className="bg-primary text-primary-foreground p-4 rounded-full">
            <Scissors className="w-8 h-8" />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="correo">Correo Electrónico</Label>
            <Input
              id="correo"
              type="email"
              placeholder="tu@email.com"
              value={formData.correo}
              onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contraseña">Contraseña</Label>
            <Input
              id="contraseña"
              type="password"
              placeholder="••••••••"
              value={formData.contraseña}
              onChange={(e) => setFormData({ ...formData, contraseña: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Regístrate aquí
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
