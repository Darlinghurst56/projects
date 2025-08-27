const fs = require('fs');
const path = require('path');

// Task 24 definition
const task24 = {
  "id": 24,
  "title": "Integrate Dashy Personal Dashboard (Latest Release 3.1.1)",
  "description": "Integrate Dashy 3.1.1 - a mature, self-hostable personal dashboard with 50+ pre-built widgets, themes, and real API integrations as the core single-user interface, leveraging existing MCP testing infrastructure.\n\nPROJECT: House AI - Single User Home Page | SUBPROJECT: MVP Dashboard Integration",
  "status": "pending",
  "dependencies": [18, 19, 21],
  "priority": "high",
  "details": "1. **Quick MVP Setup Using Existing Solution:**\n   - Deploy Dashy via Docker one-click setup with YAML-based configuration\n   - No custom development required - use proven open-source solution\n   - Leverage 50+ pre-built widgets for status-checking, real-time data\n   - Single YAML config file for entire dashboard setup\n\n2. **Real API Integration (No Mock Data):**\n   - Use Dashy's built-in status checking with real endpoints\n   - Configure existing widgets for real services\n   - Dynamic content from any API-enabled service\n\n3. **MCP Testing Integration:**\n   - Use existing Playwright MCP from Task 23 to test Dashy deployment\n   - Apply Accessibility Testing MCP from Task 18 to validate WCAG compliance\n   - Leverage Design System validation from Task 21 for theme consistency\n\n4. **Zero Custom Code Approach:**\n   - Configure through UI editor or single YAML file\n   - Use existing Dashy themes and layouts\n   - Focus on configuration over implementation",
  "testStrategy": "1. **Docker Deployment Validation:**\n   - Deploy Dashy to http://localhost:3001 using official Docker image\n   - Test YAML configuration loading and UI responsiveness\n   - Validate all 50+ built-in widgets with real data sources\n\n2. **Real API Testing:**\n   - Configure OpenWeather API with actual API key\n   - Test system monitoring widgets with real server data\n   - Validate network status checks with actual ping results\n\n3. **MCP Integration Testing:**\n   - Run Playwright MCP tests on Dashy interface\n   - Apply accessibility tests to ensure single-user optimized experience\n   - Test responsive design across device sizes using existing validation",
  "subtasks": []
};

const tasksFilePath = 'D:\\Projects\\y\\claude-project\\apps\\taskmaster-ai\\.taskmaster\\tasks\\tasks.json';

try {
  console.log('Reading tasks.json...');
  const tasksContent = fs.readFileSync(tasksFilePath, 'utf8');
  
  console.log('Parsing JSON...');
  const tasksData = JSON.parse(tasksContent);
  
  console.log('Current structure keys:', Object.keys(tasksData));
  
  if (tasksData.master && tasksData.master.tasks) {
    console.log('Current number of tasks:', tasksData.master.tasks.length);
    
    // Check if task 24 already exists
    const existingTask = tasksData.master.tasks.find(t => t.id === 24);
    if (existingTask) {
      console.log('Task 24 already exists, updating...');
      const index = tasksData.master.tasks.findIndex(t => t.id === 24);
      tasksData.master.tasks[index] = task24;
    } else {
      console.log('Adding new Task 24...');
      tasksData.master.tasks.push(task24);
    }
    
    // Create backup first
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = tasksFilePath.replace('.json', `-backup-${timestamp}.json`);
    fs.writeFileSync(backupPath, tasksContent);
    console.log('Backup created:', backupPath);
    
    // Write updated content
    console.log('Writing updated tasks.json...');
    fs.writeFileSync(tasksFilePath, JSON.stringify(tasksData, null, 2));
    
    console.log('✅ SUCCESS: Task 24 added to tasks.json');
    console.log('New number of tasks:', tasksData.master.tasks.length);
    
  } else {
    console.log('❌ ERROR: Could not find master.tasks array');
    console.log('Available keys:', Object.keys(tasksData));
  }
  
} catch (error) {
  console.error('❌ ERROR:', error.message);
  console.error(error.stack);
}
