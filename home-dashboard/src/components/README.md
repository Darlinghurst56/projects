# Component Organization Standards

## Directory Structure

```
components/
├── auth/           # Authentication-related components
├── ai/             # AI chat and related features
├── dns/            # DNS monitoring widgets
├── google/         # Google services integration
├── layout/         # Layout and navigation components
├── meal/           # Meal planning features
└── doc-coverage/   # Documentation tools
```

## Component Standards

### File Naming
- Use PascalCase for component files: `MyWidget.jsx`
- Co-locate CSS files with components: `MyWidget.css`
- Export components using named exports: `export const MyWidget = () => {}`

### Component Structure
1. **Imports** - External libraries first, then internal imports
2. **Component Definition** - Use functional components with hooks
3. **Props Validation** - Use PropTypes for prop validation where beneficial
4. **Exports** - Use named exports for better tree-shaking

### State Management
- Use `useState` for local component state
- Use `useAuth` context for authentication state
- Use `useEffect` for side effects and cleanup
- Use `useCallback` and `useMemo` for performance optimization where needed

### Widget Guidelines
- Each widget should be self-contained
- Handle loading and error states appropriately
- Support both authenticated and guest modes where applicable
- Include proper cleanup in `useEffect` return functions

### CSS Organization
- Keep component-specific styles in co-located CSS files
- Use semantic class names
- Avoid deep nesting (max 3 levels)
- Use CSS custom properties for theming

## Example Component Template

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './MyWidget.css';

export const MyWidget = ({ title, refreshInterval = 30000 }) => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch data logic here
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  if (loading) return <div className="widget-loading">Loading...</div>;
  if (error) return <div className="widget-error">Error: {error}</div>;

  return (
    <div className="my-widget">
      <h3 className="widget-title">{title}</h3>
      <div className="widget-content">
        {/* Widget content */}
      </div>
    </div>
  );
};
```

## Family Dashboard Best Practices

1. **Family-focused functionality** - Each component serves a specific family need
2. **Safe error handling** - Family-friendly error messages and graceful degradation
3. **Accessible design** - Readable by all family members, including children
4. **Age-appropriate content** - Content filtering and access controls
5. **Clear documentation** - Comments explain family use cases and safety features
6. **Reliable performance** - Stable operation for busy family environments
7. **Privacy protection** - Secure handling of family data and communications

## Family Dashboard Performance

- Use `React.memo` for complex family widgets that update frequently
- Use `useCallback` for family interaction handlers
- Use `useMemo` for family data calculations and filtering
- Implement proper cleanup to prevent issues during family use
- Lazy load educational content and large family features
- Optimize for family devices (tablets, shared computers)
- Ensure smooth operation during peak family usage times

## Family Safety Guidelines

- **Content Filtering**: All AI responses and external content should be family-appropriate
- **Access Controls**: Different features for parents, children, and guests
- **Privacy Protection**: Secure handling of family calendars, emails, and personal data
- **Error Recovery**: Gentle error handling that doesn't disrupt family activities
- **Monitoring**: Appropriate system monitoring without being intrusive
- **Documentation**: Clear help text that parents and children can understand