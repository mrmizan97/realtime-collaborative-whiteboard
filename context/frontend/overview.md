# Frontend Overview

The frontend is a Next.js 15 App Router app. Most of the interesting code lives in the canvas and the Yjs bindings around it; the rest is fairly ordinary web UI.

## Where things live

```
apps/web/
├── src/
│   ├── app/                      # Next.js routes
│   │   ├── (marketing)/          # landing, pricing (later)
│   │   ├── (app)/                # authed app shell
│   │   │   ├── dashboard/        # room list
│   │   │   └── r/[slug]/         # the whiteboard itself
│   │   └── api/                  # backend routes (see backend docs)
│   ├── components/
│   │   ├── canvas/               # canvas rendering, shapes, tools
│   │   ├── collab/               # presence cursors, user avatars
│   │   ├── toolbar/              # top/side toolbars
│   │   ├── panels/               # property panels, layers list
│   │   └── ui/                   # shadcn components, buttons, etc.
│   ├── lib/
│   │   ├── yjs/                  # Y.Doc setup, providers, undo
│   │   ├── canvas/               # viewport, quadtree, hit-testing
│   │   ├── shapes/               # shape types, create, draw
│   │   ├── export/               # PNG/SVG export
│   │   └── offline/              # IndexedDB wiring
│   └── hooks/                    # React hooks (useYjsDoc, useAwareness, etc.)
```

## State management

This is the one thing I want to be careful about.

- **Canvas state is in Yjs.** Shapes, their properties, z-order, groups — all inside the `Y.Doc`. We never duplicate this into React state.
- **Viewport state is in React/Zustand.** Pan, zoom, active tool, selection highlight, hover — this is per-user and ephemeral. Zustand with a minimal store; no global Redux.
- **Awareness state is in Yjs awareness.** Other users' cursors and selections. Read-only from our side except for our own entry.
- **Auth / user data is in NextAuth + Zustand.** Session comes from NextAuth, current user profile lives in a thin Zustand store.

If you find yourself storing a shape in React state, stop. It belongs in Yjs.

## Rendering approach

Canvas 2D, one `<canvas>` element, drawn via requestAnimationFrame. React does NOT render shapes. React renders:
- The canvas element (once).
- The toolbar and panels.
- Overlay DOM elements (user cursors, selection handles) positioned absolutely.

The draw loop reads directly from the `Y.Doc` each frame. No virtual DOM for shapes. This is intentional — we want predictable 60fps.

See `canvas.md` for the renderer details.

## Where React fits

React handles:
- Auth flows (sign-in, redirect)
- Room list and dashboard
- Toolbar buttons, color pickers, modals
- Sharing UI, settings drawer
- Loading/error boundaries around the canvas

The canvas itself is a black box to React. We mount it once in `useEffect`, teardown on unmount.

## Routing

- `/` — marketing landing (simple, static).
- `/sign-in` — NextAuth sign-in page.
- `/dashboard` — list of rooms I'm in.
- `/r/:slug` — the whiteboard.
- `/r/:slug/settings` — room settings drawer (could just be a modal on the main page instead; deciding during build).

## Styling

- Tailwind for layout and general styling.
- shadcn/ui for buttons, dialogs, dropdowns, toasts.
- CSS modules for the canvas-adjacent UI that needs precise control (cursors, selection handles, mini-map later).
- No CSS-in-JS libraries. Don't want the runtime cost near the canvas.

## Testing strategy

- **Unit**: shape operations, hit-testing, quadtree. Jest.
- **Integration**: Yjs document mutations, awareness merge behavior. Jest + Yjs in-memory.
- **E2E**: the four critical flows — sign in, create room, draw a shape, two-client sync. Playwright.

Not unit-testing React components unless they're doing real logic. Snapshot tests are noise.

## Performance budget

Every canvas change should budget against these numbers. If a PR breaks them, the PR doesn't ship.

| Metric | Target |
|---|---|
| FPS during drag with 1k shapes | 60 |
| FPS during drag with 5k shapes | 60 |
| FPS during drag with 10k shapes | ≥ 30 |
| Initial load JS bundle (gzipped) | < 250KB |
| Time to canvas interactive | < 2s on 4G |
| Memory after 1hr of editing | < 400MB |

## Files worth reading first

When I come back after a break and need to remember how this works:

1. `lib/yjs/doc.ts` — how the `Y.Doc` is structured.
2. `lib/canvas/renderer.ts` — the draw loop.
3. `lib/shapes/registry.ts` — shape type definitions.
4. `hooks/useCanvas.ts` — the React glue.

Start there, branch out from there.
