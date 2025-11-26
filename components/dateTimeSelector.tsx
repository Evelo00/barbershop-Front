import { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

import DateCalendar from '@/components/ui/date-picker-base';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface DateTimeSelectorProps {
    selectedServiceId: string | null;
    selectedBarberId: string | 'any' | null;
    serviceDuration: number;
    onSelectDateTime: (date: Date, timeSlot: string) => void;
    selectedDate: Date | undefined;
    selectedTimeSlot: string | null;
}

export function DateTimeSelector({
    selectedServiceId,
    selectedBarberId,
    serviceDuration,
    onSelectDateTime,
    selectedDate,
    selectedTimeSlot,
}: DateTimeSelectorProps) {
    const [availableTimes, setAvailableTimes] = useState<string[]>([]);
    const [isLoadingTimes, setIsLoadingTimes] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAvailableTimes = useCallback(async (date: Date) => {
        if (!selectedServiceId) return;

        setIsLoadingTimes(true);
        setError(null);
        setAvailableTimes([]);

        try {
            const formattedDate = format(date, 'yyyy-MM-dd');

            const params = new URLSearchParams({
                date: formattedDate,
                duration: String(serviceDuration),
                ...(selectedBarberId && selectedBarberId !== 'any' && { barberId: selectedBarberId })
            }).toString();

            const res = await fetch(`${API_BASE_URL}/api/citas/availability?${params}`);

            if (!res.ok) {
                const contentType = res.headers.get("content-type");
                let errorMessage = `Error ${res.status}`;
                if (contentType?.includes("application/json")) {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await res.json();
            setAvailableTimes(data.availableSlots || []);

        } catch (err: any) {
            setError(err.message || 'Fallo la conexión con el servidor de disponibilidad.');
        } finally {
            setIsLoadingTimes(false);
        }
    }, [selectedServiceId, selectedBarberId, serviceDuration]);

    useEffect(() => {
        if (selectedDate) {
            fetchAvailableTimes(selectedDate);
        }
    }, [selectedDate, fetchAvailableTimes]);

    const handleDateSelect = (date: Date | undefined) => {
        if (date) onSelectDateTime(date, '');
    };

    const minDate = startOfDay(new Date());

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                        <CalendarIcon className="w-5 h-5 mr-2 text-primary" />
                        1. Elige una Fecha
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center p-0">
                    <DateCalendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        initialFocus
                        className="rounded-md border shadow"
                        locale={es}
                        disabled={(date: Date) => date < minDate}
                    />
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                        <Loader2 className="w-5 h-5 mr-2 text-primary" />
                        2. Elige una Hora
                    </CardTitle>
                    {selectedDate && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Disponibilidad para: <span className="font-semibold">{format(selectedDate, 'PPP', { locale: es })}</span>
                        </p>
                    )}
                </CardHeader>
                <CardContent className="h-[300px] p-4">
                    {!selectedDate && (
                        <div className="text-center text-muted-foreground pt-12">
                            Por favor, selecciona una fecha primero.
                        </div>
                    )}

                    {selectedDate && isLoadingTimes && (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
                            Cargando disponibilidad...
                        </div>
                    )}

                    {selectedDate && error && !isLoadingTimes && (
                        <p className="text-center text-red-500 pt-12">{error}</p>
                    )}

                    {selectedDate && !isLoadingTimes && !error && availableTimes.length > 0 && (
                        <ScrollArea className="h-full pr-4">
                            <div className="grid grid-cols-3 gap-3">
                                {availableTimes.map((timeSlot) => (
                                    <Button
                                        key={timeSlot}
                                        variant={timeSlot === selectedTimeSlot ? 'default' : 'outline'}
                                        className={cn(
                                            "font-semibold",
                                            timeSlot !== selectedTimeSlot && "text-primary hover:bg-primary/10"
                                        )}
                                        onClick={() => selectedDate && onSelectDateTime(selectedDate, timeSlot)}
                                    >
                                        {timeSlot}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    )}

                    {selectedDate && !isLoadingTimes && !error && availableTimes.length === 0 && (
                        <div className="text-center text-red-600 pt-12">
                            😞 No hay horarios disponibles para el {format(selectedDate, 'PPP', { locale: es })}.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
