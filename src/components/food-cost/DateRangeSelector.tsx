
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange as ReactDayPickerDateRange } from 'react-day-picker';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangeSelectorProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DateRangeSelector = ({
  dateRange,
  onDateRangeChange,
  open,
  onOpenChange
}: DateRangeSelectorProps) => {
  const handleClearDates = () => {
    onDateRangeChange({ from: undefined, to: undefined });
  };

  const handleDateSelect = (range: ReactDayPickerDateRange | undefined) => {
    onDateRangeChange({
      from: range?.from,
      to: range?.to
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy")
              )
            ) : (
              <span>Seleziona intervallo date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={dateRange.from}
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      
      {(dateRange.from || dateRange.to) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearDates}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default DateRangeSelector;
