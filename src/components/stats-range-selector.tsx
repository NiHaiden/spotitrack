import { Button } from "@/components/ui/button"
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
    <div className="flex gap-2">
      {statsRangeOptions.map(option => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(option.value)}
          aria-label={`Select ${statsRangeLabel(option.value)} range`}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
