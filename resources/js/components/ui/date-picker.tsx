import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, ChevronDownIcon } from "lucide-react"

interface DatePickerProps {
    value?: string | null
    onChange?: (date: string) => void
    placeholder?: string
    disabled?: boolean
    minDate?: Date
    maxDate?: Date
    className?: string
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Select a date",
    disabled = false,
    minDate,
    maxDate,
    className = "",
}: DatePickerProps) {
    // Convert the string value to a Date object
    const dateValue = value ? new Date(value) : undefined

    const handleSelect = (selectedDate: Date | undefined) => {
        if (selectedDate && onChange) {
            // Convert to YYYY-MM-DD for backend
            const formatted = format(selectedDate, "yyyy-MM-dd")
            onChange(formatted)
        } else if (!selectedDate && onChange) {
            onChange("")
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={`w-full justify-between text-left font-normal rounded-xl border-2 border-border bg-background hover:bg-muted/50 ${!value ? "text-muted-foreground" : "text-foreground"
                        } ${className}`}
                >
                    <span className="truncate">
                        {value ? format(new Date(value), "PPP") : placeholder}
                    </span>
                    <CalendarIcon className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={dateValue}
                    onSelect={handleSelect}
                    disabled={(date) => {
                        if (minDate && date < minDate) return true
                        if (maxDate && date > maxDate) return true
                        return false
                    }}
                    defaultMonth={dateValue}
                />
            </PopoverContent>
        </Popover>
    )
}