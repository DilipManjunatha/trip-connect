# Refactoring UI to Use Headless UI Components and Modern Design System

## Current State Analysis

### Issues Identified:
1. **Custom Modals**: 8+ pages use manual div-based modals without accessibility features
2. **Basic Selects**: Native HTML selects without search/filter capabilities
3. **No Design System**: Inconsistent spacing, colors, typography across components
4. **Headless UI Unused**: Package installed but no components implemented
5. **No Reusable Components**: Each page duplicates modal/form patterns
6. **Limited Accessibility**: Missing ARIA attributes, focus management, keyboard navigation

### Components to Refactor:
- **Modals**: Tags, Lists, Contacts, Groups, Expenses, Itinerary, Users (7 total)
- **Selects**: Expense categories, Split types, Tag selection, Role selection
- **Forms**: All form inputs need consistent styling
- **Buttons**: Various button styles need standardization
- **Navigation**: Sidebar navigation could use Menu component

## Implementation Plan

### Phase 1: Design System Foundation

#### 1.1 Create Design Tokens
**File**: `frontend/src/design-system/tokens.ts`

Create comprehensive design tokens:
- **Colors**: Primary, secondary, semantic (success, error, warning), neutral palette
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Consistent spacing scale (4px base unit)
- **Shadows**: Elevation system
- **Border Radius**: Consistent rounding
- **Transitions**: Animation timings and easing

#### 1.2 Update Tailwind Config
**File**: `frontend/tailwind.config.js`

Extend Tailwind with design tokens:
- Complete color palette (currently only has primary-50, 500, 600, 700)
- Typography scale
- Spacing scale
- Shadow system
- Custom utilities

#### 1.3 Create Theme Provider
**File**: `frontend/src/design-system/ThemeProvider.tsx`

Optional theme provider for future dark mode support.

### Phase 2: Reusable Component Library

#### 2.1 Modal Component (Dialog)
**File**: `frontend/src/components/ui/Modal.tsx`

Replace all custom modals with Headless UI Dialog:
- Uses `@headlessui/react` Dialog component
- Proper focus trap and ESC key handling
- Backdrop with transition
- Accessible by default
- Props: `open`, `onClose`, `title`, `children`, `size` (sm, md, lg, xl)

**Usage Pattern**:
```tsx
<Modal open={isOpen} onClose={handleClose} title="Create Tag">
  <form>...</form>
</Modal>
```

#### 2.2 Select Component (Listbox)
**File**: `frontend/src/components/ui/Select.tsx`

Replace native selects with Headless UI Listbox:
- Searchable/filterable options
- Keyboard navigation
- Custom styling
- Props: `value`, `onChange`, `options`, `placeholder`, `label`

#### 2.3 Combobox Component
**File**: `frontend/src/components/ui/Combobox.tsx`

For searchable selects (tag selection, user search):
- Uses Headless UI Combobox
- Async search support
- Multi-select capability

#### 2.4 Menu Component
**File**: `frontend/src/components/ui/Menu.tsx`

For dropdown menus (user actions, context menus):
- Uses Headless UI Menu
- Proper keyboard navigation
- Accessible by default

#### 2.5 Button Component
**File**: `frontend/src/components/ui/Button.tsx`

Standardized button with variants:
- Primary, Secondary, Outline, Ghost, Danger
- Sizes: sm, md, lg
- Loading state
- Icon support

#### 2.6 Input Component
**File**: `frontend/src/components/ui/Input.tsx`

Standardized input with:
- Label, helper text, error states
- Icon support (left/right)
- Consistent styling

#### 2.7 FormField Component
**File**: `frontend/src/components/ui/FormField.tsx`

Wrapper for form fields with:
- Label
- Helper text
- Error message
- Required indicator

#### 2.8 Card Component
**File**: `frontend/src/components/ui/Card.tsx`

Standardized card component with variants.

#### 2.9 Badge/Chip Component
**File**: `frontend/src/components/ui/Badge.tsx`

For tags, status indicators, etc.

### Phase 3: Refactor Pages

#### 3.1 Tags Page
**File**: `frontend/src/pages/Tags.tsx`

Replacements:
- Custom modal → `<Modal>` component
- Native selects → `<Select>` or `<Combobox>`
- Buttons → `<Button>` component
- Forms → Use `<FormField>` and `<Input>`

#### 3.2 Lists Page
**File**: `frontend/src/pages/Lists.tsx`

Replacements:
- Custom modal → `<Modal>` component
- Tag select → `<Combobox>` for searchable tag selection
- Forms → Standardized form components

#### 3.3 Contacts Page
**File**: `frontend/src/pages/Contacts.tsx`

Replacements:
- Custom modal → `<Modal>` component
- Tag selection → `<Combobox>` with multi-select
- Form inputs → `<Input>` and `<FormField>`

#### 3.4 Groups Page
**File**: `frontend/src/pages/Groups.tsx`

Replacements:
- Custom modals (2) → `<Modal>` components
- Member selection → `<Combobox>` for user/contact search
- Date inputs → Consider date picker component
- Forms → Standardized components

#### 3.5 Expenses Page
**File**: `frontend/src/pages/Expenses.tsx`

Replacements:
- Custom modal → `<Modal>` component
- Category select → `<Select>` component
- Split type select → `<Select>` component
- Forms → Standardized components

#### 3.6 Itinerary Page
**File**: `frontend/src/pages/Itinerary.tsx`

Replacements:
- Custom modal → `<Modal>` component
- Date/time inputs → Date/time picker components
- Forms → Standardized components

#### 3.7 Users Page
**File**: `frontend/src/pages/Users.tsx`

Replacements:
- Custom modals (2) → `<Modal>` components
- Role select → `<Select>` component
- Action menus → `<Menu>` component for user actions
- Forms → Standardized components

### Phase 4: Enhanced Components

#### 4.1 DatePicker Component
**File**: `frontend/src/components/ui/DatePicker.tsx`

For date selection in Groups, Itinerary:
- Uses Headless UI Popover + Calendar
- Or integrate existing react-datepicker with Headless UI styling

#### 4.2 Tabs Component
**File**: `frontend/src/components/ui/Tabs.tsx`

If needed for tabbed interfaces:
- Uses Headless UI Tabs

#### 4.3 Disclosure Component
**File**: `frontend/src/components/ui/Disclosure.tsx`

For collapsible sections:
- Uses Headless UI Disclosure
- Can replace progressive disclosure patterns

#### 4.4 Toast/Notification System
**File**: `frontend/src/components/ui/Toast.tsx`

Enhance or replace react-hot-toast with Headless UI-based notifications.

### Phase 5: Layout Improvements

#### 5.1 Navigation Menu
**File**: `frontend/src/components/Layout.tsx`

Enhance sidebar navigation:
- Consider using Headless UI Menu for mobile responsive menu
- Add transition animations

#### 5.2 Search Components
**File**: `frontend/src/components/ui/SearchInput.tsx`

Standardized search input with:
- Icon
- Clear button
- Loading state

### Phase 6: Accessibility & Polish

#### 6.1 Focus Management
- Ensure all interactive elements have proper focus states
- Add skip links for keyboard navigation
- Test with screen readers

#### 6.2 Animations
- Add smooth transitions using Headless UI Transition
- Consistent animation timing
- Respect prefers-reduced-motion

#### 6.3 Responsive Design
- Ensure all components work on mobile
- Test breakpoints
- Mobile-friendly modals and menus

## File Structure

```
frontend/src/
├── design-system/
│   ├── tokens.ts
│   ├── ThemeProvider.tsx
│   └── index.ts
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Combobox.tsx
│   │   ├── Modal.tsx
│   │   ├── Menu.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── FormField.tsx
│   │   ├── DatePicker.tsx
│   │   ├── Tabs.tsx
│   │   ├── Disclosure.tsx
│   │   └── SearchInput.tsx
│   └── [existing components]
└── pages/
    └── [all pages refactored]
```

## Implementation Order

### Week 1: Foundation
1. Create design tokens and update Tailwind config
2. Build core UI components (Button, Input, FormField)
3. Build Modal component
4. Refactor 2-3 pages as proof of concept

### Week 2: Core Components
5. Build Select and Combobox components
6. Build Menu component
7. Build Card and Badge components
8. Refactor remaining pages

### Week 3: Enhanced Features
9. Build DatePicker component
10. Build Tabs and Disclosure if needed
11. Enhance Layout with improved navigation
12. Add animations and transitions

### Week 4: Polish & Testing
13. Accessibility audit and fixes
14. Responsive design testing
15. Performance optimization
16. Documentation

## Design System Specifications

### Color Palette
```typescript
colors: {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  gray: { /* Full scale */ },
  success: { /* Green scale */ },
  error: { /* Red scale */ },
  warning: { /* Yellow scale */ },
}
```

### Typography Scale
```typescript
fontSize: {
  xs: ['0.75rem', { lineHeight: '1rem' }],
  sm: ['0.875rem', { lineHeight: '1.25rem' }],
  base: ['1rem', { lineHeight: '1.5rem' }],
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  xl: ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  // ... more sizes
}
```

### Spacing Scale
Based on 4px unit: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96

### Shadow System
```typescript
boxShadow: {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
}
```

## Benefits

1. **Accessibility**: Headless UI components are accessible by default
2. **Consistency**: Design system ensures visual consistency
3. **Maintainability**: Reusable components reduce code duplication
4. **User Experience**: Better interactions, animations, keyboard navigation
5. **Developer Experience**: Easier to build new features with component library
6. **Modern Look**: Professional, polished UI matching current design trends

## Migration Strategy

1. Build components alongside existing code
2. Refactor one page at a time
3. Test thoroughly before moving to next page
4. Keep old code until new implementation is verified
5. Update documentation as components are created

## Testing Checklist

- [ ] All modals accessible via keyboard
- [ ] All selects searchable and keyboard navigable
- [ ] Forms have proper validation and error states
- [ ] Components work on mobile devices
- [ ] Screen reader compatibility
- [ ] Focus management works correctly
- [ ] Animations respect reduced motion preference
- [ ] All pages maintain functionality after refactor
