"use client";

import React, { useState, useEffect } from "react";
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

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

const customColors = {
  "barber-dark": "#2A2A2A",
};

// HORARIOS FIJOS
const ALL_TIME_SLOTS = [
  { display: "9:00 am", value: "09:00" },
  { display: "9:30 am", value: "09:30" },
  { display: "10:00 am", value: "10:00" },
  { display: "10:30 am", value: "10:30" },
  { display: "11:00 am", value: "11:00" },
  { display: "11:30 am", value: "11:30" },
  { display: "12:00 pm", value: "12:00" },
  { display: "12:30 pm", value: "12:30" },
  { display: "1:00 pm", value: "13:00" },
  { display: "1:30 pm", value: "13:30" },
  { display: "2:00 pm", value: "14:00" },
  { display: "2:30 pm", value: "14:30" },
  { display: "3:00 pm", value: "15:00" },
  { display: "3:30 pm", value: "15:30" },
  { display: "4:00 pm", value: "16:00" },
  { display: "4:30 pm", value: "16:30" },
  { display: "5:00 pm", value: "17:00" },
  { display: "5:30 pm", value: "17:30" },
  { display: "6:00 pm", value: "18:00" },
  { display: "6:30 pm", value: "18:30" },
  { display: "7:00 pm", value: "19:00" },
  { display: "7:30 pm", value: "19:30" },
  { display: "8:00 pm", value: "20:00" },
  { display: "8:30 pm", value: "20:30" },
];

const View5Page: React.FC = () => {
  const router = { push: (path: string) => (window.location.href = path) };

  const [service, setService] = useState<Service | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [barberName, setBarberName] = useState<string | null>(null);

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

  // Load service + barber
  useEffect(() => {
    const s = localStorage.getItem("abalvi_reserva_servicio");
    const b = localStorage.getItem("abalvi_reserva_barbero");
    const bname = localStorage.getItem("abalvi_reserva_barbero_nombre");

    if (s) setService(JSON.parse(s));
    if (b) setBarberId(b);
    if (bname) setBarberName(bname);
  }, []);

  // Fetch available hours
  const fetchAvailable = async (day: Date) => {
    if (!service || !barberId) return;

    setLoadingSlots(true);
    setAvailableSlots([]);

    try {
      const dateStr = format(day, "yyyy-MM-dd");

      const res = await fetch(
        `${API_BASE_URL}/api/citas/availability?date=${dateStr}&serviceDuration=${service.duration}&barberoId=${barberId}`
      );

      const data = await res.json();
      setAvailableSlots(data.availableSlots || []);
    } catch (err) {
      console.error(err);
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

  // const handleFinalize = async () => {
  //   if (!selectedDate || !selectedTime || !service || !barberId) {
  //     showMessage("Selecciona fecha y hora.");
  //     return;
  //   }

  //   const dateStr = format(selectedDate, "yyyy-MM-dd");

  //   const fechaBogota = new Date(`${dateStr}T${selectedTime}:00-05:00`);

  //   const fechaHoraUTC = fechaBogota.toISOString();

  //   console.log("🕒 Bogotá local:", fechaBogota.toString());
  //   console.log("🌎 Enviando UTC:", fechaHoraUTC);

  //   const clientData = JSON.parse(
  //     localStorage.getItem("abalvi_reserva_cliente") || "{}"
  //   );

  //   const body = {
  //     clienteId: null,
  //     barberoId: barberId,
  //     servicioId: service.id,
  //     fechaHora: fechaHoraUTC,
  //     precioFinal: service.price,
  //     nombreCliente: clientData.nombre || null,
  //     emailCliente: clientData.correo || null,
  //     whatsappCliente: clientData.whatsapp || null,
  //     notas: null,
  //   };

  //   try {
  //     const res = await fetch(`${API_BASE_URL}/api/citas/public`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(body),
  //     });

  //     if (res.status === 409) {
  //       showMessage("Ese turno ya está ocupado.");
  //       fetchAvailable(selectedDate);
  //       return;
  //     }

  //     if (!res.ok) throw new Error("Error al crear cita.");

  //     showMessage("Cita creada!");
  //     setTimeout(() => router.push("/view6"), 900);
  //   } catch (err) {
  //     console.error(err);
  //     showMessage("Error al agendar la cita");
  //   }
  // };
  const handleFinalize = async () => {
    if (!selectedDate || !selectedTime || !service || !barberId) {
      showMessage("Selecciona fecha y hora.");
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    // 👉 FECHA LOCAL SIN CONVERSION A UTC
    const fechaHora = `${dateStr}T${selectedTime}:00-05:00`;

    console.log("🕒 Enviando hora local:", fechaHora);

    const clientData = JSON.parse(
      localStorage.getItem("abalvi_reserva_cliente") || "{}"
    );

    const body = {
      clienteId: null,
      barberoId: barberId,
      servicioId: service.id,
      fechaHora, // 👉 ENVIAMOS HORA LOCAL
      precioFinal: service.price,
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

      if (!res.ok) throw new Error("Error al crear cita.");

      showMessage("Cita creada!");
      setTimeout(() => router.push("/view6"), 900);
    } catch (err) {
      console.error(err);
      showMessage("Error al agendar la cita");
    }
  };

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
      <div className="p-6 pb-16 rounded-b-[40px]" style={{ background: customColors["barber-dark"] }}>
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

  return (
    <div className="w-full min-h-screen flex justify-center bg-gray-100">
      <div className="w-full max-w-sm md:max-w-2xl bg-white shadow-xl min-h-screen">
        {renderCalendar()}

        {/* HORARIOS */}
        <div className="relative -top-10 px-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-center mb-4">ELIGE LA HORA</h3>

            {loadingSlots ? (
              <p className="text-center text-gray-500">Cargando horarios...</p>
            ) : !selectedDate ? (
              <p className="text-center text-gray-500">Selecciona una fecha.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {ALL_TIME_SLOTS.filter((slot) =>
                  availableSlots.includes(slot.value)
                ).map((slot) => {
                  const isSelected = selectedTime === slot.value;

                  return (
                    <button
                      key={slot.value}
                      className={`py-3 rounded-lg font-semibold text-sm transition
                        ${isSelected
                          ? "bg-black text-white shadow-lg scale-[1.03]"
                          : "bg-white border border-gray-400 hover:bg-gray-100"
                        }`}
                      onClick={() => setSelectedTime(slot.value)}
                    >
                      {slot.display}
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
            <span className="font-semibold">Barbero:</span> {barberName} |
            <span className="font-semibold"> Servicio:</span> {service?.name} – $
            {service?.price?.toLocaleString("es-CO")}
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
