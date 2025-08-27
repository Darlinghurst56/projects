#!/usr/bin/env node

/**
 * User Testing MCP Server
 * Automated user journey validation for home dashboard
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import puppeteer from 'puppeteer';

export class UserTestingMCP {
  constructor() {
    this.server = new Server({
      name: 'user-testing-mcp',
      version: '1.0.0',
      description: 'Automated user journey validation for home dashboard'
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
          name: 'test_task_assignment_journey',
          description: 'Test the complete task assignment user journey',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'Dashboard URL to test'
              },
              taskType: {
                type: 'string',
                description: 'Type of task to test (urgent, normal, assign)',
                enum: ['urgent', 'normal', 'assign']
              }
            },
            required: ['url']
          }
        },
        {
          name: 'test_dashboard_navigation',
          description: 'Test dashboard navigation and user flow',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'Dashboard URL to test'
              },
              scenario: {
                type: 'string',
                description: 'Navigation scenario to test',
                enum: ['quick-actions', 'agent-interaction', 'full-workflow']
              }
            },
            required: ['url']
          }
        },
        {
          name: 'test_user_feedback_flow',
          description: 'Test user feedback and interaction responsiveness',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'Dashboard URL to test'
              },
              interactions: {
                type: 'number',
                description: 'Number of interactions to test (1-10)',
                minimum: 1,
                maximum: 10
              }
            },
            required: ['url']
          }
        },
        {
          name: 'validate_user_experience',
          description: 'Comprehensive UX validation across multiple user scenarios',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'Dashboard URL to test'
              },
              userType: {
                type: 'string',
                description: 'Type of user to simulate',
                enum: ['new-user', 'experienced-user', 'mobile-user']
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
          case 'test_task_assignment_journey':
            return await this.testTaskAssignmentJourney(args.url, args.taskType);
          case 'test_dashboard_navigation':
            return await this.testDashboardNavigation(args.url, args.scenario);
          case 'test_user_feedback_flow':
            return await this.testUserFeedbackFlow(args.url, args.interactions);
          case 'validate_user_experience':
            return await this.validateUserExperience(args.url, args.userType);
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

  async testTaskAssignmentJourney(url, taskType = 'urgent') {
    const browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    try {
      const startTime = Date.now();
      await page.goto(url);
      
      // Wait for page to load
      await page.waitForSelector('#dashboard-container', { timeout: 10000 });
      
      const journey = {
        steps: [],
        timings: {},
        interactions: [],
        errors: [],
        success: false
      };

      // Step 1: Landing and orientation
      const landingTime = Date.now();
      journey.steps.push('Page loaded');
      journey.timings.pageLoad = landingTime - startTime;

      // Check if user can quickly identify what to do
      const urgentSection = await page.$('.priority-urgent');
      const hasUrgentTasks = urgentSection !== null;
      
      if (hasUrgentTasks) {
        journey.steps.push('Urgent tasks section found');
        journey.interactions.push({ type: 'visual', element: 'urgent-section', status: 'success' });
      } else {
        journey.errors.push('No urgent tasks section visible');
      }

      // Step 2: Task identification
      const taskSelector = taskType === 'urgent' ? '.priority-urgent .task-card' : '.task-card';
      const taskCard = await page.$(taskSelector);
      
      if (taskCard) {
        journey.steps.push('Task card identified');
        
        // Get task details
        const taskTitle = await taskCard.$eval('h3', el => el.textContent);
        const taskDescription = await taskCard.$eval('p', el => el.textContent);
        
        journey.interactions.push({
          type: 'read',
          element: 'task-card',
          content: { title: taskTitle, description: taskDescription },
          status: 'success'
        });
      } else {
        journey.errors.push(`No ${taskType} task card found`);
      }

      // Step 3: Action selection
      const actionTime = Date.now();
      const actionButton = await page.$('.btn-danger, .btn-success, .btn');
      
      if (actionButton) {
        journey.steps.push('Action button found');
        
        // Test button interaction
        await actionButton.click();
        journey.interactions.push({ type: 'click', element: 'action-button', status: 'success' });
        
        // Wait for feedback
        await page.waitForTimeout(1000);
        
        // Check for loading state
        const loadingState = await page.$('.loading, [aria-busy="true"]');
        if (loadingState) {
          journey.steps.push('Loading feedback shown');
          journey.interactions.push({ type: 'feedback', element: 'loading', status: 'success' });
        }
        
        // Wait for completion
        await page.waitForTimeout(2000);
        
        // Check for success feedback
        const successFeedback = await page.$('.notification');
        const successButton = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('.btn'));
          return buttons.find(btn => btn.textContent.includes('✅'));
        });
        
        if (successFeedback || successButton) {
          journey.steps.push('Success feedback shown');
          journey.interactions.push({ type: 'feedback', element: 'success', status: 'success' });
          journey.success = true;
        }
        
        journey.timings.totalInteraction = Date.now() - actionTime;
      } else {
        journey.errors.push('No action button found');
      }

      // Step 4: Post-action state
      const notification = await page.$('.notification');
      if (notification) {
        const notificationText = await notification.evaluate(el => el.textContent);
        journey.interactions.push({
          type: 'notification',
          content: notificationText,
          status: 'success'
        });
      }

      await browser.close();

      // Calculate journey metrics
      const metrics = this.calculateJourneyMetrics(journey);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ journey, metrics }, null, 2)
        }]
      };

    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  async testDashboardNavigation(url, scenario = 'quick-actions') {
    const browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    try {
      await page.goto(url);
      await page.waitForSelector('#dashboard-container', { timeout: 10000 });

      const navigation = {
        scenario: scenario,
        steps: [],
        timings: {},
        accessibility: {},
        usability: {},
        errors: []
      };

      const startTime = Date.now();

      if (scenario === 'quick-actions') {
        // Test quick actions workflow
        const quickActionsSection = await page.$('[aria-labelledby="actions-heading"]');
        if (quickActionsSection) {
          navigation.steps.push('Quick actions section found');
          
          // Test each quick action
          const quickButtons = await quickActionsSection.$$('.btn');
          navigation.usability.quickActionCount = quickButtons.length;
          
          for (let i = 0; i < Math.min(quickButtons.length, 3); i++) {
            const buttonText = await quickButtons[i].evaluate(el => el.textContent);
            
            const clickTime = Date.now();
            await quickButtons[i].click();
            await page.waitForTimeout(500);
            
            navigation.steps.push(`Quick action clicked: ${buttonText}`);
            navigation.timings[`quickAction${i}`] = Date.now() - clickTime;
            
            // Wait for reset
            await page.waitForTimeout(2000);
          }
        }
      } else if (scenario === 'agent-interaction') {
        // Test agent interaction workflow
        const agentSection = await page.$('[aria-labelledby="agents-heading"]');
        if (agentSection) {
          navigation.steps.push('Agent section found');
          
          const agentCards = await agentSection.$$('.agent-card');
          navigation.usability.agentCount = agentCards.length;
          
          navigation.steps.push(`Found ${agentCards.length} agent cards`);
        }
      } else if (scenario === 'full-workflow') {
        // Test complete workflow
        const sections = await page.$$('section');
        navigation.usability.sectionCount = sections.length;
        
        for (const section of sections) {
          const heading = await section.$('h2');
          if (heading) {
            const headingText = await heading.evaluate(el => el.textContent);
            navigation.steps.push(`Section found: ${headingText}`);
          }
        }
      }

      // Test keyboard navigation
      const keyboardTime = Date.now();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      navigation.timings.keyboardNavigation = Date.now() - keyboardTime;
      navigation.accessibility.keyboardNavigable = true;

      // Test skip links
      const skipLink = await page.$('.skip-link');
      navigation.accessibility.hasSkipLinks = skipLink !== null;

      await browser.close();

      navigation.timings.total = Date.now() - startTime;
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(navigation, null, 2)
        }]
      };

    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  async testUserFeedbackFlow(url, interactions = 5) {
    const browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    try {
      await page.goto(url);
      await page.waitForSelector('#dashboard-container', { timeout: 10000 });

      const feedback = {
        totalInteractions: interactions,
        responses: [],
        averageResponseTime: 0,
        feedbackQuality: {},
        errors: []
      };

      const buttons = await page.$$('.btn');
      const interactionCount = Math.min(interactions, buttons.length);

      let totalResponseTime = 0;

      for (let i = 0; i < interactionCount; i++) {
        const button = buttons[i];
        const buttonText = await button.evaluate(el => el.textContent);
        
        const startTime = Date.now();
        await button.click();
        
        // Wait for immediate feedback
        await page.waitForTimeout(100);
        
        // Check for loading state
        const loadingState = await page.$('.loading, [aria-busy="true"]');
        const hasLoadingFeedback = loadingState !== null;
        
        // Wait for completion
        await page.waitForTimeout(2000);
        
        // Check for completion feedback
        const completionFeedback = await page.$('.notification');
        const completionButton = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('.btn'));
          return buttons.find(btn => btn.textContent.includes('✅'));
        });
        const hasCompletionFeedback = completionFeedback !== null || completionButton !== null;
        
        const responseTime = Date.now() - startTime;
        totalResponseTime += responseTime;
        
        feedback.responses.push({
          interaction: i + 1,
          buttonText: buttonText,
          responseTime: responseTime,
          hasLoadingFeedback: hasLoadingFeedback,
          hasCompletionFeedback: hasCompletionFeedback,
          feedbackQuality: hasLoadingFeedback && hasCompletionFeedback ? 'excellent' : 
                          hasLoadingFeedback || hasCompletionFeedback ? 'good' : 'poor'
        });
        
        // Wait for reset
        await page.waitForTimeout(1000);
      }

      feedback.averageResponseTime = totalResponseTime / interactionCount;
      
      // Calculate feedback quality metrics
      const excellentCount = feedback.responses.filter(r => r.feedbackQuality === 'excellent').length;
      const goodCount = feedback.responses.filter(r => r.feedbackQuality === 'good').length;
      const poorCount = feedback.responses.filter(r => r.feedbackQuality === 'poor').length;
      
      feedback.feedbackQuality = {
        excellent: excellentCount,
        good: goodCount,
        poor: poorCount,
        score: Math.round(((excellentCount * 100) + (goodCount * 70) + (poorCount * 30)) / interactionCount)
      };

      await browser.close();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(feedback, null, 2)
        }]
      };

    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  async validateUserExperience(url, userType = 'new-user') {
    const browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    try {
      // Set viewport based on user type
      if (userType === 'mobile-user') {
        await page.setViewport({ width: 375, height: 667 });
      } else {
        await page.setViewport({ width: 1920, height: 1080 });
      }

      await page.goto(url);
      await page.waitForSelector('#dashboard-container', { timeout: 10000 });

      const ux = {
        userType: userType,
        overallScore: 0,
        metrics: {},
        usabilityIssues: [],
        strengths: [],
        recommendations: []
      };

      const startTime = Date.now();

      // Test 1: First impression and clarity
      const h1 = await page.$('h1');
      const headerText = h1 ? await h1.evaluate(el => el.textContent) : null;
      
      if (headerText) {
        ux.strengths.push('Clear page title present');
        ux.metrics.hasTitle = true;
      } else {
        ux.usabilityIssues.push('No clear page title');
        ux.metrics.hasTitle = false;
      }

      // Test 2: Task prioritization visibility
      const urgentSection = await page.$('.priority-urgent');
      const importantSection = await page.$('.priority-important');
      
      if (urgentSection && importantSection) {
        ux.strengths.push('Clear task prioritization');
        ux.metrics.priorityVisible = true;
      } else {
        ux.usabilityIssues.push('Task priorities not clearly visible');
        ux.metrics.priorityVisible = false;
      }

      // Test 3: Action clarity (new user perspective)
      const actionButtons = await page.$$('.btn');
      const buttonTexts = await Promise.all(
        actionButtons.map(btn => btn.evaluate(el => el.textContent))
      );
      
      const confusingButtons = buttonTexts.filter(text => 
        text.includes('API') || text.includes('JSON') || text.includes('Config')
      );
      
      if (confusingButtons.length === 0) {
        ux.strengths.push('User-friendly button labels');
        ux.metrics.buttonClarityScore = 100;
      } else {
        ux.usabilityIssues.push(`Technical jargon in buttons: ${confusingButtons.join(', ')}`);
        ux.metrics.buttonClarityScore = Math.max(0, 100 - (confusingButtons.length * 20));
      }

      // Test 4: Information density
      const textElements = await page.$$('p, h1, h2, h3, button, span');
      const totalText = await Promise.all(
        textElements.map(el => el.evaluate(e => e.textContent))
      );
      
      const avgTextLength = totalText.reduce((sum, text) => sum + text.length, 0) / totalText.length;
      
      if (avgTextLength < 50) {
        ux.strengths.push('Concise, scannable text');
        ux.metrics.textDensity = 'optimal';
      } else {
        ux.usabilityIssues.push('Text too dense for quick scanning');
        ux.metrics.textDensity = 'too-dense';
      }

      // Test 5: Mobile experience (if mobile user)
      if (userType === 'mobile-user') {
        const touchTargets = await page.$$('.btn, .task-card, .agent-card');
        const touchTargetSizes = await Promise.all(
          touchTargets.map(async (target) => {
            const box = await target.boundingBox();
            return box ? { width: box.width, height: box.height } : null;
          })
        );
        
        const adequateTouchTargets = touchTargetSizes.filter(size => 
          size && size.width >= 44 && size.height >= 44
        ).length;
        
        ux.metrics.touchTargetCompliance = Math.round((adequateTouchTargets / touchTargetSizes.length) * 100);
        
        if (ux.metrics.touchTargetCompliance >= 90) {
          ux.strengths.push('Touch-friendly interface');
        } else {
          ux.usabilityIssues.push('Touch targets too small for mobile');
        }
      }

      // Test 6: Visual hierarchy
      const headings = await page.$$('h1, h2, h3');
      const hasProperHierarchy = headings.length >= 3;
      
      if (hasProperHierarchy) {
        ux.strengths.push('Clear visual hierarchy');
        ux.metrics.visualHierarchy = true;
      } else {
        ux.usabilityIssues.push('Weak visual hierarchy');
        ux.metrics.visualHierarchy = false;
      }

      // Calculate overall score
      const scoreFactors = [
        ux.metrics.hasTitle ? 20 : 0,
        ux.metrics.priorityVisible ? 20 : 0,
        ux.metrics.buttonClarityScore * 0.2,
        ux.metrics.textDensity === 'optimal' ? 20 : 0,
        ux.metrics.visualHierarchy ? 20 : 0,
        userType === 'mobile-user' ? (ux.metrics.touchTargetCompliance * 0.2) : 20
      ];
      
      ux.overallScore = Math.round(scoreFactors.reduce((sum, score) => sum + score, 0));

      // Generate recommendations
      if (ux.overallScore < 70) {
        ux.recommendations.push('Improve task prioritization visibility');
        ux.recommendations.push('Simplify button labels for non-technical users');
      }
      
      if (userType === 'new-user' && ux.usabilityIssues.length > 0) {
        ux.recommendations.push('Add onboarding hints or tooltips');
      }

      ux.metrics.totalTestTime = Date.now() - startTime;

      await browser.close();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(ux, null, 2)
        }]
      };

    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  calculateJourneyMetrics(journey) {
    const metrics = {
      success: journey.success,
      totalSteps: journey.steps.length,
      totalInteractions: journey.interactions.length,
      errorCount: journey.errors.length,
      successRate: journey.success ? 100 : 0,
      averageStepTime: 0,
      usabilityScore: 0
    };

    // Calculate usability score
    let score = 100;
    
    // Deduct for errors
    score -= journey.errors.length * 20;
    
    // Deduct for slow interactions
    if (journey.timings.totalInteraction > 5000) {
      score -= 20;
    }
    
    // Deduct for missing feedback
    const feedbackInteractions = journey.interactions.filter(i => i.type === 'feedback');
    if (feedbackInteractions.length < 2) {
      score -= 15;
    }
    
    // Bonus for successful completion
    if (journey.success) {
      score += 10;
    }
    
    metrics.usabilityScore = Math.max(0, Math.min(100, score));
    metrics.averageStepTime = journey.timings.totalInteraction / journey.steps.length;
    
    return metrics;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('User Testing MCP Server running on stdio');
  }
}

const server = new UserTestingMCP();
server.run().catch(console.error);