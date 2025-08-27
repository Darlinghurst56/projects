#!/usr/bin/env node

/**
 * TaskMaster AI - Orchestrator Handoff Visualizer
 * Interactive visual flow system for orchestrator-to-user handoffs
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

// Use dynamic import for ES module compatibility
let boxen;
try {
    boxen = require('boxen');
    if (typeof boxen !== 'function') {
        throw new Error('boxen is not a function');
    }
} catch (e) {
    // Fallback for ES module imports
    boxen = (text, options = {}) => {
        const padding = ' '.repeat(options.padding || 1);
        const lines = text.split('\n');
        const maxLength = Math.max(...lines.map(line => line.length));
        const border = '─'.repeat(maxLength + (options.padding || 1) * 2);
        
        return `┌${border}┐\n${lines.map(line => `│${padding}${line.padEnd(maxLength)}${padding}│`).join('\n')}\n└${border}┘`;
    };
}

class OrchestratorHandoffVisualizer {
    constructor() {
        this.currentStage = 'analysis';
        this.taskData = null;
        this.analysisResults = null;
        this.userDecision = null;
        this.executionProgress = 0;
        this.completionData = null;
        this.autoApprovalTimer = null;
        this.refreshInterval = null;
        
        // Load agent capabilities
        this.agentCapabilities = this.loadAgentCapabilities();
        
        // Load coordination workflow
        this.coordinationWorkflow = this.loadCoordinationWorkflow();
    }

    loadAgentCapabilities() {
        try {
            const rolesPath = path.join(process.cwd(), '.taskmaster/agents/agent-roles.json');
            const roles = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));
            return roles.agents || {};
        } catch (error) {
            console.error(chalk.red('❌ Could not load agent capabilities'));
            return {};
        }
    }

    loadCoordinationWorkflow() {
        try {
            const workflowPath = path.join(process.cwd(), '.taskmaster/agents/coordination-workflow.cjs');
            const WorkflowClass = require(workflowPath);
            return new WorkflowClass();
        } catch (error) {
            console.error(chalk.red('❌ Could not load coordination workflow'));
            return null;
        }
    }

    /**
     * Stage 1: Task Analysis & Suggestion
     */
    async displayTaskAnalysis(taskData) {
        console.clear();
        this.taskData = taskData;
        
        // Analyze task requirements
        const analysis = await this.analyzeTask(taskData);
        this.analysisResults = analysis;
        
        // Display analysis header
        console.log(boxen(
            chalk.blue.bold('🧠 ORCHESTRATOR ANALYSIS') + '\n' +
            chalk.gray('AI-powered task analysis and agent matching'),
            {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'blue',
                backgroundColor: '#001122'
            }
        ));
        
        console.log();
        
        // Task info
        console.log(chalk.cyan('📋 Task Information'));
        console.log(`├─ ID: ${chalk.yellow(taskData.id)}`);
        console.log(`├─ Title: ${chalk.white(taskData.title)}`);
        console.log(`├─ Priority: ${this.getPriorityIcon(taskData.priority)} ${taskData.priority}`);
        console.log(`└─ Project: ${chalk.gray(taskData.project || 'Not specified')}`);
        console.log();
        
        // Analysis progress
        console.log(chalk.cyan('⚡ Analysis Progress'));
        await this.showProgressBar('Analyzing requirements', 100);
        await this.showProgressBar('Matching capabilities', 100);
        await this.showProgressBar('Calculating scores', 100);
        await this.showProgressBar('Generating recommendations', 100);
        console.log();
        
        // Keywords and requirements
        console.log(chalk.cyan('🔍 Analysis Results'));
        console.log(`├─ Keywords: ${analysis.keywords.map(k => chalk.yellow(k)).join(', ')}`);
        console.log(`├─ Requirements: ${analysis.requirements.join(', ')}`);
        console.log(`├─ Complexity: ${this.getComplexityIcon(analysis.complexity)} ${analysis.complexity}`);
        console.log(`└─ Estimated Time: ${chalk.magenta(analysis.estimatedTime)}`);
        console.log();
        
        // Agent recommendations
        console.log(chalk.cyan('🎯 Agent Recommendations'));
        analysis.recommendations.forEach((rec, index) => {
            const prefix = index === 0 ? '├─' : index === analysis.recommendations.length - 1 ? '└─' : '├─';
            const confidence = this.getConfidenceBar(rec.confidence);
            const status = rec.available ? chalk.green('✅ Available') : chalk.red('🔴 Busy');
            
            console.log(`${prefix} ${chalk.bold(rec.agent)}: ${confidence} ${rec.confidence}% | ${status}`);
            if (rec.reasoning) {
                console.log(`   ${chalk.gray('└─ ' + rec.reasoning)}`);
            }
        });
        
        console.log();
        
        // Best recommendation highlight
        const bestMatch = analysis.recommendations[0];
        console.log(boxen(
            chalk.green.bold('💡 RECOMMENDATION') + '\n' +
            `Best Match: ${chalk.yellow(bestMatch.agent)} (${bestMatch.confidence}% confidence)\n` +
            `Reasoning: ${bestMatch.reasoning}`,
            {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'green'
            }
        ));
        
        console.log();
        console.log(chalk.gray('Press any key to continue to handoff stage...'));
        
        // Wait for user input
        await this.waitForKeyPress();
        
        // Move to handoff stage
        await this.displayUserHandoff();
    }

    /**
     * Stage 2: User Handoff & Decision
     */
    async displayUserHandoff() {
        console.clear();
        
        const bestMatch = this.analysisResults.recommendations[0];
        
        // Display handoff header
        console.log(boxen(
            chalk.yellow.bold('🤖➡️👤 ORCHESTRATOR HANDOFF') + '\n' +
            chalk.gray('Your decision required for task assignment'),
            {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'yellow',
                backgroundColor: '#221100'
            }
        ));
        
        console.log();
        
        // Task summary
        console.log(chalk.cyan('📋 Task Summary'));
        console.log(`├─ Task: ${chalk.white(this.taskData.title)}`);
        console.log(`├─ Suggested Agent: ${chalk.yellow(bestMatch.agent)}`);
        console.log(`├─ Confidence: ${this.getConfidenceBar(bestMatch.confidence)} ${bestMatch.confidence}%`);
        console.log(`└─ Reasoning: ${chalk.gray(bestMatch.reasoning)}`);
        console.log();
        
        // Decision options
        console.log(chalk.cyan('🎯 Your Decision Required'));
        console.log('┌─────────────────────────────────────────────────────────────┐');
        console.log('│ [A] ✅ Approve - Assign to ' + chalk.yellow(bestMatch.agent) + '                  │');
        console.log('│ [R] ❌ Reject - Choose different agent                     │');
        console.log('│ [M] ✏️  Modify - Edit assignment details                   │');
        console.log('│ [D] 📋 Defer - Decide later                                │');
        console.log('└─────────────────────────────────────────────────────────────┘');
        console.log();
        
        // Auto-approval timer
        let timeRemaining = 300; // 5 minutes
        console.log(chalk.cyan('⏱️  Auto-approval Timer'));
        
        const timerInterval = setInterval(() => {
            process.stdout.write('\r' + chalk.gray(`Auto-approve in: ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')} `));
            timeRemaining--;
            
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                console.log(chalk.green('\n⏰ Auto-approved due to timeout'));
                this.userDecision = { action: 'approve', reasoning: 'Auto-approved after timeout' };
                this.executeTask();
            }
        }, 1000);
        
        console.log();
        
        // Get user decision
        const decision = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: '✅ Approve - Assign to ' + bestMatch.agent, value: 'approve' },
                    { name: '❌ Reject - Choose different agent', value: 'reject' },
                    { name: '✏️  Modify - Edit assignment details', value: 'modify' },
                    { name: '📋 Defer - Decide later', value: 'defer' }
                ]
            }
        ]);
        
        clearInterval(timerInterval);
        console.log(); // Clear timer line
        
        // Handle decision
        if (decision.action === 'approve') {
            const reasoning = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'reasoning',
                    message: 'Add reasoning (optional):',
                    default: 'Approved orchestrator recommendation'
                }
            ]);
            
            this.userDecision = { action: 'approve', reasoning: reasoning.reasoning, agent: bestMatch.agent };
            console.log(chalk.green('✅ Task approved for assignment'));
            await this.executeTask();
            
        } else if (decision.action === 'reject') {
            await this.handleRejection();
        } else if (decision.action === 'modify') {
            await this.handleModification();
        } else if (decision.action === 'defer') {
            console.log(chalk.yellow('📋 Task deferred - added to pending queue'));
            process.exit(0);
        }
    }

    /**
     * Stage 3: Execution & Monitoring
     */
    async executeTask() {
        console.clear();
        
        // Display execution header
        console.log(boxen(
            chalk.green.bold('🚀 TASK EXECUTION MONITOR') + '\n' +
            chalk.gray('Real-time task execution and progress tracking'),
            {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'green',
                backgroundColor: '#002200'
            }
        ));
        
        console.log();
        
        // Task info
        console.log(chalk.cyan('📋 Execution Details'));
        console.log(`├─ Task: ${chalk.white(this.taskData.title)}`);
        console.log(`├─ Agent: ${chalk.yellow(this.userDecision.agent)}`);
        console.log(`├─ Status: ${chalk.green('⚡ In Progress')}`);
        console.log(`└─ Started: ${chalk.gray(new Date().toLocaleTimeString())}`);
        console.log();
        
        // Progress simulation
        console.log(chalk.cyan('📊 Progress Tracking'));
        const progressStages = [
            { name: 'Initializing', time: 2000 },
            { name: 'Analyzing requirements', time: 3000 },
            { name: 'Setting up environment', time: 2000 },
            { name: 'Implementing solution', time: 5000 },
            { name: 'Running tests', time: 2000 },
            { name: 'Finalizing', time: 1000 }
        ];
        
        let totalProgress = 0;
        const activityLog = [];
        
        for (let i = 0; i < progressStages.length; i++) {
            const stage = progressStages[i];
            const progress = Math.floor(((i + 1) / progressStages.length) * 100);
            
            // Update progress bar
            process.stdout.write('\r' + this.getProgressBar(progress, 50) + ` ${progress}%`);
            
            // Add to activity log
            activityLog.push({
                time: new Date().toLocaleTimeString(),
                action: stage.name
            });
            
            // Show activity log
            console.log('\n');
            console.log(chalk.cyan('🔄 Activity Log'));
            activityLog.slice(-5).forEach((log, index) => {
                const prefix = index === activityLog.length - 1 ? '└─' : '├─';
                const icon = index === activityLog.length - 1 ? '⚡' : '✅';
                console.log(`${prefix} ${log.time} ${icon} ${log.action}`);
            });
            
            // Show metrics
            console.log();
            console.log(chalk.cyan('📈 Metrics'));
            const elapsed = Math.floor((Date.now() - Date.now()) / 1000 / 60) + (i + 1) * 2; // Simulate elapsed time
            const estimated = Math.max(0, 15 - elapsed);
            console.log(`├─ Time Elapsed: ${elapsed} minutes`);
            console.log(`├─ Est. Completion: ${estimated} minutes`);
            console.log(`└─ Confidence: ${chalk.green('High')}`);
            
            console.log();
            console.log(chalk.cyan('🎮 Controls'));
            console.log('[V] View Details | [P] Pause | [H] Handoff | [C] Cancel');
            
            // Wait for stage completion
            await new Promise(resolve => setTimeout(resolve, stage.time));
            
            // Clear screen for next update
            if (i < progressStages.length - 1) {
                console.clear();
                console.log(boxen(
                    chalk.green.bold('🚀 TASK EXECUTION MONITOR') + '\n' +
                    chalk.gray('Real-time task execution and progress tracking'),
                    {
                        padding: 1,
                        borderStyle: 'round',
                        borderColor: 'green',
                        backgroundColor: '#002200'
                    }
                ));
                console.log();
                console.log(chalk.cyan('📋 Execution Details'));
                console.log(`├─ Task: ${chalk.white(this.taskData.title)}`);
                console.log(`├─ Agent: ${chalk.yellow(this.userDecision.agent)}`);
                console.log(`├─ Status: ${chalk.green('⚡ In Progress')}`);
                console.log(`└─ Started: ${chalk.gray(new Date().toLocaleTimeString())}`);
                console.log();
            }
        }
        
        // Task completion
        console.log(chalk.green('\n🎉 Task execution completed successfully!'));
        console.log(chalk.gray('Press any key to view completion details...'));
        
        await this.waitForKeyPress();
        await this.displayCompletion();
    }

    /**
     * Stage 4: Completion & Handback
     */
    async displayCompletion() {
        console.clear();
        
        // Mock completion data
        this.completionData = {
            duration: '58 minutes',
            qualityScore: 5,
            testsTotal: 12,
            testsPassed: 12,
            deliverables: [
                'Navigation.tsx (React component)',
                'Navigation.module.css (Responsive styles)',
                'Navigation.test.tsx (Unit tests)',
                'Navigation.stories.tsx (Storybook)'
            ],
            agentNotes: 'Added extra accessibility features and improved mobile responsiveness'
        };
        
        // Display completion header
        console.log(boxen(
            chalk.green.bold('✅ TASK COMPLETION HANDBACK') + '\n' +
            chalk.gray('Task completed successfully - review and accept deliverables'),
            {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'green',
                backgroundColor: '#002200'
            }
        ));
        
        console.log();
        
        // Task summary
        console.log(chalk.cyan('📋 Completion Summary'));
        console.log(`├─ Task: ${chalk.white(this.taskData.title)}`);
        console.log(`├─ Agent: ${chalk.yellow(this.userDecision.agent)}`);
        console.log(`├─ Status: ${chalk.green('✅ Completed')}`);
        console.log(`└─ Finished: ${chalk.gray(new Date().toLocaleTimeString())}`);
        console.log();
        
        // Performance metrics
        console.log(chalk.cyan('📊 Performance Summary'));
        console.log(`├─ Duration: ${chalk.magenta(this.completionData.duration)} (under estimate)`);
        console.log(`├─ Quality Score: ${this.getStarRating(this.completionData.qualityScore)} (${this.completionData.qualityScore}/5)`);
        console.log(`└─ Tests Passed: ${chalk.green(this.completionData.testsPassed)}/${this.completionData.testsTotal}`);
        console.log();
        
        // Deliverables
        console.log(chalk.cyan('📦 Deliverables'));
        this.completionData.deliverables.forEach((deliverable, index) => {
            const prefix = index === this.completionData.deliverables.length - 1 ? '└─' : '├─';
            console.log(`${prefix} ${chalk.white(deliverable)}`);
        });
        console.log();
        
        // Agent notes
        if (this.completionData.agentNotes) {
            console.log(chalk.cyan('💭 Agent Notes'));
            console.log(`"${chalk.italic(this.completionData.agentNotes)}"`);
            console.log();
        }
        
        // Next steps
        console.log(chalk.cyan('🎯 Next Steps'));
        console.log('┌─────────────────────────────────────────────────────────────┐');
        console.log('│ [R] Review code                                            │');
        console.log('│ [T] Run tests                                              │');
        console.log('│ [D] Deploy to staging                                      │');
        console.log('│ [A] Accept and close                                       │');
        console.log('└─────────────────────────────────────────────────────────────┘');
        console.log();
        
        // Get final decision
        const decision = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: '👁️  Review code', value: 'review' },
                    { name: '🧪 Run tests', value: 'test' },
                    { name: '🚀 Deploy to staging', value: 'deploy' },
                    { name: '✅ Accept and close', value: 'accept' }
                ]
            }
        ]);
        
        switch (decision.action) {
            case 'review':
                console.log(chalk.blue('👁️  Opening code review interface...'));
                break;
            case 'test':
                console.log(chalk.yellow('🧪 Running test suite...'));
                break;
            case 'deploy':
                console.log(chalk.cyan('🚀 Deploying to staging environment...'));
                break;
            case 'accept':
                console.log(chalk.green('✅ Task accepted and closed successfully!'));
                break;
        }
        
        console.log();
        console.log(chalk.green('🎉 Orchestrator handoff workflow completed!'));
        console.log(chalk.gray('Thank you for using TaskMaster AI'));
    }

    // Helper methods
    async analyzeTask(taskData) {
        // Simulate AI analysis
        const keywords = this.extractKeywords(taskData.title);
        const requirements = this.inferRequirements(keywords);
        const complexity = this.calculateComplexity(taskData);
        const estimatedTime = this.estimateTime(complexity);
        const recommendations = this.generateRecommendations(keywords, requirements);
        
        return {
            keywords,
            requirements,
            complexity,
            estimatedTime,
            recommendations
        };
    }

    extractKeywords(title) {
        const keywordMap = {
            'component': ['frontend', 'react', 'ui'],
            'responsive': ['css', 'mobile', 'design'],
            'navigation': ['menu', 'routing', 'ui'],
            'api': ['backend', 'server', 'endpoint'],
            'authentication': ['auth', 'security', 'login'],
            'database': ['data', 'storage', 'backend'],
            'test': ['qa', 'validation', 'testing']
        };
        
        const keywords = [];
        const titleLower = title.toLowerCase();
        
        for (const [key, values] of Object.entries(keywordMap)) {
            if (titleLower.includes(key)) {
                keywords.push(...values);
            }
        }
        
        return [...new Set(keywords)];
    }

    inferRequirements(keywords) {
        const requirements = [];
        
        if (keywords.includes('frontend') || keywords.includes('react')) {
            requirements.push('React', 'TypeScript', 'CSS');
        }
        if (keywords.includes('backend') || keywords.includes('api')) {
            requirements.push('Node.js', 'Express', 'Database');
        }
        if (keywords.includes('qa') || keywords.includes('testing')) {
            requirements.push('Jest', 'Testing Framework');
        }
        
        return requirements;
    }

    calculateComplexity(taskData) {
        const title = taskData.title.toLowerCase();
        
        if (title.includes('simple') || title.includes('basic')) {
            return 'Low';
        } else if (title.includes('complex') || title.includes('advanced')) {
            return 'High';
        } else {
            return 'Medium';
        }
    }

    estimateTime(complexity) {
        const timeMap = {
            'Low': '1-2 hours',
            'Medium': '2-4 hours',
            'High': '4-8 hours'
        };
        
        return timeMap[complexity] || '2-4 hours';
    }

    generateRecommendations(keywords, requirements) {
        const recommendations = [];
        
        // Score agents based on capabilities
        for (const [agentId, agent] of Object.entries(this.agentCapabilities)) {
            const score = this.calculateAgentScore(agent, keywords, requirements);
            const available = Math.random() > 0.3; // 70% chance of being available
            
            recommendations.push({
                agent: agentId,
                confidence: score,
                available,
                reasoning: this.generateReasoning(agent, keywords, score)
            });
        }
        
        // Sort by confidence
        recommendations.sort((a, b) => b.confidence - a.confidence);
        
        return recommendations.slice(0, 3); // Top 3 recommendations
    }

    calculateAgentScore(agent, keywords, requirements) {
        let score = 0;
        const capabilities = agent.capabilities || [];
        const agentKeywords = agent.keywords || [];
        
        // Check capability matches
        for (const keyword of keywords) {
            if (capabilities.includes(keyword) || agentKeywords.includes(keyword)) {
                score += 20;
            }
        }
        
        // Check requirement matches
        for (const requirement of requirements) {
            if (capabilities.includes(requirement.toLowerCase()) || 
                agentKeywords.includes(requirement.toLowerCase())) {
                score += 15;
            }
        }
        
        // Add some randomness
        score += Math.floor(Math.random() * 10);
        
        return Math.min(100, Math.max(10, score));
    }

    generateReasoning(agent, keywords, score) {
        const capabilities = agent.capabilities || [];
        const matchingCaps = capabilities.filter(cap => 
            keywords.some(keyword => cap.includes(keyword) || keyword.includes(cap))
        );
        
        if (matchingCaps.length > 0) {
            return `Perfect match for ${matchingCaps.slice(0, 2).join(', ')}`;
        } else if (score > 70) {
            return `Strong capability alignment`;
        } else if (score > 40) {
            return `Partial capability match`;
        } else {
            return `Limited capability overlap`;
        }
    }

    // UI Helper methods
    getPriorityIcon(priority) {
        const icons = {
            high: '🔴',
            medium: '🟡',
            low: '🟢'
        };
        return icons[priority] || '⚪';
    }

    getComplexityIcon(complexity) {
        const icons = {
            'High': '🔴',
            'Medium': '🟡',
            'Low': '🟢'
        };
        return icons[complexity] || '⚪';
    }

    getConfidenceBar(confidence) {
        const filled = Math.floor(confidence / 10);
        const empty = 10 - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }

    getProgressBar(percentage, width = 40) {
        const filled = Math.floor((percentage / 100) * width);
        const empty = width - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }

    getStarRating(score) {
        return '🌟'.repeat(score);
    }

    async showProgressBar(label, percentage) {
        process.stdout.write(`├─ ${label}... `);
        
        for (let i = 0; i <= percentage; i += 10) {
            process.stdout.write('\r├─ ' + label + '... ' + this.getProgressBar(i, 20) + ` ${i}%`);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.log();
    }

    async waitForKeyPress() {
        return new Promise(resolve => {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.once('data', () => {
                process.stdin.setRawMode(false);
                process.stdin.pause();
                resolve();
            });
        });
    }

    async handleRejection() {
        console.log(chalk.red('❌ Task assignment rejected'));
        
        // Show alternative agents
        const alternatives = this.analysisResults.recommendations.slice(1);
        
        if (alternatives.length > 0) {
            console.log(chalk.cyan('🔄 Alternative Agents'));
            alternatives.forEach((alt, index) => {
                console.log(`${index + 1}. ${alt.agent} (${alt.confidence}% confidence)`);
            });
            
            const choice = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'agent',
                    message: 'Select an alternative agent:',
                    choices: alternatives.map((alt, index) => ({
                        name: `${alt.agent} (${alt.confidence}% confidence)`,
                        value: alt.agent
                    }))
                }
            ]);
            
            this.userDecision = { action: 'approve', agent: choice.agent, reasoning: 'Selected alternative agent' };
            await this.executeTask();
        } else {
            console.log(chalk.yellow('⚠️ No alternative agents available'));
        }
    }

    async handleModification() {
        console.log(chalk.blue('✏️ Modify assignment details'));
        
        const modifications = await inquirer.prompt([
            {
                type: 'input',
                name: 'agent',
                message: 'Agent to assign to:',
                default: this.analysisResults.recommendations[0].agent
            },
            {
                type: 'input',
                name: 'reasoning',
                message: 'Reasoning for this assignment:',
                default: 'Custom assignment'
            }
        ]);
        
        this.userDecision = { action: 'approve', agent: modifications.agent, reasoning: modifications.reasoning };
        await this.executeTask();
    }

    // Main entry point
    async run() {
        console.log(chalk.blue('🚀 Starting Orchestrator Handoff Visualizer...'));
        
        // Sample task data
        const sampleTask = {
            id: '#25',
            title: 'Create responsive navigation component',
            priority: 'high',
            project: 'PROJECT: House AI - Family Home Page | SUBPROJECT: Home Page UI System'
        };
        
        await this.displayTaskAnalysis(sampleTask);
    }
}

// Run if called directly
if (require.main === module) {
    const visualizer = new OrchestratorHandoffVisualizer();
    visualizer.run().catch(error => {
        console.error(chalk.red('Fatal error:', error));
        process.exit(1);
    });
}

module.exports = OrchestratorHandoffVisualizer;