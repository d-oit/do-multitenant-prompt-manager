/\*\*

- UI/UX Best Practices Guide
- Prompt Manager - 2025 Modern Web Application
  \*/

# UI/UX Design System & Best Practices

## Table of Contents

1. [Design Principles](#design-principles)
2. [Navigation](#navigation)
3. [Responsive Design](#responsive-design)
4. [Accessibility](#accessibility)
5. [Component Usage](#component-usage)
6. [User Workflows](#user-workflows)
7. [Performance](#performance)

## Design Principles

### 1. **Mobile-First Approach**

Design for mobile devices first, then progressively enhance for larger screens.

**Breakpoints**:

- Mobile: `< 768px`
- Tablet: `768px - 1023px`
- Desktop: `1024px - 1439px`
- Large Desktop: `≥ 1440px`

### 2. **Clarity & Simplicity**

- Clear visual hierarchy
- Minimal cognitive load
- Progressive disclosure
- Consistent patterns

### 3. **Accessibility**

- WCAG 2.1 AA compliant
- Keyboard navigation
- Screen reader support
- High contrast options

### 4. **Performance**

- Fast load times (< 2s)
- Smooth animations (60fps)
- Lazy loading
- Optimistic UI updates

## Navigation

### Desktop Navigation (≥ 1024px)

**Sidebar Layout**:

```
┌──────────┬─────────────────────────────┐
│          │                             │
│          │                             │
│  SIDEBAR │    MAIN CONTENT AREA        │
│          │                             │
│          │                             │
└──────────┴─────────────────────────────┘
```

**Features**:

- Fixed position sidebar (280px width)
- Always visible
- Icon + label for each nav item
- Active state highlighting
- User profile at bottom

**Best Practices**:

- Keep navigation items to 5-7 maximum
- Use descriptive labels (not just icons)
- Highlight active page clearly
- Provide visual feedback on hover

### Mobile Navigation (< 768px)

**Bottom Tab Bar**:

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│         MAIN CONTENT AREA               │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  [Icon]  [Icon]  [Icon]  [Icon]        │
│  Home    Prompts Analytics Tenants      │
└─────────────────────────────────────────┘
```

**Features**:

- Fixed bottom position
- Icon + label for each item
- Thumb-friendly touch targets (48x48px minimum)
- Safe area insets for notched devices
- Badge support for notifications

**Hamburger Menu** (Supplementary):

- Access to profile and settings
- Secondary navigation items
- Slide-in from left
- Backdrop overlay
- Swipe to dismiss

### Tablet Navigation (768px - 1023px)

**Adaptive Layout**:

- Option 1: Collapsible sidebar (icons only, expands on hover)
- Option 2: Top navigation bar with dropdowns
- Option 3: Hybrid (top bar + bottom tabs)

## Responsive Design

### Layout Strategy

#### Mobile (< 768px)

- Single column layout
- Stack elements vertically
- Bottom navigation
- Full-width components
- Touch-optimized interactions

#### Tablet (768px - 1023px)

- Two-column layout where appropriate
- Floating action buttons
- Contextual menus
- Swipe gestures

#### Desktop (≥ 1024px)

- Multi-column layouts
- Sidebar navigation
- Hover states
- Keyboard shortcuts
- Context menus

### Component Responsiveness

```css
/* Mobile-first CSS example */
.card {
  padding: 1rem;
  width: 100%;
}

@media (min-width: 768px) {
  .card {
    padding: 1.5rem;
    width: 48%;
  }
}

@media (min-width: 1024px) {
  .card {
    padding: 2rem;
    width: 32%;
  }
}
```

## Accessibility

### Keyboard Navigation

**Essential Shortcuts**:

- `Tab` / `Shift+Tab`: Navigate between elements
- `Enter` / `Space`: Activate buttons/links
- `Escape`: Close modals/dropdowns
- `Arrow keys`: Navigate lists/menus
- `?`: Show keyboard shortcuts help

**Custom Shortcuts**:

- `Ctrl/Cmd + K`: Global search
- `Ctrl/Cmd + N`: New prompt
- `Ctrl/Cmd + S`: Save
- `Ctrl/Cmd + /`: Focus search

### Screen Reader Support

**ARIA Labels**:

```tsx
// Button with icon only
<button aria-label="Close dialog">
  <CloseIcon aria-hidden="true" />
</button>

// Navigation
<nav role="navigation" aria-label="Main navigation">
  <a href="#" aria-current="page">Dashboard</a>
</nav>

// Form fields
<label htmlFor="title">Prompt Title</label>
<input
  id="title"
  type="text"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "title-error" : undefined}
/>
{hasError && <span id="title-error" role="alert">{error}</span>}
```

### Focus Management

**Principles**:

- Visible focus indicators (2px solid outline)
- Logical tab order
- Focus trapping in modals
- Focus restoration after modal close
- Skip to main content link

```css
/* Modern focus styles */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Color Contrast

**WCAG 2.1 AA Requirements**:

- Normal text: 4.5:1 contrast ratio
- Large text (≥18px): 3:1 contrast ratio
- Interactive elements: 3:1 contrast ratio

**Implementation**:

- Use color + another indicator (icon, underline)
- Test with color blindness simulators
- Provide high contrast mode option

## Component Usage

### Buttons

**Modern 2025 Button States**:

```tsx
// Primary action - use sparingly
<Button variant="primary" size="md">
  Create Prompt
</Button>

// Secondary action
<Button variant="secondary" size="md">
  Cancel
</Button>

// Subtle action
<Button variant="ghost" size="sm">
  Edit
</Button>

// Destructive action
<Button variant="danger" size="md">
  Delete
</Button>

// Loading state
<Button variant="primary" disabled>
  <Spinner size="sm" />
  Saving...
</Button>

// With icon
<Button variant="primary">
  <PlusIcon />
  New Prompt
</Button>
```

**Button Hierarchy**:

1. **Primary**: Main call-to-action (1 per screen)
2. **Secondary**: Alternative actions
3. **Ghost**: Tertiary or less important actions
4. **Danger**: Destructive actions (with confirmation)

**Size Guidelines**:

- `lg`: Hero CTAs, important actions
- `md`: Standard buttons (default)
- `sm`: Compact spaces, inline actions
- `xs`: Tags, badges, minimal UI

### Forms

**Modern Form Best Practices**:

```tsx
<form>
  {/* Always use labels */}
  <Field>
    <label htmlFor="title">Title *</label>
    <Input id="title" type="text" placeholder="Enter prompt title" required />
    <FieldHint>A descriptive title for your prompt</FieldHint>
  </Field>

  {/* Validation */}
  <Field error={errors.body}>
    <label htmlFor="body">Body *</label>
    <Textarea
      id="body"
      placeholder="Enter prompt content"
      aria-invalid={!!errors.body}
      aria-describedby={errors.body ? "body-error" : undefined}
    />
    {errors.body && <FieldError id="body-error">{errors.body}</FieldError>}
  </Field>

  {/* Autocomplete for better UX */}
  <Field>
    <label htmlFor="email">Email</label>
    <Input id="email" type="email" autoComplete="email" />
  </Field>

  {/* Action buttons */}
  <div className="form-actions">
    <Button type="submit" variant="primary">
      Save
    </Button>
    <Button type="button" variant="secondary" onClick={onCancel}>
      Cancel
    </Button>
  </div>
</form>
```

**Form Validation**:

- Real-time validation (on blur)
- Clear error messages
- Inline errors near fields
- Summary of errors at top
- Prevent submission if invalid

### Modals

**Modal Best Practices**:

```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Create New Prompt" size="lg">
  <ModalHeader>
    <h2>Create New Prompt</h2>
    <CloseButton onClick={onClose} aria-label="Close dialog" />
  </ModalHeader>

  <ModalBody>{/* Content */}</ModalBody>

  <ModalFooter>
    <Button variant="secondary" onClick={onClose}>
      Cancel
    </Button>
    <Button variant="primary" onClick={onSave}>
      Create
    </Button>
  </ModalFooter>
</Modal>
```

**Modal Guidelines**:

- Focus management (trap focus, restore on close)
- Escape key to close
- Click outside to close (optional)
- Scrollable content area
- Responsive sizing
- Backdrop overlay (semi-transparent)

### Tables

**Responsive Table Pattern**:

```tsx
// Desktop: Standard table
// Mobile: Card-based layout

<div className="table-container">
  <table className="data-table">
    <thead>
      <tr>
        <th>
          <Button variant="ghost" onClick={sortBy("title")}>
            Title
            <SortIcon direction={sortDirection} />
          </Button>
        </th>
        <th>Created</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {data.map((row) => (
        <tr key={row.id}>
          <td data-label="Title">{row.title}</td>
          <td data-label="Created">{formatDate(row.createdAt)}</td>
          <td data-label="Actions">
            <Button variant="ghost" size="sm">
              Edit
            </Button>
            <Button variant="ghost" size="sm">
              Delete
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Mobile Table CSS**:

```css
@media (max-width: 767px) {
  .data-table thead {
    display: none;
  }

  .data-table tbody tr {
    display: block;
    margin-bottom: 1rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
  }

  .data-table tbody td {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem;
    border-bottom: 1px solid var(--color-border-light);
  }

  .data-table tbody td::before {
    content: attr(data-label);
    font-weight: 600;
    margin-right: 1rem;
  }
}
```

## User Workflows

### CRUD Operations for Prompts

#### 1. **Create Prompt**

**Flow**:

```
User clicks "New Prompt" button
       ↓
Modal/Drawer opens
       ↓
User fills form (title, body, tags, metadata)
       ↓
Real-time validation
       ↓
User clicks "Create"
       ↓
Loading state
       ↓
Success: Toast notification + Close modal + Refresh list
Error: Show error inline + Keep modal open
```

**UX Enhancements**:

- Autosave drafts to localStorage
- Markdown preview for body
- Tag autocomplete
- Template selection
- Keyboard shortcut (Ctrl/Cmd + N)

#### 2. **Read/View Prompt**

**Flow**:

```
User clicks "View" button or prompt title
       ↓
Detail view opens (modal or side panel)
       ↓
Show prompt content, metadata, versions
       ↓
Provide actions: Edit, Delete, Copy, Share
```

**UX Enhancements**:

- Syntax highlighting
- Copy to clipboard button
- Version history timeline
- Quick actions toolbar
- Keyboard navigation

#### 3. **Update Prompt**

**Flow**:

```
User clicks "Edit" button
       ↓
Edit modal opens with current values
       ↓
User modifies fields
       ↓
User clicks "Save"
       ↓
Optimistic UI update
       ↓
Success: Toast + Close modal
Error: Revert changes + Show error
```

**UX Enhancements**:

- Unsaved changes warning
- Version comparison
- Auto-save (with indicator)
- Cancel confirmation if dirty
- Keyboard shortcut (Ctrl/Cmd + S)

#### 4. **Delete Prompt**

**Flow**:

```
User clicks "Delete" button
       ↓
Confirmation dialog
       ↓
User confirms
       ↓
Optimistic UI removal
       ↓
Success: Toast + Item removed
Error: Restore item + Show error
```

**UX Enhancements**:

- Two-step confirmation for safety
- Show preview of what's being deleted
- Undo option (within 5 seconds)
- Bulk delete with confirmation
- Soft delete (recoverable)

### Search & Filter

**Advanced Search Features**:

```tsx
<SearchBar
  placeholder="Search prompts by title, tags, or content..."
  onSearch={handleSearch}
  onClear={handleClear}
  shortcuts={['/', 'Ctrl+K']}
/>

<FilterPanel>
  <FilterSection title="Tags">
    <TagFilter tags={availableTags} selected={selectedTags} />
  </FilterSection>

  <FilterSection title="Date Range">
    <DateRangePicker />
  </FilterSection>

  <FilterSection title="Created By">
    <UserFilter users={users} />
  </FilterSection>
</FilterPanel>
```

**Search Best Practices**:

- Instant search (debounced, 300ms)
- Search history
- Fuzzy matching
- Highlight matches
- Filter persistence (URL params)
- Clear filters button
- Active filter indicators

## Performance

### Optimization Techniques

#### 1. **Code Splitting**

```tsx
// Lazy load pages
const PromptsPage = lazy(() => import("./pages/PromptsPage"));

// Suspense boundary
<Suspense fallback={<PageSkeleton />}>
  <PromptsPage />
</Suspense>;
```

#### 2. **Image Optimization**

- Use WebP format with fallbacks
- Lazy load images below fold
- Responsive images with srcset
- Proper sizing (width/height attributes)

#### 3. **Virtual Scrolling**

- For long lists (>100 items)
- Render only visible items
- Smooth scrolling experience

#### 4. **Optimistic UI**

```tsx
// Update UI immediately, rollback if fails
const handleCreate = async (data) => {
  const tempId = `temp-${Date.now()}`;

  // Optimistically add to list
  setPrompts((prev) => [{ id: tempId, ...data }, ...prev]);

  try {
    const created = await api.createPrompt(data);
    // Replace temp with real data
    setPrompts((prev) => prev.map((p) => (p.id === tempId ? created : p)));
  } catch (error) {
    // Rollback on error
    setPrompts((prev) => prev.filter((p) => p.id !== tempId));
    showError(error.message);
  }
};
```

### Loading States

**Skeleton Screens**:

```tsx
// Better than spinners for known layouts
<Card>
  <Skeleton height={24} width="60%" />
  <Skeleton height={16} width="40%" />
  <Skeleton height={100} />
</Card>
```

**Progressive Loading**:

1. Show skeleton immediately
2. Load critical content first
3. Load secondary content
4. Load below-fold content

## Dark Mode

### Implementation

**CSS Variables**:

```css
:root {
  --color-background: #ffffff;
  --color-text: #1a1a1a;
  --color-primary: #3b82f6;
}

[data-theme="dark"] {
  --color-background: #1a1a1a;
  --color-text: #ffffff;
  --color-primary: #60a5fa;
}
```

**Theme Toggle**:

- Light mode
- Dark mode
- System preference (default)
- Persist user choice

### Design Considerations

**Dark Mode Principles**:

- Reduce pure black (#000000) → Use #1a1a1a or similar
- Adjust colors for WCAG compliance
- Reduce white (#ffffff) → Use #f5f5f5
- Test all states (hover, focus, disabled)

## Animations

### Micro-interactions

**Guidelines**:

- Duration: 150-300ms for UI feedback
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` for smooth feel
- Purposeful: Indicate state changes, guide attention
- Respectful: Honor `prefers-reduced-motion`

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Common Animations**:

- Button press: `transform: scale(0.95)`
- Modal enter: Fade + slide up
- Toast: Slide in from edge
- Loading: Pulse or spin
- Success: Checkmark animation

## Mobile-Specific Patterns

### Touch Interactions

**Touch Targets**:

- Minimum 48x48px (Apple HIG & Material Design)
- Spacing between targets: 8px minimum
- Larger targets for primary actions

**Gestures**:

- Swipe to delete
- Pull to refresh
- Swipe to navigate (back/forward)
- Long press for context menu
- Pinch to zoom (where appropriate)

### Mobile Navigation

**Bottom Sheet**:

```tsx
<BottomSheet isOpen={isOpen} onClose={onClose}>
  <BottomSheetHeader>
    <h3>Actions</h3>
  </BottomSheetHeader>
  <BottomSheetBody>
    <ActionList>
      <Action icon={<EditIcon />} onClick={onEdit}>
        Edit
      </Action>
      <Action icon={<ShareIcon />} onClick={onShare}>
        Share
      </Action>
      <Action icon={<DeleteIcon />} danger onClick={onDelete}>
        Delete
      </Action>
    </ActionList>
  </BottomSheetBody>
</BottomSheet>
```

### Safe Areas

```css
/* Account for notches and rounded corners */
.app-header {
  padding-top: env(safe-area-inset-top);
}

.app-bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}
```

## Testing Your UI

### Accessibility Testing

**Tools**:

- axe DevTools (browser extension)
- Lighthouse (Chrome DevTools)
- NVDA/JAWS screen readers
- Keyboard-only navigation test

**Checklist**:

- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] ARIA labels present and accurate
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader announces content correctly
- [ ] Forms have proper labels and validation

### Responsive Testing

**Devices to Test**:

- iPhone SE (375px)
- iPhone 14 Pro (393px)
- Pixel 7 (412px)
- iPad (768px)
- Desktop (1920px)

**Chrome DevTools**:

- Device mode
- Network throttling
- Touch simulation

## Resources

- [Material Design 3](https://m3.material.io/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Project](https://www.a11yproject.com/)

## Conclusion

This guide provides a foundation for building a modern, accessible, and performant web application in 2025. Always prioritize:

1. **User needs** over technical preferences
2. **Accessibility** as a core feature
3. **Performance** as a user experience metric
4. **Consistency** across all touchpoints
5. **Feedback** loops for continuous improvement

Remember: Great UX is invisible. Users should accomplish their goals without thinking about the interface.
