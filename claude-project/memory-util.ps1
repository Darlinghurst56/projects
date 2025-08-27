# Claude Memory Utility Script
# This script helps manage Claude's memory

param(
    [Parameter(Mandatory = False)]
    [ValidateSet('save', 'load', 'list')]
    [string]  = 'list',
    
    [Parameter(Mandatory = False)]
    [string] ,
    
    [Parameter(Mandatory = False)]
    [string] ,
    
    [Parameter(Mandatory = False)]
    [string] 
)

# Memory directory
 = "D:\Projects\claude-project\memory"
 = "\project-memory.json"

# Ensure memory directory exists
if (-not (Test-Path )) {
    New-Item -ItemType Directory -Path  -Force | Out-Null
}

# Initialize or load the memory file
if (-not (Test-Path )) {
     = @{
        projects = @{}
        mcp_servers = @{}
        general = @{}
    }
} else {
     = Get-Content -Path  | ConvertFrom-Json
    # Convert to PSObject if needed
    if (-not .projects) {
         = @{
            projects = @{}
            mcp_servers = @{}
            general = @{}
        }
    }
}

# Function to save memory
function Save-Memory {
     | ConvertTo-Json -Depth 10 | Set-Content -Path 
    Write-Host "Memory saved to " -ForegroundColor Green
}

# Process based on action
switch () {
    'list' {
        Write-Host "Claude Memory Contents:" -ForegroundColor Cyan
        
        Write-Host "
Projects:" -ForegroundColor Yellow
        if (.projects.PSObject.Properties.Count -eq 0) {
            Write-Host "  No projects in memory" -ForegroundColor Gray
        } else {
            foreach ( in .projects.PSObject.Properties) {
                Write-Host "  : " -ForegroundColor White
            }
        }
        
        Write-Host "
MCP Servers:" -ForegroundColor Yellow
        if (.mcp_servers.PSObject.Properties.Count -eq 0) {
            Write-Host "  No MCP servers in memory" -ForegroundColor Gray
        } else {
            foreach ( in .mcp_servers.PSObject.Properties) {
                Write-Host "  : " -ForegroundColor White
            }
        }
        
        Write-Host "
General Memory:" -ForegroundColor Yellow
        if (.general.PSObject.Properties.Count -eq 0) {
            Write-Host "  No general memory items" -ForegroundColor Gray
        } else {
            foreach ( in .general.PSObject.Properties) {
                Write-Host "  : " -ForegroundColor White
            }
        }
    }
    
    'save' {
        if (-not ) {
            Write-Host "Error: Key is required for save action" -ForegroundColor Red
            exit 1
        }
        
        if (-not ) {
            Write-Host "Error: Value is required for save action" -ForegroundColor Red
            exit 1
        }
        
        if () {
            # Save to a project
            if (-not .projects.) {
                .projects | Add-Member -NotePropertyName  -NotePropertyValue @{}
            }
            .projects. | Add-Member -NotePropertyName  -NotePropertyValue  -Force
            Write-Host "Saved '' to project ''" -ForegroundColor Green
        } else {
            # Save to general memory
            .general | Add-Member -NotePropertyName  -NotePropertyValue  -Force
            Write-Host "Saved '' to general memory" -ForegroundColor Green
        }
        
        Save-Memory
    }
    
    'load' {
        if (-not ) {
            Write-Host "Error: Key is required for load action" -ForegroundColor Red
            exit 1
        }
        
        if () {
            # Load from a project
            if (-not .projects.) {
                Write-Host "Error: Project '' not found in memory" -ForegroundColor Red
                exit 1
            }
            
            if (-not .projects..) {
                Write-Host "Error: Key '' not found in project ''" -ForegroundColor Red
                exit 1
            }
            
            Write-Host "Value for '' in project '':" -ForegroundColor Cyan
            Write-Host .projects.. -ForegroundColor White
        } else {
            # Load from general memory
            if (-not .general.) {
                Write-Host "Error: Key '' not found in general memory" -ForegroundColor Red
                exit 1
            }
            
            Write-Host "Value for '' in general memory:" -ForegroundColor Cyan
            Write-Host .general. -ForegroundColor White
        }
    }
}
