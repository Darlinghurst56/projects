# Gmail-Telegram n8n Integration

This project implements Gmail email management through Telegram bot commands using n8n workflows.

## Overview

- **n8n Instance**: Running at `192.168.1.74:5678` via Docker
- **Purpose**: Enable email operations (send, read, search, archive) through Telegram bot commands
- **Architecture**: n8n workflows connecting Gmail API with Telegram Bot API

## Setup Requirements

### 1. n8n Instance Setup ✅
- n8n is already running via Docker on port 5678
- Connected to PostgreSQL database
- Demo data and shared volumes configured

### 2. Required Nodes
- Gmail node (for email operations)
- Telegram Bot node (for bot commands)
- HTTP Request node (for API calls)
- Set node (for data transformation)
- IF node (for conditional logic)

### 3. Credentials Needed
- Gmail OAuth2 credentials (Google Cloud Console)
- Telegram Bot token (BotFather)

## Workflows to Implement

### 1. Send Email via Telegram (`workflow-send-email.json`)
**Trigger**: Telegram command `/send_email`
**Flow**: Telegram → Parse Command → Gmail Send → Response

### 2. Read Emails via Telegram (`workflow-read-emails.json`)
**Trigger**: Telegram command `/read_emails`
**Flow**: Telegram → Gmail List → Format → Response

### 3. Search Emails via Telegram (`workflow-search-emails.json`)
**Trigger**: Telegram command `/search_email`
**Flow**: Telegram → Parse Query → Gmail Search → Response

### 4. Archive Emails via Telegram (`workflow-archive-emails.json`)
**Trigger**: Telegram command `/archive_email`
**Flow**: Telegram → Parse ID → Gmail Archive → Response

## Implementation Status

- [x] n8n instance identified and accessible
- [x] Project structure created
- [ ] Gmail OAuth2 setup
- [ ] Telegram Bot creation
- [ ] Workflow implementation
- [ ] Testing and validation

## Next Steps

1. Configure Gmail API credentials
2. Create Telegram bot and get token
3. Import workflow templates into n8n
4. Test each workflow functionality
5. Implement error handling and validation

## Files Structure

```
gmail-telegram-n8n/
├── README.md
├── workflows/
│   ├── send-email-workflow.json
│   ├── read-emails-workflow.json
│   ├── search-emails-workflow.json
│   └── archive-emails-workflow.json
├── docs/
│   ├── gmail-setup.md
│   ├── telegram-setup.md
│   └── deployment-guide.md
└── tests/
    └── workflow-tests.md
```