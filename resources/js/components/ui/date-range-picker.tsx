import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Calendar, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface DateRangePickerProps {
    value?: { start: Date; end: Date };
    onChange?: (range: { start: Date; end: Date } | undefined) => void;
    className?: string;
}

export default function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
    // Convert internal state to react-day-picker format (from / to)
    const range = value ? { from: value.start, to: value.end } : undefined;

    const handleSelect = (selectedRange: { from?: Date; to?: Date } | undefined) => {
        if (selectedRange?.from && selectedRange?.to) {
            onChange?.({ start: selectedRange.from, end: selectedRange.to });
        } else {
            onChange?.(undefined);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'justify-start px-2.5 font-normal w-full sm:w-auto',
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? (
                        <>
                            {format(value.start, 'LLL dd, y')} - {format(value.end, 'LLL dd, y')}
                        </>
                    ) : (
                        <span>Pick a date range</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="range"
                    defaultMonth={value?.start}
                    selected={range}
                    onSelect={handleSelect}
                    numberOfMonths={2}
                />
            </PopoverContent>
        </Popover>
    );
}