import { DayPicker, DayPickerProps } from "react-day-picker";

export default function Calendar(props: DayPickerProps) {
    return (
        <DayPicker
            className="p-3" // Añade estilos base
            classNames={{
                month: "space-y-4",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                // ... Añade aquí todas las clases de tu Calendar de shadcn/ui
            }}
            {...props}
        />
    );
}