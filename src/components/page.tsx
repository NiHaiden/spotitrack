import { Link } from '@tanstack/react-router'
import { IconChevronRight } from '@tabler/icons-react'
import type * as React from 'react'
import { describeSource } from '@/lib/format'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-2xl leading-tight font-bold tracking-[-0.03em] sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}

export function Breadcrumbs({
  parent,
  current,
}: {
  parent: { label: string; to: '/top-tracks' | '/top-artists' | '/playlists' }
  current: string
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1.5 text-[13px]"
    >
      <Link
        to={parent.to}
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        {parent.label}
      </Link>
      <IconChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />
      <span
        className="truncate font-medium text-foreground"
        aria-current="page"
      >
        {current}
      </span>
    </nav>
  )
}

/**
 * A titled section. Unboxed by default: sections sit on the page and are
 * grouped by space, not by borders. `surface` puts the page's one leading
 * object on a soft fill so the eye lands there first.
 */
export function Panel({
  title,
  description,
  action,
  className,
  bodyClassName,
  children,
  surface,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
  bodyClassName?: string
  children: React.ReactNode
  surface?: boolean
}) {
  const hasHeader = Boolean(title || action)
  return (
    <section
      className={cn(
        'min-w-0',
        surface && 'rounded-2xl bg-muted/60 p-5 sm:p-6 dark:bg-card',
        className,
      )}
    >
      {hasHeader ? (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            {title ? (
              <h2 className="text-[15px] leading-snug font-semibold">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-[13px] leading-snug text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

export function PanelLink({
  children,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className="shrink-0 text-[13px] font-medium text-primary transition-colors hover:text-primary/80"
    >
      {children}
    </Link>
  )
}

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'block text-[13px] leading-snug font-medium text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Header for artist / track / playlist detail pages. */
export function DetailHero({
  art,
  eyebrow,
  title,
  subtitle,
  stats,
}: {
  art: React.ReactNode
  eyebrow: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  stats?: Array<{ label: string; value: React.ReactNode }>
}) {
  return (
    <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-10">
      <div className="flex min-w-0 flex-1 items-center gap-5 sm:gap-7">
        <div className="size-20 shrink-0 sm:size-32">{art}</div>
        <div className="flex min-w-0 flex-col gap-1">
          <Eyebrow className="text-primary">{eyebrow}</Eyebrow>
          <h1 className="text-2xl leading-tight font-bold tracking-[-0.03em] break-words sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-sm text-muted-foreground sm:text-[15px]">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {stats?.length ? (
        <dl className="grid grid-cols-3 gap-4 lg:flex lg:gap-10">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-0.5">
              <dt className="text-[13px] text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="text-xl font-semibold tracking-[-0.02em] whitespace-nowrap tabular-nums sm:text-2xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  )
}

export function DetailRows({ children }: { children: React.ReactNode }) {
  return <dl className="divide-y divide-border">{children}</dl>
}

export function DetailRow({
  label,
  value,
  accent,
}: {
  label: string
  value: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'text-sm font-semibold tabular-nums',
          accent && 'text-primary',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-muted/60 px-6 py-12 text-center dark:bg-card',
        className,
      )}
    >
      {icon ? (
        <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="max-w-sm text-[13px] text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

export function ErrorNotice({
  message,
}: {
  message: string | null | undefined
}) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {message}
    </div>
  )
}

/** Thin share-of-total bar used in ranked tables. */
export function ShareBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${Math.max(4, Math.min(100, percent))}%` }}
      />
    </div>
  )
}

/** Where a play came from: live Spotify sync or a privacy-data import. */
export function SourceBadge({ source }: { source: string }) {
  const { label, tone } = describeSource(source)
  return (
    <span className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground">
      <span
        className={cn(
          'size-1.5 rounded-full',
          tone === 'live' ? 'bg-emerald-500' : 'bg-sky-500',
        )}
      />
      {label}
    </span>
  )
}
