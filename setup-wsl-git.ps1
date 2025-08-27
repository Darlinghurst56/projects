# PowerShell script for WSL Git access to CrewAI repositories

Write-Host "Setting up WSL Git access for CrewAI repositories..." -ForegroundColor Green

# Add safe directories for git
git config --global --add safe.directory '//wsl$/Ubuntu/home/darlinghurstlinux/projects/crewai'
git config --global --add safe.directory '//wsl$/Ubuntu/home/darlinghurstlinux/projects/crewai-studio/CrewAI-Studio'

Write-Host "Git safe directories configured successfully!" -ForegroundColor Green
Write-Host ""

# Create aliases for easy navigation
function Set-CrewAIWSLPaths {
    Write-Host "Available WSL paths:" -ForegroundColor Yellow
    Write-Host "  cd \\wsl$\Ubuntu\home\darlinghurstlinux\projects\crewai" -ForegroundColor Cyan
    Write-Host "  cd \\wsl$\Ubuntu\home\darlinghurstlinux\projects\crewai-studio\CrewAI-Studio" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Quick commands:" -ForegroundColor Yellow
    Write-Host "  wsl -d Ubuntu -e bash -c 'cd /home/darlinghurstlinux/projects/crewai && git status'" -ForegroundColor Cyan
    Write-Host "  wsl -d Ubuntu -e bash -c 'cd /home/darlinghurstlinux/projects/crewai-studio/CrewAI-Studio && git status'" -ForegroundColor Cyan
}

Set-CrewAIWSLPaths 