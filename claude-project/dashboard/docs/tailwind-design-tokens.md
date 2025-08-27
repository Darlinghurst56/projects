# Tailwind CSS Design System Integration

This document demonstrates how to use Tailwind CSS classes that map to our existing design system CSS variables.

## Color System

### Primary Colors (Blues)
```html
<!-- Using custom design tokens -->
<div class="bg-primary text-primary-foreground">Primary background</div>
<div class="bg-primary-dark text-white">Dark primary</div>
<div class="bg-primary-light text-white">Light primary</div>

<!-- Using Tailwind scale (still maps to our variables) -->
<div class="bg-primary-500 text-white">Primary 500</div>
<div class="bg-primary-600 text-white">Primary 600</div>
```

### Status Colors
```html
<!-- Success (Green) -->
<div class="bg-success text-success-foreground">Success message</div>
<div class="text-success">Success text</div>

<!-- Warning (Orange) -->
<div class="bg-warning text-warning-foreground">Warning message</div>
<div class="text-warning">Warning text</div>

<!-- Danger (Red) -->
<div class="bg-danger text-danger-foreground">Error message</div>
<div class="text-danger">Error text</div>
```

### Background Colors
```html
<div class="bg-bg-primary">White background</div>
<div class="bg-bg-secondary">Light gray background</div>
<div class="bg-bg-tertiary">Medium gray background</div>
```

### Text Colors
```html
<p class="text-text-primary">Primary text</p>
<p class="text-text-secondary">Secondary text</p>
<p class="text-text-muted">Muted text</p>
<p class="text-text-inverse">Inverse text (white)</p>
```

## Spacing System

Using CSS variable-based spacing:
```html
<div class="p-xs">Extra small padding (0.25rem)</div>
<div class="p-sm">Small padding (0.5rem)</div>
<div class="p-md">Medium padding (1rem)</div>
<div class="p-lg">Large padding (1.5rem)</div>
<div class="p-xl">Extra large padding (2rem)</div>
<div class="p-xxl">Double extra large padding (3rem)</div>

<!-- Margins work the same way -->
<div class="m-md mb-lg">Medium margin with large bottom margin</div>
```

## Border Radius

```html
<div class="rounded-xs">Extra small radius (0.25rem)</div>
<div class="rounded-sm">Small radius (0.25rem)</div>
<div class="rounded">Default radius (0.375rem)</div>
<div class="rounded-md">Medium radius (0.375rem)</div>
<div class="rounded-lg">Large radius (0.75rem)</div>
```

## Shadows

```html
<div class="shadow-sm">Small shadow</div>
<div class="shadow">Default shadow</div>
<div class="shadow-lg">Large shadow</div>
<div class="shadow-widget">Widget shadow (same as default)</div>
<div class="shadow-widget-hover">Widget hover shadow</div>
```

## Dashboard-Specific Classes

### Dashboard Layout
```html
<div class="bg-dashboard-bg text-dashboard-text">Dashboard background</div>
<div class="bg-dashboard-card border-dashboard-border">Dashboard card</div>
<p class="text-dashboard-muted">Dashboard muted text</p>
```

### Agent Status
```html
<span class="text-agent-active">Active agent</span>
<span class="text-agent-inactive">Inactive agent</span>
<span class="text-agent-error">Error state</span>
<span class="text-agent-warning">Warning state</span>
```

## Widget Examples

### Complete Widget with Tailwind
```html
<div class="bg-bg-primary border border-border-color rounded-lg shadow-widget hover:shadow-widget-hover transition-all">
  <!-- Widget Header -->
  <div class="bg-bg-secondary border-b border-border-color p-md flex justify-between items-center">
    <h3 class="text-text-primary font-semibold">Widget Title</h3>
    <div class="flex gap-xs">
      <button class="w-7 h-7 flex items-center justify-center border border-border-color rounded-sm hover:bg-bg-tertiary hover:text-text-primary text-text-secondary transition-fast">
        ↻
      </button>
    </div>
  </div>
  
  <!-- Widget Content -->
  <div class="p-md flex flex-col gap-md">
    <div class="bg-bg-secondary border border-border-color rounded p-md text-center">
      <div class="text-lg font-bold text-primary mb-xs">42</div>
      <div class="text-sm text-text-secondary uppercase tracking-wide">Metric Label</div>
    </div>
  </div>
</div>
```

### Status Indicators
```html
<div class="flex items-center gap-sm">
  <div class="w-3 h-3 rounded-full bg-success"></div>
  <span class="text-sm text-text-primary">Active</span>
</div>

<div class="flex items-center gap-sm">
  <div class="w-3 h-3 rounded-full bg-danger"></div>
  <span class="text-sm text-text-primary">Error</span>
</div>
```

### Buttons
```html
<!-- Primary Button -->
<button class="bg-primary hover:bg-primary-dark text-primary-foreground px-md py-sm rounded font-medium transition-fast">
  Primary Action
</button>

<!-- Success Button -->
<button class="bg-success hover:bg-success-dark text-success-foreground px-md py-sm rounded font-medium transition-fast">
  Success Action
</button>

<!-- Danger Button -->
<button class="bg-danger hover:bg-danger-dark text-danger-foreground px-md py-sm rounded font-medium transition-fast">
  Danger Action
</button>
```

## Migration Guide

### From CSS Classes to Tailwind

Old CSS:
```css
.widget {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: var(--spacing-md);
}
```

New Tailwind:
```html
<div class="bg-bg-primary border border-border-color rounded-lg shadow p-md">
  <!-- content -->
</div>
```

### Responsive Design
```html
<!-- Mobile-first responsive design -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
  <div class="bg-bg-primary p-md rounded">Card 1</div>
  <div class="bg-bg-primary p-md rounded">Card 2</div>
  <div class="bg-bg-primary p-md rounded">Card 3</div>
</div>
```

## Best Practices

1. **Use semantic color names**: Prefer `bg-primary` over `bg-blue-500`
2. **Leverage design tokens**: Use `p-md` instead of `p-4` for consistency
3. **Maintain CSS variable fallbacks**: The design system CSS still works alongside Tailwind
4. **Use transition classes**: Add `transition-fast` for consistent timing
5. **Combine with CSS for complex layouts**: Tailwind complements existing CSS

## Shadcn/UI Compatibility

The configuration maintains compatibility with Shadcn/UI components:
```html
<!-- Shadcn components still work -->
<div class="bg-card text-card-foreground rounded-shadcn-lg border">
  Shadcn card content
</div>
```

This integration provides the best of both worlds: the utility-first approach of Tailwind CSS with the consistency and theming of our existing design system.