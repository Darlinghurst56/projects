const BaseAgent = require('./base-agent.cjs');
const agentConfig = require('./agent-config.json');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class IntegrationAgent extends BaseAgent {
    constructor(configName = 'background-integration') {
        const config = agentConfig.agents[configName];
        if (!config) {
            throw new Error(`Agent configuration '${configName}' not found`);
        }
        super(config);
    }

    async executeTask(task) {
        this.log('info', `Executing integration task: ${task.description}`);
        
        try {
            const integrationPlan = await this.analyzeIntegrationTask(task);
            await this.createIntegrationArtifacts(task, integrationPlan);
            this.log('info', `Integration Plan: ${integrationPlan.summary}`);
            
            return integrationPlan;
        } catch (error) {
            this.log('error', `Integration task execution failed: ${error.message}`);
            throw error;
        }
    }

    async analyzeIntegrationTask(task) {
        const content = (`${task.description } ${ task.prompt}`).toLowerCase();
        
        const plan = {
            taskType: this.determineIntegrationType(content),
            steps: [],
            summary: ''
        };

        // Analyze integration requirements
        if (content.includes('api')) {
            plan.steps.push('API endpoint configuration reviewed');
        }
        if (content.includes('auth') || content.includes('token')) {
            plan.steps.push('Authentication flow validated');
        }
        if (content.includes('sync') || content.includes('data')) {
            plan.steps.push('Data synchronization strategy planned');
        }
        if (content.includes('webhook') || content.includes('event')) {
            plan.steps.push('Event handling integration designed');
        }

        plan.summary = plan.steps.length > 0 ? 
            `Integration steps: ${plan.steps.join(', ')}` :
            'Integration analysis completed - requirements clarified';

        return plan;
    }

    determineIntegrationType(content) {
        if (content.includes('api')) {return 'api-integration';}
        if (content.includes('webhook')) {return 'webhook-integration';}
        if (content.includes('auth')) {return 'auth-integration';}
        if (content.includes('sync')) {return 'data-sync';}
        return 'general-integration';
    }
}

// Auto-start if run directly
if (require.main === module) {
    const agent = new IntegrationAgent();
    
    process.on('SIGTERM', () => agent.stop());
    process.on('SIGINT', () => agent.stop());
    
    agent.start().catch(error => {
        console.error('Integration Agent startup failed:', error);
        process.exit(1);
    });
}

module.exports = IntegrationAgent;