# 🎯 GOAP Multi-Agent Implementation Plan

## Professional Design System & Feature Enhancements

**Created:** 2025-01-XX  
**Status:** Planning Phase  
**Coordination Model:** Goal-Oriented Action Planning (GOAP) with Sequential Handoffs

---

## 🎭 Agent Definitions & Responsibilities

### Agent 1: Design System Architect

**Role:** Color system refinement and token management  
**Skills:** CSS variables, accessibility (WCAG AAA), color theory  
**Output:** Refined `tokens.css` and `pm-tokens.css`

### Agent 2: Monaco Theme Engineer

**Role:** Editor theme and syntax highlighting  
**Skills:** Monaco editor API, syntax color schemes, VS Code themes  
**Output:** Monaco theme configuration with code syntax colors

### Agent 3: Component Engineer

**Role:** UI component updates and new variants  
**Skills:** React, TypeScript, component patterns  
**Output:** Updated Button, Modal, and new components

### Agent 4: Documentation Writer

**Role:** Design system documentation and prompts  
**Skills:** Technical writing, design specifications  
**Output:** Updated design prompts with validated color system

### Agent 5: Feature Architect

**Role:** Enterprise-scale feature implementation  
**Skills:** Full-stack development, scalability patterns  
**Output:** Tenant switcher, keyboard shortcuts, API token management

---

## 🗺️ Goal Hierarchy (Top → Bottom)

```
MASTER GOAL: Professional B2B Multi-Tenant Prompt Manager
│
├── GOAL 1: Professional Color System [P0 - Critical]
│   ├── Action 1.1: Refine tokens.css with professional palette
│   ├── Action 1.2: Update pm-tokens.css for consistency
│   ├── Action 1.3: Add code syntax color tokens
│   └── Action 1.4: Validate WCAG AAA compliance
│
├── GOAL 2: Monaco Editor Enhancement [P0 - Critical]
│   ├── Action 2.1: Create custom Monaco theme (do-dark)
│   ├── Action 2.2: Configure syntax highlighting colors
│   ├── Action 2.3: Add token counter component
│   └── Action 2.4: Implement live preview pane (split view)
│
├── GOAL 3: Component System Update [P1 - High]
│   ├── Action 3.1: Add Button variants (destructive, ghost)
│   ├── Action 3.2: Create security-themed components
│   ├── Action 3.3: Update existing components with new tokens
│   └── Action 3.4: Add component tests
│
├── GOAL 4: Documentation & Design Prompts [P1 - High]
│   ├── Action 4.1: Update all design prompts with new colors
│   ├── Action 4.2: Create color system documentation
│   ├── Action 4.3: Generate visual comparison (before/after)
│   └── Action 4.4: Write implementation guidelines
│
└── GOAL 5: Enterprise Features [P2 - Medium]
    ├── Action 5.1: Scalable tenant switcher (1000+ tenants)
    ├── Action 5.2: API token management UI
    ├── Action 5.3: Enhanced keyboard shortcuts system
    └── Action 5.4: Dashboard 4-zone layout
```

---

## 📋 Detailed Action Plan with Dependencies

### PHASE 1: Foundation (Agent 1) - Estimated: 45min

**Preconditions:** None  
**Agent:** Design System Architect

#### Action 1.1: Refine `tokens.css`

**Goal:** Professional B2B color palette
**Preconditions:**

- ✅ Research completed (Linear, GitHub, Vercel analysis)
- ✅ WCAG requirements understood

**Tasks:**

1. Remove bright pink/playful colors (#d946ef)
2. Standardize on Tailwind Slate + Indigo
3. Add full color scales (50-950)
4. Add code syntax color tokens
5. Add security/semantic color tokens
6. Validate contrast ratios (7:1 minimum)

**Outputs:**

- `frontend/src/design-system/tokens.css` (refined)
- Color contrast validation report

**Success Criteria:**

- [ ] All primary colors pass WCAG AAA (7:1)
- [ ] Code syntax colors defined
- [ ] Security colors (warning/danger/safe) defined
- [ ] No playful/consumer colors remain

**Handoff to Agent 1 (Action 1.2):** Design tokens file path

---

#### Action 1.2: Update `pm-tokens.css`

**Goal:** Consistency with main token system
**Preconditions:**

- ✅ Action 1.1 completed
- ✅ tokens.css refined

**Tasks:**

1. Align pm-tokens with tokens.css color scales
2. Remove gradient mesh (too playful)
3. Simplify to professional gradients only
4. Update dark mode mappings
5. Ensure semantic color consistency

**Outputs:**

- `frontend/src/design-system/pm-tokens.css` (updated)

**Success Criteria:**

- [ ] PM tokens reference main tokens
- [ ] No color duplication
- [ ] Dark mode colors validated

**Handoff to Agent 2:** Color token variable names + hex codes

---

### PHASE 2: Monaco Editor (Agent 2) - Estimated: 60min

**Preconditions:**

- ✅ Action 1.1, 1.2 completed (syntax colors available)

**Agent:** Monaco Theme Engineer

#### Action 2.1: Create Monaco Theme File

**Goal:** Custom "do-dark" theme for editor

**Tasks:**

1. Create `frontend/src/themes/monaco-do-dark.ts`
2. Map syntax colors from tokens.css
3. Configure editor UI colors (background, selection, line numbers)
4. Define bracket pair colors
5. Set up diff editor colors

**Outputs:**

- `frontend/src/themes/monaco-do-dark.ts`
- `frontend/src/themes/monaco-do-light.ts`

**Success Criteria:**

- [ ] Theme matches VS Code Dark+ feel
- [ ] Syntax highlighting uses token colors
- [ ] Readable on both dark backgrounds (#0f172a, #1e293b)

**Handoff to Agent 2 (Action 2.2):** Theme configuration object

---

#### Action 2.2: Integrate Monaco Theme

**Goal:** Apply theme to RichTextEditor component

**Tasks:**

1. Update `RichTextEditor.tsx` to import custom theme
2. Register theme with Monaco using `monaco.editor.defineTheme()`
3. Add theme switching logic
4. Test with various languages (JSON, Markdown, TypeScript)

**Outputs:**

- Updated `frontend/src/components/RichTextEditor.tsx`

**Success Criteria:**

- [ ] Theme loads correctly
- [ ] Switches with global theme
- [ ] No console errors

**Handoff to Agent 2 (Action 2.3):** Editor component reference

---

#### Action 2.3: Token Counter Component

**Goal:** Real-time token counting UI

**Tasks:**

1. Create `frontend/src/components/TokenCounter.tsx`
2. Implement token counting logic (GPT tokenizer)
3. Add to RichTextEditor footer
4. Debounce counting (300ms)
5. Style with design tokens

**Outputs:**

- `frontend/src/components/TokenCounter.tsx`

**Success Criteria:**

- [ ] Counts tokens accurately
- [ ] Updates on keystroke (debounced)
- [ ] Shows in editor bottom-right

**Handoff to Agent 3:** Component API documentation

---

### PHASE 3: Component Updates (Agent 3) - Estimated: 90min

**Preconditions:**

- ✅ Phase 1 completed (tokens available)

**Agent:** Component Engineer

#### Action 3.1: Button Component Enhancements

**Goal:** Add missing button variants

**Tasks:**

1. Read `frontend/src/components/ui/Button.tsx`
2. Add `variant="destructive"` (red, requires confirmation)
3. Add `variant="ghost"` (transparent, hover bg)
4. Add size variants: sm (32px), md (40px), lg (48px)
5. Update TypeScript types
6. Add tests for new variants

**Outputs:**

- Updated `frontend/src/components/ui/Button.tsx`
- Updated `frontend/src/components/ui/Button.test.tsx`

**Success Criteria:**

- [ ] Destructive button uses semantic error colors
- [ ] Ghost button has subtle hover
- [ ] All sizes render correctly
- [ ] Tests pass

**Handoff to Agent 3 (Action 3.2):** Button component reference

---

#### Action 3.2: Security Components

**Goal:** Token management UI components

**Tasks:**

1. Create `frontend/src/components/TokenBadge.tsx` (warning indicators)
2. Create `frontend/src/components/TokenMasked.tsx` (reveal on click)
3. Create `frontend/src/components/ConfirmDialog.tsx` (destructive actions)
4. Style with security color tokens
5. Add accessibility features

**Outputs:**

- `frontend/src/components/TokenBadge.tsx`
- `frontend/src/components/TokenMasked.tsx`
- `frontend/src/components/ConfirmDialog.tsx`

**Success Criteria:**

- [ ] Security colors prominent (yellow warnings)
- [ ] Token masking works (10s reveal timeout)
- [ ] Confirm dialog requires typing name

**Handoff to Agent 5:** Security component APIs

---

### PHASE 4: Documentation (Agent 4) - Estimated: 60min

**Preconditions:**

- ✅ Phase 1, 2, 3 completed

**Agent:** Documentation Writer

#### Action 4.1: Update Design Prompts

**Goal:** Reflect validated color system in all prompts

**Tasks:**

1. Create `DESIGN_SYSTEM_COLORS.md` with final palette
2. Update Dashboard prompt with exact hex codes
3. Update Monaco Editor prompt with theme details
4. Update Tenant Switcher prompt with component specs
5. Update all prompts to reference tokens.css variables

**Outputs:**

- `DESIGN_SYSTEM_COLORS.md`
- Updated design prompts (in original prompt text)

**Success Criteria:**

- [ ] All prompts use validated colors
- [ ] No references to removed colors (pink #d946ef)
- [ ] Token variable names documented

**Handoff to Agent 4 (Action 4.2):** Documentation structure

---

#### Action 4.2: Visual Comparison Document

**Goal:** Show before/after color changes

**Tasks:**

1. Create `COLOR_MIGRATION_GUIDE.md`
2. Document old → new color mappings
3. Add contrast ratio tables
4. Include accessibility notes
5. Add migration checklist

**Outputs:**

- `COLOR_MIGRATION_GUIDE.md`

**Success Criteria:**

- [ ] Clear mapping table
- [ ] Screenshots/examples included
- [ ] Migration path documented

**Handoff to All Agents:** Migration guide URL

---

### PHASE 5: Enterprise Features (Agent 5) - Estimated: 180min

**Preconditions:**

- ✅ Phase 1-4 completed (foundation ready)

**Agent:** Feature Architect

#### Action 5.1: Scalable Tenant Switcher

**Goal:** Handle 1000+ tenants with search

**Tasks:**

1. Install `@tanstack/react-virtual` (if not present)
2. Create `frontend/src/components/TenantSwitcherAdvanced.tsx`
3. Implement fuzzy search (local filtering <100, API >100)
4. Add virtual scrolling for list
5. Add "recent tenants" pinned section
6. Add keyboard shortcuts (Cmd+Shift+T)
7. Style with dropdown component from design system

**Outputs:**

- `frontend/src/components/TenantSwitcherAdvanced.tsx`
- Updated `package.json` (new dependencies)

**Success Criteria:**

- [ ] Handles 1000+ tenants without lag
- [ ] Search filters instantly
- [ ] Virtual scrolling works
- [ ] Keyboard shortcuts registered

**Dependencies to Install:**

- `@tanstack/react-virtual`

**Handoff to Agent 5 (Action 5.2):** Tenant selector API

---

#### Action 5.2: API Token Management Interface

**Goal:** Complete token lifecycle UI

**Tasks:**

1. Create `frontend/src/pages/TokensPage.tsx`
2. Create `frontend/src/components/TokenTable.tsx` (list view)
3. Create `frontend/src/components/TokenCreateModal.tsx` (multi-step)
4. Create `frontend/src/components/TokenDetailsDrawer.tsx`
5. Implement token CRUD operations (API calls)
6. Add one-time token display warning
7. Add audit log component
8. Style with security color tokens

**Outputs:**

- `frontend/src/pages/TokensPage.tsx`
- Token management components (4 files)
- API integration in `frontend/src/lib/api.ts`

**Success Criteria:**

- [ ] Token creation shows one-time display
- [ ] Revoke requires confirmation ("type name")
- [ ] Token prefixes masked (first 8 chars only)
- [ ] Security warnings visible

**Handoff to Agent 5 (Action 5.3):** Token page route

---

#### Action 5.3: Enhanced Keyboard Shortcuts

**Goal:** Integrate shortcuts throughout app

**Tasks:**

1. Update `frontend/src/components/ui/KeyboardShortcuts.tsx`
2. Add app-specific shortcuts (New Prompt, Save, Test)
3. Create shortcut registry service
4. Add visual indicators on buttons (hover shows shortcut)
5. Implement sequence shortcuts (G+D, G+P)
6. Test conflict resolution

**Outputs:**

- Updated `frontend/src/components/ui/KeyboardShortcuts.tsx`
- `frontend/src/lib/shortcuts.ts` (registry)

**Success Criteria:**

- [ ] All shortcuts work globally
- [ ] Help modal shows all shortcuts
- [ ] No conflicts with browser shortcuts
- [ ] Sequence shortcuts work (G then D)

**Handoff to Agent 5 (Action 5.4):** Shortcut registry

---

#### Action 5.4: Dashboard 4-Zone Layout

**Goal:** Enhanced dashboard per design prompts

**Tasks:**

1. Update `frontend/src/pages/DashboardPage.tsx`
2. Create 4-zone grid layout (tenant selector, metrics, activity, actions)
3. Create `frontend/src/components/ActivityFeed.tsx`
4. Create `frontend/src/components/QuickActions.tsx`
5. Add real-time activity updates (polling or WebSocket)
6. Optimize chart performance

**Outputs:**

- Updated `frontend/src/pages/DashboardPage.tsx`
- Activity feed component
- Quick actions component

**Success Criteria:**

- [ ] 4 zones visible and functional
- [ ] Activity feed shows recent changes
- [ ] Quick actions shortcuts work
- [ ] Layout responsive

**Handoff to QA:** Dashboard for testing

---

## 🔄 Handoff Coordination Points

### Handoff 1: Design System → Monaco Engineer

**From:** Agent 1 (Action 1.2)  
**To:** Agent 2 (Action 2.1)  
**Data Transferred:**

- Color token variable names
- Syntax color hex codes
- Dark/light mode mappings

**Validation:**

- [ ] Syntax colors defined in tokens.css
- [ ] Variables accessible via CSS import

---

### Handoff 2: Monaco Theme → Component Engineer

**From:** Agent 2 (Action 2.3)  
**To:** Agent 3 (Action 3.1)  
**Data Transferred:**

- Component API patterns
- Theme switching mechanism
- Token usage examples

**Validation:**

- [ ] Theme loads in editor
- [ ] Components can query current theme

---

### Handoff 3: Components → Feature Architect

**From:** Agent 3 (Action 3.2)  
**To:** Agent 5 (Action 5.2)  
**Data Transferred:**

- Security component APIs
- Button variants
- Modal/drawer components

**Validation:**

- [ ] All components exported
- [ ] TypeScript types available
- [ ] Components tested

---

### Handoff 4: All Agents → Documentation

**From:** Agents 1, 2, 3, 5  
**To:** Agent 4 (Action 4.1)  
**Data Transferred:**

- Implementation details
- Color values used
- Component names
- Feature capabilities

**Validation:**

- [ ] All new components documented
- [ ] Color system finalized
- [ ] Features implemented

---

## 📊 Success Metrics & Acceptance Criteria

### Global Success Criteria

- [ ] All WCAG AAA contrast requirements met (7:1 minimum)
- [ ] No console errors in browser
- [ ] All TypeScript types valid
- [ ] All tests passing (run `npm test`)
- [ ] Dark mode works correctly
- [ ] Responsive layouts functional (1366px - 1920px)

### Phase-Specific Metrics

**Phase 1 (Design System):**

- Color contrast validator passes all checks
- No playful/consumer colors remain
- Code syntax colors present

**Phase 2 (Monaco):**

- Editor theme loads in <100ms
- Syntax highlighting works for 5+ languages
- Token counter accurate within ±2 tokens

**Phase 3 (Components):**

- Button variants render correctly
- Security components functional
- Component test coverage >80%

**Phase 4 (Documentation):**

- All design prompts updated
- Migration guide complete
- Visual comparisons included

**Phase 5 (Features):**

- Tenant switcher handles 1000+ items
- Token management CRUD works
- Keyboard shortcuts registered (10+)
- Dashboard 4-zone layout complete

---

## 🚀 Execution Order & Timeline

```
Total Estimated Time: 7-8 hours

┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: Foundation (45min)                                  │
│ Agent 1: tokens.css → pm-tokens.css → validation           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: Monaco (60min)                                      │
│ Agent 2: theme → integration → token counter               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├──────────────────┐
                 ▼                  ▼
┌───────────────────────┐  ┌──────────────────────────────────┐
│ PHASE 3: Components   │  │ PHASE 4: Documentation (60min)   │
│ (90min)               │  │ Agent 4: prompts → guide         │
│ Agent 3: Button →     │  └──────────────────────────────────┘
│ Security components   │
└───────────┬───────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 5: Enterprise Features (180min)                        │
│ Agent 5: Tenant Switcher → Tokens → Shortcuts → Dashboard  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Deliverables Checklist

### Code Files (Modified/Created)

- [ ] `frontend/src/design-system/tokens.css` (refined)
- [ ] `frontend/src/design-system/pm-tokens.css` (updated)
- [ ] `frontend/src/themes/monaco-do-dark.ts` (new)
- [ ] `frontend/src/themes/monaco-do-light.ts` (new)
- [ ] `frontend/src/components/RichTextEditor.tsx` (updated)
- [ ] `frontend/src/components/TokenCounter.tsx` (new)
- [ ] `frontend/src/components/ui/Button.tsx` (updated)
- [ ] `frontend/src/components/ui/Button.test.tsx` (updated)
- [ ] `frontend/src/components/TokenBadge.tsx` (new)
- [ ] `frontend/src/components/TokenMasked.tsx` (new)
- [ ] `frontend/src/components/ConfirmDialog.tsx` (new)
- [ ] `frontend/src/components/TenantSwitcherAdvanced.tsx` (new)
- [ ] `frontend/src/pages/TokensPage.tsx` (new)
- [ ] `frontend/src/components/TokenTable.tsx` (new)
- [ ] `frontend/src/components/TokenCreateModal.tsx` (new)
- [ ] `frontend/src/components/TokenDetailsDrawer.tsx` (new)
- [ ] `frontend/src/components/ActivityFeed.tsx` (new)
- [ ] `frontend/src/components/QuickActions.tsx` (new)
- [ ] `frontend/src/pages/DashboardPage.tsx` (updated)
- [ ] `frontend/src/lib/shortcuts.ts` (new)
- [ ] `frontend/package.json` (dependencies added)

### Documentation Files

- [ ] `DESIGN_SYSTEM_COLORS.md` (new)
- [ ] `COLOR_MIGRATION_GUIDE.md` (new)
- [ ] Updated design prompts document
- [ ] `IMPLEMENTATION_PLAN.md` (this file)

---

## 🔧 Dependencies to Install

```bash
npm install @tanstack/react-virtual --workspace frontend
```

---

## ⚠️ Risk Mitigation

### Risk 1: Breaking Changes to Existing Components

**Mitigation:**

- Create color variable aliases during migration
- Test each component after token changes
- Keep old tokens with deprecation warnings

### Risk 2: Monaco Theme Loading Issues

**Mitigation:**

- Implement fallback to default theme
- Add error boundary around editor
- Test theme registration before use

### Risk 3: Performance with 1000+ Tenants

**Mitigation:**

- Implement pagination on backend
- Use virtual scrolling
- Add loading states and skeleton screens

### Risk 4: Keyboard Shortcut Conflicts

**Mitigation:**

- Document all shortcuts
- Allow user customization
- Disable shortcuts in input fields

---

## 📞 Communication Protocol

### Progress Updates

Each agent will update the TODO list after completing their action:

```
Status: "completed" with timestamp
```

### Blockers

If blocked, agent will:

1. Update TODO with status "blocked"
2. Document blocker in plan
3. Notify dependent agents

### Handoff Confirmation

Receiving agent confirms receipt:

```
Action X.Y: Preconditions validated ✓
Inputs received: [list]
```

---

## 🎯 Final Acceptance Test

Before marking complete, run:

```bash
# 1. Type checking
npm run lint

# 2. Tests
npm test

# 3. Build
npm run build:frontend

# 4. E2E tests
npm run test:e2e

# 5. Manual checks
- [ ] Dark mode works
- [ ] Monaco editor loads with custom theme
- [ ] Buttons show all variants
- [ ] Tenant switcher handles 100+ items
- [ ] Keyboard shortcuts work (press ?)
- [ ] Dashboard shows 4 zones
```

---

**Plan Status:** Ready for Execution  
**Next Step:** Begin Phase 1, Action 1.1 (Agent 1: Design System Architect)
