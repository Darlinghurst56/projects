# Control D Dashboard Design Guidelines

## Overview
This document establishes design guidelines for the Control D Dashboard to ensure consistency, accessibility, and optimal user experience across all dashboard components.

## Accessibility Standards

### WCAG 2.1 AA Compliance
- All interactive elements must have accessible names
- Color contrast ratio minimum 4.5:1 for normal text
- Color contrast ratio minimum 3:1 for large text
- All functionality available via keyboard navigation
- Support for screen readers and assistive technologies

### Icon Usage
- **Prohibited**: Direct emoji usage in critical interface elements
- **Recommended**: 
  - SVG icons with proper ARIA attributes
  - Text-based icons (↻, ⚡, ⚙) for simple actions
  - Icons wrapped in `aria-hidden="true"` spans
  - Descriptive `aria-label` attributes on interactive elements

### Status Indicators
- Use colored circles/dots with accompanying text
- Never rely solely on color to convey information
- Include ARIA live regions for dynamic status updates
- Text alternatives for all visual status indicators

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Hierarchy
- **H1 (Dashboard Title)**: 2.25rem, font-weight: 700, line-height: 1.2
- **H2 (Section Headers)**: 1.5rem, font-weight: 600, line-height: 1.3
- **H3 (Widget Titles)**: 1.25rem, font-weight: 600, line-height: 1.3
- **Body Text**: 1rem, font-weight: 400, line-height: 1.5
- **Small Text**: 0.875rem, font-weight: 400, line-height: 1.4

### Text Contrast
- Primary text: `#212529` on light backgrounds
- Secondary text: `#6c757d` for supporting information
- Inverse text: `#ffffff` on dark backgrounds

## Color Palette

### Primary Colors
- **Primary Blue**: `#007bff` (main action color)
- **Primary Dark**: `#0056b3` (hover states)
- **Primary Light**: `#3395ff` (accents)

### Semantic Colors
- **Success**: `#28a745` (completed tasks, positive states)
- **Warning**: `#ffc107` (pending tasks, caution states)
- **Danger**: `#dc3545` (errors, critical actions)
- **Info**: `#007bff` (informational content)

### Background Colors
- **Primary Background**: `#ffffff` (main content areas)
- **Secondary Background**: `#f8f9fa` (widget headers, subtle backgrounds)
- **Tertiary Background**: `#e9ecef` (borders, dividers)

### Border Colors
- **Default Border**: `#dee2e6`
- **Dark Border**: `#adb5bd` (stronger emphasis)

## Layout & Spacing

### Grid System
- Use CSS Grid for main dashboard layouts
- Minimum widget width: 300px
- Responsive breakpoints:
  - Mobile: < 768px (single column)
  - Tablet: 768px - 1024px (2 columns)
  - Desktop: > 1024px (3+ columns)

### Spacing Scale
- **XS**: 0.25rem (4px)
- **SM**: 0.5rem (8px)
- **MD**: 1rem (16px) - default spacing
- **LG**: 1.5rem (24px)
- **XL**: 2rem (32px)
- **XXL**: 3rem (48px)

### Border Radius
- **Small**: 0.25rem (4px) - buttons, form elements
- **Medium**: 0.375rem (6px) - default
- **Large**: 0.75rem (12px) - cards, widgets

## Interactive Elements

### Buttons
```css
.nav-button {
    padding: 10px 18px;
    background: rgba(255, 255, 255, 0.15);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.nav-button:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
}
```

### Form Elements
- All form elements must have associated labels
- Use `aria-label` for elements without visible labels
- Focus indicators required on all interactive elements
- Placeholder text should not be sole source of labeling

### Status Indicators
```css
.status-indicator {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 0.5rem;
}

.status-done { background-color: #28a745; }
.status-progress { background-color: #007bff; }
.status-pending { background-color: #ffc107; }
```

## Widget Design

### Standard Widget Structure
```html
<div class="widget-card" role="region" aria-label="Widget Name">
    <h3 class="widget-title">
        <span class="widget-icon" aria-hidden="true">📊</span>
        Widget Name
    </h3>
    <div class="widget-content">
        <!-- Widget content -->
    </div>
</div>
```

### Widget States
- **Loading**: Subtle opacity change with loading indicator
- **Error**: Red border with error message
- **Empty**: Placeholder content with helpful instructions
- **Active**: Standard appearance with full functionality

## Navigation

### Primary Navigation
- Clear, descriptive button labels
- Icons supplement text, never replace it
- Consistent button styling across all views
- Keyboard accessible with proper focus management

### Breadcrumbs
- Use when navigation depth > 2 levels
- Include "Home" or main dashboard link
- Separate levels with "/" or ">"
- Make each level clickable (except current)

## Information Hierarchy

### Dashboard Organization
1. **Header**: Branding, primary navigation, user controls
2. **Main Content**: Widget grid with essential functionality
3. **Footer**: Secondary information, links

### Widget Priority
1. **Critical Actions**: Prominently placed, high contrast
2. **Frequently Used**: Easy to access, well-labeled
3. **Secondary Functions**: Available but not prominent
4. **Rarely Used**: In menus or secondary screens

## Responsive Design

### Mobile Considerations
- Single column layout on mobile devices
- Touch-friendly button sizes (minimum 44px)
- Simplified navigation for small screens
- Prioritize essential functions

### Tablet Considerations
- Two-column grid layout
- Maintain desktop functionality
- Optimize for both portrait and landscape

### Desktop Considerations
- Multi-column grid (3+ columns on wide screens)
- Full feature set available
- Efficient use of screen real estate

## Performance Guidelines

### CSS
- Use CSS custom properties for theming
- Minimize use of complex selectors
- Prefer flexbox and grid for layouts
- Use efficient transitions and animations

### Images and Icons
- Prefer SVG icons over bitmap images
- Optimize all images for web delivery
- Use appropriate image formats (WebP when supported)

### Loading States
- Provide loading indicators for async operations
- Progressive loading for large datasets
- Graceful degradation when content fails to load

## Content Guidelines

### Microcopy
- Use clear, action-oriented button labels
- Provide helpful error messages
- Include context in tooltips and help text
- Write for international audiences (simple English)

### Data Presentation
- Use consistent formatting for dates and times
- Round numbers appropriately for context
- Provide units for all measurements
- Use tables for tabular data, not for layout

## Implementation Checklist

### For Each New Component
- [ ] Follows established color palette
- [ ] Uses consistent typography scale
- [ ] Includes proper ARIA labels
- [ ] Supports keyboard navigation
- [ ] Has focus indicators
- [ ] Meets color contrast requirements
- [ ] Works on mobile devices
- [ ] Includes loading and error states
- [ ] Has been tested with screen readers

### Before Release
- [ ] Cross-browser compatibility tested
- [ ] Accessibility audit completed
- [ ] Performance benchmarks met
- [ ] Design consistency verified
- [ ] Documentation updated

## Tools and Resources

### Accessibility Testing
- WAVE Web Accessibility Evaluator
- axe DevTools
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Keyboard navigation testing

### Design Tools
- Color contrast checkers
- Typography scale calculators
- Grid layout planning tools
- Icon libraries (Heroicons, Feather Icons)

### Development Tools
- CSS custom properties for theming
- CSS Grid and Flexbox for layouts
- Semantic HTML for accessibility
- Progressive enhancement principles

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Maintained By**: UI Development Team