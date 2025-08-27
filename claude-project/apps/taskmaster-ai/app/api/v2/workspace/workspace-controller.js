/**
 * TaskMaster AI - Workspace Management Controller
 * Provides API endpoints for managing TaskMaster workspaces as single source of truth
 */

const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class WorkspaceController {
    constructor(projectRoot) {
        this.router = express.Router();
        this.projectRoot = projectRoot;
        this.setupRoutes();
    }

    setupRoutes() {
        // Get current workspace
        this.router.get('/current', (req, res) => {
            try {
                const result = this.executeTaskMaster('tags');
                const currentWorkspace = this.parseCurrentWorkspace(result);
                
                res.json({
                    success: true,
                    workspace: currentWorkspace,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // List all workspaces with agent mapping
        this.router.get('/list', (req, res) => {
            try {
                const result = this.executeTaskMaster('tags');
                const workspaces = this.parseWorkspaces(result);
                const agentMapping = this.getAgentWorkspaceMapping();
                
                res.json({
                    success: true,
                    workspaces: workspaces.map(ws => ({
                        ...ws,
                        assignedAgent: agentMapping[ws.name] || null
                    })),
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Switch workspace and sync agent assignments
        this.router.post('/switch', (req, res) => {
            try {
                const { workspace, agentId } = req.body;
                
                if (!workspace) {
                    return res.status(400).json({
                        success: false,
                        error: 'workspace parameter is required'
                    });
                }

                // Switch workspace using TaskMaster CLI
                const result = this.executeTaskMaster(`use-tag ${workspace}`);
                
                // Update agent mapping if agentId provided
                if (agentId) {
                    this.updateAgentWorkspaceMapping(agentId, workspace);
                }

                res.json({
                    success: true,
                    workspace,
                    agentId: agentId || null,
                    message: `Switched to workspace: ${workspace}`,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Create new workspace
        this.router.post('/create', (req, res) => {
            try {
                const { name, description, copyFromCurrent } = req.body;
                
                if (!name) {
                    return res.status(400).json({
                        success: false,
                        error: 'name parameter is required'
                    });
                }

                let command = `add-tag ${name}`;
                if (description) {
                    command += ` --description="${description}"`;
                }
                if (copyFromCurrent) {
                    command += ' --copy-from-current';
                }

                const result = this.executeTaskMaster(command);

                res.json({
                    success: true,
                    workspace: name,
                    message: `Created workspace: ${name}`,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }

    /**
     * Execute TaskMaster CLI command
     */
    executeTaskMaster(command) {
        try {
            return execSync(`cd ${this.projectRoot} && npx task-master ${command}`, {
                encoding: 'utf8',
                timeout: 10000
            });
        } catch (error) {
            throw new Error(`TaskMaster command failed: ${error.message}`);
        }
    }

    /**
     * Parse current workspace from TaskMaster output
     */
    parseCurrentWorkspace(output) {
        const currentMatch = output.match(/● (\w+) \(current\)/);
        return currentMatch ? currentMatch[1] : 'master';
    }

    /**
     * Parse all workspaces from TaskMaster output
     */
    parseWorkspaces(output) {
        const workspaces = [];
        const lines = output.split('\n');
        
        for (const line of lines) {
            const match = line.match(/[●○] (\w+)(?:\s+\(current\))?\s+│\s+(\d+)\s+│\s+(\d+)/);
            if (match) {
                workspaces.push({
                    name: match[1],
                    tasks: parseInt(match[2]),
                    completed: parseInt(match[3]),
                    isCurrent: line.includes('(current)')
                });
            }
        }
        
        return workspaces;
    }

    /**
     * Get agent-to-workspace mapping
     */
    getAgentWorkspaceMapping() {
        try {
            const mappingFile = path.join(this.projectRoot, '.taskmaster/agents/workspace-mapping.json');
            if (fs.existsSync(mappingFile)) {
                return JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
            }
        } catch (error) {
            console.warn('Could not load workspace mapping:', error.message);
        }
        return {};
    }

    /**
     * Update agent-to-workspace mapping
     */
    updateAgentWorkspaceMapping(agentId, workspace) {
        try {
            const mappingFile = path.join(this.projectRoot, '.taskmaster/agents/workspace-mapping.json');
            let mapping = {};
            
            if (fs.existsSync(mappingFile)) {
                mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
            }
            
            mapping[workspace] = agentId;
            
            fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
        } catch (error) {
            console.error('Could not update workspace mapping:', error.message);
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = WorkspaceController;