// frontend/components/logs/LogsFilters.tsx
"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogLevel, LogAction, LogFilters } from "@/types/logs";
import { Search, Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface LogsFiltersProps {
  filters: LogFilters;
  onFilterChange: (filters: LogFilters) => void;
  onClearFilters: () => void;
}

export function LogsFilters({
  filters,
  onFilterChange,
  onClearFilters,
}: LogsFiltersProps) {
  const handleLevelChange = (value: string) => {
    onFilterChange({ ...filters, level: value as any });
  };

  const handleActionChange = (value: string) => {
    onFilterChange({ ...filters, action: value as any });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between pb-6">
      <div className="flex flex-1 items-center gap-3 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search Resource ID, Request ID or message..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-9 bg-white border-slate-200 focus-visible:ring-slate-400"
          />
        </div>

        <Select value={filters.level} onValueChange={handleLevelChange}>
          <SelectTrigger className="w-[130px] bg-white border-slate-200">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Levels</SelectItem>
            <SelectItem value="INFO">Info</SelectItem>
            <SelectItem value="WARN">Warning</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
            <SelectItem value="FATAL">Fatal</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.action} onValueChange={handleActionChange}>
          <SelectTrigger className="w-[180px] bg-white border-slate-200">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Actions</SelectItem>
            <SelectItem value="MODEL_INFERENCE">Model Inference</SelectItem>
            <SelectItem value="IMAGE_UPLOAD">Image Upload</SelectItem>
            <SelectItem value="FEEDBACK_SUBMITTED">Feedback</SelectItem>
            <SelectItem value="AUTH_EVENT">Auth Event</SelectItem>
            <SelectItem value="SYSTEM">System</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal bg-white border-slate-200",
                !filters.startDate && "text-slate-500"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.startDate ? (
                filters.endDate ? (
                  <>
                    {format(filters.startDate, "LLL dd, y")} -{" "}
                    {format(filters.endDate, "LLL dd, y")}
                  </>
                ) : (
                  format(filters.startDate, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              selected={{
                from: filters.startDate,
                to: filters.endDate,
              }}
              onSelect={(range) =>
                onFilterChange({
                  ...filters,
                  startDate: range?.from,
                  endDate: range?.to,
                })
              }
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {(filters.level !== "ALL" ||
          filters.action !== "ALL" ||
          filters.search ||
          filters.startDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-slate-500 h-9 px-2 hover:bg-slate-100"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
