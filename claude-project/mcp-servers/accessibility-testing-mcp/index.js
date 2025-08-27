#!/usr/bin/env node

/**
 * Accessibility Testing MCP Server
 * Simple WCAG compliance validation for home user dashboard
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import puppeteer from 'puppeteer';

export class AccessibilityTestingMCP {
  constructor() {
    this.server = new Server({
      name: 'accessibility-testing-mcp',
      version: '1.0.0',
      description: 'Simple accessibility testing for home dashboard'
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'test_accessibility',
          description: 'Run accessibility tests on dashboard pages',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL to test for accessibility'
              },
              selector: {
                type: 'string',
                description: 'CSS selector to focus testing on specific element'
              }
            },
            required: ['url']
          }
        },
        {
          name: 'test_family_dashboard_accessibility',
          description: 'Comprehensive accessibility testing specifically for family dashboard',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'Family dashboard URL to test'
              },
              testType: {
                type: 'string',
                description: 'Type of accessibility test to run',
                enum: ['wcag-aa', 'keyboard-navigation', 'screen-reader', 'color-contrast', 'family-specific']
              }
            },
            required: ['url']
          }
        },
        {
          name: 'validate_dashboard_semantics',
          description: 'Validate semantic HTML structure and ARIA implementation for dashboard',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'Dashboard URL to validate'
              },
              widgetFocus: {
                type: 'string',
                description: 'Specific widget to focus validation on'
              }
            },
            required: ['url']
          }
        },
        {
          name: 'check_keyboard_navigation',
          description: 'Test keyboard navigation for home user needs',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL to test keyboard navigation'
              }
            },
            required: ['url']
          }
        },
        {
          name: 'validate_color_contrast',
          description: 'Check color contrast ratios for readability',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL to test color contrast'
              }
            },
            required: ['url']
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'test_accessibility':
            return await this.testAccessibility(args.url, args.selector);
          case 'test_family_dashboard_accessibility':
            return await this.testFamilyDashboardAccessibility(args.url, args.testType);
          case 'validate_dashboard_semantics':
            return await this.validateDashboardSemantics(args.url, args.widgetFocus);
          case 'check_keyboard_navigation':
            return await this.checkKeyboardNavigation(args.url);
          case 'validate_color_contrast':
            return await this.validateColorContrast(args.url);
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

  async testAccessibility(url, selector = null) {
    const browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    try {
      await page.goto(url);
      
      // Inject axe-core for accessibility testing
      await page.addScriptTag({
        path: './node_modules/axe-core/axe.min.js'
      });

      // Run accessibility tests
      const results = await page.evaluate((selector) => {
        const config = {
          rules: {
            // Focus on home user needs - simplified rules
            'color-contrast': { enabled: true },
            'keyboard-navigation': { enabled: true },
            'heading-order': { enabled: true },
            'label': { enabled: true },
            'button-name': { enabled: true },
            'link-name': { enabled: true },
            'landmark-one-main': { enabled: true },
            'page-has-heading-one': { enabled: true },
            'region': { enabled: true }
          }
        };

        const context = selector ? { include: [[selector]] } : undefined;
        return axe.run(context, config);
      }, selector);

      // Process results for home user context
      const summary = this.processAccessibilityResults(results);
      
      await browser.close();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(summary, null, 2)
        }]
      };

    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  async checkKeyboardNavigation(url) {
    const browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    try {
      await page.goto(url);
      
      // Test keyboard navigation
      const navigationResults = await page.evaluate(() => {
        const results = {
          focusableElements: [],
          tabOrder: [],
          keyboardTraps: [],
          skipLinks: []
        };

        // Find all focusable elements
        const focusable = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        results.focusableElements = Array.from(focusable).map(el => ({
          tag: el.tagName.toLowerCase(),
          id: el.id,
          className: el.className,
          text: el.textContent?.trim().substring(0, 50) || '',
          hasVisibleFocus: getComputedStyle(el).outline !== 'none',
          tabIndex: el.tabIndex
        }));

        // Check for skip links
        const skipLinks = document.querySelectorAll('a[href^="#"]');
        results.skipLinks = Array.from(skipLinks).map(link => ({
          text: link.textContent?.trim(),
          target: link.getAttribute('href'),
          visible: getComputedStyle(link).position !== 'absolute' || 
                   getComputedStyle(link).top !== '-40px'
        }));

        return results;
      });

      // Test actual tab navigation
      const tabSequence = [];
      let currentElement = null;
      
      for (let i = 0; i < Math.min(10, navigationResults.focusableElements.length); i++) {
        await page.keyboard.press('Tab');
        currentElement = await page.evaluate(() => {
          const focused = document.activeElement;
          return focused ? {
            tag: focused.tagName.toLowerCase(),
            id: focused.id,
            className: focused.className,
            text: focused.textContent?.trim().substring(0, 30) || ''
          } : null;
        });
        
        if (currentElement) {
          tabSequence.push(currentElement);
        }
      }

      await browser.close();

      const summary = {
        totalFocusableElements: navigationResults.focusableElements.length,
        hasSkipLinks: navigationResults.skipLinks.length > 0,
        tabSequence: tabSequence,
        accessibilityScore: this.calculateKeyboardScore(navigationResults, tabSequence),
        recommendations: this.generateKeyboardRecommendations(navigationResults, tabSequence)
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(summary, null, 2)
        }]
      };

    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  async validateColorContrast(url) {
    const browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    try {
      await page.goto(url);
      
      const contrastResults = await page.evaluate(() => {
        const results = {
          textElements: [],
          contrastIssues: [],
          overallScore: 0
        };

        // Simple contrast checking for home user needs
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, button, a, span, div');
        
        Array.from(textElements).forEach(element => {
          const text = element.textContent?.trim();
          if (text && text.length > 0) {
            const styles = getComputedStyle(element);
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;
            const fontSize = parseFloat(styles.fontSize);
            
            results.textElements.push({
              tag: element.tagName.toLowerCase(),
              text: text.substring(0, 50),
              color: color,
              backgroundColor: backgroundColor,
              fontSize: fontSize,
              isLargeText: fontSize >= 18 || (fontSize >= 14 && styles.fontWeight === '700')
            });
          }
        });

        return results;
      });

      // Simple color contrast assessment
      const assessment = {
        elementsChecked: contrastResults.textElements.length,
        potentialIssues: contrastResults.textElements.filter(el => 
          el.color === 'rgb(0, 0, 0)' && el.backgroundColor === 'rgba(0, 0, 0, 0)'
        ).length,
        recommendations: [
          'Ensure text has sufficient contrast against backgrounds',
          'Test with different lighting conditions',
          'Consider users with visual impairments'
        ]
      };

      await browser.close();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(assessment, null, 2)
        }]
      };

    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  processAccessibilityResults(results) {
    const violations = results.violations || [];
    const passes = results.passes || [];
    
    return {
      summary: {
        totalViolations: violations.length,
        totalPasses: passes.length,
        overallScore: Math.round((passes.length / (passes.length + violations.length)) * 100) || 0
      },
      criticalIssues: violations.filter(v => v.impact === 'critical').map(v => ({
        rule: v.id,
        description: v.description,
        impact: v.impact,
        nodes: v.nodes.length,
        helpUrl: v.helpUrl
      })),
      recommendations: this.generateHomeUserRecommendations(violations),
      wcagCompliance: {
        level: violations.length === 0 ? 'AA' : violations.filter(v => v.impact === 'critical').length === 0 ? 'A' : 'Non-compliant',
        passedChecks: passes.length,
        failedChecks: violations.length
      }
    };
  }

  calculateKeyboardScore(navigationResults, tabSequence) {
    let score = 100;
    
    // Deduct points for issues
    if (navigationResults.skipLinks.length === 0) score -= 20;
    if (navigationResults.focusableElements.length === 0) score -= 30;
    if (tabSequence.length < navigationResults.focusableElements.length / 2) score -= 25;
    
    // Check for visible focus
    const elementsWithVisibleFocus = navigationResults.focusableElements.filter(el => el.hasVisibleFocus).length;
    if (elementsWithVisibleFocus < navigationResults.focusableElements.length * 0.8) score -= 25;
    
    return Math.max(0, score);
  }

  generateKeyboardRecommendations(navigationResults, tabSequence) {
    const recommendations = [];
    
    if (navigationResults.skipLinks.length === 0) {
      recommendations.push('Add skip links for keyboard navigation');
    }
    
    if (tabSequence.length < navigationResults.focusableElements.length / 2) {
      recommendations.push('Ensure all interactive elements are keyboard accessible');
    }
    
    recommendations.push('Test navigation with only keyboard');
    recommendations.push('Ensure focus indicators are clearly visible');
    
    return recommendations;
  }

  generateHomeUserRecommendations(violations) {
    const recommendations = [];
    
    if (violations.some(v => v.id === 'color-contrast')) {
      recommendations.push('Improve text contrast for better readability');
    }
    
    if (violations.some(v => v.id === 'button-name')) {
      recommendations.push('Add clear labels to all buttons');
    }
    
    if (violations.some(v => v.id === 'heading-order')) {
      recommendations.push('Use proper heading hierarchy (H1, H2, H3)');
    }
    
    if (violations.some(v => v.id === 'landmark-one-main')) {
      recommendations.push('Add main landmark for screen readers');
    }
    
    recommendations.push('Test with screen reader software');
    recommendations.push('Consider users with different abilities');
    
    return recommendations;
  }

  async testFamilyDashboardAccessibility(url, testType = 'wcag-aa') {
    const browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    try {
      await page.goto(url);
      
      let results = {};
      
      switch (testType) {
        case 'wcag-aa':
          results = await this.runWCAGTests(page);
          break;
        case 'keyboard-navigation':
          results = await this.testKeyboardOnly(page);
          break;
        case 'screen-reader':
          results = await this.testScreenReaderSupport(page);
          break;
        case 'color-contrast':
          results = await this.testColorContrast(page);
          break;
        case 'family-specific':
          results = await this.testFamilySpecificAccessibility(page);
          break;
        default:
          results = await this.runWCAGTests(page);
      }
      
      await browser.close();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            testType,
            url,
            results,
            timestamp: new Date().toISOString(),
            familyDashboardOptimized: true
          }, null, 2)
        }]
      };
      
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  async validateDashboardSemantics(url, widgetFocus = null) {
    const browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    try {
      await page.goto(url);
      
      const semantics = await page.evaluate((widgetFocus) => {
        const results = {
          headingStructure: [],
          landmarks: [],
          ariaLabels: [],
          semanticElements: [],
          issues: []
        };
        
        // Check heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(h => {
          results.headingStructure.push({
            level: h.tagName,
            text: h.textContent.trim(),
            hasId: !!h.id
          });
        });
        
        // Check landmarks
        const landmarks = document.querySelectorAll('main, header, footer, nav, aside, section[aria-labelledby], [role="main"], [role="banner"], [role="navigation"]');
        landmarks.forEach(l => {
          results.landmarks.push({
            element: l.tagName,
            role: l.getAttribute('role') || 'implicit',
            hasLabel: !!(l.getAttribute('aria-label') || l.getAttribute('aria-labelledby'))
          });
        });
        
        // Check ARIA labels
        const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
        ariaElements.forEach(el => {
          results.ariaLabels.push({
            element: el.tagName,
            ariaLabel: el.getAttribute('aria-label'),
            ariaLabelledby: el.getAttribute('aria-labelledby'),
            ariaDescribedby: el.getAttribute('aria-describedby')
          });
        });
        
        // Semantic validation
        if (results.headingStructure.length === 0) {
          results.issues.push('No heading structure found');
        }
        
        if (!results.landmarks.some(l => l.role === 'main' || l.element === 'MAIN')) {
          results.issues.push('No main landmark found');
        }
        
        return results;
      }, widgetFocus);
      
      await browser.close();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            url,
            widgetFocus,
            semantics,
            score: this.calculateSemanticsScore(semantics),
            recommendations: this.generateSemanticsRecommendations(semantics)
          }, null, 2)
        }]
      };
      
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  async testFamilySpecificAccessibility(page) {
    // Family dashboard specific accessibility tests
    const familyTests = await page.evaluate(() => {
      const results = {
        familyFriendly: {
          buttonSizes: [],
          readability: [],
          navigation: []
        },
        homeUsability: {
          quickAccess: false,
          clearLabels: false,
          simpleNavigation: false
        }
      };
      
      // Check button sizes for touch-friendly interaction
      const buttons = document.querySelectorAll('button, .btn, a[role="button"]');
      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        results.familyFriendly.buttonSizes.push({
          width: rect.width,
          height: rect.height,
          touchFriendly: rect.width >= 44 && rect.height >= 44,
          text: btn.textContent.trim()
        });
      });
      
      // Check for quick access patterns
      const skipLinks = document.querySelectorAll('.skip-link, [href="#main"]');
      results.homeUsability.quickAccess = skipLinks.length > 0;
      
      // Check label clarity
      const labels = document.querySelectorAll('label, [aria-label]');
      results.homeUsability.clearLabels = labels.length > 0;
      
      // Check navigation simplicity
      const navElements = document.querySelectorAll('nav, [role="navigation"]');
      results.homeUsability.simpleNavigation = navElements.length <= 2; // Simple navigation
      
      return results;
    });
    
    return familyTests;
  }

  calculateSemanticsScore(semantics) {
    let score = 100;
    
    if (semantics.issues.length > 0) score -= semantics.issues.length * 20;
    if (semantics.headingStructure.length === 0) score -= 30;
    if (semantics.landmarks.length === 0) score -= 25;
    if (semantics.ariaLabels.length === 0) score -= 15;
    
    return Math.max(0, score);
  }

  generateSemanticsRecommendations(semantics) {
    const recommendations = [];
    
    if (semantics.issues.includes('No heading structure found')) {
      recommendations.push('Add proper heading hierarchy (h1, h2, h3)');
    }
    
    if (semantics.issues.includes('No main landmark found')) {
      recommendations.push('Add <main> element or role="main"');
    }
    
    if (semantics.landmarks.length === 0) {
      recommendations.push('Add navigation landmarks (header, nav, main, footer)');
    }
    
    if (semantics.ariaLabels.length === 0) {
      recommendations.push('Add ARIA labels for interactive elements');
    }
    
    return recommendations;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Accessibility Testing MCP Server running on stdio');
  }
}

const server = new AccessibilityTestingMCP();
server.run().catch(console.error);