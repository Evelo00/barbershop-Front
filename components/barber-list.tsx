import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User, Star } from 'lucide-react';

interface Barber {
    id: string;
    nombre: string;
}

interface BarberListProps {
    barbers: Barber[];
    onSelect: (barberId: string) => void;
    selectedBarberId: string | null;
}

export function BarberList({ barbers, onSelect, selectedBarberId }: BarberListProps) {

    if (!barbers || barbers.length === 0) {
        return <p className="text-center text-muted-foreground">No hay barberos disponibles para agendar.</p>;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">

            <Card
                key="any"
                className={cn(
                    "p-4 flex flex-col items-center cursor-pointer transition-all border-dashed border-gray-400 hover:bg-primary/10",
                    {
                        "border-2 border-primary ring-2 ring-primary/50": selectedBarberId === 'any',
                        "opacity-70": selectedBarberId && selectedBarberId !== 'any'
                    }
                )}
                onClick={() => onSelect('any')}
            >
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                    <User className="w-8 h-8 text-primary" />
                </div>
                <p className="font-semibold text-center text-sm">Cualquiera</p>
                <p className="text-xs text-muted-foreground mt-1">(Barbero libre)</p>
            </Card>

            {barbers.map((barber) => (
                <Card
                    key={barber.id}
                    className={cn(
                        "p-4 flex flex-col items-center cursor-pointer transition-all hover:bg-primary/10",
                        {
                            "border-2 border-primary ring-2 ring-primary/50": barber.id === selectedBarberId,
                            "opacity-70": selectedBarberId && barber.id !== selectedBarberId
                        }
                    )}
                    onClick={() => onSelect(barber.id)}
                >
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                        <User className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="font-semibold text-center text-sm">{barber.nombre}</p>
                    <div className="flex items-center text-xs text-yellow-500 mt-1">
                        <Star className="w-3 h-3 fill-yellow-500 mr-1" />
                        <span>4.8</span>
                    </div>
                </Card>
            ))}
        </div>
    );
}