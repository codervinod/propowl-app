"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
  value?: string; // Format: YYYY-MM
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxDate?: Date;
}

export function MonthPicker({
  value,
  onChange,
  placeholder = "Select month",
  disabled = false,
  maxDate = new Date(),
}: MonthPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentYear, setCurrentYear] = React.useState(new Date().getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Parse current value (value format is YYYY-MM)
  const selectedDate = value ? (() => {
    const [year, month] = value.split('-').map(Number);
    return new Date(year, month - 1, 1); // month - 1 because Date() expects 0-indexed months
  })() : null;
  const selectedMonth = selectedDate?.getMonth(); // This will be 0-indexed
  const selectedYear = selectedDate?.getFullYear();

  // Format display value
  const displayValue = selectedDate
    ? `${months[selectedMonth!]} ${selectedYear}`
    : placeholder;

  const handleMonthSelect = (monthIndex: number) => {
    const newValue = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    onChange?.(newValue);
    setIsOpen(false);
  };

  const isMonthDisabled = (monthIndex: number) => {
    const monthDate = new Date(currentYear, monthIndex, 1);
    return monthDate > maxDate;
  };

  const goToPreviousYear = () => {
    setCurrentYear(prev => prev - 1);
  };

  const goToNextYear = () => {
    setCurrentYear(prev => prev + 1);
  };

  const isNextYearDisabled = () => {
    return currentYear >= maxDate.getFullYear();
  };

  const isPreviousYearDisabled = () => {
    return currentYear <= 2000; // Reasonable lower bound
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3">
          {/* Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousYear}
              disabled={isPreviousYearDisabled()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-lg font-semibold">
              {currentYear}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextYear}
              disabled={isNextYearDisabled()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => {
              const isSelected = selectedYear === currentYear && selectedMonth === index;
              const isDisabled = isMonthDisabled(index);

              return (
                <Button
                  key={month}
                  variant={isSelected ? "default" : "ghost"}
                  className={cn(
                    "h-9 text-sm font-normal",
                    isSelected && "bg-primary text-primary-foreground",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => !isDisabled && handleMonthSelect(index)}
                  disabled={isDisabled}
                >
                  {month.substring(0, 3)}
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}