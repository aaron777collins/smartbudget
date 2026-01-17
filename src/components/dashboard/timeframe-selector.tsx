"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TimeframePeriod =
  | "today"
  | "this-week"
  | "last-7-days"
  | "this-month"
  | "last-30-days"
  | "this-quarter"
  | "this-year"
  | "last-12-months"
  | "all-time"
  | "custom";

export interface TimeframeValue {
  period: TimeframePeriod;
  startDate?: Date;
  endDate?: Date;
}

interface TimeframeSelectorProps {
  value: TimeframeValue;
  onChange: (value: TimeframeValue) => void;
  className?: string;
}

const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "this-week", label: "This Week" },
  { value: "last-7-days", label: "Last 7 Days" },
  { value: "this-month", label: "This Month" },
  { value: "last-30-days", label: "Last 30 Days" },
  { value: "this-quarter", label: "This Quarter" },
  { value: "this-year", label: "This Year" },
  { value: "last-12-months", label: "Last 12 Months" },
  { value: "all-time", label: "All Time" },
  { value: "custom", label: "Custom Range" },
] as const;

export function TimeframeSelector({
  value,
  onChange,
  className
}: TimeframeSelectorProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [customDateRange, setCustomDateRange] = React.useState<{
    from?: Date;
    to?: Date;
  }>({
    from: value.startDate,
    to: value.endDate,
  });

  const handlePeriodChange = (newPeriod: TimeframePeriod) => {
    if (newPeriod === "custom") {
      // Keep custom dates if they exist
      onChange({
        period: newPeriod,
        startDate: customDateRange.from,
        endDate: customDateRange.to,
      });
    } else {
      // Clear custom dates for preset periods
      onChange({
        period: newPeriod,
        startDate: undefined,
        endDate: undefined,
      });
    }
  };

  const handleCustomDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range) {
      setCustomDateRange(range);

      // Only update the parent if both dates are selected
      if (range.from && range.to) {
        onChange({
          period: "custom",
          startDate: range.from,
          endDate: range.to,
        });
        setIsDatePickerOpen(false);
      }
    }
  };

  const getDisplayLabel = () => {
    if (value.period === "custom" && value.startDate && value.endDate) {
      return `${format(value.startDate, "MMM d, yyyy")} - ${format(value.endDate, "MMM d, yyyy")}`;
    }
    return PERIOD_OPTIONS.find(opt => opt.value === value.period)?.label || "Select timeframe";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={value.period} onValueChange={(v) => handlePeriodChange(v as TimeframePeriod)}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Select timeframe">
            {getDisplayLabel()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value.period === "custom" && (
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !customDateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customDateRange.from ? (
                customDateRange.to ? (
                  <>
                    {format(customDateRange.from, "LLL dd, y")} -{" "}
                    {format(customDateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(customDateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={customDateRange.from}
              selected={{
                from: customDateRange.from,
                to: customDateRange.to,
              }}
              onSelect={handleCustomDateSelect}
              numberOfMonths={2}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
