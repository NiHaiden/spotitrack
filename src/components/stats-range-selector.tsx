import { useLayoutEffect, useRef, useState } from 'react'
import { IconChevronDown, IconCheck } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  StatsRange,
  statsRangeLabel,
  statsRangeOptions,
} from '@/lib/stats-range'
import { cn } from '@/lib/utils'

type StatsRangeSelectorProps = {
  value: StatsRange
  onChange: (value: StatsRange) => void
}

export function StatsRangeSelector({
  value,
  onChange,
}: StatsRangeSelectorProps) {
  const groupRef = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const group = groupRef.current
    const measure = () => {
      const button = group?.querySelector<HTMLElement>(
        `[data-value="${value}"]`,
      )
      // Hidden (the mobile dropdown is showing): nothing to measure
      if (!button || !button.offsetWidth) return setPill(null)
      setPill({ left: button.offsetLeft, width: button.offsetWidth })
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (group) observer.observe(group)
    return () => observer.disconnect()
  }, [value])

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
          {statsRangeOptions.map((option) => (
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

      {/* Desktop: a segmented control whose highlight slides to the pick */}
      <div
        ref={groupRef}
        role="group"
        aria-label="Time range"
        className="relative hidden items-center rounded-[10px] bg-muted p-0.5 sm:flex"
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-0.5 bottom-0.5 rounded-lg bg-background shadow-xs ring-1 ring-black/5 transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-card dark:ring-white/10',
            !pill && 'hidden',
          )}
          style={pill ?? undefined}
        />
        {statsRangeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            data-value={option.value}
            onClick={() => onChange(option.value)}
            aria-label={`Select ${statsRangeLabel(option.value)} range`}
            aria-pressed={value === option.value}
            className={cn(
              'relative rounded-lg px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
              value === option.value
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
              // Until the highlight is measured, the pick carries its own fill
              value === option.value &&
                !pill &&
                'bg-background shadow-xs dark:bg-card',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  )
}
