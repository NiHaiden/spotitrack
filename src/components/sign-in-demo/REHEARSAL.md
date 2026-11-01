# Sign-in demo: rehearsal notes

- **Gold copied:** `chart-scrub` (the scrub stroke, hairline and dot, rolling readout), framed like `static-card` (satellite straddling the sidebar).
- **Story (~13s loop):** the pointer scrubs "Listening over time" to Oct 15, clicks, the Top tracks card rolls to that day; the card's own Reset puts it back to Today, which is the opening frame. Poster (reduced motion): Oct 15 selected.
- **Framing:** the sign-in panel is the ground and the crop. The stage has no background or mask; the window runs off the panel's right and bottom. The card's left edge sits on the copy's 48px edge. The stage scales 0.93 at 1024 and stops at 1.1 (`max-w-[704px]`).
- **Changed from the gold:** SpotiTrack's tokens (DM Sans, `--primary`, 14px panels), Tabler icons, the dashboard's real right column as filler, light and dark from the app theme.
- **Filmed:** `film.mjs --gate` passed at 1024 and 1440 in the Stageshow playground, using a copy of this page's layout; dark theme looked at.
- **Not checked:** the real `/sign-in` route (the local `node_modules` has no rolldown native binding, so `vite dev` won't start); viewports between about 1200 and 1225 px, where the right filler column may show as a thin sliver.
- **Kit:** `src/components/stageshow/kit/` holds only the 20 Stageshow files this demo imports (MIT, see LICENSE). It's ignored by ESLint and Prettier.
