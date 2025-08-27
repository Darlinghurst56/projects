# Claude Desktop Configuration Update Script
# This script updates the Claude Desktop configuration to use the MCP servers

# Claude Desktop configuration path
 = "C:\Users\cjwhi\AppData\Roaming\Claude\claude_desktop_config.json"

if (-not (Test-Path )) {
    Write-Host "Claude Desktop configuration not found at " -ForegroundColor Red
    Write-Host "Please install Claude Desktop or correct the path." -ForegroundColor Red
    exit 1
}

# Backup the current configuration
 = ".backup.20250625-093447"
Copy-Item -Path  -Destination 
Write-Host "Backed up current configuration to " -ForegroundColor Green

# Read the current configuration
 = Get-Content -Path  | ConvertFrom-Json

# Update the MCP servers configuration
 = @{}

# Add Browser MCP
.browsermcp = @{
    command = "C:\Program Files\Development\Nodejs\npx.cmd"
    args = @("@browsermcp/mcp@latest")
}

# Add Memory MCP
.memory = @{
    command = "C:\Program Files\Development\Nodejs\npx.cmd"
    args = @("@modelcontextprotocol/server-memory", "--storage", "D:\Projects\claude-project\memory")
}

# Add Filesystem MCP
.filesystem = @{
    command = "C:\Program Files\Development\Nodejs\npx.cmd"
    args = @("@modelcontextprotocol/server-filesystem", "--root", "D:\Projects\claude-project")
}

# Add Sequential Thinking MCP
.sequential = @{
    command = "C:\Program Files\Development\Nodejs\npx.cmd"
    args = @("@modelcontextprotocol/server-sequential-thinking")
}

# Update the configuration
.mcpServers = 

# Save the updated configuration
$config | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath
Write-Host "Updated Claude Desktop configuration at " -ForegroundColor Green

Write-Host "
Configuration complete!" -ForegroundColor Green
Write-Host "You can now start the MCP servers using the start-mcps.ps1 script." -ForegroundColor Green
Write-Host "After starting the servers, launch Claude Desktop to connect to them." -ForegroundColor Green
