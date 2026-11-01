import { useRef } from 'react'
import {
  IconChartBar,
  IconClock,
  IconMusic,
  IconPlaylist,
  IconUsers,
} from '@tabler/icons-react'
import type { Act } from '@/components/stageshow/kit/act'
import type { Theme } from '@/components/stageshow/kit/looks'
import { Stage } from '@/components/stageshow/kit/stage'
import { Bar, Window } from '@/components/stageshow/kit/window'
import { Chart, chartPoints } from '@/components/stageshow/kit/chart'
import { Roll } from '@/components/stageshow/kit/motion/Roll'
import './sign-in-demo.css'

// SpotiTrack's sign-in hero: the dashboard's "Listening over time" chart,
// scrubbed and clicked, with the day's top tracks as a satellite card.
//
// Beats: the pointer comes onto the chart and the headline reads the day under
// it; one stroke to the busiest day; a click selects it (the ring moves there)
// and the card's eyebrow and tracks roll to that day; the payoff holds; the
// card's own Reset puts it back to Today, which is the opening frame.
//
// Real strings: the heading, the readout, the card's eyebrow,
// its action and three tracks with their plays. Sidebar and the rest are bars.

type S = { hover: number | null; x: number | null; sel: number }

// Minutes listened per day, Sep 24 to Oct 23
const DAYS = [
  8, 22, 6, 60, 15, 30, 21, 26, 66, 14, 4, 45, 40, 11, 32, 46, 38, 15, 28, 26,
  48, 82, 42, 6, 55, 63, 24, 21, 47, 29,
]
const LAST = DAYS.length - 1
const PEAK = 21
const START = new Date(2025, 8, 24)
const dayName = (i: number) =>
  new Date(START.getTime() + i * 864e5).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
const dur = (m: number) =>
  m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
const TOTAL = 1123 // 18h 43m, as the dashboard's stat card says

type Track = { name: string; plays: number; art: number }
const TODAY: Array<Track> = [
  { name: 'Northern Static', plays: 3, art: 1 },
  { name: 'Midnight Transit', plays: 2, art: 2 },
  { name: 'Cartography', plays: 1, art: 3 },
]
const PEAK_DAY: Array<Track> = [
  { name: 'Harmattan', plays: 6, art: 4 },
  { name: 'Fieldwork', plays: 4, art: 5 },
  { name: 'Northern Static', plays: 3, art: 1 },
]
const plays = (n: number) => `${n} ${n === 1 ? 'play' : 'plays'}`

const W = 314
const H = 140
const initial: S = { hover: null, x: null, sel: LAST }
const REST = { x: 520, y: 110 }

async function script(a: Act<S>) {
  await a.wait(1000)
  const box = a.rect('plot')
  const pts = chartPoints({
    data: DAYS,
    width: box.width,
    height: H,
    dot: false,
    max: 90,
  })
  const at = (i: number) => ({ x: box.x + pts[i].x, y: box.y + pts[i].y + 16 })
  const nearest = (x: number) => {
    let n = 0
    for (let i = 1; i < pts.length; i++)
      if (Math.abs(pts[i].x - x) < Math.abs(pts[n].x - x)) n = i
    return n
  }

  a.mark('hover')
  await a.move(at(13), { duration: 800 })
  a.put({ hover: 13, x: pts[13].x })
  await a.wait(600)

  // One stroke along the line to the busiest day; the readout follows
  a.mark('scrub')
  await a.move(at(PEAK), {
    duration: 1200,
    path: (e, from, to) => ({
      x: from.x + (to.x - from.x) * e,
      y: from.y + (to.y - from.y) * e,
    }),
    onMove: (pt) => {
      const x = Math.max(0, Math.min(box.width, pt.x - box.x))
      a.put({ hover: nearest(x), x })
    },
  })
  await a.wait(400)

  a.mark('select')
  await a.click()
  await a.set({ sel: PEAK })
  await a.wait(2400)

  // To the card's Reset; the hairline lets go as the pointer leaves the plot
  a.mark('reset')
  let gone = false
  await a.move(
    { at: 'reset', x: 0.96, y: 0.7 },
    {
      onMove: (pt) => {
        if (!gone && (pt.y > box.y + box.height || pt.x < box.x)) {
          gone = true
          a.put({ hover: null, x: null })
        }
      },
    },
  )
  a.put({ hover: null, x: null })
  await a.wait(300)
  await a.click()
  await a.set({ sel: LAST })
  await a.wait(900)
  // Back to the empty surface beside the readout, where the loop opens
  await a.move(REST)
  await a.wait(500)
}

// The y of the drawn line at x, read off the chart's own path
function yOn(path: SVGPathElement | null | undefined, x: number) {
  if (!path) return null
  let lo = 0
  let hi = path.getTotalLength()
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (path.getPointAtLength(mid).x < x) lo = mid
    else hi = mid
  }
  return path.getPointAtLength(hi).y
}

const NAV = [
  { icon: IconChartBar, w: 58, on: true },
  { icon: IconMusic, w: 50 },
  { icon: IconUsers, w: 54 },
  { icon: IconClock, w: 62 },
  { icon: IconPlaylist, w: 44 },
]

export function SignInDemo({ theme = 'light' }: { theme?: Theme }) {
  const plot = useRef<HTMLDivElement>(null)
  return (
    <Stage<S>
      width={640}
      height={410}
      fill
      initial={initial}
      poster={{ hover: null, x: null, sel: PEAK }}
      script={script}
      theme={theme}
      accent="oklch(0.65 0.17 55)"
      cursor={{ at: REST }}
      className="stk"
    >
      {(s) => {
        const pts = chartPoints({
          data: DAYS,
          width: W,
          height: H,
          dot: false,
          max: 90,
        })
        const path =
          plot.current?.querySelector<SVGPathElement>('.ss-chart__line')
        const hx = s.x ?? (s.hover === null ? null : pts[s.hover].x)
        const hy = hx === null ? null : (yOn(path, hx) ?? pts[s.hover ?? 0].y)
        const shown = s.hover ?? (s.sel === LAST ? null : s.sel)
        const picked = s.sel !== LAST
        const tracks = picked ? PEAK_DAY : TODAY
        const ring = (i: number) => ({
          left: pts[i].x,
          top: yOn(path, pts[i].x) ?? pts[i].y,
        })
        return (
          <>
            <Window
              className="stk-win"
              title="Dashboard"
              sidebarWidth={124}
              sidebar={
                <nav className="stk-nav">
                  {NAV.map(({ icon: I, w, on }, i) => (
                    <span
                      key={i}
                      className="stk-nav__row"
                      data-on={on || undefined}
                    >
                      <I size={16} stroke={1.75} />
                      <Bar w={w} h={5} tone={on ? 4 : 2} />
                    </span>
                  ))}
                </nav>
              }
            >
              <div className="stk-body">
                <div className="stk-panel">
                  <div className="stk-panel__title">Listening over time</div>
                  <div className="stk-read">
                    <div className="stk-read__label">
                      <Roll variant="fade">
                        {shown === null ? 'Last 30 days' : dayName(shown)}
                      </Roll>
                    </div>
                    <div className="stk-read__value">
                      <Roll stagger={25}>
                        {dur(shown === null ? TOTAL : DAYS[shown])}
                      </Roll>
                    </div>
                  </div>
                  <div
                    ref={plot}
                    className="stk-plot"
                    data-target="plot"
                    data-cursor="crosshair"
                    style={{ width: W, height: H }}
                  >
                    <Chart
                      data={DAYS}
                      width={W}
                      height={H}
                      dot={false}
                      max={90}
                    />
                    <span
                      className="stk-hair"
                      data-on={hx !== null && s.hover !== null ? '' : undefined}
                      style={hx !== null ? { left: hx } : undefined}
                    />
                    <span
                      className="stk-dot"
                      data-on={
                        hx !== null && hy !== null && s.hover !== null
                          ? ''
                          : undefined
                      }
                      style={
                        hx !== null && hy !== null
                          ? { left: hx, top: hy }
                          : undefined
                      }
                    />
                    <span
                      className="stk-ring"
                      data-on={!picked ? '' : undefined}
                      style={ring(LAST)}
                    />
                    <span
                      className="stk-ring"
                      data-on={picked ? '' : undefined}
                      style={ring(PEAK)}
                    />
                  </div>
                  <div className="stk-axis" style={{ width: W }}>
                    <span>Sep 24</span>
                    <span>Oct 23</span>
                  </div>
                </div>
                <div className="stk-panel stk-panel--below">
                  <Bar w={120} h={6} tone={3} />
                  <Bar w={190} h={5} tone={2} />
                </div>
                {/* The dashboard's right column, filler, running off the page */}
                <div className="stk-side">
                  <div className="stk-panel stk-artist">
                    <span className="stk-artist__disc" />
                    <span className="stk-lines">
                      <Bar w={96} h={6} tone={4} />
                      <Bar w={64} h={5} tone={2} />
                    </span>
                  </div>
                  <div className="stk-panel stk-recent">
                    <Bar w={84} h={6} tone={3} />
                    {[70, 54, 82, 60].map((w, i) => (
                      <span key={i} className="stk-recent__row">
                        <span className="stk-recent__tile">
                          <IconMusic size={14} stroke={1.75} />
                        </span>
                        <span className="stk-lines">
                          <Bar w={w} h={5} tone={3} />
                          <Bar w={w - 24} h={4} tone={2} />
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Window>

            <div className="stk-card">
              <div className="stk-card__head">
                <span className="stk-eyebrow">
                  <Roll variant="fade">{`${picked ? dayName(PEAK) : 'Today'} · Top tracks`}</Roll>
                </span>
                <span className="stk-link" data-target="reset">
                  <Roll variant="fade" align="end">
                    {picked ? 'Reset' : 'View all'}
                  </Roll>
                </span>
              </div>
              <ol className="stk-tracks">
                {tracks.map((t, i) => (
                  <li key={i} className="stk-track">
                    <span className="stk-track__n">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="stk-art">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <i
                          key={n}
                          className={`stk-art--${n}`}
                          data-on={t.art === n || undefined}
                        />
                      ))}
                    </span>
                    <span className="stk-track__name">
                      <Roll variant="fade" delay={i * 60}>
                        {t.name}
                      </Roll>
                    </span>
                    <span className="stk-track__plays">
                      <Roll delay={i * 60}>{plays(t.plays)}</Roll>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )
      }}
    </Stage>
  )
}
