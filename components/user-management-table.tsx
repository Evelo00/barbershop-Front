"use client";

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// --- INTERFACES ---
interface UserData {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: "superadmin" | "caja" | "barbero" | "cliente";
  activo: boolean;
  telefono: string;
}

interface UserManagementTableProps {
  users: UserData[];
  onUserUpdate: (userId: string, updates: Partial<UserData>) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const ROLES = ["cliente", "barbero", "caja", "superadmin"];

// --- COMPONENTE PRINCIPAL ---
export default function UserManagementTable({ users, onUserUpdate, onRefresh }: UserManagementTableProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // ID del usuario que se está actualizando

  // Función para obtener el color del rol
  const getRoleVariant = (rol: string) => {
    switch (rol) {
      case "superadmin":
        return "bg-red-600 text-white hover:bg-red-700";
      case "barbero":
        return "bg-blue-500 text-white hover:bg-blue-600";
      case "caja":
        return "bg-green-500 text-white hover:bg-green-600";
      case "cliente":
      default:
        return "bg-gray-300 text-gray-800 hover:bg-gray-400";
    }
  };

  // Manejador de cambio de rol
  const handleRoleChange = async (userId: string, newRol: string) => {
    setIsUpdating(userId);
    try {
      await onUserUpdate(userId, { rol: newRol as UserData["rol"] });
    } finally {
      setIsUpdating(null);
    }
  };

  // Manejador de cambio de estado activo
  const handleStatusToggle = async (user: UserData) => {
    setIsUpdating(user.id);
    try {
      // Invertir el estado 'activo'
      await onUserUpdate(user.id, { activo: !user.activo });
    } finally {
      setIsUpdating(null);
    }
  };
  
  // No mostrar al Superadmin actualmente logueado para evitar que se desactive a sí mismo
  const filteredUsers = users.filter(user => user.email !== localStorage.getItem('userEmail'));


  return (
    <div className="relative border rounded-lg shadow-md overflow-x-auto">
      <div className="flex justify-end p-4 bg-white">
        <Button onClick={onRefresh} variant="outline" className="flex items-center">
          <RotateCcw className="w-4 h-4 mr-2" />
          Refrescar Lista
        </Button>
      </div>
      <Table className="min-w-full divide-y divide-gray-200">
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[100px] text-left">ID</TableHead>
            <TableHead className="text-left">Nombre Completo</TableHead>
            <TableHead className="text-left">Email</TableHead>
            <TableHead className="text-center">Rol</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-gray-50 transition-colors">
              <TableCell className="font-mono text-xs text-gray-500">{user.id.substring(0, 8)}...</TableCell>
              <TableCell className="font-medium">
                {user.nombre} {user.apellido}
              </TableCell>
              <TableCell className="text-sm">{user.email}</TableCell>
              
              {/* Selector de Rol */}
              <TableCell className="text-center">
                <Select
                  value={user.rol}
                  onValueChange={(newRol) => handleRoleChange(user.id, newRol)}
                  disabled={isUpdating === user.id}
                >
                  <SelectTrigger className={`w-[120px] h-8 text-xs ${getRoleVariant(user.rol)} border-none text-white`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((rol) => (
                      <SelectItem key={rol} value={rol} className="capitalize">
                        {rol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>

              {/* Estado Activo */}
              <TableCell className="text-center">
                <Badge variant="outline" className={`capitalize ${user.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {user.activo ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>

              {/* Botón de Toggle */}
              <TableCell className="text-center">
                <Button
                  variant={user.activo ? "destructive" : "default"}
                  size="sm"
                  onClick={() => handleStatusToggle(user)}
                  disabled={isUpdating === user.id || user.rol === 'superadmin'} // Proteger al Superadmin
                  className="h-8"
                >
                  {isUpdating === user.id ? 'Cargando...' : user.activo ? <X className="w-4 h-4 mr-1"/> : <Check className="w-4 h-4 mr-1"/>}
                  {user.activo ? "Desactivar" : "Activar"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}