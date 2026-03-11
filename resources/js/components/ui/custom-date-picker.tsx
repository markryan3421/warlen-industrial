import { format, parse } from "date-fns"
import * as React from "react"
import InputError from "@/components/input-error"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface FormDatePickerProps {
  value: string  // expects YYYY-MM-DD
  onChange: (value: string) => void
  error?: string
  id?: string
  label?: string
}

export function CustomDatePicker({
  value,
  onChange,
  error,
  id = "date-picker",
  label = "Effective From",
}: FormDatePickerProps) {
  // Convert string to Date for the calendar
  const date = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Convert Date back to YYYY-MM-DD string
      onChange(format(selectedDate, "yyyy-MM-dd"))
    } else {
      onChange("")
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            className="w-full justify-start font-normal"
          >
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            defaultMonth={date}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && <InputError message={error} />}
    </div>
  )
}