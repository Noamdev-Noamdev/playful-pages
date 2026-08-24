import * as React from "react";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange as DateRangeType } from "react-day-picker";

interface DateRangePickerProps {
  dateRange: { from: string; to: string };
  onChange: (range: { from: string; to: string }) => void;
}

export function DateRangePicker({ dateRange, onChange }: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRangeType | undefined>({
    from: new Date(dateRange.from),
    to: new Date(dateRange.to),
  });

  const handleSelect = (newDate: DateRangeType | undefined) => {
    setDate(newDate);
    if (newDate?.from && newDate?.to) {
      onChange({
        from: format(newDate.from, "yyyy-MM-dd"),
        to: format(newDate.to, "yyyy-MM-dd"),
      });
    }
  };

  const setPreset = (days: number, months: number = 0) => {
    const today = new Date();
    const from = months > 0 ? subMonths(today, months) : subDays(today, days);
    const newDate = { from: startOfDay(from), to: endOfDay(today) };
    setDate(newDate);
    onChange({
      from: format(newDate.from, "yyyy-MM-dd"),
      to: format(newDate.to, "yyyy-MM-dd"),
    });
  };

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-[260px] sm:w-[300px] justify-start text-left font-normal border-2 border-foreground rounded-xl shadow-[2px_2px_0_0_var(--foreground)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--foreground)] transition-all",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "MMM d, yyyy")} - {format(date.to, "MMM d, yyyy")}
                </>
              ) : (
                format(date.from, "MMM d, yyyy")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 border-2 border-foreground rounded-xl shadow-[4px_4px_0_0_var(--foreground)]"
          align="end"
        >
          <div className="flex items-center gap-2 p-3 border-b-2 border-foreground/10 bg-muted/30">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreset(0)}
              className="rounded-lg border-2 border-foreground shadow-[2px_2px_0_0_var(--foreground)]"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreset(7)}
              className="rounded-lg border-2 border-foreground shadow-[2px_2px_0_0_var(--foreground)]"
            >
              7D
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreset(30)}
              className="rounded-lg border-2 border-foreground shadow-[2px_2px_0_0_var(--foreground)]"
            >
              30D
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreset(0, 12)}
              className="rounded-lg border-2 border-foreground shadow-[2px_2px_0_0_var(--foreground)]"
            >
              12M
            </Button>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
