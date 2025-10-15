# Updated Design Prompts with Professional Color System

**Date:** 2025  
**Based on:** DESIGN_SYSTEM_COLORS.md  
**Status:** Production Ready - Use these prompts for all new design work

---

## Color Palette Reference (Use in All Prompts)

### Primary Action Color

- **Indigo 500**: `#6366f1` - Main primary for buttons, links, focus
- **Indigo 400**: `#818cf8` - Dark mode primary (brighter for visibility)
- **Indigo 600**: `#4f46e5` - Hover states

### Background Colors (Dark Mode Primary)

- **Slate 900**: `#0f172a` - Primary background
- **Slate 800**: `#1e293b` - Secondary background / elevated surfaces
- **Slate 700**: `#334155` - Tertiary background / cards

### Text Colors

- **Slate 100**: `#f1f5f9` - Primary text on dark
- **Slate 300**: `#cbd5e1` - Secondary text
- **Slate 400**: `#94a3b8` - Tertiary text / placeholders

### Semantic Colors

- **Success**: `#22c55e` - Valid, completed, positive states
- **Warning**: `#fbbf24` - Caution, expiring, attention needed
- **Error**: `#ef4444` - Errors, destructive, critical
- **Info**: `#3b82f6` - Informational, neutral notifications

### Code Syntax (Monaco Editor)

- **Keywords**: `#c586c0` (Purple)
- **Strings**: `#ce9178` (Orange)
- **Functions**: `#dcdcaa` (Yellow)
- **Variables**: `#9cdcfe` (Light Blue)
- **Comments**: `#6a9955` (Green)

---

## Dashboard Prompt (Updated)

```
You are a senior product designer specializing in SaaS analytics platforms. Design a comprehensive multi-tenant prompt operations dashboard for do-multitenant-prompt-manager.

Context:
- React + Vite + TypeScript tech stack
- Users: DevOps teams, prompt engineers, technical managers
- Primary actions: Monitor prompt performance, switch tenants, view analytics
- Keyboard-first workflow (shortcuts critical)

COLOR SYSTEM (Professional B2B Palette):
- Primary: Indigo #6366f1 (buttons, links, actions)
- Background: Slate #0f172a (primary), #1e293b (secondary), #334155 (elevated)
- Text: Slate #f1f5f9 (primary), #cbd5e1 (secondary), #94a3b8 (tertiary)
- Success: #22c55e | Warning: #fbbf24 | Error: #ef4444 | Info: #3b82f6
- Borders: Slate #334155
- NO bright pink (#d946ef) or playful colors

Requirements:
1. Information architecture with 4 zones:
   - Tenant selector (top-left, persistent, uses indigo #6366f1 on select)
   - Key metrics cards (prompt usage, token consumption, error rates, latency p95)
     - Use semantic colors: success #22c55e for good metrics, warning #fbbf24 for degraded, error #ef4444 for critical
   - Real-time activity feed (recent deployments, version changes)
     - Background: slate #1e293b, borders: slate #334155
   - Quick actions panel (new prompt, clone existing, view logs)
     - Primary button: indigo #6366f1, ghost buttons: transparent with slate #1e293b hover

2. Visual design:
   - Modern SaaS aesthetic, dark mode primary (#0f172a background)
   - Color palette: ONLY use colors from above system
   - Typography: Inter for UI, JetBrains Mono for code/metrics
   - Data visualization: Use indigo #6366f1 for primary data, success #22c55e for positive trends, warning #fbbf24 for alerts

3. Layout specifications:
   - 1920x1080 baseline, responsive down to 1366x768
   - Grid system: 12-column with 24px gutter
   - Navigation sidebar collapsed by default (keyboard toggle)
   - Header height: 64px fixed, background slate #1e293b

4. Accessibility:
   - All keyboard shortcuts visible on hover
   - ARIA labels for tenant switcher
   - Focus indicators: 2px indigo #6366f1 outline with 2px offset
   - Screen reader announcements for metric changes
   - Minimum 7:1 contrast ratio (WCAG AAA)

Avoid: Generic admin templates, cluttered stat cards, decorative gradients, stock photography, playful colors, bright pink

Output: Component hierarchy with interaction states, spacing values, keyboard shortcut annotations, exact hex colors from system above
```

---

## Monaco Editor Prompt (Updated)

```
Design advanced prompt authoring workspace for Monaco editor integration in do-multitenant-prompt-manager.

You are a UX designer with experience in developer tools like VS Code, GitHub Codespaces, and Replit.

Context:
- Users are technical prompt engineers who prefer keyboard workflows
- Editor must handle multi-step prompt chains with variables
- Syntax highlighting using custom "do-dark" theme
- Real-time validation and token counting

COLOR SYSTEM (Matches VS Code Dark+):
- Editor background: #0f172a (slate-900)
- Line numbers: #64748b (slate-500)
- Selection: #6366f140 (indigo with 25% opacity)
- Current line: #ffffff08 (subtle white 3%)
- Syntax highlighting:
  - Keywords: #c586c0 (purple)
  - Strings: #ce9178 (orange)
  - Functions: #dcdcaa (yellow)
  - Variables: #9cdcfe (light blue)
  - Comments: #6a9955 (green)
  - Numbers: #b5cea8 (light green)

Component breakdown:

1. Editor pane (60% width):
   - Monaco editor with "do-dark" theme (background #0f172a)
   - Line numbers enabled (color #64748b)
   - Minimap enabled (background #1e293b)
   - Token counter in bottom-right:
     - Normal state: white text on slate #1e293b background
     - Warning (>80%): amber #fbbf24 background
     - Error (>100%): red #ef4444 background
     - Updates on keystroke debounced 300ms

2. Preview/Test pane (40% width):
   - Live preview of rendered prompt with variable substitution
   - Background: slate #1e293b
   - Border: slate #334155
   - Test execution panel with sample inputs
   - Response display with syntax highlighting
   - Execution time + token usage metrics (use info blue #3b82f6)

3. Top toolbar:
   - Background: slate #1e293b
   - Prompt name (inline edit on click, indigo #6366f1 focus ring)
   - Version dropdown (git-style SHA + timestamp)
   - Status badge: Draft (slate #475569), Published (success #22c55e), Archived (slate #64748b)
   - Actions:
     - Save button: Indigo #6366f1 primary
     - Test button: Indigo #6366f1 outline variant
     - Publish: Success #22c55e
     - Clone: Ghost button with slate #1e293b hover

4. Left sidebar (collapsible 280px):
   - Background: slate #1e293b
   - Prompt library tree view
   - Search/filter (Cmd+P to focus, indigo #6366f1 focus ring)
   - Recent prompts (last 10)
   - Favorites (star icon in amber #fbbf24)

Design system:
- Monaco theme: "do-dark" (already implemented in codebase)
- Syntax colors: Use exact colors listed above
- Panel dividers: Resizable with drag handle (slate #334155)
- Keyboard shortcuts visible on toolbar hover
- Focus indicators: 2px indigo #6366f1 outline

Technical:
- React component using @monaco-editor/react
- Split pane layout with react-resizable-panels (install if needed)
- Autosave debounced 2s to Cloudflare KV
- Version history stored as diff patches
- Token counter component already exists (TokenCounter.tsx)

Avoid: Overwhelming toolbars, hidden critical features, laggy preview updates, unclear validation errors, bright pink colors, playful gradients

Output: React component structure with TypeScript interfaces, state management approach (Zustand/Jotai), keyboard shortcut mapping table, exact hex colors from system
```

---

## Tenant Switcher Prompt (Updated)

```
Design tenant switcher component for multi-tenant prompt manager with 10-1000+ organizations.

COLOR SYSTEM:
- Trigger background: Transparent, hover slate #1e293b
- Trigger text: Slate #f1f5f9
- Trigger border: Slate #334155
- Dropdown background: Slate #1e293b
- Dropdown border: Slate #334155
- Search input focus: Indigo #6366f1 ring (2px)
- Selected tenant: Indigo #6366f1 dot indicator
- Hover state: Slate #334155 background
- Active state: Slate #475569 background

Requirements:
- Instant search/filter (fuzzy match on tenant name + ID)
- Recently accessed tenants (last 5) pinned to top with amber #fbbf24 "recent" badge
- Visual tenant indicators (avatar/logo initials with indigo #6366f1 background, color label)
- Current tenant always visible in header with indigo #6366f1 dot
- Switch without page reload (SPA state management)

Component structure:
- Trigger: Compact pill in header showing tenant name + chevron (max-width 200px)
  - Background: transparent, hover slate #1e293b
  - Text: slate #f1f5f9
  - Border: slate #334155
- Dropdown: 400px width, max-height 600px, scrollable
  - Background: slate #1e293b
  - Border: slate #334155
  - Shadow: 0 20px 48px rgba(0, 0, 0, 0.6)
- Search input: Auto-focus on open, clear on ESC
  - Background: slate #0f172a
  - Border: slate #334155
  - Focus ring: 2px indigo #6366f1
  - Text: slate #f1f5f9
- Tenant list: Virtual scrolling for 1000+ items (use @tanstack/react-virtual)
  - Each row: 48px height
  - Hover: slate #334155 background
  - Active: slate #475569 background
  - Current tenant: Indigo #6366f1 dot, bold text
- Footer: "Manage tenants" link (indigo #6366f1), keyboard hints (slate #94a3b8)

Interaction design:
- Click trigger → open dropdown
- Cmd+Shift+T → toggle dropdown
- Type to search (instant filter)
- Arrow keys navigate results
- Enter to select
- Tab to cycle through recent tenants
- Click outside or ESC to close

Visual design:
- Dropdown shadow: 0 20px 48px rgba(0, 0, 0, 0.6)
- Each tenant row: 48px height, hover slate #334155, active slate #475569
- Tenant avatar: 32px circle, indigo #6366f1 background with white initials if no logo
- Current tenant: Indigo #6366f1 dot indicator (8px), semibold text
- Empty state: Illustration + "No matching tenants" (slate #94a3b8)

Accessibility:
- Combobox ARIA pattern
- Live region announces result count
- Focus trap when open
- Screen reader announces current tenant on switch
- Minimum 7:1 contrast on all text

Technical constraints:
- React component with Radix UI Dropdown primitive (or custom)
- TanStack Virtual for list virtualization (@tanstack/react-virtual)
- Tenant data from Cloudflare Worker API
- Client-side filtering for <100 tenants, server-side for 100+

Avoid: Cluttered dropdown, poor search UX, slow virtual scrolling, bright pink colors, playful gradients

Output: Figma component with variants (open/closed, empty/populated, loading), interaction states, React implementation pseudocode, exact hex colors
```

---

## API Token Management Prompt (Updated)

```
Design token-gated API management screen for Cloudflare Worker authentication in do-multitenant-prompt-manager.

COLOR SYSTEM (Security-Focused):
- Background: Slate #0f172a (primary), #1e293b (cards)
- Text: Slate #f1f5f9 (primary), #cbd5e1 (secondary)
- Borders: Slate #334155
- Primary actions: Indigo #6366f1
- Destructive actions: Error #ef4444
- Security states:
  - Valid: Success #22c55e
  - Expiring (< 7 days): Warning #fbbf24
  - Expired/Revoked: Error #ef4444
  - Info badges: Info #3b82f6

Context:
- Cloudflare Workers use bearer tokens for authentication
- Users need to create, view, revoke, and rotate tokens
- Security-critical interface requiring clear permissions and audit trail

Component hierarchy:

1. Token list table:
   - Background: slate #1e293b
   - Borders: slate #334155
   - Columns: Name, Prefix (first 8 chars), Created, Last Used, Expires, Scope, Actions
   - Row hover: slate #334155
   - Row actions: Copy (indigo #6366f1), Revoke (error #ef4444), View details (ghost)
   - Empty state: "No active tokens" with "Create first token" button (indigo #6366f1)
   - Pagination: 25 per page, indigo #6366f1 active page

2. Create token modal:
   - Background: slate #1e293b
   - Border: slate #334155
   - Backdrop: rgba(0, 0, 0, 0.7)
   - Step 1: Token name + description inputs
     - Focus ring: 2px indigo #6366f1
   - Step 2: Scope selection checkboxes (read_prompts, write_prompts, read_analytics, admin)
     - Checked: indigo #6366f1
   - Step 3: Expiration dropdown (7d, 30d, 90d, 1y, never)
   - Step 4: Display full token with copy button (ONE-TIME SHOW WARNING in amber #fbbf24)
     - Token display: Monospace font, background slate #0f172a, success #22c55e border

3. Token details drawer:
   - Slide from right, 480px width
   - Background: slate #1e293b
   - Border-left: slate #334155
   - Full token metadata
   - Usage stats chart (requests per day, last 30 days) - use indigo #6366f1 for line
   - Audit log (last 100 actions) - table with slate #334155 borders
   - Rotate button (indigo #6366f1), Revoke button (error #ef4444, requires confirmation)

Security-focused design:
- Warning badges:
  - Expiring soon (< 7 days): Amber #fbbf24 background, white text
  - Never expires: Amber #fbbf24 outline with "⚠️" icon
  - Over 90 days old: Info #3b82f6 badge with "ℹ️" icon
- Token display: JetBrains Mono font, masked by default, click to reveal for 10s
  - Masked: "••••••••••••" in slate #475569
  - Revealed: Success #22c55e text, countdown timer
- Copy success: Toast notification "Token copied - store securely" (success #22c55e)
- Revoke confirmation: Modal with "Type token name to confirm" input
  - Background: slate #1e293b
  - Danger zone: Error #ef4444 border, white text on error #ef4444 button

Visual design:
- Security context: Amber #fbbf24 for warnings (not playful pink)
- Danger actions: Error #ef4444 for revoke/delete
- Success states: Success #22c55e for valid tokens
- Monospace: JetBrains Mono for token display, 14px
- Info badges: Info #3b82f6 for informational states

Accessibility:
- Clear ARIA labels for destructive actions ("Revoke token {name}")
- Confirmation dialogs before revocation
- Screen reader announces token creation success
- Keyboard navigation through token list (arrow keys)
- Minimum 7:1 contrast on all text

Technical:
- Token generation on Cloudflare Worker edge
- Client never stores full tokens (only prefixes)
- Copy using Clipboard API with fallback
- Real-time token validation status check
- Audit log pagination (100 per page)

Avoid: Unclear security warnings, hidden critical actions, bright pink colors, playful UI, weak confirmation flows

Output: Full component specification with state machine for token lifecycle (creating → active → expiring → expired → revoked), form validation rules, API integration points, exact hex colors from system
```

---

## Keyboard Shortcuts Overlay Prompt (Updated)

```
Design keyboard shortcuts overlay panel for do-multitenant-prompt-manager emphasizing keyboard-driven workflows.

COLOR SYSTEM:
- Modal background: Slate #1e293b with 95% opacity
- Backdrop: rgba(0, 0, 0, 0.8)
- Text: Slate #f1f5f9 (primary), #cbd5e1 (secondary)
- Key badges: Slate #334155 background, slate #475569 border, slate #f1f5f9 text
- Hover: Slate #475569 background
- Category headings: Slate #cbd5e1, semibold
- Search bar focus: Indigo #6366f1 ring (2px)

Subject: Modal overlay displaying all available keyboard shortcuts organized by context

Style: Inspired by VS Code Command Palette, Superhuman shortcuts overlay, minimal and scannable

Structure:
1. Trigger: ? key or Cmd+/ opens overlay
2. Layout: Centered modal 800x600px
   - Background: slate #1e293b
   - Border: slate #334155
   - Border-radius: 8px
   - Backdrop: rgba(0, 0, 0, 0.8)
3. Search bar: Top sticky
   - Background: slate #0f172a
   - Border: slate #334155
   - Focus ring: 2px indigo #6366f1
   - Text: slate #f1f5f9
   - Placeholder: slate #94a3b8
   - Fuzzy filter shortcuts by name or key combo
4. Categorized sections:
   - Global (tenant switching, search, help)
   - Dashboard (refresh, export, time range)
   - Editor (save, test, format, duplicate)
   - Navigation (sidebar, panels, focus areas)
   - Category heading: slate #cbd5e1, font-weight 600, 14px

Visual design per shortcut row:
- Row height: 48px
- Padding: 12px 16px
- Hover: slate #475569 background
- Left: Action name in sentence case (slate #f1f5f9, 14px)
- Right: Key combination in pill badges
  - Background: slate #334155
  - Border: 1px solid slate #475569
  - Padding: 4px 8px
  - Font: JetBrains Mono 13px, slate #f1f5f9
  - Border-radius: 4px
  - Gap between keys: 4px
  - Example: [⌘] [K] shown as two separate badges
- Platform-aware: Show Mac symbols (⌘⇧⌥⌃) vs Windows (Ctrl+Shift+Alt+Win)

Interactions:
- Type to filter shortcuts in real-time (fuzzy match)
- Click shortcut row → closes overlay and executes action
- ESC or click backdrop → close
- Arrow keys navigate filtered results
- Enter on selected row → execute shortcut

Accessibility:
- Focus trap within modal
- ESC always closes
- Announce filtered count via aria-live (e.g., "15 shortcuts found")
- Support screen reader navigation
- ARIA role="dialog", aria-label="Keyboard shortcuts help"

Technical:
- React Portal for modal rendering
- mousetrap or hotkeys-js for key binding detection
- Platform detection: navigator.platform
- Persist "shortcuts seen" flag to localStorage
- Fuzzy search using fuse.js or custom implementation

Avoid: Overwhelming number of shortcuts, unclear key combinations, slow search, bright pink colors, playful UI

Output format: React component code with TypeScript types, keyboard event handlers, Tailwind CSS classes (using exact hex from system above)
```

---

## Design System Foundation Prompt (Updated)

```
Create comprehensive design system for do-multitenant-prompt-manager SaaS application.

You are a design systems architect with experience in modern developer tools (Linear, Vercel, Railway, GitHub).

VALIDATED COLOR PALETTE (Use exactly these):

Primary: Professional Indigo
- 400: #818cf8 (dark mode primary)
- 500: #6366f1 (main primary)
- 600: #4f46e5 (hover)
- 700: #4338ca (active)

Accent: Refined Violet (limited use)
- 500: #8b5cf6 (AI features, premium)

Neutral: Tailwind Slate
- 50: #f8fafc (light mode BG)
- 100: #f1f5f9 (light mode text)
- 300: #cbd5e1 (secondary text)
- 400: #94a3b8 (tertiary text)
- 500: #64748b (disabled)
- 600: #475569 (borders)
- 700: #334155 (elevated surfaces)
- 800: #1e293b (secondary BG dark)
- 900: #0f172a (primary BG dark)
- 950: #020617 (deepest BG)

Semantic:
- Success: #22c55e (9.1:1 contrast on dark)
- Warning: #fbbf24 (10.8:1 contrast on dark)
- Error: #ef4444 (5.8:1 contrast on dark)
- Info: #3b82f6 (7.2:1 contrast on dark)

Code Syntax (Monaco):
- Keywords: #c586c0 (purple)
- Strings: #ce9178 (orange)
- Functions: #dcdcaa (yellow)
- Variables: #9cdcfe (light blue)
- Comments: #6a9955 (green)

Typography scale:
- Headings: Inter (600 weight)
- Body: Inter (400 regular, 500 medium)
- Code: JetBrains Mono (400 regular)
- Sizes: 12px, 14px, 16px, 18px, 24px, 32px, 48px
- Line heights: 1.2 (headings), 1.5 (body), 1.4 (code)

Spacing system:
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px
- Component padding: 12px vertical, 16px horizontal (default)
- Section margins: 24px between components, 48px between major sections

Component library:

1. Buttons:
   - Primary: Indigo #6366f1 background, white text, hover darken to #4f46e5, active scale 0.98
   - Secondary: Slate #1e293b background, slate #f1f5f9 text, border slate #334155
   - Destructive: Error #ef4444 background, white text, requires confirmation
   - Ghost: Transparent, hover slate #1e293b background
   - Sizes: sm (32px), md (40px), lg (48px)
   - Border radius: 6px
   - Icon spacing: 8px gap between icon + label

2. Input fields:
   - Height: 40px default
   - Border: 1px solid #334155, focus 2px indigo #6366f1 ring with 2px offset
   - Padding: 12px horizontal
   - Background: slate #0f172a (dark), white (light)
   - Text: slate #f1f5f9 (dark), slate #0f172a (light)
   - Label: 14px above input, 8px margin-bottom
   - Error state: Error #ef4444 border + helper text below

3. Cards:
   - Background: slate #1e293b
   - Border: 1px solid slate #334155
   - Border radius: 8px
   - Padding: 24px
   - Shadow: 0 4px 12px rgba(0, 0, 0, 0.5)
   - Hover: Lift 2px, increase shadow to 0 8px 24px rgba(0, 0, 0, 0.6)

4. Data tables:
   - Header: Slate #334155 background, 14px medium text (slate #cbd5e1)
   - Row height: 48px
   - Row hover: Slate #1e293b background
   - Borders: Horizontal only, slate #334155
   - Zebra striping: Optional, slate #1e293b every other row

5. Navigation:
   - Sidebar width: 240px (collapsed: 64px)
   - Background: Slate #1e293b
   - Nav item height: 40px
   - Active state: Indigo #6366f1 left border (3px) + indigo #6366f140 background
   - Hover: Slate #334155 background
   - Icon size: 20px, 12px gap to label
   - Text: Slate #f1f5f9

Interaction patterns:
- Hover transitions: 150ms ease-out
- Modal animations: Fade + scale from 0.95, 250ms
- Toast notifications: Slide from top-right, 300ms
- Loading states: Skeleton screens (slate #1e293b pulse) for content areas

Accessibility requirements:
- Color contrast minimum 7:1 for text (WCAG AAA)
- Focus indicators: 2px indigo #6366f1 outline, 2px offset
- Touch targets: Minimum 44x44px
- Motion: Respect prefers-reduced-motion

Responsive breakpoints:
- Mobile: 640px
- Tablet: 1024px
- Desktop: 1440px
- Wide: 1920px

NO LONGER USED (deprecated):
- ❌ Bright pink #d946ef
- ❌ Playful gradients with pink
- ❌ Consumer-focused colors
- ❌ Neon/fluorescent accents

Output format:
1. Figma design system file structure (pages, frames, components)
2. CSS custom properties (CSS variables) for all tokens
3. Tailwind config extension with custom colors/spacing
4. React component API interfaces (TypeScript)
5. Storybook story structure for component documentation
6. WCAG AAA compliance report

Generate design system following Linear, GitHub Primer, and Vercel Geist patterns for token organization, using ONLY the colors specified above.
```

---

## Key Changes from Original Prompts

1. **Removed bright pink** (`#d946ef`) from all prompts
2. **Added exact hex colors** for all UI elements
3. **Specified WCAG AAA compliance** requirements (7:1 contrast)
4. **Added code syntax colors** for Monaco editor
5. **Clarified dark mode as primary** UI mode
6. **Added security-focused colors** (warning/danger/safe states)
7. **Removed playful language** and consumer-focused references
8. **Added technical constraints** (libraries, dependencies)
9. **Specified accessibility patterns** (ARIA, focus management)
10. **Referenced real professional design systems** (Linear, GitHub, Vercel)

---

## Using These Prompts

### For Design Tools (Figma, Sketch):

1. Copy the color palette from DESIGN_SYSTEM_COLORS.md
2. Create color styles with exact hex values
3. Use prompts as specification for wireframes/mockups
4. Validate all designs meet 7:1 contrast minimum

### For Development:

1. Reference `frontend/src/design-system/tokens.css` for variables
2. Use `--color-primary-500`, `--color-slate-900`, etc.
3. Never hardcode hex values directly
4. Test in dark mode first (primary UI mode)

### For AI Tools (v0, Galileo, Builder):

1. Paste updated prompt with validated color system
2. Specify "use exact hex colors from system"
3. Request TypeScript interfaces for component props
4. Ensure output uses CSS custom properties

---

## Prompt Template

For any new design work, include this color reference:

```
COLOR SYSTEM (Professional B2B - WCAG AAA):
- Primary: Indigo #6366f1 (actions), #818cf8 (dark mode)
- Background: Slate #0f172a (primary), #1e293b (secondary), #334155 (elevated)
- Text: Slate #f1f5f9 (primary), #cbd5e1 (secondary), #94a3b8 (tertiary)
- Success: #22c55e | Warning: #fbbf24 | Error: #ef4444 | Info: #3b82f6
- Borders: Slate #334155
- Code: Keywords #c586c0, Strings #ce9178, Functions #dcdcaa, Variables #9cdcfe
- NO bright pink (#d946ef), NO playful colors, NO consumer-focused palette
```

---

**Document Version:** 1.0  
**Last Updated:** 2025  
**Maintained by:** Design System Team  
**Reference:** DESIGN_SYSTEM_COLORS.md, COLOR_MIGRATION_GUIDE.md
