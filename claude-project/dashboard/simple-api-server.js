#!/usr/bin/env node

/**
 * Simple TaskMaster Dashboard API Server
 * Minimal API server for testing dashboard integration
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, spawn } from 'child_process';
import fs from 'fs';
import { agentStorage } from './agent-storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// Serve static files from the dashboard directory
app.use(express.static(__dirname));

// Mock data representing current TaskMaster state
const mockAgents = [
    {
        name: 'integration-specialist',
        description: 'MCP server integration and API connections',
        priority: 2,
        taskCount: 3,
        completedTasks: 1,
        statusBreakdown: { 'in-progress': 2, 'done': 1 },
        isCurrent: true
    },
    {
        name: 'server-agent',
        description: 'Exclusive server operations and deployment coordination',
        priority: 1,
        taskCount: 16,
        completedTasks: 9,
        statusBreakdown: { 'in-progress': 5, 'done': 9, 'pending': 2 },
        isCurrent: false
    },
    {
        name: 'ui-developer',
        description: 'CSS, HTML, and visual component development',
        priority: 3,
        taskCount: 10,
        completedTasks: 7,
        statusBreakdown: { 'done': 7, 'in-progress': 1, 'pending': 2 },
        isCurrent: false
    },
    {
        name: 'qa-specialist',
        description: 'Testing, validation, and quality assurance',
        priority: 3,
        taskCount: 8,
        completedTasks: 5,
        statusBreakdown: { 'in-progress': 1, 'done': 5, 'pending': 2 },
        isCurrent: false
    }
];

const mockTasks = [
    {
        "id": "1",
        "title": "Implement LiteLLM Integration for Model Call Redirection",
        "description": "Implement LiteLLM proxy server to redirect model calls to alternative sources, including network-hosted Ollama, providing unified API access, cost control, and reliability improvements.",
        "status": "in-progress",
        "priority": "high",
        "assignedAgent": "integration-specialist",
        "sourceTag": "master",
        "dependencies": [
            5,
            8,
            10
        ],
        "subtasks": [
            {
                "id": "1.1",
                "title": "Set up Docker Environment and Base LiteLLM Configuration",
                "status": "pending",
                "assignedAgent": "ui-developer",
                "description": "Create a Dockerfile for the LiteLLM proxy server and configure a basic `docker-compose.yml` file for local deployment. Define minimal environment variables required for LiteLLM to start.",
                "updates": []
            },
            {
                "id": "1.2",
                "title": "Deploy Basic LiteLLM Proxy with Single Provider",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Deploy the LiteLLM proxy using Docker Compose and configure it to use a single provider (e.g., OpenAI) with a valid API key. Verify that the proxy can successfully forward requests to the provider.",
                "updates": []
            },
            {
                "id": "1.3",
                "title": "Implement Multi-Provider Configuration (Anthropic, Google, Ollama)",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Extend the LiteLLM configuration to support multiple providers (Anthropic, Google, and Ollama). Implement dynamic switching between providers based on configuration settings.",
                "updates": []
            },
            {
                "id": "1.4",
                "title": "Implement Cost Optimization Routing Logic",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Develop routing logic to direct model calls based on cost, prioritizing cheaper providers when possible. Implement a configuration option to specify the cost threshold for each provider.",
                "updates": []
            },
            {
                "id": "1.5",
                "title": "Integrate with TaskMaster and Update API Endpoint",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Integrate LiteLLM with TaskMaster to track model usage and costs per task. Update the API endpoint to include task-specific information.",
                "updates": []
            },
            {
                "id": "1.6",
                "title": "Set up Monitoring and Testing",
                "status": "pending",
                "assignedAgent": "qa-specialist",
                "description": "Set up monitoring for the LiteLLM proxy server, including metrics for request latency, error rates, and provider usage. Implement comprehensive testing to ensure the reliability and performance of the proxy.",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.692Z",
        "updatedAt": "2025-07-08T13:56:12.692Z"
    },
    {
        "id": "1",
        "title": "QA Testing: DNS Analytics Widget",
        "description": "Perform QA testing on the DNS Analytics Widget to ensure proper functionality, data visualization, and integration with the dashboard system.",
        "status": "in-progress",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            14,
            15,
            16
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.692Z",
        "updatedAt": "2025-07-08T13:56:12.692Z"
    },
    {
        "id": "2",
        "title": "QA Testing: PIN Authentication System",
        "description": "Perform comprehensive QA testing on the PIN Authentication System, focusing on security architecture, session management, and dashboard integration.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            3
        ],
        "subtasks": [
            {
                "id": "2.1",
                "title": "PIN Authentication Security Testing Complete",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Comprehensive security analysis and functional testing of PIN authentication system completed with excellent results",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.692Z",
        "updatedAt": "2025-07-08T13:56:12.692Z"
    },
    {
        "id": "3",
        "title": "QA Specialist Assignment: DNS Analytics Widget Testing",
        "description": "Officially assign a QA specialist to begin comprehensive testing of the DNS Analytics Widget, ensuring thorough validation of its functionality and integration.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            1
        ],
        "subtasks": [
            {
                "id": "3.1",
                "title": "Begin DNS Analytics Widget QA Testing",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Start comprehensive QA testing of the DNS Analytics Widget",
                "updates": []
            },
            {
                "id": "3.2",
                "title": "Test Widget Integration in Dashboard",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Test the DNS Analytics Widget integration within the dashboard environment",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.692Z",
        "updatedAt": "2025-07-08T13:56:12.692Z"
    },
    {
        "id": "4",
        "title": "Authentication Context and Session Management",
        "description": "Implement React Context API for PIN-based authentication state, localStorage session management, custom useAuth hooks, and session timeout detection for dashboard security. This task ensures secure and persistent user sessions within the application.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            2,
            3
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.692Z",
        "updatedAt": "2025-07-08T13:56:12.692Z"
    },
    {
        "id": "5",
        "title": "Launch Development Server via Server Agent",
        "description": "Launch the development server using the server agent to serve the latest dashboard files. This ensures that the most recent UI fixes and widget grid improvements are available for testing and development.",
        "status": "pending",
        "priority": "medium",
        "assignedAgent": "qa-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            2,
            3
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.692Z",
        "updatedAt": "2025-07-08T13:56:12.692Z"
    },
    {
        "id": "6",
        "title": "Install and configure Cron/Scheduler MCP server for complex task scheduling and automated widget updates",
        "description": "Set up task scheduling capabilities using node-cron for automated dashboard widget updates and background job management, with optional custom MCP server development for Claude Code integration.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "integration-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            1,
            2,
            3
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.692Z",
        "updatedAt": "2025-07-08T13:56:12.692Z"
    },
    {
        "id": "7",
        "title": "Install Tailwind CSS MCP and Shadcn/UI MCP servers for modern component-based styling",
        "description": "Set up and configure Tailwind CSS MCP server and Shadcn/UI MCP server to enable modern utility-first CSS framework and beautiful pre-built components for the dashboard interface.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "ui-developer",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            1,
            2
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.692Z",
        "updatedAt": "2025-07-08T13:56:12.692Z"
    },
    {
        "id": "8",
        "title": "Install HTTP/Fetch MCP server for enhanced API integration",
        "description": "Install and configure the HTTP/Fetch MCP server to provide enhanced API calling capabilities with caching, error handling, and reusable client configurations for improved API integration across the project.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            1,
            2
        ],
        "subtasks": [
            {
                "id": "8.1",
                "title": "Install HTTP/Fetch MCP Server Package",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Install the necessary HTTP/Fetch MCP server package and its dependencies.",
                "updates": []
            },
            {
                "id": "8.2",
                "title": "Configure Server with Default Settings",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Configure the MCP server using the .mcp.json file with default settings.",
                "updates": []
            },
            {
                "id": "8.3",
                "title": "Set Up Caching and Error Handling",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Implement caching strategies and error handling mechanisms for the MCP server.",
                "updates": []
            },
            {
                "id": "8.4",
                "title": "Create Reusable API Client Configurations",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Develop reusable API client configurations for interacting with various services.",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.692Z",
        "updatedAt": "2025-07-08T13:56:12.692Z"
    },
    {
        "id": "9",
        "title": "Create and configure .claude/settings.json with allowlist for all new MCP tools",
        "description": "Set up Claude Code configuration file with comprehensive tool allowlist including Task Master AI, Puppeteer, Docker, ESLint, Vite, Tailwind CSS, Shadcn/UI, Cron, and HTTP MCP tools.",
        "status": "pending",
        "priority": "medium",
        "assignedAgent": "ui-developer",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            1,
            2
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "10",
        "title": "Test all newly installed MCP servers for functionality and integration with Claude Code",
        "description": "Verify that all MCP servers are properly installed, configured, and functioning correctly with Claude Code integration.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            6,
            7,
            8,
            9
        ],
        "subtasks": [
            {
                "id": "10.1",
                "title": "Task Master AI MCP server tests",
                "status": "completed",
                "assignedAgent": "qa-specialist",
                "description": "Verify all task management commands work (models command, complexity-report, get_tasks, set_task_status, use_tag).",
                "updates": []
            },
            {
                "id": "10.2",
                "title": "ESLint MCP server tests",
                "status": "completed",
                "assignedAgent": "qa-specialist",
                "description": "Verify linting and formatting capabilities (lint_file, fix_file with Prettier integration).",
                "updates": []
            },
            {
                "id": "10.3",
                "title": "HTTP/Fetch MCP server tests",
                "status": "completed",
                "assignedAgent": "qa-specialist",
                "description": "Verify fetch capabilities (fetch_json command with httpbin.org).",
                "updates": []
            },
            {
                "id": "10.4",
                "title": "Investigate Puppeteer MCP server browser launch failure",
                "status": "done",
                "assignedAgent": "ui-developer",
                "description": "Address Chrome binary syntax error in WSL2 environment. Issue: \"/root/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome: 2: Syntax error: Unterminated quoted string\". Requires Chrome installation fix for WSL2.",
                "updates": []
            },
            {
                "id": "10.5",
                "title": "Install Docker Desktop with WSL2 integration",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Docker MCP server is not available because Docker is not installed in WSL2 environment. Enable WSL integration in Docker Desktop.",
                "updates": []
            },
            {
                "id": "10.6",
                "title": "Configure tool allowlist in .claude/settings.json",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Complete .claude/settings.json configuration to enable all working MCP servers.",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "11",
        "title": "Implement AI-powered agent role management system",
        "description": "Create a comprehensive agent role management system with specialized Frontend, Backend, and Testing agents that can be assigned to tasks, including automated workflow triggers and enhanced task metadata for intelligent routing.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            1,
            5,
            7
        ],
        "subtasks": [
            {
                "id": "11.1",
                "title": "Define Agent Role Taxonomy and Capabilities",
                "status": "done",
                "assignedAgent": "ui-developer",
                "description": "Establish a comprehensive taxonomy of agent roles, defining their specific capabilities, responsibilities, and resource requirements. This includes defining the schema for agent configuration.",
                "updates": []
            },
            {
                "id": "11.2",
                "title": "Design Agent Configuration Schema",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Develop a schema for agent configuration, including parameters for role assignment, resource allocation, and communication preferences.",
                "updates": []
            },
            {
                "id": "11.3",
                "title": "Implement AI-Powered Task Assignment Logic",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Develop an AI-powered algorithm to dynamically assign tasks to agents based on their roles, capabilities, and current workload. Incorporate a scoring mechanism to prioritize task assignments.",
                "updates": []
            },
            {
                "id": "11.4",
                "title": "Enhance Task Schema with Agent Metadata",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Extend the existing task schema to include metadata fields for tracking agent assignments, task progress, and performance metrics.",
                "updates": []
            },
            {
                "id": "11.5",
                "title": "Build Automated Workflow Trigger System",
                "status": "done",
                "assignedAgent": "ui-developer",
                "description": "Create a system to automatically trigger workflows based on task completion, agent availability, and other predefined events.",
                "updates": []
            },
            {
                "id": "11.6",
                "title": "Integrate with Task Master CLI and MCP Tools",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Integrate the AI-powered agent role management system with the existing Task Master CLI and MCP tools to provide a unified interface for managing agents and tasks.",
                "updates": []
            },
            {
                "id": "11.7",
                "title": "Develop Comprehensive Testing Suite",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Create a comprehensive testing suite to validate the functionality, performance, and scalability of the AI-powered agent role management system.",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "12",
        "title": "Fix DNS Profile Widget to Display Real Control D Profile Data",
        "description": "Replace the fake/blank content in the DNS Profile Widget with actual Control D profile data by implementing proper API integration to fetch and display real profile configurations, service blocking rules, and DNS filtering settings. This task is assigned to the integration-specialist role for Control D API integration.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            2,
            6
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "13",
        "title": "Fix all non-functional buttons in dashboard",
        "description": "Implement proper event handlers for all placeholder buttons in the dashboard including refresh buttons, settings buttons, and widget controls to restore full user interaction functionality.",
        "status": "pending",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            6,
            7,
            8,
            9,
            10,
            11,
            12
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "14",
        "title": "Redesign and implement professional Connection Control Widget",
        "description": "Replace the current poorly-designed Connection Control Widget with an enterprise-grade version featuring professional styling, proper layout, and consistent design system implementation to address critical customer feedback. This task is assigned to the ui-developer role.",
        "status": "pending",
        "priority": "medium",
        "assignedAgent": "ui-developer",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            1,
            3,
            6,
            8
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "15",
        "title": "Fix DNS Analytics Widget blank display issue",
        "description": "Investigate and resolve the DNS Analytics widget displaying blank content instead of expected analytics data, charts, and statistics from Control D API.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            2,
            5,
            10
        ],
        "subtasks": [
            {
                "id": "15.1",
                "title": "Agent Assignment",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Assigned to integration-specialist role for Control D Analytics API integration",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "16",
        "title": "Enhance taskmaster-cli.sh workflow script with additional commands for complexity analysis and research",
        "description": "Extend the existing taskmaster-cli.sh workflow script to include new commands for complexity analysis, expand-all functionality, research-backed updates, and dependency validation, while maintaining git synchronicity with remote TaskMaster development. Updated to incorporate modern shell scripting best practices, improved error handling, and enhanced git workflow integration.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "qa-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "17",
        "title": "Implement tag-based agent role coordination system using TaskMaster's built-in tag functionality",
        "description": "Implement role-specific tags for frontend-architect, ui-developer, integration-specialist, and qa-specialist, and design an agent role assignment protocol for task coordination without requiring new infrastructure while maintaining git synchronicity.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "qa-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            1
        ],
        "subtasks": [
            {
                "id": "17.1",
                "title": "Define Agent Role Tags in TaskMaster",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Create the four agent role tags (frontend-architect, ui-developer, integration-specialist, qa-specialist) within TaskMaster using the `task-master add-tag` command. This establishes the foundation for role-based task assignment.",
                "updates": []
            },
            {
                "id": "17.2",
                "title": "Implement Agent Role Assignment Protocol",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Develop the agent role assignment protocol, including tag switching, task listing, task claiming, and role context addition. This defines how agents interact with TaskMaster to manage their tasks.",
                "updates": []
            },
            {
                "id": "17.3",
                "title": "Establish Coordination Workflow",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Implement the coordination workflow, including working within tag contexts, sharing tasks between roles, maintaining task history with role attribution, and coordinating handoffs through task status changes. This ensures smooth collaboration between agents.",
                "updates": []
            },
            {
                "id": "17.4",
                "title": "Configure Git Synchronization",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Configure Git synchronization for TaskMaster, including setting up the `.taskmaster/config.json` file, adding a pre-commit hook, using atomic commits, and pulling before tag switches. This ensures that task assignments are synchronized across the team.",
                "updates": []
            },
            {
                "id": "17.5",
                "title": "Document Agent Role Coordination System",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Create documentation for the agent role coordination system, including role descriptions, the tag switching protocol, and slash commands for each role. This provides agents with the information they need to effectively use the system.",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "18",
        "title": "Create dashboard-workflow.sh script for widget-specific TaskMaster operations",
        "description": "Develop a specialized shell script that provides widget-focused TaskMaster operations including status tracking, task discovery, and implementation research, integrating seamlessly with the existing taskmaster-cli.sh infrastructure.",
        "status": "in-progress",
        "priority": "medium",
        "assignedAgent": "server-agent",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            1
        ],
        "subtasks": [
            {
                "id": "18.1",
                "title": "Create Basic Shell Script Structure",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Set up the initial shell script file with necessary shebang and basic error handling.",
                "updates": []
            },
            {
                "id": "18.2",
                "title": "Integrate with taskmaster-cli.sh",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Incorporate the script into the taskmaster-cli.sh workflow, allowing it to be called as a command.",
                "updates": []
            },
            {
                "id": "18.3",
                "title": "Implement Widget Task Identification",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Develop the logic to identify the relevant widget task based on user input or context.",
                "updates": []
            },
            {
                "id": "18.4",
                "title": "Implement Command Logic",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Implement the core command logic to perform the desired action on the identified widget task.",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "19",
        "title": "Complete Google API Integration Project Setup and Documentation",
        "description": "Integrate Google APIs (Gmail, Google Calendar, Google Drive, and Google Docs) using n8n's built-in Google API nodes within the Telegram Bot + n8n workflow. Focus on leveraging n8n's native credential management and workflow system instead of custom OAuth2 flows, testing frameworks, and configuration management. This task involves project analysis, n8n workflow setup, and comprehensive documentation.",
        "status": "in-progress",
        "priority": "medium",
        "assignedAgent": "qa-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [],
        "subtasks": [
            {
                "id": "19.1",
                "title": "Convert CLI OAuth2 flow to web-based authentication",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Modify existing google-auth.js to support web-based OAuth2 flow instead of CLI readline, using redirect URI for web interface",
                "updates": []
            },
            {
                "id": "19.2",
                "title": "Add Google Docs API integration",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Create docs.js module for Google Docs API with basic read, create, and edit functionality, following existing pattern from calendar.js and drive.js",
                "updates": []
            },
            {
                "id": "19.3",
                "title": "Create web interface framework",
                "status": "done",
                "assignedAgent": "ui-developer",
                "description": "Build basic HTML/CSS/JS web interface that connects to existing backend modules (gmail.js, calendar.js, drive.js, docs.js) with simple navigation",
                "updates": []
            },
            {
                "id": "19.4",
                "title": "Adapt existing error handling for web interface",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Modify existing error logging and handling in google-auth.js and API modules to work with web interface instead of CLI console output",
                "updates": []
            },
            {
                "id": "19.5",
                "title": "Replace custom Google API integrations with n8n nodes",
                "status": "done",
                "assignedAgent": "ui-developer",
                "description": "Remove existing custom API modules (gmail.js, calendar.js, drive.js, docs.js) and replace them with n8n's built-in Google API nodes.",
                "updates": []
            },
            {
                "id": "19.6",
                "title": "Configure n8n Google API nodes",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Configure n8n's Google API nodes to perform the desired actions (e.g., send emails, create calendar events, upload files, create documents).",
                "updates": []
            },
            {
                "id": "19.7",
                "title": "Set up n8n credentials for Google APIs",
                "status": "done",
                "assignedAgent": "ui-developer",
                "description": "Use n8n's built-in OAuth2 authentication and credential storage to connect to Google APIs.",
                "updates": []
            },
            {
                "id": "19.8",
                "title": "Integrate n8n workflow with Telegram Bot",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Design n8n workflows that trigger Google API actions based on Telegram bot commands or events.",
                "updates": []
            },
            {
                "id": "19.9",
                "title": "Update documentation for n8n integration",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Document the n8n workflow setup, node configuration, and credential management. Provide examples of how to trigger Google API actions via Telegram bot commands.",
                "updates": []
            },
            {
                "id": "19.10",
                "title": "Remove custom error handling and testing framework",
                "status": "in-progress",
                "assignedAgent": "qa-specialist",
                "description": "Remove custom error handling logic and testing framework, relying on n8n's built-in mechanisms.",
                "updates": []
            },
            {
                "id": "19.11",
                "title": "Skip Task 19.3 - Web Interface",
                "status": "completed",
                "assignedAgent": "integration-specialist",
                "description": "Skip the creation of a web interface framework as the Telegram Bot interface is already implemented and functional.",
                "updates": []
            },
            {
                "id": "19.12",
                "title": "Skip Task 19.4 - Adapt Error Handling",
                "status": "completed",
                "assignedAgent": "ui-developer",
                "description": "Skip adapting custom error handling for a web interface, as n8n's built-in error handling mechanisms are sufficient.",
                "updates": []
            },
            {
                "id": "19.13",
                "title": "Finalize Telegram Bot interface documentation",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Complete the documentation for the Telegram Bot interface, including command usage, setup instructions, and troubleshooting tips.",
                "updates": []
            },
            {
                "id": "19.14",
                "title": "Test n8n error handling workflows",
                "status": "pending",
                "assignedAgent": "qa-specialist",
                "description": "Create and execute test workflows to verify the functionality of n8n's built-in error handling mechanisms.",
                "updates": []
            },
            {
                "id": "19.15",
                "title": "Consolidate remaining tasks and create focused deliverables",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Review Tasks 19.6-19.10 and consolidate them into fewer, more focused deliverables to streamline the completion of the project.",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "20",
        "title": "Implement Google Calendar Integration Enhancements",
        "description": "Implement basic Google Calendar integration using n8n's Google Calendar node to manage events (create, read, update, delete) via Telegram bot commands. This simplifies the original scope by removing complex features.",
        "status": "pending",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [],
        "subtasks": [
            {
                "id": "20.1",
                "title": "Implement calendar read functionality in web interface",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Display upcoming calendar events in a simple web view, extending existing calendar.js list functionality",
                "updates": []
            },
            {
                "id": "20.2",
                "title": "Add create and edit calendar events",
                "status": "pending",
                "assignedAgent": "ui-developer",
                "description": "Build simple web forms to create new events and edit existing ones with basic fields (title, date, time, description)",
                "updates": []
            },
            {
                "id": "20.3",
                "title": "Implement delete calendar events",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Add simple delete functionality for calendar events with basic confirmation dialog",
                "updates": []
            },
            {
                "id": "20.4",
                "title": "Set up n8n instance and install Google Calendar node",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Deploy an n8n instance and install the necessary Google Calendar node for integration.",
                "updates": []
            },
            {
                "id": "20.5",
                "title": "Create n8n workflow for reading calendar events",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Develop an n8n workflow that retrieves calendar events using the Google Calendar node and exposes them via a Telegram bot command.",
                "updates": []
            },
            {
                "id": "20.6",
                "title": "Create n8n workflow for creating calendar events",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Develop an n8n workflow that creates calendar events based on input from a Telegram bot command.",
                "updates": []
            },
            {
                "id": "20.7",
                "title": "Create n8n workflow for updating calendar events",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Develop an n8n workflow that updates existing calendar events based on input from a Telegram bot command.",
                "updates": []
            },
            {
                "id": "20.8",
                "title": "Create n8n workflow for deleting calendar events",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Develop an n8n workflow that deletes calendar events based on input from a Telegram bot command.",
                "updates": []
            },
            {
                "id": "20.9",
                "title": "Implement error handling in n8n workflows",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Add error handling to all n8n workflows to gracefully handle API errors and provide informative messages to Telegram users.",
                "updates": []
            },
            {
                "id": "20.10",
                "title": "Implement rate limiting in n8n workflows",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Add rate limiting to n8n workflows to prevent exceeding Google Calendar API limits.",
                "updates": []
            },
            {
                "id": "20.11",
                "title": "Remove or update web interface components",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Remove or update the existing web interface components (calendar.js, forms) to reflect the shift to Telegram bot interaction.",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "21",
        "title": "Enhance Gmail Integration with Advanced Email Management Features",
        "description": "Implement basic Gmail integration using n8n's Gmail node to enable email operations (send, read, search, archive) through Telegram bot commands via n8n workflows. Project located at /integrations/gmail-telegram-n8n/",
        "status": "in-progress",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [],
        "subtasks": [
            {
                "id": "21.1",
                "title": "Create email reading interface",
                "status": "pending",
                "assignedAgent": "ui-developer",
                "description": "Build simple web interface to display inbox, read emails, and view email details with basic formatting",
                "updates": []
            },
            {
                "id": "21.2",
                "title": "Implement basic email sending",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Create simple web form for composing and sending emails, integrating with existing gmail.js draft/send system",
                "updates": []
            },
            {
                "id": "21.3",
                "title": "Add basic email management actions",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Implement simple delete, archive, and mark as read/unread functionality with basic confirmation dialogs",
                "updates": []
            },
            {
                "id": "21.4",
                "title": "Set up n8n instance and install Gmail and Telegram nodes",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Configure an n8n instance and install the necessary Gmail and Telegram nodes for integration.",
                "updates": []
            },
            {
                "id": "21.5",
                "title": "Configure Gmail node with appropriate credentials",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Authenticate the Gmail node in n8n using appropriate credentials to access the Gmail account.",
                "updates": []
            },
            {
                "id": "21.6",
                "title": "Set up Telegram bot and configure Telegram node",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Create a Telegram bot and configure the Telegram node in n8n with the bot's API token.",
                "updates": []
            },
            {
                "id": "21.7",
                "title": "Create n8n workflow for sending emails via Telegram command",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Design an n8n workflow that triggers upon receiving a specific Telegram command and sends an email using the Gmail node.",
                "updates": []
            },
            {
                "id": "21.8",
                "title": "Create n8n workflow for reading emails via Telegram command",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Design an n8n workflow that triggers upon receiving a specific Telegram command and retrieves and displays email information using the Gmail node.",
                "updates": []
            },
            {
                "id": "21.9",
                "title": "Create n8n workflow for searching emails via Telegram command",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Design an n8n workflow that triggers upon receiving a specific Telegram command and searches emails based on provided criteria using the Gmail node.",
                "updates": []
            },
            {
                "id": "21.10",
                "title": "Create n8n workflow for archiving emails via Telegram command",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Design an n8n workflow that triggers upon receiving a specific Telegram command and archives emails using the Gmail node.",
                "updates": []
            },
            {
                "id": "21.11",
                "title": "Remove email filtering/labeling, automated responses, bulk operations, analytics, attachment management, and template system functionalities",
                "status": "pending",
                "assignedAgent": "ui-developer",
                "description": "Remove the code and configurations related to the complex features that are no longer required.",
                "updates": []
            },
            {
                "id": "21.12",
                "title": "Import n8n workflows",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Import the 4 n8n workflow files into the n8n instance.",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "22",
        "title": "Create front-end chat integration for locally hosted Ulana AI system",
        "description": "Build a modern chat interface with real-time messaging capabilities for the locally hosted Ulana AI system, featuring responsive UI, WebSocket/HTTP polling communication, conversation management, and offline support.",
        "status": "pending",
        "priority": "medium",
        "assignedAgent": "ui-developer",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            1
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "23",
        "title": "Create Ulana AI Chat Integration Layer for Google API Services",
        "description": "Build a simplified chat automation system using Telegram Bot and n8n workflow automation for interacting with Google APIs, focusing on a single-user home web server use case. Includes an AI model abstraction stub for future Ulana AI or other model integration.",
        "status": "pending",
        "priority": "medium",
        "assignedAgent": "ui-developer",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [],
        "subtasks": [
            {
                "id": "23.1",
                "title": "Create basic web chat interface",
                "status": "pending",
                "assignedAgent": "ui-developer",
                "description": "Build simple chat web page with message input/output and connection to Ulana AI system for basic conversation",
                "updates": []
            },
            {
                "id": "23.2",
                "title": "Add simple calendar commands",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Implement basic chat commands like 'schedule meeting tomorrow at 2pm' that trigger calendar event creation",
                "updates": []
            },
            {
                "id": "23.3",
                "title": "Add simple email commands",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Implement basic chat commands like 'send email to john@email.com about project update' that trigger email composition",
                "updates": []
            },
            {
                "id": "23.4",
                "title": "Set up Telegram Bot",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Create a Telegram Bot and obtain the API token.",
                "updates": []
            },
            {
                "id": "23.5",
                "title": "Install and Configure n8n",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Install n8n on a home web server and configure it to connect to the Telegram Bot.",
                "updates": []
            },
            {
                "id": "23.6",
                "title": "Create n8n Workflows for Google API Interactions",
                "status": "pending",
                "assignedAgent": "ui-developer",
                "description": "Build n8n workflows to handle Gmail, Calendar, and Drive operations using the respective Google API nodes.",
                "updates": []
            },
            {
                "id": "23.7",
                "title": "Implement AI Model Abstraction Stub",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Create a placeholder function or module for AI model integration (e.g., `ai_model_interface.js`).",
                "updates": []
            },
            {
                "id": "23.8",
                "title": "Configure OAuth 2.0 for Google API Access",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Set up OAuth 2.0 authentication in n8n to allow access to Google APIs.",
                "updates": []
            },
            {
                "id": "23.9",
                "title": "Remove custom chat interface",
                "status": "pending",
                "assignedAgent": "integration-specialist",
                "description": "Remove the custom web chat interface as it is replaced by Telegram Bot.",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "24",
        "title": "Implement Comprehensive Agent Architecture System",
        "description": "Create a comprehensive agent architecture system with memory-linked specialist roles, persistent expertise via Memory MCP, evolving codex files, and dynamic tool restriction framework.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "integration-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            1,
            9,
            11,
            17,
            22,
            23
        ],
        "subtasks": [
            {
                "id": "24.1",
                "title": "Design Agent Architecture and Memory MCP Integration",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Design the core agent architecture, including the structure for specialist roles and the integration with Memory MCP for persistent expertise. Define data structures for knowledge storage and retrieval.",
                "updates": []
            },
            {
                "id": "24.2",
                "title": "Implement Evolving Codex File System",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Develop a system for managing and evolving codex files, allowing agents to access, update, and learn from structured project information.",
                "updates": []
            },
            {
                "id": "24.3",
                "title": "Implement Dynamic Tool Restriction Framework",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Develop the dynamic tool restriction framework using `/project:restrict-tools` to manage agent tool access based on roles.",
                "updates": []
            },
            {
                "id": "24.4",
                "title": "Implement Tag Standardization and .agent-meta/ Linking System",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Implement the tag standardization system for agent roles and the `.agent-meta/` linking system for agent discovery and metadata access.",
                "updates": []
            },
            {
                "id": "24.5",
                "title": "Implement /project:claim-role Command",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Implement the `/project:claim-role` command to allow agents to claim specific roles, updating their tags and permissions.",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "25",
        "title": "Design and implement standardized coordination system to prevent multiple agents from killing each other's processes",
        "description": "Create an automatic agent assignment system that routes server-related requests to a designated server agent with exclusive server knowledge and capabilities, eliminating port conflicts by ensuring only one agent type handles server operations.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "integration-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            1,
            5,
            11,
            17
        ],
        "subtasks": [
            {
                "id": "25.1",
                "title": "Create Agent Capability Registry Module",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Develop a JSON-based agent registry system with capability mapping and role definitions for automatic request routing",
                "updates": []
            },
            {
                "id": "25.2",
                "title": "Implement Request Routing Engine",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Create intelligent request classification and routing system to automatically assign appropriate agents based on request type",
                "updates": []
            },
            {
                "id": "25.3",
                "title": "Design Server Agent Designation System",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Implement exclusive server agent role with dedicated server knowledge and capabilities",
                "updates": []
            },
            {
                "id": "25.4",
                "title": "Develop Agent Communication Protocol",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Create request forwarding and response handling system for inter-agent communication",
                "updates": []
            },
            {
                "id": "25.5",
                "title": "Integrate Routing System with TaskMaster",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Connect agent assignment system to TaskMaster's task execution with routing metadata and status reporting",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "26",
        "title": "Implement Interactive Tooltips for Agent Coordination Dashboard",
        "description": "Implement interactive tooltips for the Agent Coordination Dashboard to enhance user experience and provide contextual information about dashboard elements.",
        "status": "pending",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            2,
            17
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "27",
        "title": "Fix Agent Coordination Dashboard Widget Width Inconsistencies",
        "description": "Address Agent Coordination Dashboard widget width inconsistencies by implementing dynamic width calculations, consistent grid layouts, and responsive design patterns to prevent UI spacing issues.",
        "status": "pending",
        "priority": "high",
        "assignedAgent": "ui-developer",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            2,
            17,
            26
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "28",
        "title": "Implement Comprehensive CSS Design System and Layout Standards",
        "description": "Establish a comprehensive CSS design system and layout standards to prevent UI spacing issues in future dashboard development, ensuring consistent widget positioning and theming.",
        "status": "pending",
        "priority": "medium",
        "assignedAgent": "ui-developer",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            2,
            14,
            27
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "29",
        "title": "Create Human-Readable Documentation Index for Agent Dashboard",
        "description": "Create a comprehensive, human-readable documentation index for the agent dashboard, including a structured tree view with web links to all relevant files and resources.",
        "status": "pending",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            2,
            9,
            24,
            25
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "30",
        "title": "Update Frontend Agent Skills and Documentation for MVP Dashboard",
        "description": "Review and update the frontend agent's skills and documentation to ensure it is equipped for the MVP dashboard, focusing on modern tooling and clear documentation.",
        "status": "in-progress",
        "priority": "high",
        "assignedAgent": "ui-developer",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            1,
            29
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "31",
        "title": "Update Frontend Agent Skills and Documentation for MVP Dashboard",
        "description": "Update the frontend agent's skills and documentation to ensure it is properly configured with the right tools (Puppeteer, ESLint, Tailwind CSS, Shadcn/UI) and that its documentation is accurate and up-to-date for the MVP dashboard.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "ui-developer",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            1,
            29,
            30
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "32",
        "title": "Start Development Server for Dashboard Application",
        "description": "Start the development server for the dashboard application to enable real-time testing and development of the user interface.",
        "status": "pending",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            5
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "33",
        "title": "Create AI Model Abstraction Layer Stub",
        "description": "Create an AI model abstraction layer stub that allows switching between local Ulana AI and other AI models in the future, focusing on a pluggable architecture for intent recognition and response generation.",
        "status": "pending",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            23,
            24,
            25
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "34",
        "title": "Test DNS Analytics Widget Implementation",
        "description": "Test and validate the DNS Analytics Widget implementation. QA specialist agent should verify widget functionality, data display, user interactions, error handling, and integration with the dashboard system.",
        "status": "pending",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            15,
            17,
            27
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "35",
        "title": "Test Google Gemini Integration",
        "description": "Verify the Google Gemini integration is functioning correctly after switching from the Claude-Code provider. This task involves testing the core functionalities and ensuring seamless integration with existing workflows.",
        "status": "pending",
        "priority": "medium",
        "assignedAgent": "qa-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            10,
            19,
            20,
            21
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "36",
        "title": "Implement API Token Usage Monitoring and Tracking",
        "description": "Implement comprehensive API token usage monitoring and tracking for AI agents, including debugging the local Ollama installation and creating a usage tracking dashboard with alerts.",
        "status": "pending",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "integration-specialist-tasks",
        "dependencies": [
            9,
            24,
            33
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "1",
        "title": "QA Testing: DNS Analytics Widget",
        "description": "Perform QA testing on the DNS Analytics Widget to ensure proper functionality, data visualization, and integration with the dashboard system.",
        "status": "in-progress",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "server-agent",
        "dependencies": [
            14,
            15,
            16
        ],
        "subtasks": [
            {
                "id": "1.1",
                "title": "UI Developer Dashboard Testing Complete",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Complete testing of agent dashboard from ui-developer perspective",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "2",
        "title": "QA Testing: PIN Authentication System",
        "description": "Perform QA testing on the PIN Authentication System to ensure proper functionality, security, and integration with the dashboard system.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "server-agent",
        "dependencies": [
            3
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "3",
        "title": "QA Specialist Assignment: DNS Analytics Widget Testing",
        "description": "Officially assign a QA specialist to begin comprehensive testing of the DNS Analytics Widget, ensuring thorough validation of its functionality and integration.",
        "status": "in-progress",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "server-agent",
        "dependencies": [
            1
        ],
        "subtasks": [
            {
                "id": "3.1",
                "title": "Begin DNS Analytics Widget QA Testing",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Start comprehensive QA testing of the DNS Analytics Widget",
                "updates": []
            },
            {
                "id": "3.2",
                "title": "Test Widget Integration in Dashboard",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Test the DNS Analytics Widget integration within the dashboard environment",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "4",
        "title": "Authentication Context and Session Management",
        "description": "Implement React Context API for PIN-based authentication state, localStorage session management, custom useAuth hooks, and session timeout detection for dashboard security. This task ensures secure and persistent user sessions within the application. The implementation is now complete and production-ready, incorporating enterprise-level security features.",
        "status": "completed",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "server-agent",
        "dependencies": [
            2,
            3
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "5",
        "title": "Resolve Dashboard Server Infrastructure Issue",
        "description": "Diagnose and resolve the unresponsive dashboard server issue at localhost:5173, which is currently blocking QA testing of the DNS Analytics Widget.",
        "status": "in-progress",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "server-agent",
        "dependencies": [
            1,
            3
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "6",
        "title": "Build PAWS Test Connection Widget",
        "description": "Develop a PAWS test connection widget with interactive controls for DNS connection status, pause/resume filtering, and diagnostics. The widget will provide real-time status indicators and professional styling.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "server-agent",
        "dependencies": [
            4,
            5,
            14
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "7",
        "title": "Fix Puppeteer Chrome Browser Launch Failure",
        "description": "Diagnose and resolve the Puppeteer Chrome browser launch failure, which is currently blocking QA testing. This involves checking Chrome binary integrity, clearing the Puppeteer cache, reinstalling dependencies, and testing alternative launch configurations. Task officially assigned to server-agent role and will remain in server-agent tag until completely resolved and QA testing capabilities restored.",
        "status": "in-progress",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "server-agent",
        "dependencies": [
            5
        ],
        "subtasks": [
            {
                "id": "7.1",
                "title": "Install Linux System Dependencies",
                "status": "done",
                "assignedAgent": "ui-developer",
                "description": "Install missing Linux packages required for Chrome browser",
                "updates": []
            },
            {
                "id": "7.2",
                "title": "Test Puppeteer Browser Launch",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Verify Puppeteer can successfully launch Chrome after fixes",
                "updates": []
            },
            {
                "id": "7.3",
                "title": "Verify MCP Puppeteer Integration",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Test that mcp__puppeteer tools work correctly after browser fix",
                "updates": []
            },
            {
                "id": "7.4",
                "title": "Check Chrome Binary Integrity",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Verify the Chrome binary is not corrupted and has execute permissions.",
                "updates": []
            },
            {
                "id": "7.5",
                "title": "Clear Puppeteer Cache",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Clear the Puppeteer cache directory.",
                "updates": []
            },
            {
                "id": "7.6",
                "title": "Reinstall Puppeteer",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Reinstall Puppeteer and Chrome dependencies.",
                "updates": []
            },
            {
                "id": "7.7",
                "title": "Install and configure Tailwind CSS MCP with PostCSS",
                "status": "done",
                "assignedAgent": "ui-developer",
                "description": "Set up the Tailwind CSS MCP server integration including PostCSS configuration for the dashboard",
                "updates": []
            },
            {
                "id": "7.8",
                "title": "Initialize Tailwind with custom design tokens",
                "status": "pending",
                "assignedAgent": "ui-developer",
                "description": "Configure Tailwind CSS with the project's existing design system tokens and color variables",
                "updates": []
            },
            {
                "id": "7.9",
                "title": "Install and configure Shadcn/UI MCP server",
                "status": "pending",
                "assignedAgent": "ui-developer",
                "description": "Set up the Shadcn/UI MCP server for component library integration",
                "updates": []
            },
            {
                "id": "7.10",
                "title": "Test component installation and styling integration",
                "status": "pending",
                "assignedAgent": "qa-specialist",
                "description": "Verify MCP servers work correctly by installing a test component and validating styling",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "8",
        "title": "Add Onboarding Help and Tooltips to Agent Dashboard",
        "description": "Implement onboarding help and tooltips for the agent dashboard to guide users on system usage. This includes guided tours, interactive help hints, and tooltips explaining key functionalities.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "ui-developer",
        "sourceTag": "server-agent",
        "dependencies": [
            4,
            6
        ],
        "subtasks": [
            {
                "id": "8.1",
                "title": "Create tooltip system",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Develop a reusable tooltip component for the agent dashboard.",
                "updates": []
            },
            {
                "id": "8.2",
                "title": "Build guided tour",
                "status": "completed",
                "assignedAgent": "ui-developer",
                "description": "Implement a guided tour that walks users through the key features of the agent dashboard.",
                "updates": []
            },
            {
                "id": "8.3",
                "title": "Add interactive help hints",
                "status": "completed",
                "assignedAgent": "integration-specialist",
                "description": "Implement interactive help hints that appear contextually based on user actions.",
                "updates": []
            },
            {
                "id": "8.4",
                "title": "Implement help button/menu",
                "status": "completed",
                "assignedAgent": "integration-specialist",
                "description": "Add a help button or menu item that allows users to access the onboarding help at any time.",
                "updates": []
            },
            {
                "id": "8.5",
                "title": "Verify complete onboarding experience",
                "status": "done",
                "assignedAgent": "ui-developer",
                "description": "Verify that the dashboard provides a complete onboarding experience for human managers with tooltips, guided tours, contextual hints, and an easily accessible help system.",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "9",
        "title": "Deploy UI Components to Dashboard Server",
        "description": "Deploy the completed and tested UI components, including the DNS Analytics Widget, PIN Authentication System, Pause/Test Connection Widget, and dashboard integration, to the development dashboard server.",
        "status": "in-progress",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "server-agent",
        "dependencies": [
            4,
            6,
            5
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "10",
        "title": "Improve Control D Dashboard Readability and Layout",
        "description": "Review the Control D dashboard for human readability and layout improvements, focusing on visual hierarchy, information density, and navigation clarity. Replace emoji icons with more accessible and professional alternatives, establishing design principles for future development.",
        "status": "pending",
        "priority": "high",
        "assignedAgent": "ui-developer",
        "sourceTag": "server-agent",
        "dependencies": [
            9,
            8
        ],
        "subtasks": [
            {
                "id": "10.1",
                "title": "Multi-Agent Web Dashboard Coordination Test Complete",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Comprehensive testing completed for multi-agent coordination on web dashboard. System working with 76 tasks across 9 agent contexts, priority hierarchy established, and dashboard framework ready.",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "11",
        "title": "Deploy Enhanced Agent Dashboard to Production",
        "description": "Deployment of the fully enhanced agent dashboard with comprehensive TaskMaster integration (63 tasks across 5 contexts), responsive design, interactive tooltip system, enhanced settings menu, and fallback display to production is now COMPLETE. The dashboard is live at http://localhost:3001/dashboard with all features implemented and running on a production Express.js server.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "server-agent",
        "dependencies": [
            9,
            10,
            8,
            5,
            7
        ],
        "subtasks": [
            {
                "id": "11.1",
                "title": "Configure Production Server Environment",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Set up production server with proper routing and configuration to serve the enhanced dashboard",
                "updates": []
            },
            {
                "id": "11.2",
                "title": "Set up SSL/TLS Certificates",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Install and configure SSL certificates for secure HTTPS access",
                "updates": []
            },
            {
                "id": "11.3",
                "title": "Configure Production Environment Variables",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Set up production environment variables and API endpoint configuration",
                "updates": []
            },
            {
                "id": "11.4",
                "title": "Implement CORS and Security Policies",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Configure CORS policies for TaskMaster API integration and implement security headers",
                "updates": []
            },
            {
                "id": "11.5",
                "title": "Set up Production Monitoring and Logging",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Configure monitoring and logging systems for production dashboard",
                "updates": []
            },
            {
                "id": "11.6",
                "title": "Create Deployment Scripts",
                "status": "done",
                "assignedAgent": "server-agent",
                "description": "Develop automated deployment scripts for production deployment process",
                "updates": []
            },
            {
                "id": "11.7",
                "title": "Comprehensive Production Testing",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Test all enhanced features in production environment",
                "updates": []
            },
            {
                "id": "11.8",
                "title": "Document Production Deployment",
                "status": "done",
                "assignedAgent": "server-agent",
                "description": "Create comprehensive documentation for production deployment process and configuration",
                "updates": []
            },
            {
                "id": "11.9",
                "title": "Verify Production Deployment",
                "status": "completed",
                "assignedAgent": "server-agent",
                "description": "Verify that the enhanced agent dashboard is successfully deployed to production.",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "12",
        "title": "Deploy Agent Dashboard Onboarding System to Production Server",
        "description": "Deploy the QA-approved Agent Dashboard Onboarding System to the production server. This includes installing dependencies, updating server files, restarting services, and verifying the enhanced dashboard functionality.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "server-agent",
        "dependencies": [
            8,
            11
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "13",
        "title": "Investigate and Fix Task Assignment Widget TaskMaster Integration",
        "description": "Debug and fix the task assignment widget to display real TaskMaster data instead of placeholder content. The widget should show all 63 tasks from 5 contexts retrieved from the TaskMaster API integration.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "server-agent",
        "dependencies": [
            11,
            12
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "14",
        "title": "Refactor Dashboard Widget for Accessibility",
        "description": "Improve dashboard widget accessibility by implementing ARIA attributes, semantic HTML, and keyboard navigation to ensure users with disabilities can interact with the widget effectively.",
        "status": "pending",
        "priority": "medium",
        "assignedAgent": "ui-developer",
        "sourceTag": "server-agent",
        "dependencies": [
            9,
            11
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "15",
        "title": "Launch TaskMaster API Server with Multi-Agent Coordination",
        "description": "Launch the TaskMaster API server with multi-agent coordination to make the dashboard live, starting the server on port 3001 and ensuring WebSocket connections are working for real-time agent coordination.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "server-agent",
        "dependencies": [
            9,
            11
        ],
        "subtasks": [
            {
                "id": "15.1",
                "title": "Server Agent: Deploy TaskMaster API server on port 3001",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Launch the multi-agent coordination system server using npm start command. Verify WebSocket connections and dashboard accessibility.",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "16",
        "title": "Monitor and Maintain TaskMaster API Server",
        "description": "Monitor and maintain the live TaskMaster API server. Check server logs, verify port accessibility, ensure WebSocket connections remain stable, and implement server health monitoring dashboard endpoint.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "server-agent",
        "dependencies": [
            15
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "1",
        "title": "QA Testing: DNS Analytics Widget",
        "description": "Perform QA testing on the DNS Analytics Widget to ensure proper functionality, data visualization, and integration with the dashboard system.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "ui-developer",
        "dependencies": [
            14,
            15,
            16
        ],
        "subtasks": [
            {
                "id": "1.1",
                "title": "Multi-Agent Coordination Test Successful",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Successfully tested multi-agent coordination protocol - tag switching, task updates, and subtask creation all working correctly",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "2",
        "title": "QA Testing: PIN Authentication System",
        "description": "Perform QA testing on the PIN Authentication System to ensure proper functionality, security, and integration with the dashboard system.",
        "status": "in-progress",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "ui-developer",
        "dependencies": [
            3
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "3",
        "title": "QA Specialist Assignment: DNS Analytics Widget Testing",
        "description": "Officially assign a QA specialist to begin comprehensive testing of the DNS Analytics Widget, ensuring thorough validation of its functionality and integration.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "ui-developer",
        "dependencies": [
            1
        ],
        "subtasks": [
            {
                "id": "3.1",
                "title": "Begin DNS Analytics Widget QA Testing",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Start comprehensive QA testing of the DNS Analytics Widget",
                "updates": []
            },
            {
                "id": "3.2",
                "title": "Test Widget Integration in Dashboard",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Test the DNS Analytics Widget integration within the dashboard environment",
                "updates": []
            },
            {
                "id": "3.3",
                "title": "Document QA Testing Blocked by Server Issues",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Document that QA testing is blocked and requires server agent intervention",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "4",
        "title": "Authentication Context and Session Management",
        "description": "Implement React Context API for PIN-based authentication state, localStorage session management, custom useAuth hooks, and session timeout detection for dashboard security. This task ensures secure and persistent user sessions within the application.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "ui-developer",
        "dependencies": [
            2,
            3
        ],
        "subtasks": [
            {
                "id": "4.1",
                "title": "Puppeteer Browser Testing Integration Complete",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Successfully configured and tested Puppeteer browser automation for TaskMaster dashboard integration. Verified API backend functionality, dashboard navigation, and multi-agent coordination capabilities.",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "5",
        "title": "Launch Development Server via Server Agent",
        "description": "Launch the development server using the server agent to serve the latest dashboard files. This ensures that the most recent UI fixes and widget grid improvements are available for testing and development.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "qa-specialist",
        "sourceTag": "ui-developer",
        "dependencies": [
            2,
            3
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "6",
        "title": "Implement PAWS/test connection widget",
        "description": "Implement a dashboard widget for testing DNS connection status and controlling DNS filtering. This widget will provide real-time status indicators and interactive controls for connection diagnostics.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "ui-developer",
        "dependencies": [
            4,
            5
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "7",
        "title": "Optimize Agent Dashboard UX/Layout for Readability",
        "description": "Optimize the agent dashboard's UX and layout to improve human readability and overall user experience by addressing identified issues and implementing modern UX principles.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "ui-developer",
        "dependencies": [
            5,
            4,
            6
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "8",
        "title": "Improve Control D Dashboard Usability and Accessibility",
        "description": "Review the Control D dashboard for usability and accessibility improvements, focusing on visual hierarchy, information density, and navigation clarity. Replace emoji icons with accessible alternatives and establish design guidelines.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "ui-developer",
        "sourceTag": "ui-developer",
        "dependencies": [
            7,
            6
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "9",
        "title": "Fix Puppeteer Browser Launch Configuration in MCP Server",
        "description": "Resolve the 'Dangerous browser arguments detected: --no-sandbox' error in the MCP Puppeteer server by implementing proper browser launch configuration that works with the security restrictions, specifically addressing ARM64 architecture requirements, while enabling UI testing capabilities.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "qa-specialist",
        "sourceTag": "ui-developer",
        "dependencies": [
            6,
            7,
            8
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "10",
        "title": "Test Multi-Agent Coordination with Priority and Conflict Resolution",
        "description": "Implement comprehensive testing for multi-agent coordination, ensuring proper priority handling and conflict resolution across all agent roles within the system.",
        "status": "pending",
        "priority": "medium",
        "assignedAgent": "qa-specialist",
        "sourceTag": "ui-developer",
        "dependencies": [
            1,
            2,
            6,
            7,
            8
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "11",
        "title": "Clean up and refactor ARM64 Puppeteer configuration",
        "description": "Remove temporary fixes, workarounds, and complex configuration snippets for ARM64 Puppeteer. Implement a simple, permanent solution that works reliably without manual interventions.",
        "status": "pending",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "ui-developer",
        "dependencies": [
            9
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "1",
        "title": "QA Testing: DNS Analytics Widget",
        "description": "Perform QA testing on the DNS Analytics Widget to ensure proper functionality, data visualization, and integration with the dashboard system.",
        "status": "in-progress",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "qa-specialist",
        "dependencies": [
            14,
            15,
            16
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "2",
        "title": "QA Testing: PIN Authentication System",
        "description": "Perform QA testing on the PIN Authentication System to ensure proper functionality, security, and integration with the dashboard system.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "qa-specialist",
        "dependencies": [
            3
        ],
        "subtasks": [
            {
                "id": "2.1",
                "title": "Functional Testing of PIN Authentication Features",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Test all core authentication features including PIN setup, login/logout, rate limiting, and security mechanisms",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "3",
        "title": "QA Specialist Assignment: DNS Analytics Widget Testing",
        "description": "Officially assign a QA specialist to begin comprehensive testing of the DNS Analytics Widget, ensuring thorough validation of its functionality and integration.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "qa-specialist",
        "dependencies": [
            1
        ],
        "subtasks": [
            {
                "id": "3.1",
                "title": "Begin DNS Analytics Widget QA Testing",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Start comprehensive QA testing of the DNS Analytics Widget",
                "updates": []
            },
            {
                "id": "3.2",
                "title": "Test Widget Integration in Dashboard",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Test the DNS Analytics Widget integration within the dashboard environment",
                "updates": []
            },
            {
                "id": "3.3",
                "title": "Perform Functional Testing of DNS Analytics Widget",
                "status": "done",
                "assignedAgent": "qa-specialist",
                "description": "Test all DNS Analytics Widget features including data visualization, time range controls, and user interactions",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "4",
        "title": "Create TaskMaster HTTP API Server",
        "description": "Build an Express.js HTTP server to expose TaskMaster data to the dashboard via REST endpoints. This will replace the current CLI-only interface with web-accessible APIs.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "ui-developer",
        "sourceTag": "qa-specialist",
        "dependencies": [
            1,
            2,
            3
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "5",
        "title": "Replace Dashboard Mock Data with Real API Calls",
        "description": "Replace the hardcoded mock data in the dashboard widgets with real data fetched from the TaskMaster HTTP API. This will ensure the dashboard displays accurate and up-to-date information.",
        "status": "review",
        "priority": "high",
        "assignedAgent": "integration-specialist",
        "sourceTag": "qa-specialist",
        "dependencies": [
            4
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "6",
        "title": "Resolve Puppeteer Browser Launch Failure",
        "description": "Investigate and resolve the Puppeteer browser launch failure due to a Chrome syntax error, which is blocking UI testing capabilities. This involves checking Chrome binary integrity, clearing the Puppeteer cache, reinstalling dependencies, and fixing file permissions.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "qa-specialist",
        "sourceTag": "qa-specialist",
        "dependencies": [
            4,
            5
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "7",
        "title": "QA Testing: Agent Dashboard TaskMaster Integration",
        "description": "Test the enhanced agent dashboard to verify all 63 tasks from 5 contexts are properly displayed, validate TaskMaster API integration, and test responsive design across different screen sizes using Puppeteer automation",
        "status": "pending",
        "priority": "medium",
        "assignedAgent": "qa-specialist",
        "sourceTag": "qa-specialist",
        "dependencies": [
            4,
            5,
            6
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "8",
        "title": "QA Review: Agent Dashboard Onboarding System",
        "description": "Perform comprehensive QA testing of the completed agent dashboard onboarding system. Validate functionality, cross-browser compatibility, responsive design, accessibility, and user experience flow.",
        "status": "done",
        "priority": "high",
        "assignedAgent": "qa-specialist",
        "sourceTag": "qa-specialist",
        "dependencies": [
            4,
            5,
            7
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "1",
        "title": "Implement LiteLLM Integration for Model Call Redirection",
        "description": "Implement LiteLLM proxy server to redirect model calls to alternative sources, including network-hosted Ollama, providing unified API access, cost control, and reliability improvements.",
        "status": "in-progress",
        "priority": "high",
        "assignedAgent": "integration-specialist",
        "sourceTag": "integration-specialist",
        "dependencies": [
            5,
            8,
            10
        ],
        "subtasks": [
            {
                "id": "1.2",
                "title": "Multi-Provider Testing and Cost Optimization",
                "status": "in-progress",
                "assignedAgent": "qa-specialist",
                "description": "Test multi-provider configuration and cost optimization routing logic.",
                "updates": []
            },
            {
                "id": "1.1",
                "title": "Set up Docker Environment and Base LiteLLM Configuration",
                "status": "done",
                "assignedAgent": "server-agent",
                "description": "Create Docker Compose setup and initial LiteLLM configuration files for proxy deployment",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "2",
        "title": "Deploy Multi-Agent System via Server Agent",
        "description": "Deploy the multi-agent coordination system with human orchestrator via the Server Agent, ensuring all components are correctly configured and operational in the target environment.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "integration-specialist",
        "dependencies": [
            1
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "3",
        "title": "Create API Backend Server with TaskMaster Integration",
        "description": "Develop an API backend server to replace the existing dashboard fallback data source and enable real-time multi-agent coordination through TaskMaster integration.",
        "status": "done",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "integration-specialist",
        "dependencies": [
            1,
            2
        ],
        "subtasks": [
            {
                "id": "3.1",
                "title": "Phase 1: Design API Endpoints for TaskMaster Integration",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Design and document RESTful API endpoints for dashboard-TaskMaster integration including agent management, task operations, and real-time coordination",
                "updates": []
            },
            {
                "id": "3.2",
                "title": "Phase 2: Express.js API Server Implementation Complete",
                "status": "done",
                "assignedAgent": "integration-specialist",
                "description": "Successfully implemented Express.js API server with TaskMaster dashboard integration. API provides real-time multi-agent coordination, task management, and priority-based agent hierarchy.",
                "updates": []
            }
        ],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "4",
        "title": "Automated E2E Testing of API and Dashboard Integration with Puppeteer",
        "description": "Implement end-to-end testing of the API backend server and dashboard integration using Puppeteer browser automation to verify multi-agent coordination functionality.",
        "status": "in-progress",
        "priority": "medium",
        "assignedAgent": "qa-specialist",
        "sourceTag": "integration-specialist",
        "dependencies": [
            2,
            3
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "1",
        "title": "Implement Agent Management API Endpoints",
        "description": "Implement the /api/agents endpoints for agent management, including registration, status updates, and task assignment. Integrate these endpoints with the coordination-workflow.cjs module for agent discovery and management.",
        "status": "in-progress",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "backend-agent",
        "dependencies": [
            6,
            7,
            8
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "1",
        "title": "Connect Agent-Registry Widget to Live Agent Data",
        "description": "Connect the agent-registry widget to live agent data fetched from API endpoints. Implement real-time updates and an interactive agent management interface for human orchestration.",
        "status": "in-progress",
        "priority": "medium",
        "assignedAgent": "integration-specialist",
        "sourceTag": "frontend-agent",
        "dependencies": [
            6,
            7,
            8
        ],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    },
    {
        "id": "2",
        "title": "Implement LiteLLM Integration for Model Call Redirection",
        "description": "Implement LiteLLM integration to redirect model calls to various providers (Anthropic, Google, Ollama) for unified API access, cost control, and improved reliability.",
        "status": "pending",
        "priority": "high",
        "assignedAgent": "integration-specialist",
        "sourceTag": "frontend-agent",
        "dependencies": [],
        "subtasks": [],
        "createdAt": "2025-07-08T13:56:12.693Z",
        "updatedAt": "2025-07-08T13:56:12.693Z"
    }
];

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'TaskMaster Dashboard API - Simple Version',
        agents: mockAgents.length,
        tasks: mockTasks.length
    });
});

app.get('/api/agents', (req, res) => {
    const agents = mockAgents.sort((a, b) => a.priority - b.priority);
    
    res.json({
        agents,
        currentAgent: agents.find(a => a.isCurrent)?.name || null,
        totalAgents: agents.length,
        lastUpdate: new Date().toISOString()
    });
});

// POST endpoint to create/launch new agents
app.post('/api/agents', (req, res) => {
    // Using imported exec function
    const { name, description, role, priority = 5 } = req.body;
    
    if (!name || !role) {
        return res.status(400).json({
            success: false,
            message: 'Agent name and role are required',
            timestamp: new Date().toISOString()
        });
    }
    
    // Validate role
    const validRoles = ['frontend-architect', 'ui-developer', 'integration-specialist', 'qa-specialist', 'server-agent', 'backend-agent', 'devops-agent'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
            timestamp: new Date().toISOString()
        });
    }
    
    // Check if agent already exists
    const existingAgent = mockAgents.find(agent => agent.name === name);
    if (existingAgent) {
        return res.status(409).json({
            success: false,
            message: 'Agent with this name already exists',
            timestamp: new Date().toISOString()
        });
    }
    
    try {
        // Register agent with coordination workflow
        const coordinationScript = '/mnt/d/Projects/claude-project/.taskmaster/agents/coordination-workflow.cjs';
        const agentId = `${name}-${Date.now()}`;
        
        // Execute agent registration
        exec(`node "${coordinationScript}" register ${agentId} ${role}`, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Agent registration failed:', error.message);
            } else {
                console.log('✅ Agent registered successfully:', stdout);
            }
        });
        
        // Add to mock agents array
        const newAgent = {
            name,
            description: description || `${role} agent for specialized task execution`,
            priority: parseInt(priority),
            taskCount: 0,
            completedTasks: 0,
            statusBreakdown: {},
            isCurrent: false,
            role,
            agentId,
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        
        mockAgents.push(newAgent);
        
        res.json({
            success: true,
            message: `Agent ${name} created successfully`,
            agent: newAgent,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Failed to create agent:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during agent creation',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// PUT endpoint to update agent status
app.put('/api/agents/:name', (req, res) => {
    const agentName = req.params.name;
    const { status, isCurrent, description } = req.body;
    
    const agent = mockAgents.find(a => a.name === agentName);
    if (!agent) {
        return res.status(404).json({
            success: false,
            message: 'Agent not found',
            timestamp: new Date().toISOString()
        });
    }
    
    // Update agent properties
    if (status) agent.status = status;
    if (description) agent.description = description;
    if (typeof isCurrent === 'boolean') {
        // Set all agents to not current first
        mockAgents.forEach(a => a.isCurrent = false);
        agent.isCurrent = isCurrent;
    }
    
    res.json({
        success: true,
        message: `Agent ${agentName} updated successfully`,
        agent,
        timestamp: new Date().toISOString()
    });
});

// Simple function to get real TaskMaster tasks
function getTaskMasterTasks() {
    try {
        const tasksJsonPath = path.join(__dirname, '..', '.taskmaster', 'tasks', 'tasks.json');
        if (!fs.existsSync(tasksJsonPath)) {
            console.warn('TaskMaster tasks.json not found at:', tasksJsonPath);
            return [];
        }
        
        const tasksData = JSON.parse(fs.readFileSync(tasksJsonPath, 'utf8'));
        const allTasks = [];
        
        console.log('Reading TaskMaster data from:', Object.keys(tasksData));
        
        // Aggregate tasks from all workspaces with current structure
        Object.keys(tasksData).forEach(workspace => {
            if (tasksData[workspace] && tasksData[workspace].tasks) {
                tasksData[workspace].tasks.forEach(task => {
                    // Convert TaskMaster task format to dashboard API format
                    allTasks.push({
                        id: task.id.toString(),
                        title: task.title,
                        description: task.description,
                        status: task.status,
                        priority: task.priority,
                        dependencies: task.dependencies || [],
                        subtasks: (task.subtasks || []).map(subtask => ({
                            id: `${task.id}.${subtask.id}`,
                            title: subtask.title,
                            description: subtask.description,
                            status: subtask.status,
                            assignedAgent: workspace,
                            updates: []
                        })),
                        sourceTag: workspace,
                        assignedAgent: workspace,
                        complexityScore: task.complexityScore || null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                });
            }
        });
        
        console.log(`Loaded ${allTasks.length} tasks from ${Object.keys(tasksData).length} workspaces`);
        return allTasks;
    } catch (error) {
        console.error('Error reading TaskMaster tasks:', error.message);
        return []; // Return empty array instead of mock data to see actual problem
    }
}

app.get('/api/tasks', (req, res) => {
    const { status, agent, priority, limit = 50, page = 1, source = 'taskmaster' } = req.query;
    
    // Choose data source: real TaskMaster data or mock for testing
    let tasks = source === 'mock' ? [...mockTasks] : getTaskMasterTasks();
    
    // Apply filters
    if (status && status !== 'all') {
        tasks = tasks.filter(task => task.status === status);
    }
    if (agent && agent !== 'all') {
        tasks = tasks.filter(task => task.sourceTag === agent || task.assignedAgent === agent);
    }
    if (priority && priority !== 'all') {
        tasks = tasks.filter(task => task.priority === priority);
    }
    
    // Stats calculation
    const allTasks = source === 'mock' ? mockTasks : getTaskMasterTasks();
    const stats = {
        total: allTasks.length,
        completed: allTasks.filter(t => t.status === 'done' || t.status === 'completed').length,
        inProgress: allTasks.filter(t => t.status === 'in-progress').length,
        pending: allTasks.filter(t => t.status === 'pending').length
    };
    stats.completionPercentage = allTasks.length > 0 ? Math.round((stats.completed / allTasks.length) * 100) : 0;
    
    res.json({
        tasks,
        filter: { status, agent, priority },
        pagination: {
            total: tasks.length,
            page: parseInt(page),
            limit: parseInt(limit)
        },
        stats,
        source: source === 'mock' ? 'mock' : 'taskmaster',
        lastUpdate: new Date().toISOString()
    });
});

app.get('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const task = mockTasks.find(t => t.id === taskId);
    
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
});

app.post('/api/tasks/:id/claim', (req, res) => {
    const taskId = req.params.id;
    const { agentName } = req.body;
    
    if (!agentName) {
        return res.status(400).json({ error: 'Agent name is required' });
    }
    
    const task = mockTasks.find(t => t.id === taskId);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    
    // Update task
    task.status = 'in-progress';
    task.assignedAgent = agentName;
    task.claimedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();
    
    res.json({
        taskId,
        agentName,
        claimedAt: task.claimedAt,
        previousStatus: 'pending',
        newStatus: 'in-progress'
    });
});

app.get('/api/coordination/status', (req, res) => {
    const agentStats = mockAgents.map(agent => ({
        name: agent.name,
        priority: agent.priority,
        taskCount: agent.taskCount,
        completedTasks: agent.completedTasks,
        activeTasks: mockTasks.filter(t => t.sourceTag === agent.name && t.status === 'in-progress').length
    }));
    
    res.json({
        totalAgents: mockAgents.length,
        totalTasks: mockTasks.length,
        activeCoordination: agentStats.filter(a => a.activeTasks > 0).length,
        agentStats,
        lastUpdate: new Date().toISOString()
    });
});

app.get('/api/coordination/priority', (req, res) => {
    const priorityHierarchy = [
        { level: 1, name: 'server-agent', description: 'Highest - Infrastructure & Deployment' },
        { level: 2, name: 'integration-specialist', description: 'High - API & Backend Integration' },
        { level: 3, name: 'ui-developer', description: 'Medium - Frontend Development' },
        { level: 3, name: 'qa-specialist', description: 'Medium - Testing & Validation' }
    ];
    
    res.json({
        hierarchy: priorityHierarchy,
        conflictResolution: 'Higher priority agents take precedence',
        lastUpdate: new Date().toISOString()
    });
});

// Sync Management
app.post('/api/sync/taskmaster', (req, res) => {
    try {
        // Using imported spawn and path functions
        
        console.log('🔄 Starting TaskMaster sync...');
        
        // Run the sync utility
        const syncProcess = spawn('node', ['/mnt/d/Projects/y/apps/taskmaster-ai/taskmaster-sync-utility.js', 'sync'], {
            cwd: '/mnt/d/Projects/y',
            stdio: 'pipe'
        });
        
        let output = '';
        let error = '';
        
        syncProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        syncProcess.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        syncProcess.on('close', (code) => {
            if (code === 0) {
                console.log('✅ TaskMaster sync completed');
                res.json({
                    success: true,
                    message: 'TaskMaster sync completed successfully',
                    output: output,
                    timestamp: new Date().toISOString()
                });
                
                // Note: Server restart would be needed for changes to take effect
                console.log('📝 Note: Server restart required for task data changes to take effect');
            } else {
                console.error('❌ TaskMaster sync failed:', error);
                res.status(500).json({
                    success: false,
                    message: 'TaskMaster sync failed',
                    error: error,
                    output: output,
                    timestamp: new Date().toISOString()
                });
            }
        });
        
    } catch (error) {
        console.error('❌ Sync endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during sync',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.get('/api/sync/status', (req, res) => {
    res.json({
        syncUtilityPath: '/mnt/d/Projects/y/apps/taskmaster-ai/taskmaster-sync-utility.js',
        taskMasterDataPath: '/mnt/d/Projects/claude-project/.taskmaster/tasks/tasks.json',
        lastSyncEndpoint: '/api/sync/taskmaster',
        supportedCommands: ['sync', 'dry-run'],
        timestamp: new Date().toISOString()
    });
});

// TaskMaster API endpoints for dashboard integration
app.get('/api/taskmaster/tags', (req, res) => {
    try {
        const tasksJsonPath = path.join(__dirname, '..', '.taskmaster', 'tasks', 'tasks.json');
        if (!fs.existsSync(tasksJsonPath)) {
            return res.status(404).json({ error: 'TaskMaster data not found' });
        }
        
        const tasksData = JSON.parse(fs.readFileSync(tasksJsonPath, 'utf8'));
        const tags = [];
        
        Object.keys(tasksData).forEach(workspace => {
            if (tasksData[workspace] && tasksData[workspace].tasks) {
                const workspaceTasks = tasksData[workspace].tasks;
                const completedTasks = workspaceTasks.filter(t => t.status === 'done').length;
                
                tags.push({
                    name: workspace,
                    tasks: workspaceTasks.length,
                    completed: completedTasks,
                    description: getWorkspaceDescription(workspace)
                });
            }
        });
        
        res.json(tags);
    } catch (error) {
        console.error('Error fetching TaskMaster tags:', error);
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
});

function getWorkspaceDescription(workspace) {
    const descriptions = {
        'master': 'Main project tasks and coordination',
        'qa-specialist': 'Testing, validation, and quality assurance',
        'ui-developer': 'CSS, HTML, and visual component development',
        'backend-agent': 'Server APIs, databases, and backend logic',
        'integration-specialist': 'API connections and data flow coordination',
        'devops-agent': 'Infrastructure, deployment, and operations',
        'frontend-architect': 'JavaScript architecture and design systems'
    };
    return descriptions[workspace] || `${workspace} tasks`;
}

// POST endpoint for TaskMaster tasks with tag filtering
app.post('/api/taskmaster/tasks', (req, res) => {
    try {
        const { tag, format = 'json', include_subtasks = true } = req.body;
        
        const tasksJsonPath = path.join(__dirname, '..', '.taskmaster', 'tasks', 'tasks.json');
        if (!fs.existsSync(tasksJsonPath)) {
            return res.status(404).json({ error: 'TaskMaster data not found' });
        }
        
        const tasksData = JSON.parse(fs.readFileSync(tasksJsonPath, 'utf8'));
        
        if (tag && !tasksData[tag]) {
            return res.status(404).json({ error: `Tag '${tag}' not found` });
        }
        
        // If specific tag requested, return just that workspace
        if (tag) {
            const workspaceTasks = tasksData[tag].tasks || [];
            const formattedTasks = workspaceTasks.map(task => transformTaskFormat(task, tag, include_subtasks));
            
            res.json({
                tasks: formattedTasks,
                tag: tag,
                total: formattedTasks.length
            });
        } else {
            // Return all tasks from all workspaces
            const allTasks = [];
            Object.keys(tasksData).forEach(workspace => {
                if (tasksData[workspace] && tasksData[workspace].tasks) {
                    tasksData[workspace].tasks.forEach(task => {
                        allTasks.push(transformTaskFormat(task, workspace, include_subtasks));
                    });
                }
            });
            
            res.json({
                tasks: allTasks,
                total: allTasks.length,
                workspaces: Object.keys(tasksData).length
            });
        }
    } catch (error) {
        console.error('Error fetching TaskMaster tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Function to transform TaskMaster format to dashboard format
function transformTaskFormat(task, workspace, includeSubtasks = true) {
    const transformed = {
        id: task.id.toString(),
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dependencies: task.dependencies || [],
        sourceTag: workspace,
        assignedAgent: workspace,
        complexityScore: task.complexityScore || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Transform subtasks to match dashboard format
    if (includeSubtasks && task.subtasks && task.subtasks.length > 0) {
        transformed.subtasks = task.subtasks.map(subtask => ({
            id: `${task.id}.${subtask.id}`,
            title: subtask.title,
            description: subtask.description || '',
            status: subtask.status,
            assignedAgent: workspace,
            updates: [] // Dashboard expects this field
        }));
    } else {
        transformed.subtasks = [];
    }
    
    return transformed;
}

// Agent registration endpoints
app.post('/api/agents/register', (req, res) => {
    try {
        const agentData = req.body;
        const agent = agentStorage.registerAgent(agentData);
        
        res.json({
            success: true,
            agent: agent,
            message: `Agent ${agent.id} registered successfully`
        });
    } catch (error) {
        console.error('Error registering agent:', error);
        res.status(400).json({ error: error.message });
    }
});

// Agent status endpoints
app.get('/api/taskmaster/agents/status', (req, res) => {
    try {
        const activeAgents = agentStorage.getActiveAgents();
        const summary = agentStorage.getDashboardSummary();
        
        res.json({
            agents: activeAgents,
            total: summary.total,
            active: summary.active,
            offline: summary.offline,
            byStatus: summary.byStatus,
            byRole: summary.byRole,
            metrics: summary.metrics,
            lastUpdated: summary.lastUpdated
        });
    } catch (error) {
        console.error('Error fetching agent status:', error);
        res.status(500).json({ error: 'Failed to fetch agent status' });
    }
});

// Update agent status
app.put('/api/agents/:id/status', (req, res) => {
    try {
        const agentId = req.params.id;
        const statusUpdate = req.body;
        
        const agent = agentStorage.updateAgentStatus(agentId, statusUpdate);
        
        res.json({
            success: true,
            agent: agent,
            updatedAt: agent.lastHeartbeat
        });
    } catch (error) {
        console.error('Error updating agent status:', error);
        res.status(400).json({ error: error.message });
    }
});

// Agent heartbeat endpoint
app.post('/api/agents/:id/heartbeat', (req, res) => {
    try {
        const agentId = req.params.id;
        const result = agentStorage.heartbeat(agentId);
        
        res.json({
            success: true,
            agentId: agentId,
            timestamp: result.timestamp
        });
    } catch (error) {
        console.error('Error updating heartbeat:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get specific agent details
app.get('/api/agents/:id', (req, res) => {
    try {
        const agentId = req.params.id;
        const agent = agentStorage.getAgent(agentId);
        
        res.json({
            success: true,
            agent: agent
        });
    } catch (error) {
        console.error('Error fetching agent:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get agents by role
app.get('/api/agents/role/:role', (req, res) => {
    try {
        const role = req.params.role;
        const agents = agentStorage.getAgentsByRole(role);
        
        res.json({
            success: true,
            role: role,
            agents: agents,
            count: agents.length
        });
    } catch (error) {
        console.error('Error fetching agents by role:', error);
        res.status(500).json({ error: 'Failed to fetch agents by role' });
    }
});

// Get agents by status
app.get('/api/agents/status/:status', (req, res) => {
    try {
        const status = req.params.status;
        const agents = agentStorage.getAgentsByStatus(status);
        
        res.json({
            success: true,
            status: status,
            agents: agents,
            count: agents.length
        });
    } catch (error) {
        console.error('Error fetching agents by status:', error);
        res.status(500).json({ error: 'Failed to fetch agents by status' });
    }
});

// Remove agent
app.delete('/api/agents/:id', (req, res) => {
    try {
        const agentId = req.params.id;
        agentStorage.removeAgent(agentId);
        
        res.json({
            success: true,
            message: `Agent ${agentId} removed successfully`
        });
    } catch (error) {
        console.error('Error removing agent:', error);
        res.status(400).json({ error: error.message });
    }
});

// Agent dashboard summary
app.get('/api/agents/dashboard/summary', (req, res) => {
    try {
        const summary = agentStorage.getDashboardSummary();
        res.json(summary);
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard summary' });
    }
});

// TaskMaster command execution endpoints
app.post('/api/taskmaster/update-task', (req, res) => {
    try {
        const { taskId, prompt, ...updateData } = req.body;
        
        if (!taskId || !prompt) {
            return res.status(400).json({ error: 'taskId and prompt are required' });
        }
        
        // In a real implementation, this would execute: task-master update-task --id={taskId} --prompt="{prompt}"
        console.log(`TaskMaster update-task: ${taskId} - ${prompt}`);
        
        res.json({
            success: true,
            taskId: taskId,
            message: 'Task updated successfully',
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating task via TaskMaster:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

app.post('/api/taskmaster/use-tag', (req, res) => {
    try {
        const { tagName } = req.body;
        
        if (!tagName) {
            return res.status(400).json({ error: 'tagName is required' });
        }
        
        // In a real implementation, this would execute: task-master use-tag {tagName}
        console.log(`TaskMaster use-tag: ${tagName}`);
        
        res.json({
            success: true,
            tagName: tagName,
            message: `Switched to tag context: ${tagName}`,
            switchedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error switching TaskMaster tag:', error);
        res.status(500).json({ error: 'Failed to switch tag' });
    }
});

// Enhanced sync dashboard endpoint
app.get('/api/sync/dashboard', (req, res) => {
    // Using imported fs module
    const tasksJsonPath = '/mnt/d/Projects/claude-project/.taskmaster/tasks/tasks.json';
    
    let syncStatus = {
        status: 'active',
        autoSyncEnabled: true,
        lastSync: new Date().toISOString(),
        tasksCount: 0,
        tasksFile: tasksJsonPath,
        syncUtilityPath: '/mnt/d/Projects/y/apps/taskmaster-ai/taskmaster-sync-utility.js',
        watcherStatus: 'unknown'
    };
    
    try {
        // Check if TaskMaster data exists and get task count
        if (fs.existsSync(tasksJsonPath)) {
            const tasksData = JSON.parse(fs.readFileSync(tasksJsonPath, 'utf8'));
            let totalTasks = 0;
            
            for (const [tagName, tagData] of Object.entries(tasksData)) {
                if (tagData.tasks && Array.isArray(tagData.tasks)) {
                    totalTasks += tagData.tasks.length;
                }
            }
            
            syncStatus.tasksCount = totalTasks;
            syncStatus.tags = Object.keys(tasksData);
            syncStatus.taskMasterFile = 'accessible';
            
            // Get file modification time as last sync indicator
            const stats = fs.statSync(tasksJsonPath);
            syncStatus.lastModified = stats.mtime.toISOString();
        } else {
            syncStatus.taskMasterFile = 'not_found';
            syncStatus.status = 'error';
        }
        
        // Check if mock tasks exist in current server
        syncStatus.mockTasksCount = mockTasks.length;
        
        syncStatus.integration = {
            mockToTaskMaster: syncStatus.tasksCount > 0 ? 'available' : 'pending',
            realTimeSync: 'configurable',
            backupSystem: 'active'
        };
        
    } catch (error) {
        syncStatus.status = 'error';
        syncStatus.error = error.message;
    }
    
    res.json(syncStatus);
});

// Dashboard routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'taskmaster-dashboard.html'));
});

app.get('/old', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/agent', (req, res) => {
    res.sendFile(path.join(__dirname, 'agent-dashboard.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ TaskMaster Dashboard API running on port ${PORT}`);
    console.log(`🌐 API: http://localhost:${PORT}/api`);
    console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
    console.log(`👥 Agents: http://localhost:${PORT}/api/agents`);
    console.log(`📋 Tasks: http://localhost:${PORT}/api/tasks`);
});