#!/usr/bin/env node

/**
 * Design System MCP Server
 * Consistent UI component library for home dashboard
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import puppeteer from 'puppeteer';

export class DesignSystemMCP {
  constructor() {
    this.server = new Server({
      name: 'design-system-mcp',
      version: '1.0.0',
      description: 'Consistent UI component library for home dashboard'
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.designTokens = {
      colors: {
        primary: '#007bff',
        primaryDark: '#0056b3',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545',
        background: '#f8f9fa',
        backgroundWhite: '#ffffff',
        text: '#212529',
        textMuted: '#6c757d'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        sizes: {
          xs: '12px',
          sm: '14px',
          md: '16px',
          lg: '18px',
          xl: '24px'
        }
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px'
      },
      shadows: {
        sm: '0 2px 4px rgba(0,0,0,0.1)',
        md: '0 2px 8px rgba(0,0,0,0.1)',
        lg: '0 4px 12px rgba(0,0,0,0.2)'
      }
    };

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'generate_component',
          description: 'Generate a standardized UI component with consistent styling',
          inputSchema: {
            type: 'object',
            properties: {
              componentType: {
                type: 'string',
                description: 'Type of component to generate',
                enum: ['button', 'card', 'form', 'navigation', 'modal', 'notification', 'table', 'widget', 'family-dashboard', 'agent-card', 'task-card', 'status-indicator', 'quick-action']
              },
              variant: {
                type: 'string',
                description: 'Component variant',
                enum: ['primary', 'secondary', 'success', 'warning', 'danger', 'minimal']
              },
              size: {
                type: 'string',
                description: 'Component size',
                enum: ['small', 'medium', 'large']
              },
              props: {
                type: 'object',
                description: 'Additional component properties'
              }
            },
            required: ['componentType']
          }
        },
        {
          name: 'validate_design_consistency',
          description: 'Validate design consistency across dashboard components',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'Dashboard URL to validate'
              },
              focus: {
                type: 'string',
                description: 'Focus area for validation',
                enum: ['colors', 'typography', 'spacing', 'components', 'all']
              }
            },
            required: ['url']
          }
        },
        {
          name: 'generate_design_tokens',
          description: 'Generate design tokens for consistent styling',
          inputSchema: {
            type: 'object',
            properties: {
              format: {
                type: 'string',
                description: 'Output format for design tokens',
                enum: ['css', 'scss', 'js', 'json']
              },
              theme: {
                type: 'string',
                description: 'Theme variant',
                enum: ['light', 'dark', 'high-contrast']
              }
            },
            required: ['format']
          }
        },
        {
          name: 'create_component_library',
          description: 'Create a complete component library documentation',
          inputSchema: {
            type: 'object',
            properties: {
              components: {
                type: 'array',
                description: 'List of components to include',
                items: {
                  type: 'string',
                  enum: ['button', 'card', 'form', 'navigation', 'modal', 'notification', 'table', 'widget', 'family-dashboard', 'agent-card', 'task-card', 'status-indicator', 'quick-action']
                }
              },
              includeExamples: {
                type: 'boolean',
                description: 'Include usage examples'
              }
            },
            required: ['components']
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_component':
            return await this.generateComponent(args.componentType, args.variant, args.size, args.props);
          case 'validate_design_consistency':
            return await this.validateDesignConsistency(args.url, args.focus);
          case 'generate_design_tokens':
            return await this.generateDesignTokens(args.format, args.theme);
          case 'create_component_library':
            return await this.createComponentLibrary(args.components, args.includeExamples);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    });
  }

  async generateComponent(componentType, variant = 'primary', size = 'medium', props = {}) {
    let component = {
      type: componentType,
      variant: variant,
      size: size,
      html: '',
      css: '',
      javascript: '',
      usage: '',
      accessibility: {}
    };

    switch (componentType) {
      case 'button':
        component = await this.generateButton(variant, size, props);
        break;
      case 'card':
        component = await this.generateCard(variant, size, props);
        break;
      case 'form':
        component = await this.generateForm(variant, size, props);
        break;
      case 'navigation':
        component = await this.generateNavigation(variant, size, props);
        break;
      case 'modal':
        component = await this.generateModal(variant, size, props);
        break;
      case 'notification':
        component = await this.generateNotification(variant, size, props);
        break;
      case 'table':
        component = await this.generateTable(variant, size, props);
        break;
      case 'widget':
        component = await this.generateWidget(variant, size, props);
        break;
      case 'family-dashboard':
        component = await this.generateFamilyDashboard(variant, size, props);
        break;
      case 'agent-card':
        component = await this.generateAgentCard(variant, size, props);
        break;
      case 'task-card':
        component = await this.generateTaskCard(variant, size, props);
        break;
      case 'status-indicator':
        component = await this.generateStatusIndicator(variant, size, props);
        break;
      case 'quick-action':
        component = await this.generateQuickAction(variant, size, props);
        break;
      default:
        throw new Error(`Unknown component type: ${componentType}`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(component, null, 2)
      }]
    };
  }

  async generateButton(variant = 'primary', size = 'medium', props = {}) {
    const { colors, spacing, typography, borderRadius } = this.designTokens;
    const { text = 'Button', disabled = false, icon = null } = props;

    const variantStyles = {
      primary: {
        background: colors.primary,
        color: '#ffffff',
        hoverBackground: colors.primaryDark
      },
      secondary: {
        background: colors.textMuted,
        color: '#ffffff',
        hoverBackground: '#5a6268'
      },
      success: {
        background: colors.success,
        color: '#ffffff',
        hoverBackground: '#1e7e34'
      },
      warning: {
        background: colors.warning,
        color: colors.text,
        hoverBackground: '#e0a800'
      },
      danger: {
        background: colors.danger,
        color: '#ffffff',
        hoverBackground: '#c82333'
      },
      minimal: {
        background: 'transparent',
        color: colors.primary,
        hoverBackground: colors.background
      }
    };

    const sizeStyles = {
      small: {
        padding: `${spacing.sm} ${spacing.md}`,
        fontSize: typography.sizes.sm,
        minHeight: '32px'
      },
      medium: {
        padding: `${spacing.sm} ${spacing.md}`,
        fontSize: typography.sizes.md,
        minHeight: '44px'
      },
      large: {
        padding: `${spacing.md} ${spacing.lg}`,
        fontSize: typography.sizes.lg,
        minHeight: '52px'
      }
    };

    const style = { ...variantStyles[variant], ...sizeStyles[size] };

    const html = `
<button class="btn btn-${variant} btn-${size}" ${disabled ? 'disabled' : ''}>
  ${icon ? `<span class="btn-icon">${icon}</span>` : ''}
  ${text}
</button>`;

    const css = `
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${spacing.sm};
  border: none;
  border-radius: ${borderRadius.md};
  font-family: ${typography.fontFamily};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  line-height: 1.5;
  min-width: 44px;
  box-sizing: border-box;
}

.btn:focus-visible {
  outline: 3px solid ${colors.primary};
  outline-offset: 2px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-${variant} {
  background: ${style.background};
  color: ${style.color};
  padding: ${style.padding};
  font-size: ${style.fontSize};
  min-height: ${style.minHeight};
}

.btn-${variant}:hover:not(:disabled) {
  background: ${style.hoverBackground};
  transform: translateY(-1px);
}

.btn-${variant}:active:not(:disabled) {
  transform: translateY(0);
}

.btn-icon {
  display: inline-flex;
  align-items: center;
}`;

    const javascript = `
// Button component interaction
document.addEventListener('DOMContentLoaded', function() {
  const buttons = document.querySelectorAll('.btn');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      if (this.disabled) return;
      
      // Add click animation
      this.style.transform = 'scale(0.98)';
      setTimeout(() => {
        this.style.transform = '';
      }, 100);
      
      // Emit custom event
      this.dispatchEvent(new CustomEvent('btn:click', {
        detail: {
          variant: this.classList.contains('btn-primary') ? 'primary' : 'secondary',
          text: this.textContent.trim()
        }
      }));
    });
  });
});`;

    return {
      type: 'button',
      variant: variant,
      size: size,
      html: html.trim(),
      css: css.trim(),
      javascript: javascript.trim(),
      usage: `
// Usage Example
<button class="btn btn-${variant} btn-${size}">
  ${text}
</button>

// With icon
<button class="btn btn-${variant} btn-${size}">
  <span class="btn-icon">🎯</span>
  ${text}
</button>

// Disabled state
<button class="btn btn-${variant} btn-${size}" disabled>
  ${text}
</button>`,
      accessibility: {
        guidelines: [
          'Minimum 44px touch target size',
          'Visible focus indicators',
          'Sufficient color contrast',
          'Descriptive button text',
          'Keyboard navigation support'
        ],
        ariaAttributes: [
          'aria-label for icon-only buttons',
          'aria-disabled for disabled state',
          'aria-pressed for toggle buttons'
        ]
      }
    };
  }

  async generateCard(variant = 'primary', size = 'medium', props = {}) {
    const { colors, spacing, borderRadius, shadows } = this.designTokens;
    const { title = 'Card Title', content = 'Card content goes here', footer = null } = props;

    const html = `
<div class="card card-${variant} card-${size}">
  <div class="card-header">
    <h3 class="card-title">${title}</h3>
  </div>
  <div class="card-body">
    <p class="card-content">${content}</p>
  </div>
  ${footer ? `<div class="card-footer">${footer}</div>` : ''}
</div>`;

    const css = `
.card {
  background: ${colors.backgroundWhite};
  border-radius: ${borderRadius.lg};
  box-shadow: ${shadows.md};
  overflow: hidden;
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: ${shadows.lg};
  transform: translateY(-2px);
}

.card-header {
  padding: ${spacing.md} ${spacing.lg};
  border-bottom: 1px solid ${colors.background};
}

.card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${colors.text};
}

.card-body {
  padding: ${spacing.lg};
}

.card-content {
  margin: 0;
  color: ${colors.textMuted};
  line-height: 1.6;
}

.card-footer {
  padding: ${spacing.md} ${spacing.lg};
  background: ${colors.background};
  border-top: 1px solid #e9ecef;
}`;

    return {
      type: 'card',
      variant: variant,
      size: size,
      html: html.trim(),
      css: css.trim(),
      javascript: '',
      usage: `
// Basic card
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Task Status</h3>
  </div>
  <div class="card-body">
    <p class="card-content">5 tasks completed today</p>
  </div>
</div>`,
      accessibility: {
        guidelines: [
          'Proper heading hierarchy',
          'Semantic HTML structure',
          'Sufficient color contrast',
          'Keyboard navigation'
        ]
      }
    };
  }

  async generateWidget(variant = 'primary', size = 'medium', props = {}) {
    const { colors, spacing, borderRadius, shadows } = this.designTokens;
    const { title = 'Widget Title', type = 'info', refreshable = true } = props;

    const html = `
<div class="widget widget-${variant} widget-${size}" role="region" aria-labelledby="widget-title-${Date.now()}">
  <div class="widget-header">
    <h3 id="widget-title-${Date.now()}" class="widget-title">${title}</h3>
    <div class="widget-controls">
      ${refreshable ? '<button class="widget-refresh" aria-label="Refresh widget">🔄</button>' : ''}
      <button class="widget-settings" aria-label="Widget settings">⚙️</button>
    </div>
  </div>
  <div class="widget-content">
    <div class="widget-loading" aria-hidden="true" style="display: none;">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>
    <div class="widget-data">
      <!-- Widget content goes here -->
    </div>
  </div>
</div>`;

    const css = `
.widget {
  background: ${colors.backgroundWhite};
  border: 1px solid #e9ecef;
  border-radius: ${borderRadius.lg};
  box-shadow: ${shadows.sm};
  overflow: hidden;
  transition: all 0.2s ease;
}

.widget:hover {
  box-shadow: ${shadows.md};
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${spacing.md} ${spacing.lg};
  background: ${colors.background};
  border-bottom: 1px solid #e9ecef;
}

.widget-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text};
}

.widget-controls {
  display: flex;
  gap: ${spacing.sm};
}

.widget-refresh,
.widget-settings {
  background: none;
  border: none;
  padding: ${spacing.sm};
  cursor: pointer;
  border-radius: ${borderRadius.sm};
  transition: all 0.2s ease;
}

.widget-refresh:hover,
.widget-settings:hover {
  background: ${colors.backgroundWhite};
}

.widget-content {
  padding: ${spacing.lg};
  min-height: 120px;
  position: relative;
}

.widget-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${colors.backgroundWhite};
  z-index: 10;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid ${colors.background};
  border-top: 2px solid ${colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`;

    const javascript = `
// Widget component functionality
class Widget {
  constructor(element) {
    this.element = element;
    this.refreshButton = element.querySelector('.widget-refresh');
    this.settingsButton = element.querySelector('.widget-settings');
    this.loadingElement = element.querySelector('.widget-loading');
    this.dataElement = element.querySelector('.widget-data');
    
    this.init();
  }
  
  init() {
    if (this.refreshButton) {
      this.refreshButton.addEventListener('click', () => this.refresh());
    }
    
    if (this.settingsButton) {
      this.settingsButton.addEventListener('click', () => this.showSettings());
    }
  }
  
  async refresh() {
    this.showLoading();
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update widget content
      this.updateContent();
      
    } catch (error) {
      console.error('Widget refresh failed:', error);
    } finally {
      this.hideLoading();
    }
  }
  
  showLoading() {
    this.loadingElement.style.display = 'flex';
    this.loadingElement.setAttribute('aria-hidden', 'false');
  }
  
  hideLoading() {
    this.loadingElement.style.display = 'none';
    this.loadingElement.setAttribute('aria-hidden', 'true');
  }
  
  updateContent() {
    // Override in specific widget implementations
    this.dataElement.innerHTML = '<p>Widget refreshed at ' + new Date().toLocaleTimeString() + '</p>';
  }
  
  showSettings() {
    // Override in specific widget implementations
    alert('Widget settings');
  }
}

// Initialize widgets
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.widget').forEach(element => {
    new Widget(element);
  });
});`;

    return {
      type: 'widget',
      variant: variant,
      size: size,
      html: html.trim(),
      css: css.trim(),
      javascript: javascript.trim(),
      usage: `
// Basic widget
<div class="widget">
  <div class="widget-header">
    <h3 class="widget-title">Task Status</h3>
    <div class="widget-controls">
      <button class="widget-refresh">🔄</button>
    </div>
  </div>
  <div class="widget-content">
    <div class="widget-data">
      <p>5 tasks completed today</p>
    </div>
  </div>
</div>`,
      accessibility: {
        guidelines: [
          'Proper ARIA labels and roles',
          'Keyboard navigation support',
          'Screen reader compatibility',
          'Loading state announcements'
        ]
      }
    };
  }

  async validateDesignConsistency(url, focus = 'all') {
    const browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    try {
      await page.goto(url);
      await page.waitForSelector('main', { timeout: 10000 });

      const validation = {
        url: url,
        focus: focus,
        score: 0,
        issues: [],
        recommendations: [],
        compliance: {},
        analyzed: {}
      };

      // Analyze colors
      if (focus === 'all' || focus === 'colors') {
        const colorAnalysis = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          const colors = new Set();
          const backgroundColors = new Set();
          
          elements.forEach(el => {
            const styles = getComputedStyle(el);
            if (styles.color && styles.color !== 'rgba(0, 0, 0, 0)') {
              colors.add(styles.color);
            }
            if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
              backgroundColors.add(styles.backgroundColor);
            }
          });
          
          return {
            uniqueColors: Array.from(colors),
            uniqueBackgrounds: Array.from(backgroundColors),
            colorCount: colors.size,
            backgroundCount: backgroundColors.size
          };
        });
        
        validation.analyzed.colors = colorAnalysis;
        
        if (colorAnalysis.colorCount > 10) {
          validation.issues.push('Too many color variations (limit: 10)');
        } else {
          validation.score += 25;
        }
      }

      // Analyze typography
      if (focus === 'all' || focus === 'typography') {
        const typographyAnalysis = await page.evaluate(() => {
          const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
          const textElements = document.querySelectorAll('p, span, div, button');
          
          const fontSizes = new Set();
          const fontFamilies = new Set();
          
          [...headings, ...textElements].forEach(el => {
            const styles = getComputedStyle(el);
            fontSizes.add(styles.fontSize);
            fontFamilies.add(styles.fontFamily);
          });
          
          return {
            headingCount: headings.length,
            fontSizeCount: fontSizes.size,
            fontFamilyCount: fontFamilies.size,
            fontSizes: Array.from(fontSizes),
            fontFamilies: Array.from(fontFamilies)
          };
        });
        
        validation.analyzed.typography = typographyAnalysis;
        
        if (typographyAnalysis.fontFamilyCount <= 2) {
          validation.score += 25;
        } else {
          validation.issues.push('Too many font families (limit: 2)');
        }
      }

      // Analyze components
      if (focus === 'all' || focus === 'components') {
        const componentAnalysis = await page.evaluate(() => {
          const buttons = document.querySelectorAll('.btn, button');
          const cards = document.querySelectorAll('.card, .task-card, .agent-card');
          const widgets = document.querySelectorAll('.widget');
          
          const buttonStyles = Array.from(buttons).map(btn => {
            const styles = getComputedStyle(btn);
            return {
              backgroundColor: styles.backgroundColor,
              color: styles.color,
              padding: styles.padding,
              borderRadius: styles.borderRadius,
              fontSize: styles.fontSize
            };
          });
          
          return {
            buttonCount: buttons.length,
            cardCount: cards.length,
            widgetCount: widgets.length,
            buttonStyles: buttonStyles
          };
        });
        
        validation.analyzed.components = componentAnalysis;
        
        if (componentAnalysis.buttonCount > 0) {
          validation.score += 25;
        }
      }

      // Analyze spacing
      if (focus === 'all' || focus === 'spacing') {
        const spacingAnalysis = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          const margins = new Set();
          const paddings = new Set();
          
          elements.forEach(el => {
            const styles = getComputedStyle(el);
            if (styles.margin !== '0px') margins.add(styles.margin);
            if (styles.padding !== '0px') paddings.add(styles.padding);
          });
          
          return {
            uniqueMargins: margins.size,
            uniquePaddings: paddings.size,
            marginValues: Array.from(margins),
            paddingValues: Array.from(paddings)
          };
        });
        
        validation.analyzed.spacing = spacingAnalysis;
        
        if (spacingAnalysis.uniqueMargins <= 8 && spacingAnalysis.uniquePaddings <= 8) {
          validation.score += 25;
        } else {
          validation.issues.push('Inconsistent spacing values');
        }
      }

      // Generate recommendations
      if (validation.issues.length > 0) {
        validation.recommendations.push('Implement design tokens for consistent styling');
        validation.recommendations.push('Use a standardized component library');
        validation.recommendations.push('Define clear design guidelines');
      }

      validation.compliance.score = Math.min(100, validation.score);
      validation.compliance.level = validation.score >= 80 ? 'excellent' : 
                                   validation.score >= 60 ? 'good' : 
                                   validation.score >= 40 ? 'fair' : 'needs-improvement';

      await browser.close();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(validation, null, 2)
        }]
      };

    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  async generateDesignTokens(format = 'css', theme = 'light') {
    const tokens = this.designTokens;
    let output = '';

    switch (format) {
      case 'css':
        output = this.generateCSSTokens(tokens, theme);
        break;
      case 'scss':
        output = this.generateSCSSTokens(tokens, theme);
        break;
      case 'js':
        output = this.generateJSTokens(tokens, theme);
        break;
      case 'json':
        output = JSON.stringify(tokens, null, 2);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return {
      content: [{
        type: 'text',
        text: output
      }]
    };
  }

  generateCSSTokens(tokens, theme) {
    const { colors, spacing, typography, borderRadius, shadows } = tokens;
    
    return `
/* Design Tokens - ${theme} theme */
:root {
  /* Colors */
  --color-primary: ${colors.primary};
  --color-primary-dark: ${colors.primaryDark};
  --color-success: ${colors.success};
  --color-warning: ${colors.warning};
  --color-danger: ${colors.danger};
  --color-background: ${colors.background};
  --color-background-white: ${colors.backgroundWhite};
  --color-text: ${colors.text};
  --color-text-muted: ${colors.textMuted};
  
  /* Spacing */
  --spacing-xs: ${spacing.xs};
  --spacing-sm: ${spacing.sm};
  --spacing-md: ${spacing.md};
  --spacing-lg: ${spacing.lg};
  --spacing-xl: ${spacing.xl};
  
  /* Typography */
  --font-family: ${typography.fontFamily};
  --font-size-xs: ${typography.sizes.xs};
  --font-size-sm: ${typography.sizes.sm};
  --font-size-md: ${typography.sizes.md};
  --font-size-lg: ${typography.sizes.lg};
  --font-size-xl: ${typography.sizes.xl};
  
  /* Border Radius */
  --border-radius-sm: ${borderRadius.sm};
  --border-radius-md: ${borderRadius.md};
  --border-radius-lg: ${borderRadius.lg};
  
  /* Shadows */
  --shadow-sm: ${shadows.sm};
  --shadow-md: ${shadows.md};
  --shadow-lg: ${shadows.lg};
}

/* Component Base Styles */
.btn {
  font-family: var(--font-family);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-md);
  transition: all 0.2s ease;
}

.card {
  background: var(--color-background-white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
}

.widget {
  background: var(--color-background-white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-background);
}`;
  }

  generateSCSSTokens(tokens, theme) {
    const { colors, spacing, typography, borderRadius, shadows } = tokens;
    
    return `
// Design Tokens - ${theme} theme
$colors: (
  primary: ${colors.primary},
  primary-dark: ${colors.primaryDark},
  success: ${colors.success},
  warning: ${colors.warning},
  danger: ${colors.danger},
  background: ${colors.background},
  background-white: ${colors.backgroundWhite},
  text: ${colors.text},
  text-muted: ${colors.textMuted}
);

$spacing: (
  xs: ${spacing.xs},
  sm: ${spacing.sm},
  md: ${spacing.md},
  lg: ${spacing.lg},
  xl: ${spacing.xl}
);

$typography: (
  font-family: ${typography.fontFamily},
  sizes: (
    xs: ${typography.sizes.xs},
    sm: ${typography.sizes.sm},
    md: ${typography.sizes.md},
    lg: ${typography.sizes.lg},
    xl: ${typography.sizes.xl}
  )
);

$border-radius: (
  sm: ${borderRadius.sm},
  md: ${borderRadius.md},
  lg: ${borderRadius.lg}
);

$shadows: (
  sm: ${shadows.sm},
  md: ${shadows.md},
  lg: ${shadows.lg}
);

// Helper functions
@function color($name) {
  @return map-get($colors, $name);
}

@function spacing($size) {
  @return map-get($spacing, $size);
}`;
  }

  generateJSTokens(tokens, theme) {
    return `
// Design Tokens - ${theme} theme
export const designTokens = ${JSON.stringify(tokens, null, 2)};

export const colors = designTokens.colors;
export const spacing = designTokens.spacing;
export const typography = designTokens.typography;
export const borderRadius = designTokens.borderRadius;
export const shadows = designTokens.shadows;

// Helper functions
export function getColor(name) {
  return colors[name];
}

export function getSpacing(size) {
  return spacing[size];
}

export function getFontSize(size) {
  return typography.sizes[size];
}`;
  }

  async createComponentLibrary(components = [], includeExamples = true) {
    const library = {
      title: 'Home Dashboard Design System',
      version: '1.0.0',
      components: [],
      tokens: this.designTokens,
      guidelines: {
        accessibility: [
          'All components must meet WCAG 2.1 AA standards',
          'Minimum 44px touch target size',
          'Keyboard navigation support',
          'Screen reader compatibility'
        ],
        design: [
          'Use consistent spacing from design tokens',
          'Follow established color palette',
          'Maintain visual hierarchy',
          'Ensure responsive design'
        ],
        implementation: [
          'Use semantic HTML',
          'Include proper ARIA attributes',
          'Implement loading states',
          'Provide error handling'
        ]
      }
    };

    // Generate each requested component
    for (const componentType of components) {
      const component = await this.generateComponent(componentType, 'primary', 'medium', {});
      const componentData = JSON.parse(component.content[0].text);
      
      library.components.push({
        name: componentType,
        variants: ['primary', 'secondary', 'success', 'warning', 'danger'],
        sizes: ['small', 'medium', 'large'],
        implementation: componentData,
        examples: includeExamples ? this.generateComponentExamples(componentType) : []
      });
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(library, null, 2)
      }]
    };
  }

  generateComponentExamples(componentType) {
    const examples = {
      button: [
        { name: 'Primary Action', code: '<button class="btn btn-primary">Save Changes</button>' },
        { name: 'Secondary Action', code: '<button class="btn btn-secondary">Cancel</button>' },
        { name: 'Danger Action', code: '<button class="btn btn-danger">Delete</button>' }
      ],
      card: [
        { name: 'Task Card', code: '<div class="card"><div class="card-header"><h3>Task Status</h3></div><div class="card-body"><p>5 tasks completed</p></div></div>' }
      ],
      widget: [
        { name: 'Status Widget', code: '<div class="widget"><div class="widget-header"><h3>System Status</h3></div><div class="widget-content"><p>All systems operational</p></div></div>' }
      ]
    };

    // Add family dashboard specific examples
    if (!examples['family-dashboard']) {
      examples['family-dashboard'] = [
        { name: 'Home Control Dashboard', code: '<div class="family-dashboard"><header class="dashboard-header"><h1 class="dashboard-title">Home Control Center</h1></header><div class="dashboard-grid"><!-- widgets here --></div></div>' }
      ];
      examples['agent-card'] = [
        { name: 'Frontend Agent Card', code: '<div class="agent-card"><div class="agent-header"><div class="agent-avatar">🤖</div><div class="agent-info"><h3 class="agent-name">Frontend Agent</h3><p class="agent-role">UI Developer</p></div><div class="agent-status"><span class="status-indicator status-active"></span><span class="status-text">active</span></div></div></div>' }
      ];
      examples['task-card'] = [
        { name: 'High Priority Task', code: '<div class="task-card priority-high"><div class="task-header"><div class="task-priority priority-high"><span class="priority-indicator"></span>High</div><div class="task-status status-in-progress">In Progress</div></div><div class="task-content"><h3 class="task-title">Implement Authentication</h3></div></div>' }
      ];
      examples['status-indicator'] = [
        { name: 'Active Status', code: '<div class="status-indicator"><span class="indicator-icon status-active">●</span><span class="indicator-label">Agent Active</span></div>' }
      ];
      examples['quick-action'] = [
        { name: 'Deploy Action', code: '<button class="quick-action quick-action-primary"><span class="action-icon">🚀</span><span class="action-text">Deploy</span></button>' }
      ];
    }

    return examples[componentType] || [];
  }

  async generateFamilyDashboard(variant = 'primary', size = 'medium', props = {}) {
    const { colors, spacing, borderRadius, shadows } = this.designTokens;
    const { title = 'Family Dashboard', widgets = ['agents', 'tasks', 'status'] } = props;

    const html = `
<div class="family-dashboard family-dashboard-${variant}" role="main" aria-label="Family Dashboard">
  <header class="dashboard-header">
    <h1 class="dashboard-title">${title}</h1>
    <div class="dashboard-controls">
      <button class="dashboard-refresh" aria-label="Refresh dashboard">🔄</button>
      <button class="dashboard-settings" aria-label="Dashboard settings">⚙️</button>
    </div>
  </header>
  <div class="dashboard-grid">
    ${widgets.map(widget => `
    <section class="dashboard-section" aria-labelledby="${widget}-heading">
      <h2 id="${widget}-heading" class="section-title">${widget.charAt(0).toUpperCase() + widget.slice(1)}</h2>
      <div class="section-content">
        <!-- ${widget} widget content -->
      </div>
    </section>`).join('')}
  </div>
</div>`;

    const css = `
.family-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: ${spacing.lg};
  background: ${colors.background};
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${spacing.xl};
  padding-bottom: ${spacing.md};
  border-bottom: 2px solid ${colors.backgroundWhite};
}

.dashboard-title {
  color: ${colors.text};
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
}

.dashboard-controls {
  display: flex;
  gap: ${spacing.sm};
}

.dashboard-refresh,
.dashboard-settings {
  padding: ${spacing.sm} ${spacing.md};
  background: ${colors.backgroundWhite};
  border: 1px solid ${colors.background};
  border-radius: ${borderRadius.md};
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s ease;
}

.dashboard-refresh:hover,
.dashboard-settings:hover {
  background: ${colors.primary};
  color: white;
  transform: translateY(-1px);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${spacing.lg};
  align-items: start;
}

.dashboard-section {
  background: ${colors.backgroundWhite};
  border-radius: ${borderRadius.lg};
  box-shadow: ${shadows.md};
  overflow: hidden;
}

.section-title {
  background: ${colors.background};
  color: ${colors.text};
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  padding: ${spacing.md} ${spacing.lg};
  border-bottom: 1px solid #e9ecef;
}

.section-content {
  padding: ${spacing.lg};
  min-height: 200px;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: ${spacing.md};
    text-align: center;
  }
}`;

    return {
      type: 'family-dashboard',
      variant: variant,
      size: size,
      html: html.trim(),
      css: css.trim(),
      javascript: '',
      usage: `
// Family Dashboard with multiple widgets
<div class="family-dashboard">
  <header class="dashboard-header">
    <h1 class="dashboard-title">Home Control Center</h1>
  </header>
  <div class="dashboard-grid">
    <!-- Agent and task widgets go here -->
  </div>
</div>`,
      accessibility: {
        guidelines: [
          'Main landmark with descriptive aria-label',
          'Semantic heading hierarchy (h1, h2)',
          'Section landmarks with proper labeling',
          'Keyboard accessible controls'
        ]
      }
    };
  }

  async generateAgentCard(variant = 'primary', size = 'medium', props = {}) {
    const { colors, spacing, borderRadius, shadows } = this.designTokens;
    const { agentName = 'Agent', role = 'Specialist', status = 'active', taskCount = 0 } = props;

    const statusColors = {
      active: colors.success,
      busy: colors.warning,
      offline: colors.textMuted,
      error: colors.danger
    };

    const html = `
<div class="agent-card agent-card-${variant}" role="article" aria-labelledby="agent-${agentName.toLowerCase()}">
  <div class="agent-header">
    <div class="agent-avatar" aria-hidden="true">🤖</div>
    <div class="agent-info">
      <h3 id="agent-${agentName.toLowerCase()}" class="agent-name">${agentName}</h3>
      <p class="agent-role">${role}</p>
    </div>
    <div class="agent-status" aria-label="Agent status: ${status}">
      <span class="status-indicator status-${status}"></span>
      <span class="status-text">${status}</span>
    </div>
  </div>
  <div class="agent-stats">
    <div class="stat-item">
      <span class="stat-value">${taskCount}</span>
      <span class="stat-label">Active Tasks</span>
    </div>
  </div>
  <div class="agent-actions">
    <button class="btn-switch" aria-label="Switch to ${agentName}">Switch</button>
    <button class="btn-details" aria-label="View ${agentName} details">Details</button>
  </div>
</div>`;

    const css = `
.agent-card {
  background: ${colors.backgroundWhite};
  border-radius: ${borderRadius.lg};
  box-shadow: ${shadows.sm};
  padding: ${spacing.lg};
  border-left: 4px solid ${colors.primary};
  transition: all 0.2s ease;
}

.agent-card:hover {
  box-shadow: ${shadows.md};
  transform: translateY(-2px);
}

.agent-header {
  display: flex;
  align-items: center;
  gap: ${spacing.md};
  margin-bottom: ${spacing.md};
}

.agent-avatar {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${colors.background};
  border-radius: 50%;
}

.agent-info {
  flex: 1;
}

.agent-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${colors.text};
}

.agent-role {
  margin: 0;
  font-size: 0.9rem;
  color: ${colors.textMuted};
}

.agent-status {
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${statusColors.offline};
}

.status-indicator.status-active { background: ${statusColors.active}; }
.status-indicator.status-busy { background: ${statusColors.busy}; }
.status-indicator.status-offline { background: ${statusColors.offline}; }
.status-indicator.status-error { background: ${statusColors.error}; }

.status-text {
  font-size: 0.85rem;
  color: ${colors.textMuted};
  text-transform: capitalize;
}

.agent-stats {
  padding: ${spacing.md} 0;
  border-top: 1px solid ${colors.background};
  border-bottom: 1px solid ${colors.background};
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${colors.primary};
}

.stat-label {
  font-size: 0.85rem;
  color: ${colors.textMuted};
}

.agent-actions {
  display: flex;
  gap: ${spacing.sm};
  margin-top: ${spacing.md};
}

.btn-switch,
.btn-details {
  flex: 1;
  padding: ${spacing.sm} ${spacing.md};
  border: 1px solid ${colors.primary};
  border-radius: ${borderRadius.md};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-switch {
  background: ${colors.primary};
  color: white;
}

.btn-details {
  background: white;
  color: ${colors.primary};
}

.btn-switch:hover,
.btn-details:hover {
  transform: translateY(-1px);
  box-shadow: ${shadows.sm};
}`;

    return {
      type: 'agent-card',
      variant: variant,
      size: size,
      html: html.trim(),
      css: css.trim(),
      javascript: '',
      usage: `
// Agent card with status and actions
<div class="agent-card">
  <div class="agent-header">
    <div class="agent-avatar">🤖</div>
    <div class="agent-info">
      <h3 class="agent-name">Frontend Agent</h3>
      <p class="agent-role">UI Developer</p>
    </div>
    <div class="agent-status">
      <span class="status-indicator status-active"></span>
      <span class="status-text">active</span>
    </div>
  </div>
</div>`,
      accessibility: {
        guidelines: [
          'Article role for semantic grouping',
          'Proper heading structure',
          'Status indicators with aria-labels',
          'Descriptive button labels'
        ]
      }
    };
  }

  async generateTaskCard(variant = 'primary', size = 'medium', props = {}) {
    const { colors, spacing, borderRadius, shadows } = this.designTokens;
    const { title = 'Task Title', description = 'Task description', status = 'pending', priority = 'medium', dueDate = null } = props;

    const statusColors = {
      pending: colors.textMuted,
      'in-progress': colors.warning,
      completed: colors.success,
      blocked: colors.danger
    };

    const priorityColors = {
      low: '#6c757d',
      medium: colors.warning,
      high: colors.danger
    };

    const html = `
<div class="task-card task-card-${variant}" role="article" aria-labelledby="task-${title.toLowerCase().replace(/\s+/g, '-')}">
  <div class="task-header">
    <div class="task-priority priority-${priority}" aria-label="Priority: ${priority}">
      <span class="priority-indicator"></span>
    </div>
    <div class="task-status status-${status}" aria-label="Status: ${status}">
      ${status.replace('-', ' ')}
    </div>
  </div>
  <div class="task-content">
    <h3 id="task-${title.toLowerCase().replace(/\s+/g, '-')}" class="task-title">${title}</h3>
    <p class="task-description">${description}</p>
    ${dueDate ? `<div class="task-due-date">Due: ${dueDate}</div>` : ''}
  </div>
  <div class="task-actions">
    <button class="btn-claim" aria-label="Claim task: ${title}">Claim</button>
    <button class="btn-details" aria-label="View task details: ${title}">Details</button>
  </div>
</div>`;

    const css = `
.task-card {
  background: ${colors.backgroundWhite};
  border-radius: ${borderRadius.lg};
  box-shadow: ${shadows.sm};
  padding: ${spacing.lg};
  border-left: 4px solid ${priorityColors.medium};
  transition: all 0.2s ease;
}

.task-card:hover {
  box-shadow: ${shadows.md};
  transform: translateY(-1px);
}

.task-card.priority-low { border-left-color: ${priorityColors.low}; }
.task-card.priority-medium { border-left-color: ${priorityColors.medium}; }
.task-card.priority-high { border-left-color: ${priorityColors.high}; }

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${spacing.md};
}

.task-priority {
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
}

.priority-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${priorityColors.medium};
}

.priority-low .priority-indicator { background: ${priorityColors.low}; }
.priority-medium .priority-indicator { background: ${priorityColors.medium}; }
.priority-high .priority-indicator { background: ${priorityColors.high}; }

.task-status {
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${borderRadius.sm};
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
  color: white;
  background: ${statusColors.pending};
}

.status-pending { background: ${statusColors.pending}; }
.status-in-progress { background: ${statusColors['in-progress']}; color: ${colors.text}; }
.status-completed { background: ${statusColors.completed}; }
.status-blocked { background: ${statusColors.blocked}; }

.task-title {
  margin: 0 0 ${spacing.sm} 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${colors.text};
  line-height: 1.4;
}

.task-description {
  margin: 0 0 ${spacing.md} 0;
  color: ${colors.textMuted};
  line-height: 1.5;
  font-size: 0.95rem;
}

.task-due-date {
  font-size: 0.85rem;
  color: ${colors.textMuted};
  margin-bottom: ${spacing.md};
}

.task-actions {
  display: flex;
  gap: ${spacing.sm};
  border-top: 1px solid ${colors.background};
  padding-top: ${spacing.md};
}

.btn-claim,
.btn-details {
  flex: 1;
  padding: ${spacing.sm} ${spacing.md};
  border: 1px solid ${colors.primary};
  border-radius: ${borderRadius.md};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-claim {
  background: ${colors.primary};
  color: white;
}

.btn-details {
  background: white;
  color: ${colors.primary};
}

.btn-claim:hover,
.btn-details:hover {
  transform: translateY(-1px);
  box-shadow: ${shadows.sm};
}`;

    return {
      type: 'task-card',
      variant: variant,
      size: size,
      html: html.trim(),
      css: css.trim(),
      javascript: '',
      usage: `
// Task card with priority and status
<div class="task-card priority-high">
  <div class="task-header">
    <div class="task-priority priority-high">
      <span class="priority-indicator"></span>
      High
    </div>
    <div class="task-status status-in-progress">In Progress</div>
  </div>
  <div class="task-content">
    <h3 class="task-title">Implement User Authentication</h3>
    <p class="task-description">Create JWT-based authentication system</p>
  </div>
</div>`,
      accessibility: {
        guidelines: [
          'Article role for task grouping',
          'Priority and status with aria-labels',
          'Descriptive headings and button labels',
          'Keyboard accessible actions'
        ]
      }
    };
  }

  async generateStatusIndicator(variant = 'primary', size = 'medium', props = {}) {
    const { colors, spacing, borderRadius } = this.designTokens;
    const { status = 'active', label = 'Status', showLabel = true, size: indicatorSize = 'medium' } = props;

    const statusConfig = {
      active: { color: colors.success, icon: '●', description: 'Active and operational' },
      inactive: { color: colors.textMuted, icon: '○', description: 'Inactive or offline' },
      warning: { color: colors.warning, icon: '⚠', description: 'Warning state' },
      error: { color: colors.danger, icon: '✕', description: 'Error state' },
      loading: { color: colors.primary, icon: '◐', description: 'Loading or processing' }
    };

    const sizeConfig = {
      small: { width: '12px', height: '12px', fontSize: '0.75rem' },
      medium: { width: '16px', height: '16px', fontSize: '1rem' },
      large: { width: '20px', height: '20px', fontSize: '1.25rem' }
    };

    const config = statusConfig[status] || statusConfig.inactive;
    const sizes = sizeConfig[indicatorSize] || sizeConfig.medium;

    const html = `
<div class="status-indicator status-indicator-${variant}" role="status" aria-label="${label}: ${config.description}">
  <span class="indicator-icon status-${status}" aria-hidden="true">${config.icon}</span>
  ${showLabel ? `<span class="indicator-label">${label}</span>` : ''}
</div>`;

    const css = `
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: ${spacing.xs};
  font-size: ${sizes.fontSize};
}

.indicator-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${sizes.width};
  height: ${sizes.height};
  border-radius: 50%;
  font-size: calc(${sizes.fontSize} * 0.8);
  color: ${config.color};
  line-height: 1;
}

.status-active .indicator-icon { color: ${statusConfig.active.color}; }
.status-inactive .indicator-icon { color: ${statusConfig.inactive.color}; }
.status-warning .indicator-icon { color: ${statusConfig.warning.color}; }
.status-error .indicator-icon { color: ${statusConfig.error.color}; }
.status-loading .indicator-icon { 
  color: ${statusConfig.loading.color};
  animation: spin 1s linear infinite;
}

.indicator-label {
  font-size: 0.9rem;
  color: ${colors.text};
  font-weight: 500;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`;

    return {
      type: 'status-indicator',
      variant: variant,
      size: size,
      html: html.trim(),
      css: css.trim(),
      javascript: '',
      usage: `
// Status indicators for various states
<div class="status-indicator">
  <span class="indicator-icon status-active">●</span>
  <span class="indicator-label">Agent Active</span>
</div>

<div class="status-indicator">
  <span class="indicator-icon status-loading">◐</span>
  <span class="indicator-label">Processing</span>
</div>`,
      accessibility: {
        guidelines: [
          'Role="status" for screen readers',
          'Descriptive aria-labels',
          'Color not the only differentiator',
          'Icons supplemented with text labels'
        ]
      }
    };
  }

  async generateQuickAction(variant = 'primary', size = 'medium', props = {}) {
    const { colors, spacing, borderRadius, shadows } = this.designTokens;
    const { action = 'Action', icon = '▶', description = 'Quick action button', disabled = false } = props;

    const html = `
<button class="quick-action quick-action-${variant} quick-action-${size}" 
        ${disabled ? 'disabled' : ''} 
        aria-label="${description}"
        title="${description}">
  <span class="action-icon" aria-hidden="true">${icon}</span>
  <span class="action-text">${action}</span>
</button>`;

    const css = `
.quick-action {
  display: inline-flex;
  align-items: center;
  gap: ${spacing.sm};
  padding: ${spacing.md} ${spacing.lg};
  background: ${colors.backgroundWhite};
  border: 2px solid ${colors.primary};
  border-radius: ${borderRadius.lg};
  font-family: inherit;
  font-size: 1rem;
  font-weight: 500;
  color: ${colors.primary};
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  justify-content: center;
}

.quick-action:hover:not(:disabled) {
  background: ${colors.primary};
  color: white;
  transform: translateY(-2px);
  box-shadow: ${shadows.md};
}

.quick-action:active:not(:disabled) {
  transform: translateY(0);
}

.quick-action:focus-visible {
  outline: 3px solid ${colors.primary};
  outline-offset: 2px;
}

.quick-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  border-color: ${colors.textMuted};
  color: ${colors.textMuted};
}

.quick-action-small {
  padding: ${spacing.sm} ${spacing.md};
  font-size: 0.9rem;
  min-width: 100px;
}

.quick-action-large {
  padding: ${spacing.lg} ${spacing.xl};
  font-size: 1.1rem;
  min-width: 140px;
}

.action-icon {
  font-size: 1.2em;
  line-height: 1;
}

.action-text {
  white-space: nowrap;
}

.quick-action-secondary {
  border-color: ${colors.textMuted};
  color: ${colors.textMuted};
}

.quick-action-secondary:hover:not(:disabled) {
  background: ${colors.textMuted};
  color: white;
}

.quick-action-success {
  border-color: ${colors.success};
  color: ${colors.success};
}

.quick-action-success:hover:not(:disabled) {
  background: ${colors.success};
  color: white;
}

.quick-action-warning {
  border-color: ${colors.warning};
  color: ${colors.warning};
}

.quick-action-warning:hover:not(:disabled) {
  background: ${colors.warning};
  color: ${colors.text};
}

.quick-action-danger {
  border-color: ${colors.danger};
  color: ${colors.danger};
}

.quick-action-danger:hover:not(:disabled) {
  background: ${colors.danger};
  color: white;
}`;

    return {
      type: 'quick-action',
      variant: variant,
      size: size,
      html: html.trim(),
      css: css.trim(),
      javascript: '',
      usage: `
// Quick action buttons for common tasks
<button class="quick-action quick-action-primary">
  <span class="action-icon">🚀</span>
  <span class="action-text">Deploy</span>
</button>

<button class="quick-action quick-action-success">
  <span class="action-icon">✓</span>
  <span class="action-text">Complete</span>
</button>

<button class="quick-action quick-action-warning">
  <span class="action-icon">⚠</span>
  <span class="action-text">Review</span>
</button>`,
      accessibility: {
        guidelines: [
          'Descriptive aria-labels and titles',
          'Keyboard accessible with focus indicators',
          'Disabled state properly handled',
          'Sufficient color contrast ratios'
        ]
      }
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Design System MCP Server running on stdio');
  }
}

const server = new DesignSystemMCP();
server.run().catch(console.error);