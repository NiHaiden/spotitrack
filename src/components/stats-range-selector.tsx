import { IconChevronDown, IconCheck } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  StatsRange,
  statsRangeLabel,
  statsRangeOptions,
} from "@/lib/stats-range"

type StatsRangeSelectorProps = {
  value: StatsRange
  onChange: (value: StatsRange) => void
}

export function StatsRangeSelector({
  value,
  onChange,
}: StatsRangeSelectorProps) {
  return (
    <>
      {/* Mobile: dropdown menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 sm:hidden"
              aria-label={`Time range: ${statsRangeLabel(value)}`}
            />
          }
        >
          {statsRangeLabel(value)}
          <IconChevronDown className="size-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {statsRangeOptions.map(option => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
            >
              {option.label}
              {value === option.value && (
                <IconCheck className="ml-auto size-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Desktop: inline buttons */}
      <div
        role="group"
        aria-label="Time range"
        className="hidden items-center gap-0.5 rounded-[10px] border border-border bg-card p-1 shadow-xs sm:flex"
      >
        {statsRangeOptions.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-label={`Select ${statsRangeLabel(option.value)} range`}
            aria-pressed={value === option.value}
            className={`rounded-[7px] px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none lg:px-3.5 ${
              value === option.value
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  )
}
