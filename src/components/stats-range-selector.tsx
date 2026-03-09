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
            <Button variant="outline" size="sm" className="gap-1.5 sm:hidden" />
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
      <div className="hidden items-center gap-0.5 rounded-[10px] bg-card p-1 sm:flex">
        {statsRangeOptions.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-label={`Select ${statsRangeLabel(option.value)} range`}
            className={`rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors ${
              value === option.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  )
}
