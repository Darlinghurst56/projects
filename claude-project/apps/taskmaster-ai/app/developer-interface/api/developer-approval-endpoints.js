/**
 * TaskMaster AI - Developer Approval API Endpoints
 * RESTful API for developer approval workflow integration
 */

const express = require('express');
const path = require('path');

class DeveloperApprovalAPI {
    constructor(coordinationWorkflow) {
        this.router = express.Router();
        this.coordinationWorkflow = coordinationWorkflow;
        this.setupRoutes();
    }

    setupRoutes() {
        // Get pending suggestions awaiting developer approval
        this.router.get('/suggestions/pending', (req, res) => {
            try {
                const pendingSuggestions = this.coordinationWorkflow.getPendingSuggestions();
                res.json({
                    success: true,
                    count: pendingSuggestions.length,
                    suggestions: pendingSuggestions
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get all suggestions (pending, approved, rejected)
        this.router.get('/suggestions', (req, res) => {
            try {
                const allSuggestions = this.coordinationWorkflow.coordinationState.pendingSuggestions || [];
                const { status, limit = 50 } = req.query;
                
                let filteredSuggestions = allSuggestions;
                if (status) {
                    filteredSuggestions = allSuggestions.filter(s => s.status === status);
                }
                
                const limitedSuggestions = filteredSuggestions.slice(0, parseInt(limit));
                
                res.json({
                    success: true,
                    total: allSuggestions.length,
                    filtered: filteredSuggestions.length,
                    returned: limitedSuggestions.length,
                    suggestions: limitedSuggestions
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Create a new task assignment suggestion
        this.router.post('/suggestions', (req, res) => {
            try {
                const { taskId, targetAgent, reasoning = '', suggestedBy = 'developer' } = req.body;
                
                if (!taskId || !targetAgent) {
                    return res.status(400).json({
                        success: false,
                        error: 'taskId and targetAgent are required'
                    });
                }

                const suggestion = this.coordinationWorkflow.suggestTaskAssignment(
                    { id: taskId },
                    targetAgent,
                    reasoning
                );

                // Override suggested by if provided
                if (suggestedBy !== 'orchestrator-agent') {
                    suggestion.suggestedBy = suggestedBy;
                    this.coordinationWorkflow.saveCoordinationState();
                }

                res.status(201).json({
                    success: true,
                    suggestion
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Approve a suggestion
        this.router.post('/suggestions/:suggestionId/approve', (req, res) => {
            try {
                const { suggestionId } = req.params;
                const { comment = '', approvedBy = 'developer' } = req.body;

                // Get the suggestion first to check target agent
                const suggestion = this.coordinationWorkflow.coordinationState.pendingSuggestions?.find(s => s.id === suggestionId);
                if (!suggestion) {
                    return res.status(404).json({
                        success: false,
                        error: 'Suggestion not found'
                    });
                }

                // Auto-register agent if not already registered
                this.ensureAgentRegistered(suggestion.targetAgent);

                const result = this.coordinationWorkflow.approveSuggestion(suggestionId, comment);
                
                if (result.success && result.suggestion) {
                    result.suggestion.approvedBy = approvedBy;
                    this.coordinationWorkflow.saveCoordinationState();
                }

                res.json({
                    success: result.success,
                    message: result.message,
                    suggestion: result.suggestion,
                    error: result.error
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Reject a suggestion
        this.router.post('/suggestions/:suggestionId/reject', (req, res) => {
            try {
                const { suggestionId } = req.params;
                const { reason = '', rejectedBy = 'developer' } = req.body;

                if (!reason) {
                    return res.status(400).json({
                        success: false,
                        error: 'Rejection reason is required'
                    });
                }

                const result = this.coordinationWorkflow.rejectSuggestion(suggestionId, reason);
                
                if (result.success && result.suggestion) {
                    result.suggestion.rejectedBy = rejectedBy;
                    this.coordinationWorkflow.saveCoordinationState();
                }

                res.json({
                    success: result.success,
                    message: result.message,
                    suggestion: result.suggestion,
                    error: result.error
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get suggestion details
        this.router.get('/suggestions/:suggestionId', (req, res) => {
            try {
                const { suggestionId } = req.params;
                const allSuggestions = this.coordinationWorkflow.coordinationState.pendingSuggestions || [];
                const suggestion = allSuggestions.find(s => s.id === suggestionId);

                if (!suggestion) {
                    return res.status(404).json({
                        success: false,
                        error: 'Suggestion not found'
                    });
                }

                res.json({
                    success: true,
                    suggestion
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get approval workflow statistics
        this.router.get('/stats', (req, res) => {
            try {
                const allSuggestions = this.coordinationWorkflow.coordinationState.pendingSuggestions || [];
                
                const stats = {
                    total: allSuggestions.length,
                    pending: allSuggestions.filter(s => s.status === 'pending').length,
                    approved: allSuggestions.filter(s => s.status === 'approved').length,
                    rejected: allSuggestions.filter(s => s.status === 'rejected').length,
                    approvalRate: 0,
                    avgApprovalTime: 0
                };

                const processedSuggestions = allSuggestions.filter(s => s.status !== 'pending');
                if (processedSuggestions.length > 0) {
                    stats.approvalRate = (stats.approved / processedSuggestions.length * 100).toFixed(1);
                    
                    // Calculate average approval time
                    const approvedSuggestions = allSuggestions.filter(s => s.approvedAt);
                    if (approvedSuggestions.length > 0) {
                        const totalTime = approvedSuggestions.reduce((sum, s) => {
                            const created = new Date(s.timestamp);
                            const approved = new Date(s.approvedAt);
                            return sum + (approved - created);
                        }, 0);
                        stats.avgApprovalTime = Math.round(totalTime / approvedSuggestions.length / 1000); // seconds
                    }
                }

                res.json({
                    success: true,
                    stats
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Bulk approve/reject suggestions
        this.router.post('/suggestions/bulk/:action', (req, res) => {
            try {
                const { action } = req.params; // 'approve' or 'reject'
                const { suggestionIds, comment = '', reason = '' } = req.body;

                if (!Array.isArray(suggestionIds) || suggestionIds.length === 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'suggestionIds array is required'
                    });
                }

                if (action === 'reject' && !reason) {
                    return res.status(400).json({
                        success: false,
                        error: 'Rejection reason is required for bulk reject'
                    });
                }

                const results = [];
                for (const suggestionId of suggestionIds) {
                    try {
                        let result;
                        if (action === 'approve') {
                            result = this.coordinationWorkflow.approveSuggestion(suggestionId, comment);
                        } else if (action === 'reject') {
                            result = this.coordinationWorkflow.rejectSuggestion(suggestionId, reason);
                        } else {
                            throw new Error(`Invalid action: ${action}`);
                        }
                        
                        results.push({
                            suggestionId,
                            success: result.success,
                            message: result.message,
                            error: result.error
                        });
                    } catch (error) {
                        results.push({
                            suggestionId,
                            success: false,
                            error: error.message
                        });
                    }
                }

                const successCount = results.filter(r => r.success).length;

                res.json({
                    success: successCount > 0,
                    processed: results.length,
                    successful: successCount,
                    failed: results.length - successCount,
                    results
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get developer interface health check
        this.router.get('/health', (req, res) => {
            res.json({
                success: true,
                service: 'developer-approval-api',
                timestamp: new Date().toISOString(),
                coordinationWorkflow: !!this.coordinationWorkflow,
                features: {
                    suggestions: true,
                    approval: true,
                    rejection: true,
                    bulkOperations: true,
                    statistics: true
                }
            });
        });
    }

    /**
     * Ensure agent is registered with default capabilities
     */
    ensureAgentRegistered(agentId) {
        const existingAgent = this.coordinationWorkflow.getAgents().find(a => a.id === agentId);
        if (!existingAgent) {
            // Load default capabilities for agent roles
            const defaultCapabilities = this.getDefaultCapabilities(agentId);
            this.coordinationWorkflow.registerAgent(agentId, defaultCapabilities, 'available');
            console.log(`🤖 Auto-registered agent ${agentId} with capabilities: ${defaultCapabilities.join(', ')}`);
        }
    }

    /**
     * Get default capabilities for agent role
     */
    getDefaultCapabilities(agentId) {
        const roleCapabilities = {
            'orchestrator-agent': ['coordination', 'developer-interface', 'project-management', 'task-routing'],
            'frontend-agent': ['react', 'typescript', 'css', 'html', 'ui-components', 'responsive-design'],
            'backend-agent': ['nodejs', 'express', 'api', 'database', 'authentication', 'server-logic'],
            'devops-agent': ['deployment', 'docker', 'ci-cd', 'infrastructure', 'server-management'],
            'qa-specialist': ['testing', 'validation', 'quality-assurance', 'debugging', 'accessibility']
        };
        
        return roleCapabilities[agentId] || ['general'];
    }

    getRouter() {
        return this.router;
    }
}

module.exports = DeveloperApprovalAPI;