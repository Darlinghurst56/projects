// Test file in CommonJS format (before migration)
const fs = require('fs');
const path = require('path');

const utility = {
    readConfig: function(configPath) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    },
    
    formatMessage: function(msg) {
        return `[TaskMaster] ${msg}`;
    }
};

module.exports = utility;