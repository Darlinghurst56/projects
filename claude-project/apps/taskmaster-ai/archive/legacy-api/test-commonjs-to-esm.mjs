// Same file migrated to ES modules format
import fs from 'fs';
import path from 'path';

const utility = {
    readConfig: function(configPath) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    },
    
    formatMessage: function(msg) {
        return `[TaskMaster] ${msg}`;
    }
};

export default utility;

// Or with named exports:
export const readConfig = utility.readConfig;
export const formatMessage = utility.formatMessage;