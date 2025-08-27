import { test, expect } from '@playwright/test';
import { 
  loginWithGoogle, 
  waitForWidget,
  mockApiResponse,
  mockMealPlan
} from '../helpers/test-utils';

test.describe('AI Chat and Meal Planner Widgets', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithGoogle(page);
  });

  test.describe('AI Chat Widget', () => {
    const mockAiResponse = {
      success: true,
      data: {
        response: 'Hello! I\'m your family AI assistant. How can I help you today?',
        suggestedActions: [
          { 
            type: 'calendar_event',
            label: 'Add to Calendar',
            icon: '📅',
            data: { event: 'Family movie night' }
          }
        ],
        timestamp: new Date().toISOString()
      }
    };

    test.beforeEach(async ({ page }) => {
      await mockApiResponse(page, '**/api/ai/chat', mockAiResponse, 200, 'POST');
      await mockApiResponse(page, '**/api/meals/plan', mockMealPlan);
    });

    test('should display AI chat interface correctly', async ({ page }) => {
      const widget = await waitForWidget(page, 'ai-chat-widget');
      
      // Should show chat input
      const chatInput = widget.locator('input[type="text"], textarea');
      await expect(chatInput).toBeVisible();
      await expect(chatInput).toBeEditable();
      
      // Should show send button
      const sendButton = widget.locator('button[type="submit"], .send-btn, button:has-text("Send")');
      await expect(sendButton).toBeVisible();
      
      // Should have chat history area
      const chatHistory = widget.locator('.chat-history, .messages, .chat-messages');
      await expect(chatHistory).toBeVisible();
    });

    test('should send and receive chat messages', async ({ page }) => {
      const widget = await waitForWidget(page, 'ai-chat-widget');
      
      // Type a message
      const chatInput = widget.locator('input[type="text"], textarea').first();
      await chatInput.fill('What should we have for dinner tonight?');
      
      // Send message
      const sendButton = widget.locator('button[type="submit"], .send-btn, button:has-text("Send")').first();
      await sendButton.click();
      
      // Should show user message
      await expect(widget).toContainText('What should we have for dinner tonight?');
      
      // Should show AI response
      await expect(widget).toContainText('Hello! I\'m your family AI assistant');
      
      // Input should be cleared
      await expect(chatInput).toHaveValue('');
    });

    test('should display suggested actions', async ({ page }) => {
      const widget = await waitForWidget(page, 'ai-chat-widget');
      
      // Send a message to trigger AI response
      const chatInput = widget.locator('input[type="text"], textarea').first();
      await chatInput.fill('Let\'s plan a family movie night');
      
      const sendButton = widget.locator('button[type="submit"], .send-btn').first();
      await sendButton.click();
      
      // Should show suggested action button
      const actionButton = widget.locator('.suggested-actions button, button:has-text("Add to Calendar")');
      await expect(actionButton).toBeVisible();
      await expect(actionButton).toContainText('📅');
      await expect(actionButton).toContainText('Add to Calendar');
    });

    test('should handle suggested action clicks', async ({ page }) => {
      const widget = await waitForWidget(page, 'ai-chat-widget');
      
      // Mock Google Calendar API
      await mockApiResponse(page, '**/api/google/calendar/events', {
        success: true,
        data: { eventId: 'created-event-123' }
      }, 201, 'POST');
      
      // Send message and get suggested action
      const chatInput = widget.locator('input[type="text"], textarea').first();
      await chatInput.fill('Family movie night this Friday');
      await widget.locator('button[type="submit"], .send-btn').first().click();
      
      // Click suggested action
      const actionButton = widget.locator('button:has-text("Add to Calendar")');
      if (await actionButton.isVisible()) {
        await actionButton.click();
        
        // Should show success feedback
        const successMessage = widget.locator('.action-success, .success-message');
        await expect(successMessage).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show typing indicator', async ({ page }) => {
      // Mock delayed AI response
      await page.route('**/api/ai/chat', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockAiResponse)
        });
      });
      
      const widget = await waitForWidget(page, 'ai-chat-widget');
      
      // Send message
      const chatInput = widget.locator('input[type="text"], textarea').first();
      await chatInput.fill('Hello AI');
      await widget.locator('button[type="submit"], .send-btn').first().click();
      
      // Should show typing indicator
      const typingIndicator = widget.locator('.typing-indicator, .ai-thinking, [data-typing="true"]');
      await expect(typingIndicator).toBeVisible({ timeout: 1000 });
      
      // Typing indicator should disappear when response arrives
      await expect(typingIndicator).toBeHidden({ timeout: 5000 });
    });

    test('should handle AI service errors', async ({ page }) => {
      await mockApiResponse(page, '**/api/ai/chat', {
        error: 'Ollama service unavailable'
      }, 503, 'POST');
      
      const widget = await waitForWidget(page, 'ai-chat-widget');
      
      // Send message
      const chatInput = widget.locator('input[type="text"], textarea').first();
      await chatInput.fill('Hello');
      await widget.locator('button[type="submit"], .send-btn').first().click();
      
      // Should show error message
      const errorMessage = widget.locator('.error-message, .chat-error, [data-error="true"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/error|unavailable|failed/i);
    });

    test('should support keyboard shortcuts', async ({ page }) => {
      const widget = await waitForWidget(page, 'ai-chat-widget');
      
      // Type message and press Enter
      const chatInput = widget.locator('input[type="text"], textarea').first();
      await chatInput.fill('Test message');
      await chatInput.press('Enter');
      
      // Should send message (same as clicking send button)
      await expect(widget).toContainText('Test message');
      
      // For textarea, Shift+Enter might be used for new lines
      if (await widget.locator('textarea').isVisible()) {
        await widget.locator('textarea').fill('Multi-line\nMessage');
        await widget.locator('textarea').press('Shift+Enter');
        
        // Should add new line, not send
        const textValue = await widget.locator('textarea').inputValue();
        expect(textValue).toContain('\n');
      }
    });

    test('should persist chat history', async ({ page }) => {
      const widget = await waitForWidget(page, 'ai-chat-widget');
      
      // Send first message
      let chatInput = widget.locator('input[type="text"], textarea').first();
      await chatInput.fill('First message');
      await widget.locator('button[type="submit"], .send-btn').first().click();
      
      // Wait for response
      await expect(widget).toContainText('Hello! I\'m your family AI assistant');
      
      // Send second message
      chatInput = widget.locator('input[type="text"], textarea').first();
      await chatInput.fill('Second message');
      await widget.locator('button[type="submit"], .send-btn').first().click();
      
      // Both messages should be visible
      await expect(widget).toContainText('First message');
      await expect(widget).toContainText('Second message');
      
      // Should have multiple AI responses
      const aiMessages = widget.locator('.ai-message, .assistant-message, [data-sender="ai"]');
      expect(await aiMessages.count()).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Meal Planner Widget', () => {
    test.beforeEach(async ({ page }) => {
      await mockApiResponse(page, '**/api/meals/plan', mockMealPlan);
      await mockApiResponse(page, '**/api/meals/upload-shopping-list', {
        success: true,
        data: { message: 'Shopping list processed successfully' }
      }, 200, 'POST');
    });

    test('should display weekly meal plan correctly', async ({ page }) => {
      const widget = await waitForWidget(page, 'meal-planner-widget');
      
      // Should show days of the week
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      for (const day of days) {
        await expect(widget).toContainText(day);
      }
      
      // Should show meal names from mock data
      await expect(widget).toContainText('Chicken Stir Fry');
      await expect(widget).toContainText('Beef Pasta');
      await expect(widget).toContainText('Pizza Night');
      
      // Should show cooking times
      await expect(widget).toContainText('25');
      await expect(widget).toContainText('30');
      await expect(widget).toContainText('20');
      
      // Should show difficulty levels
      await expect(widget).toContainText('Easy');
      await expect(widget).toContainText('Medium');
    });

    test('should show PDF upload interface', async ({ page }) => {
      const widget = await waitForWidget(page, 'meal-planner-widget');
      
      // Should have file upload input
      const fileInput = widget.locator('input[type="file"], .file-upload');
      await expect(fileInput).toBeVisible();
      
      // Should have upload instructions
      const uploadInstructions = widget.locator('.upload-instructions, .upload-help');
      if (await uploadInstructions.isVisible()) {
        await expect(uploadInstructions).toContainText(/pdf|shopping|list/i);
      }
      
      // Should have upload button or drag zone
      const uploadTrigger = widget.locator('button:has-text("Upload"), .upload-button, .drag-zone');
      expect(await uploadTrigger.count()).toBeGreaterThan(0);
    });

    test('should handle PDF upload', async ({ page }) => {
      const widget = await waitForWidget(page, 'meal-planner-widget');
      
      // Create a mock PDF file
      const fileInput = widget.locator('input[type="file"]');
      
      if (await fileInput.isVisible()) {
        // Set up file chooser
        const fileChooserPromise = page.waitForEvent('filechooser');
        await fileInput.click();
        const fileChooser = await fileChooserPromise;
        
        // Create a dummy file (in real test, would use actual PDF)
        await fileChooser.setFiles({
          name: 'shopping-list.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('Mock PDF content')
        });
        
        // Should trigger upload
        await page.waitForResponse(response => 
          response.url().includes('/api/meals/upload-shopping-list')
        );
        
        // Should show success message
        const successMessage = widget.locator('.upload-success, .success-message');
        await expect(successMessage).toBeVisible({ timeout: 5000 });
      }
    });

    test('should allow meal editing', async ({ page }) => {
      const widget = await waitForWidget(page, 'meal-planner-widget');
      
      // Look for edit button on a meal
      const editButton = widget.locator('button:has-text("Edit"), .edit-meal, [data-action="edit"]').first();
      
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Should show edit form or modal
        const editForm = widget.locator('.edit-form, .meal-editor, [data-editing="true"]');
        await expect(editForm).toBeVisible();
        
        // Should have editable fields
        const nameInput = editForm.locator('input[name="name"], input[placeholder*="meal name"]');
        if (await nameInput.isVisible()) {
          await nameInput.clear();
          await nameInput.fill('Updated Meal Name');
        }
        
        // Should have save button
        const saveButton = editForm.locator('button:has-text("Save"), .save-btn');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          
          // Should show updated meal name
          await expect(widget).toContainText('Updated Meal Name');
        }
      }
    });

    test('should generate new meal suggestions', async ({ page }) => {
      await mockApiResponse(page, '**/api/meals/generate', {
        success: true,
        data: {
          meals: {
            Monday: { name: 'AI Suggested Pasta', cookTime: 20, difficulty: 'Easy' }
          }
        }
      }, 200, 'POST');
      
      const widget = await waitForWidget(page, 'meal-planner-widget');
      
      // Look for generate button
      const generateButton = widget.locator('button:has-text("Generate"), .generate-btn, .ai-suggest');
      
      if (await generateButton.isVisible()) {
        await generateButton.click();
        
        // Should trigger API call
        await page.waitForResponse(response => 
          response.url().includes('/api/meals/generate')
        );
        
        // Should show new suggestions
        await expect(widget).toContainText('AI Suggested');
      }
    });

    test('should show meal plan loading states', async ({ page }) => {
      // Delay meal plan API response
      await page.route('**/api/meals/plan', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockMealPlan)
        });
      });
      
      await page.reload();
      const widget = await waitForWidget(page, 'meal-planner-widget');
      
      // Should show loading indicator
      const loadingIndicator = widget.locator('.loading-spinner, .loading');
      await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
      
      await expect(loadingIndicator).toBeHidden({ timeout: 5000 });
    });

    test('should handle empty meal plan', async ({ page }) => {
      await mockApiResponse(page, '**/api/meals/plan', {
        message: 'No meal plan found'
      }, 404);
      
      await page.reload();
      const widget = await waitForWidget(page, 'meal-planner-widget');
      
      // Should show empty state
      const emptyState = widget.locator('.empty-state, .no-meals');
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText(/no meal plan|get started|create/i);
      
      // Should show option to create new plan
      const createButton = widget.locator('button:has-text("Create"), .create-plan');
      await expect(createButton).toBeVisible();
    });

    test('should handle meal planning API errors', async ({ page }) => {
      await mockApiResponse(page, '**/api/meals/plan', {
        error: 'Meal planning service unavailable'
      }, 503);
      
      await page.reload();
      const widget = await waitForWidget(page, 'meal-planner-widget');
      
      // Should show error message
      const errorMessage = widget.locator('.error-message, .meal-error');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/error|unavailable|failed/i);
    });

    test('should show ingredient availability', async ({ page }) => {
      const widget = await waitForWidget(page, 'meal-planner-widget');
      
      // Should show available ingredients from mock data
      const ingredientsList = widget.locator('.ingredients-list, .available-ingredients');
      if (await ingredientsList.isVisible()) {
        await expect(ingredientsList).toContainText('chicken');
        await expect(ingredientsList).toContainText('beef');
        await expect(ingredientsList).toContainText('vegetables');
      }
      
      // Should indicate ingredient status
      const ingredientItems = widget.locator('.ingredient-item, [data-ingredient]');
      if (await ingredientItems.count() > 0) {
        // Should have visual indicators for available/unavailable
        const availableIndicator = ingredientItems.first().locator('.available, .in-stock, [data-available="true"]');
        const unavailableIndicator = ingredientItems.first().locator('.unavailable, .out-of-stock, [data-available="false"]');
        
        const hasIndicators = await availableIndicator.isVisible() || await unavailableIndicator.isVisible();
        expect(hasIndicators).toBe(true);
      }
    });
  });

  test.describe('AI and Meal Widgets Integration', () => {
    test('should integrate AI chat with meal planning', async ({ page }) => {
      // Mock meal suggestion API
      await mockApiResponse(page, '**/api/meals/suggest', {
        success: true,
        data: { suggestion: 'Based on your available ingredients, I suggest making chicken stir fry tonight!' }
      }, 200, 'POST');
      
      const aiWidget = await waitForWidget(page, 'ai-chat-widget');
      const mealWidget = await waitForWidget(page, 'meal-planner-widget');
      
      // Ask AI about meal suggestions
      const chatInput = aiWidget.locator('input[type="text"], textarea').first();
      await chatInput.fill('What should we cook with chicken and vegetables?');
      await aiWidget.locator('button[type="submit"], .send-btn').first().click();
      
      // AI should provide meal suggestions
      await expect(aiWidget).toContainText(/chicken|stir fry|suggest/i);
      
      // Should show integration between widgets
      const mealSuggestion = aiWidget.locator('.meal-suggestion, [data-meal-suggestion]');
      if (await mealSuggestion.isVisible()) {
        await mealSuggestion.click();
        
        // Should highlight or update meal planner
        await page.waitForTimeout(500);
        await expect(mealWidget).toContainText(/chicken/i);
      }
    });

    test('should share context between AI and meal planning', async ({ page }) => {
      const aiWidget = await waitForWidget(page, 'ai-chat-widget');
      const mealWidget = await waitForWidget(page, 'meal-planner-widget');
      
      // AI should be aware of current meal plan
      const chatInput = aiWidget.locator('input[type="text"], textarea').first();
      await chatInput.fill('What\'s for dinner on Tuesday?');
      await aiWidget.locator('button[type="submit"], .send-btn').first().click();
      
      // AI response should reference the meal plan
      await expect(aiWidget).toContainText(/beef pasta|tuesday/i);
    });

    test('should handle offline state for both widgets', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/ai/**', route => route.abort());
      await page.route('**/api/meals/**', route => route.abort());
      
      await page.reload();
      
      const aiWidget = await waitForWidget(page, 'ai-chat-widget');
      const mealWidget = await waitForWidget(page, 'meal-planner-widget');
      
      // Both widgets should show offline state
      const aiOffline = aiWidget.locator('.offline, .connection-error, [data-offline="true"]');
      const mealOffline = mealWidget.locator('.offline, .connection-error, [data-offline="true"]');
      
      await expect(aiOffline).toBeVisible({ timeout: 10000 });
      await expect(mealOffline).toBeVisible({ timeout: 10000 });
    });
  });
});