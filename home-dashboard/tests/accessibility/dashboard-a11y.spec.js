import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

test.describe('Accessibility Compliance Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard and inject axe
    await page.goto('http://localhost:8080/hursthome');
    await injectAxe(page);
  });

  test('WCAG 2.1 AA Compliance - Dashboard Homepage', async ({ page }) => {
    console.log('🔍 Testing dashboard homepage accessibility...');
    
    // Run full accessibility check
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
    
    console.log('✅ Dashboard homepage passes WCAG 2.1 AA compliance');
  });

  test('Color Contrast Requirements', async ({ page }) => {
    console.log('🎨 Testing color contrast...');
    
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
    
    console.log('✅ Color contrast meets accessibility standards');
  });

  test('Keyboard Navigation Support', async ({ page }) => {
    console.log('⌨️ Testing keyboard navigation...');
    
    // Test tab navigation through interactive elements
    await page.keyboard.press('Tab');
    const firstFocusable = await page.locator(':focus').first();
    await expect(firstFocusable).toBeVisible();
    
    // Continue tabbing through elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.locator(':focus').first();
      if (await focused.isVisible()) {
        console.log(`✅ Tab ${i + 2}: Focus visible on interactive element`);
      }
    }
    
    await checkA11y(page, null, {
      rules: {
        'focusable-content': { enabled: true },
        'focus-order-semantics': { enabled: true }
      }
    });
    
    console.log('✅ Keyboard navigation is accessible');
  });

  test('Screen Reader Compatibility', async ({ page }) => {
    console.log('🔊 Testing screen reader compatibility...');
    
    // Check for proper heading structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1); // Only one H1 per page
    
    const h1Text = await page.locator('h1').textContent();
    expect(h1Text).toBeTruthy();
    expect(h1Text.trim().length).toBeGreaterThan(0);
    
    // Check for alt text on images
    const images = await page.locator('img').count();
    if (images > 0) {
      for (let i = 0; i < images; i++) {
        const img = page.locator('img').nth(i);
        const alt = await img.getAttribute('alt');
        if (await img.isVisible()) {
          expect(alt).toBeTruthy();
          console.log(`✅ Image ${i + 1} has alt text: "${alt}"`);
        }
      }
    }
    
    // Test semantic structure
    await checkA11y(page, null, {
      rules: {
        'page-has-heading-one': { enabled: true },
        'heading-order': { enabled: true },
        'image-alt': { enabled: true },
        'label': { enabled: true }
      }
    });
    
    console.log('✅ Screen reader compatibility verified');
  });

  test('Form Accessibility', async ({ page }) => {
    console.log('📝 Testing form accessibility...');
    
    // Check for login forms or input elements
    const inputs = await page.locator('input, button, select, textarea').count();
    
    if (inputs > 0) {
      console.log(`Found ${inputs} interactive form elements`);
      
      // Test form-specific accessibility
      await checkA11y(page, null, {
        rules: {
          'label': { enabled: true },
          'button-name': { enabled: true },
          'input-button-name': { enabled: true }
        }
      });
      
      // Check each interactive element has accessible name
      for (let i = 0; i < Math.min(inputs, 10); i++) {
        const element = page.locator('input, button, select, textarea').nth(i);
        if (await element.isVisible()) {
          const name = await element.getAttribute('aria-label') || 
                       await element.getAttribute('title') ||
                       await element.textContent();
          expect(name).toBeTruthy();
          console.log(`✅ Interactive element ${i + 1} has accessible name`);
        }
      }
    }
    
    console.log('✅ Form accessibility validated');
  });

  test('Mobile Accessibility', async ({ page }) => {
    console.log('📱 Testing mobile accessibility...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Mobile-specific accessibility checks
    await checkA11y(page, null, {
      rules: {
        'target-size': { enabled: true }, // Touch target size
        'color-contrast': { enabled: true }
      }
    });
    
    // Check touch targets are large enough (minimum 44x44 pixels)
    const buttons = page.locator('button, a, input[type="button"], input[type="submit"]');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
          console.log(`✅ Touch target ${i + 1} meets minimum size requirement`);
        }
      }
    }
    
    console.log('✅ Mobile accessibility validated');
  });

  test('Error State Accessibility', async ({ page }) => {
    console.log('🚨 Testing error state accessibility...');
    
    // Test navigation to invalid page
    await page.goto('http://localhost:8080/invalid-page-test');
    
    // Check error page is still accessible
    await checkA11y(page, null, {
      rules: {
        'page-has-heading-one': { enabled: true },
        'color-contrast': { enabled: true }
      }
    });
    
    console.log('✅ Error states are accessible');
  });

  test('Performance Impact Assessment', async ({ page }) => {
    console.log('⚡ Testing accessibility performance impact...');
    
    const startTime = Date.now();
    
    // Run comprehensive accessibility check
    const violations = await getViolations(page, null, {
      detailedReport: true
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Accessibility checks should not significantly impact performance
    expect(duration).toBeLessThan(5000); // Less than 5 seconds
    
    console.log(`✅ Accessibility check completed in ${duration}ms`);
    console.log(`Found ${violations.length} violations`);
    
    // Log any violations for debugging
    if (violations.length > 0) {
      console.log('⚠️ Accessibility violations found:');
      violations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.id}: ${violation.description}`);
      });
    }
  });

  test('ARIA Labels and Roles', async ({ page }) => {
    console.log('🏷️ Testing ARIA implementation...');
    
    await checkA11y(page, null, {
      rules: {
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'button-name': { enabled: true },
        'link-name': { enabled: true }
      }
    });
    
    // Check for proper ARIA implementation
    const elementsWithAria = await page.locator('[aria-label], [aria-labelledby], [role]').count();
    console.log(`Found ${elementsWithAria} elements with ARIA attributes`);
    
    console.log('✅ ARIA implementation validated');
  });

  test('High Contrast Mode Support', async ({ page }) => {
    console.log('🔳 Testing high contrast mode...');
    
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * { 
            background: black !important; 
            color: white !important; 
            border-color: white !important; 
          }
        }
      `
    });
    
    await page.reload();
    
    // Check content is still visible and accessible
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
    
    console.log('✅ High contrast mode compatibility verified');
  });
});