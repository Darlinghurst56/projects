/**
 * Manual Description Patch for Device Dashboard
 * 
 * This patch adds the ability to manually edit device descriptions
 * with inline editing functionality in the web interface.
 */

// Add to handleRequest method - new API endpoint
const handleDescriptionUpdate = (req, res, deviceMapper) => {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const { ip, description } = JSON.parse(body);
                
                if (!ip || description === undefined) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'IP and description are required' }));
                    return;
                }
                
                // Update device description
                if (deviceMapper.devices.has(ip)) {
                    const device = deviceMapper.devices.get(ip);
                    device.manualDescription = description;
                    device.isManualDescription = description.trim() !== '';
                    
                    // Save immediately
                    deviceMapper.saveDeviceMap();
                    
                    console.log(`📝 Updated description for ${ip}: "${description}"`);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'Description updated successfully',
                        device: {
                            ip: device.ip,
                            manualDescription: device.manualDescription,
                            isManualDescription: device.isManualDescription
                        }
                    }));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Device not found' }));
                }
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON data' }));
            }
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
};

// Enhanced HTML generation with inline editing
const generateDeviceRowWithEditing = (device) => {
    const displayName = device.isManualDescription && device.manualDescription 
        ? device.manualDescription 
        : (device.hostname !== 'Unknown' ? device.hostname : 'Click to name device');
    
    const nameClass = device.isManualDescription ? 'manual-name' : 'auto-name';
    const isClickable = !device.isManualDescription || device.manualDescription.trim() === '';
    
    return `
    <div class="device-row">
        <div>
            <span class="status-indicator ${device.isActive ? 'active-status' : 'inactive-status'}"></span>
            ${device.isActive ? 'Active' : 'Inactive'}
        </div>
        <div class="device-ip">${device.ip}</div>
        <div class="device-type">${getDeviceIcon(device.deviceType)} ${device.deviceType}</div>
        <div class="device-hostname editable-field ${nameClass}" 
             data-ip="${device.ip}" 
             data-field="description"
             title="${isClickable ? 'Click to edit device name' : 'Click to edit: ' + displayName}">
            ${displayName}
        </div>
        <div class="device-domain" title="${device.lastDomain}">
            ${device.lastDomain ? device.lastDomain.substring(0, 30) + (device.lastDomain.length > 30 ? '...' : '') : 'None'}
        </div>
        <div class="device-time">${device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}</div>
    </div>`;
};

// CSS and JavaScript for inline editing
const getInlineEditingStyles = () => `
<style>
    .editable-field {
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.2s;
        min-width: 120px;
        display: inline-block;
    }
    
    .editable-field:hover {
        background-color: #374151;
        color: #fff;
    }
    
    .editable-field.editing {
        background-color: #1f2937;
        border: 2px solid #60a5fa;
    }
    
    .manual-name {
        color: #10b981;
        font-weight: 500;
    }
    
    .auto-name {
        color: #9ca3af;
        font-style: italic;
    }
    
    .edit-input {
        background: #1f2937;
        border: 2px solid #60a5fa;
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        font-family: inherit;
        font-size: inherit;
        width: 200px;
    }
    
    .edit-buttons {
        margin-left: 8px;
    }
    
    .btn {
        background: #60a5fa;
        color: white;
        border: none;
        padding: 2px 8px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
        margin: 0 2px;
    }
    
    .btn:hover {
        background: #3b82f6;
    }
    
    .btn.cancel {
        background: #6b7280;
    }
    
    .btn.cancel:hover {
        background: #4b5563;
    }
</style>`;

const getInlineEditingScript = () => `
<script>
    let currentlyEditing = null;
    
    function makeEditable() {
        document.querySelectorAll('.editable-field').forEach(field => {
            field.addEventListener('click', function(e) {
                if (currentlyEditing && currentlyEditing !== this) {
                    cancelEdit(currentlyEditing);
                }
                startEdit(this);
            });
        });
    }
    
    function startEdit(element) {
        if (currentlyEditing === element) return;
        
        currentlyEditing = element;
        const currentValue = element.dataset.field === 'description' 
            ? (element.textContent === 'Click to name device' ? '' : element.textContent.trim())
            : element.textContent.trim();
        
        const ip = element.dataset.ip;
        
        // Create input
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = currentValue;
        input.placeholder = 'Enter device name...';
        
        // Create buttons
        const buttonContainer = document.createElement('span');
        buttonContainer.className = 'edit-buttons';
        
        const saveBtn = document.createElement('button');
        saveBtn.textContent = '✓';
        saveBtn.className = 'btn save';
        saveBtn.title = 'Save';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '✕';
        cancelBtn.className = 'btn cancel';
        cancelBtn.title = 'Cancel';
        
        buttonContainer.appendChild(saveBtn);
        buttonContainer.appendChild(cancelBtn);
        
        // Replace content
        element.innerHTML = '';
        element.appendChild(input);
        element.appendChild(buttonContainer);
        element.classList.add('editing');
        
        // Focus input
        input.focus();
        input.select();
        
        // Event handlers
        const save = () => saveEdit(element, ip, input.value);
        const cancel = () => cancelEdit(element);
        
        saveBtn.addEventListener('click', save);
        cancelBtn.addEventListener('click', cancel);
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                save();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
            }
        });
        
        input.addEventListener('blur', function(e) {
            // Don't auto-save on blur if clicking buttons
            if (!e.relatedTarget || (!e.relatedTarget.classList.contains('btn'))) {
                setTimeout(() => {
                    if (currentlyEditing === element) {
                        save();
                    }
                }, 100);
            }
        });
    }
    
    function saveEdit(element, ip, newValue) {
        const trimmedValue = newValue.trim();
        
        // Save to server
        fetch('/api/update-description', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ip: ip,
                description: trimmedValue
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update display
                const displayValue = trimmedValue || 'Click to name device';
                element.innerHTML = displayValue;
                element.classList.remove('editing');
                
                // Update styling
                if (trimmedValue) {
                    element.classList.remove('auto-name');
                    element.classList.add('manual-name');
                    element.title = 'Click to edit: ' + trimmedValue;
                } else {
                    element.classList.remove('manual-name');
                    element.classList.add('auto-name');
                    element.title = 'Click to edit device name';
                }
                
                currentlyEditing = null;
                console.log('Description updated successfully');
            } else {
                alert('Failed to update description: ' + (data.error || 'Unknown error'));
                cancelEdit(element);
            }
        })
        .catch(error => {
            console.error('Error updating description:', error);
            alert('Failed to update description. Please try again.');
            cancelEdit(element);
        });
    }
    
    function cancelEdit(element) {
        // Restore original content
        const ip = element.dataset.ip;
        // You'd need to store original values or refresh
        location.reload(); // Simple approach - refresh to get original values
    }
    
    // Initialize editing when page loads
    window.addEventListener('load', function() {
        makeEditable();
        
        // Re-initialize after auto-refresh
        const originalOnLoad = window.onload;
        window.onload = function() {
            if (originalOnLoad) originalOnLoad();
            setTimeout(makeEditable, 500);
        };
    });
</script>`;

module.exports = {
    handleDescriptionUpdate,
    generateDeviceRowWithEditing,
    getInlineEditingStyles,
    getInlineEditingScript
};