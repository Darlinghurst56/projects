#!/bin/bash

# Setup script for WSL Git access to CrewAI repositories
# This script configures git to trust the WSL directories

echo "Setting up WSL Git access for CrewAI repositories..."

# Add safe directories for git
git config --global --add safe.directory '//wsl$/Ubuntu/home/darlinghurstlinux/projects/crewai'
git config --global --add safe.directory '//wsl$/Ubuntu/home/darlinghurstlinux/projects/crewai-studio/CrewAI-Studio'

echo "Git safe directories configured successfully!"
echo ""
echo "You can now use git commands directly in PowerShell with WSL paths:"
echo "  cd \\\\wsl\$\\Ubuntu\\home\\darlinghurstlinux\\projects\\crewai"
echo "  git status"
echo ""
echo "Or use WSL directly:"
echo "  wsl -d Ubuntu -e bash -c \"cd /home/darlinghurstlinux/projects/crewai && git status\"" 