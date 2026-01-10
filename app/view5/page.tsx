"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isBefore,
} from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, ArrowRight } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const SEDE_KEY = "sedeId";

interface SelectedService {
  id: string;
  name: string;
  price: number;
  duracionMinutos: number;
}

interface ReservationData {
  servicios: SelectedService[];
  duracionTotal: number;
  precioTotal: number;
}

interface TimeSlot {
  display: string;
  value: string;
}

const customColors = { "barber-dark": "#2A2A2A" };

function getScheduleForDay(date: Date) {
  const day = date.getDay();
  if (day === 0) return { start: 10, end: 18.5 };
  if (day >= 1 && day <= 4) return { start: 8, end: 19.5 };
  if (day === 5 || day === 6) return { start: 8, end: 20.5 };
  return { start: 8, end: 19.5 };
}

function generateSlotsFor(date: Date): TimeSlot[] {
  const { start, end } = getScheduleForDay(date);
  const slots: TimeSlot[] = [];

  const endHour = Math.floor(end);
  const endMinute = (end % 1) * 60;

  for (let h = start; h <= endHour; h++) {
    let minutes = [0, 15, 30, 45];
    if (h === endHour) minutes = minutes.filter((m) => m <= endMinute);

    for (let m of minutes) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");

      const displayH = h % 12 || 12;
      const ampm = h < 12 ? "am" : "pm";

      slots.push({
        value: `${hh}:${mm}`,
        display: `${displayH}:${mm} ${ampm}`,
      });
    }
  }

  return slots;
}

const View5Page: React.FC = () => {
  const router = useRouter();

  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [barberName, setBarberName] = useState<string | null>(null);
  const [sedeId, setSedeId] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2600);
  };

  // Cargar datos desde LS
  useEffect(() => {
    const stored = localStorage.getItem("abalvi_reserva_servicio");
    const b = localStorage.getItem("abalvi_reserva_barbero");
    const bname = localStorage.getItem("abalvi_reserva_barbero_nombre");
    const sede = localStorage.getItem(SEDE_KEY);

    if (!sede) {
      router.replace("/");
      return;
    }

    if (stored) setReservation(JSON.parse(stored));
    if (b) setBarberId(b);
    if (bname) setBarberName(bname);
    setSedeId(sede);
  }, [router]);

  if (!reservation || !barberId || !sedeId) return null;

  /* =========================
     DISPONIBILIDAD (MULTISEDE)
  ========================= */
  const fetchAvailable = async (day: Date) => {
    setLoadingSlots(true);
    setAvailableSlots([]);

    try {
      const dateStr = format(day, "yyyy-MM-dd");

      const res = await fetch(
        `${API_BASE_URL}/api/citas/availability?date=${dateStr}&serviceDuration=${reservation.duracionTotal}&barberoId=${barberId}&sedeId=${sedeId}`
      );

      const data = await res.json();
      setAvailableSlots(data.availableSlots || []);
    } catch {
      showMessage("Error cargando horarios.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDaySelect = (day: Date) => {
    setSelectedDate(day);
    setSelectedTime(null);
    fetchAvailable(day);
  };

  const changeMonth = (dir: "prev" | "next") => {
    setCurrentMonth((prev) =>
      dir === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
    setSelectedDate(null);
    setSelectedTime(null);
    setAvailableSlots([]);
  };

  /* =========================
     CREAR CITA (PUBLIC)
  ========================= */
  const handleFinalize = async () => {
    if (!selectedDate || !selectedTime) {
      showMessage("Selecciona fecha y hora.");
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const fechaHora = `${dateStr}T${selectedTime}:00-05:00`;
    localStorage.setItem("abalvi_reserva_fecha_hora", fechaHora);

    const clientData = JSON.parse(
      localStorage.getItem("abalvi_reserva_cliente") || "{}"
    );

    const body = {
      sedeId,
      barberoId: barberId,
      fechaHora,
      servicios: reservation.servicios.map((s) => s.id),
      precioFinal: reservation.precioTotal,
      nombreCliente: clientData.nombre || null,
      emailCliente: clientData.correo || null,
      whatsappCliente: clientData.whatsapp || null,
      notas: null,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/citas/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 409) {
        showMessage("Ese turno ya está ocupado.");
        fetchAvailable(selectedDate);
        return;
      }

      if (!res.ok) throw new Error();

      showMessage("Cita creada!");
      setTimeout(() => router.push("/view6"), 900);
    } catch {
      showMessage("Error al agendar la cita");
    }
  };

  /* =========================
     RENDER CALENDARIO
  ========================= */
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startIndex = (monthStart.getDay() + 6) % 7;
    const daysInMonth = monthEnd.getDate();

    const rows: JSX.Element[] = [];
    let cells: JSX.Element[] = [];

    for (let i = 0; i < startIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );

      const disabled = isBefore(date, new Date().setHours(0, 0, 0, 0));
      const selected = selectedDate && isSameDay(date, selectedDate);

      cells.push(
        <div
          key={day}
          className={`flex items-center justify-center h-10 w-10 text-sm font-semibold rounded-full cursor-pointer transition
            ${disabled
              ? "opacity-30 cursor-not-allowed"
              : selected
                ? "bg-white text-black shadow-lg"
                : "text-white hover:bg-gray-700"
            }
          `}
          onClick={() => !disabled && handleDaySelect(date)}
        >
          {day}
        </div>
      );

      if (((date.getDay() + 6) % 7 === 6) || day === daysInMonth) {
        rows.push(
          <div key={`week-${rows.length}`} className="grid grid-cols-7 gap-1 mb-1">
            {cells}
          </div>
        );
        cells = [];
      }
    }

    return (
      <div
        className="p-6 pb-16 rounded-b-[40px]"
        style={{ background: customColors["barber-dark"] }}
      >
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs tracking-widest text-gray-300">ABALVI BARBER</p>
          <button
            onClick={() => router.push("/view4")}
            className="text-gray-300 text-sm flex items-center hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver
          </button>
        </div>

        <h2 className="text-2xl text-white font-extrabold mb-4 text-center">
          ELIGE LA FECHA
        </h2>

        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => changeMonth("prev")}
            className="text-white text-2xl p-2 hover:bg-gray-700 rounded-full"
          >
            <ArrowLeft />
          </button>

          <span className="text-white font-bold text-lg tracking-wider">
            {format(currentMonth, "MMMM yyyy", { locale: es }).toUpperCase()}
          </span>

          <button
            onClick={() => changeMonth("next")}
            className="text-white text-2xl p-2 hover:bg-gray-700 rounded-full"
          >
            <ArrowRight />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["LU", "MA", "MI", "JU", "VI", "SA", "DO"].map((d) => (
            <div key={d} className="text-gray-300 text-center text-xs font-semibold">
              {d}
            </div>
          ))}
        </div>

        {rows}
      </div>
    );
  };

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return (
    <div className="w-full min-h-screen flex justify-center bg-gray-100">
      <div className="w-full max-w-sm md:max-w-2xl bg-white shadow-xl min-h-screen">

        {renderCalendar()}

        {/* HORARIOS */}
        <div className="relative -top-10 px-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-center mb-4">
              ELIGE LA HORA
            </h3>

            {loadingSlots ? (
              <p className="text-center text-gray-500">Cargando horarios...</p>
            ) : !selectedDate ? (
              <p className="text-center text-gray-500">
                Selecciona una fecha.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {availableSlots
                  .filter((value) => {
                    if (!selectedDate) return true;

                    const today = new Date();
                    const isToday =
                      selectedDate.getFullYear() === today.getFullYear() &&
                      selectedDate.getMonth() === today.getMonth() &&
                      selectedDate.getDate() === today.getDate();

                    if (!isToday) return true;

                    const [h, m] = value.split(":").map(Number);
                    const slotMinutes = h * 60 + m;

                    return slotMinutes > nowMinutes;
                  })
                  .map((value) => {

                    const [h, m] = value.split(":").map(Number);

                    const displayH = h % 12 || 12;
                    const ampm = h < 12 ? "am" : "pm";

                    const display = `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;

                    const isSelected = selectedTime === value;

                    return (
                      <button
                        key={value}
                        onClick={() => setSelectedTime(value)}
                        className={`py-3 rounded-lg font-semibold text-sm transition
          ${isSelected
                            ? "bg-black text-white shadow-lg scale-[1.03]"
                            : "bg-white border border-gray-400 hover:bg-gray-100"
                          }`}
                      >
                        {display}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* INFO */}
        <div className="px-6 -top-2 relative text-center">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Barbero:</span> {barberName}
          </p>

          <p className="text-sm text-gray-600 mt-1">
            <span className="font-semibold">Servicios:</span>{" "}
            {reservation.servicios.map((s) => s.name).join(", ")}
          </p>

          <p className="text-sm text-gray-600 mt-1">
            <span className="font-semibold">Total:</span>{" "}
            ${reservation.precioTotal.toLocaleString("es-CO")}
          </p>

          <p className="text-sm text-gray-600">
            Duración total: {reservation.duracionTotal} min
          </p>
        </div>

        {/* BOTÓN FINAL */}
        <div className="p-6 relative -top-2">
          <button
            onClick={handleFinalize}
            disabled={!selectedTime}
            className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-50"
            style={{ background: customColors["barber-dark"] }}
          >
            Agendar
          </button>
        </div>
      </div>

      {message && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white px-6 py-3 rounded-full shadow-lg"
          style={{ background: customColors["barber-dark"] }}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default View5Page;
