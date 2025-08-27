# MCP Startup Script
# This script starts all the necessary MCP servers for Claude

# Function to check if a port is in use
function Test-PortInUse {
    param(
        [int] $Port
    )
    $result = netstat -ano | Select-String -Pattern ":$Port " | Measure-Object
    return $result.Count -gt 0
}

# Function to start an MCP server
function Start-MCPServer {
    param(
        [string] $Name,
        [string] $Command,
        [array] $Arguments,
        [int] $Port,
        [string] $WorkingDirectory = "D:\Projects\claude-project"
    )
    
    if (Test-PortInUse -Port $Port) {
        Write-Host "$Name MCP server appears to be running on port $Port already." -ForegroundColor Yellow
        return
    }
    
    Write-Host "Starting $Name MCP server on port $Port..." -ForegroundColor Cyan
    
    # Start the process in a new window
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = $Command
    $processInfo.Arguments = $Arguments -join " "
    $processInfo.WorkingDirectory = $WorkingDirectory
    $processInfo.UseShellExecute = True
    $processInfo.WindowStyle = 'Normal'
    $processInfo.CreateNoWindow = False
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo
    $process.Start() | Out-Null
    
    Write-Host "$Name MCP server started with PID: $($process.Id)" -ForegroundColor Green
}

# Create Claude MCP directory if it doesn't exist
$claudeDir = "D:\Projects\claude-project"
if (-not (Test-Path $claudeDir)) {
    New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
}

# Start Browser MCP (port 1337)
Start-MCPServer -Name "Browser" -Command "C:\Program Files\Development\Nodejs\npx.cmd" -Arguments @("@browsermcp/mcp@latest") -Port 1337

# Start Memory MCP (port 3000)
Start-MCPServer -Name "Memory" -Command "C:\Program Files\Development\Nodejs\npx.cmd" -Arguments @("@modelcontextprotocol/server-memory", "--storage", "$claudeDir\memory") -Port 3000

# Start Filesystem MCP (port 3001)
Start-MCPServer -Name "Filesystem" -Command "C:\Program Files\Development\Nodejs\npx.cmd" -Arguments @("@modelcontextprotocol/server-filesystem", "--root", "$claudeDir") -Port 3001

# Start Sequential Thinking MCP (port 3002)
Start-MCPServer -Name "Sequential Thinking" -Command "C:\Program Files\Development\Nodejs\npx.cmd" -Arguments @("@modelcontextprotocol/server-sequential-thinking") -Port 3002

Write-Host "`nAll MCP servers have been started." -ForegroundColor Green
Write-Host "You can now connect Claude to these servers." -ForegroundColor Green
Write-Host "`nTo verify the servers are running, you can check for listening ports:" -ForegroundColor Yellow
Write-Host "netstat -ano | findstr ':1337 :3000 :3001 :3002'" -ForegroundColor Yellow
