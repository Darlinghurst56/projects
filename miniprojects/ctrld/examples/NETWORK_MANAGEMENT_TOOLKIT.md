# 🛠️ Network Management Toolkit & Trending Tools 2025

## Overview
Advanced tools and scripts for network configuration management, DNS automation, and homelab infrastructure control.

---

## 🔥 **Trending DNS & Network Management Tools 2025**

### 1. **DNSControl** ⭐ RECOMMENDED
**GitHub**: https://github.com/DNSControl/DNSControl  
**Type**: Infrastructure-as-Code for DNS  
**Language**: Go (Configuration in JavaScript)

#### Features:
- ✅ Manage DNS across multiple providers (Cloudflare, Route53, etc.)
- ✅ Version control DNS records with Git
- ✅ CI/CD pipeline integration
- ✅ SPF record optimization
- ✅ Cross-platform (Windows, Linux, macOS)

#### Installation:
```bash
# Install via Go
go install github.com/DNSControl/DNSControl/v4@latest

# Or download binary
wget https://github.com/DNSControl/DNSControl/releases/latest/download/dnscontrol-linux-amd64.tar.gz
```

#### Configuration Example:
```javascript
// dnsconfig.js
var REG_NONE = NewRegistrar("none");
var DSP_CLOUDFLARE = NewDnsProvider("cloudflare");

D("example.com", REG_NONE, DnsProvider(DSP_CLOUDFLARE),
    A("@", "192.168.1.74"),
    A("dns", "192.168.1.74"),
    CNAME("www", "@"),
    MX("@", 10, "mail.example.com.")
);
```

#### Integration with Control D:
```javascript
// DNS setup for Control D ctrld server
D("home.local", REG_NONE, DnsProvider(DSP_LOCAL),
    A("dns", "192.168.1.74"),
    A("router", "192.168.1.1"),
    A("server", "192.168.1.74"),
    // Control D filtering via ctrld
    NS("filtered", "dns.home.local.")
);
```

---

### 2. **Terraform + DNS Providers** ⭐ ENTERPRISE GRADE
**Type**: Infrastructure as Code  
**Best for**: Multi-cloud DNS management

#### Providers:
- `hashicorp/dns` - Generic DNS provider
- `cloudflare/cloudflare` - Cloudflare integration  
- `hashicorp/aws` - Route53 management

#### Example Configuration:
```hcl
# terraform/dns.tf
provider "dns" {
  update {
    server = "192.168.1.74"
  }
}

resource "dns_a_record_set" "home_server" {
  zone = "home.local."
  name = "server"
  addresses = ["192.168.1.74"]
  ttl = 300
}

resource "dns_cname_record" "dns_server" {
  zone  = "home.local."
  name  = "dns"
  cname = "server.home.local."
  ttl   = 300
}
```

#### Integration with ctrld:
```hcl
# Deploy ctrld configuration
resource "local_file" "ctrld_config" {
  content = templatefile("ctrld.toml.tpl", {
    resolver_id = "1o6nbq1u58h"
    listen_ip   = "192.168.1.74"
  })
  filename = "/etc/controld/ctrld.toml"
}

resource "null_resource" "ctrld_restart" {
  depends_on = [local_file.ctrld_config]
  
  provisioner "local-exec" {
    command = "sudo ctrld reload"
  }
}
```

---

### 3. **PowerShell DSC (Desired State Configuration)**
**Type**: Windows-native configuration management  
**Best for**: Windows network environments

#### Network Module Installation:
```powershell
Install-Module -Name NetworkingDsc -Force
Install-Module -Name DnsServerDsc -Force
Install-Module -Name xNetworking -Force
```

#### DSC Configuration:
```powershell
Configuration NetworkConfig {
    Import-DscResource -ModuleName PSDesiredStateConfiguration
    Import-DscResource -ModuleName NetworkingDsc
    
    Node "localhost" {
        DnsServerAddress DNSServer {
            InterfaceAlias = "Ethernet"
            AddressFamily = "IPv4"
            Address = "192.168.1.74", "8.8.8.8"
        }
        
        NetIPInterface DisableDhcp {
            InterfaceAlias = "Ethernet"
            AddressFamily = "IPv4"
            Dhcp = "Disabled"
        }
    }
}

# Apply configuration
NetworkConfig
Start-DscConfiguration -Path .\NetworkConfig -Wait -Verbose
```

---

### 4. **Ansible Network Modules** ⭐ POPULAR
**Type**: Agentless automation  
**Best for**: Multi-vendor network management

#### Installation:
```bash
pip install ansible
ansible-galaxy collection install ansible.netcommon
ansible-galaxy collection install community.dns
```

#### Playbook Example:
```yaml
# network-setup.yml
---
- name: Configure Network DNS
  hosts: localhost
  become: yes
  
  tasks:
    - name: Configure DNS servers
      community.dns.dns_record:
        zone: "home.local"
        record: "server"
        type: "A"
        value: "192.168.1.74"
        ttl: 300
    
    - name: Start ctrld service
      systemd:
        name: ctrld
        state: started
        enabled: yes
    
    - name: Configure Windows port forwarding
      win_shell: |
        netsh interface portproxy add v4tov4 listenport=53 listenaddress=192.168.1.74 connectport=53 connectaddress=172.22.150.21 protocol=udp
      when: ansible_os_family == "Windows"
```

---

### 5. **Python Network Automation Libraries**

#### **Napalm** - Multi-vendor support
```python
from napalm import get_network_driver
import json

# Connect to device
driver = get_network_driver('eos')  # or 'ios', 'junos', etc.
device = driver('192.168.1.1', 'admin', 'password')
device.open()

# Get device facts
facts = device.get_facts()
print(json.dumps(facts, indent=2))

# Configure DNS servers
config = """
ip name-server 192.168.1.74
ip name-server 8.8.8.8
"""
device.load_merge_candidate(config=config)
device.commit_config()
device.close()
```

#### **Netmiko** - SSH automation
```python
from netmiko import ConnectHandler

# Device connection
device = {
    'device_type': 'cisco_ios',
    'host': '192.168.1.1',
    'username': 'admin',
    'password': 'password',
}

# Connect and configure
connection = ConnectHandler(**device)
commands = [
    'configure terminal',
    'ip dns server 192.168.1.74',
    'ip domain-lookup',
    'exit'
]

output = connection.send_config_set(commands)
print(output)
connection.disconnect()
```

#### **Nornir** - Modern Python framework
```python
from nornir import InitNornir
from nornir_netmiko.tasks import netmiko_send_config

# Initialize Nornir
nr = InitNornir(config_file="config.yaml")

def configure_dns(task):
    """Configure DNS servers on devices"""
    commands = [
        "ip dns server 192.168.1.74",
        "ip domain-lookup"
    ]
    
    result = task.run(
        task=netmiko_send_config,
        config_commands=commands
    )
    return result

# Run task on all devices
result = nr.run(task=configure_dns)
print(result)
```

---

## 🏠 **Homelab-Specific Tools**

### **Pi-hole + Unbound Integration**
```bash
# Install Pi-hole with custom upstream
curl -sSL https://install.pi-hole.net | bash

# Configure upstream DNS to ctrld
echo "server=172.22.150.21#53" >> /etc/dnsmasq.d/99-upstream.conf

# Restart services
sudo systemctl restart pihole-FTL
```

### **OPNsense/pfSense Integration**
```php
// OPNsense plugin for Control D
<?php
namespace OPNsense\ControlD\Api;

class ServiceController extends \OPNsense\Base\ApiMutableModelControllerBase
{
    protected static $internalServiceClass = '\OPNsense\ControlD\ControlD';
    
    public function setAction()
    {
        $this->setUpstream('192.168.1.74');
        return $this->restart();
    }
}
?>
```

### **Docker Compose Network Stack**
```yaml
# docker-compose.yml
version: '3.8'
services:
  dns-server:
    image: coredns/coredns
    ports:
      - "53:53/udp"
      - "53:53/tcp"
    volumes:
      - ./Corefile:/etc/coredns/Corefile
    restart: unless-stopped
  
  # Network monitoring
  netdata:
    image: netdata/netdata
    ports:
      - "19999:19999"
    environment:
      - NETDATA_DNS_SERVERS=192.168.1.74
```

---

## 🚀 **Advanced Automation Scripts**

### **Dynamic DNS Update Script** (Python)
```python
#!/usr/bin/env python3
import requests
import json
import subprocess
import time

class NetworkManager:
    def __init__(self, dns_server="192.168.1.74"):
        self.dns_server = dns_server
        
    def get_current_ip(self):
        """Get current public IP"""
        response = requests.get('https://api.ipify.org?format=json')
        return response.json()['ip']
    
    def update_dns_record(self, domain, ip):
        """Update DNS record via API"""
        # Example for Cloudflare API
        headers = {
            'Authorization': f'Bearer {API_TOKEN}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'type': 'A',
            'name': domain,
            'content': ip,
            'ttl': 300
        }
        
        response = requests.put(
            f'https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/dns_records/{RECORD_ID}',
            headers=headers,
            json=data
        )
        return response.json()
    
    def test_dns_resolution(self):
        """Test DNS resolution through ctrld"""
        result = subprocess.run(['dig', '@192.168.1.74', 'google.com'], 
                              capture_output=True, text=True)
        return 'ANSWER SECTION' in result.stdout

if __name__ == "__main__":
    nm = NetworkManager()
    
    # Monitor and update every 5 minutes
    while True:
        if nm.test_dns_resolution():
            print("✅ DNS server responding correctly")
        else:
            print("❌ DNS server issues detected")
            # Send alert or restart service
            
        time.sleep(300)
```

### **Network Health Monitor** (PowerShell)
```powershell
# NetworkHealthMonitor.ps1
function Test-NetworkHealth {
    param(
        [string]$DNSServer = "192.168.1.74",
        [string]$TestDomain = "google.com"
    )
    
    $results = @{
        Timestamp = Get-Date
        DNSResolution = $false
        InternetConnectivity = $false
        ControlDActive = $false
        Latency = $null
    }
    
    # Test DNS resolution
    try {
        $dnsResult = Resolve-DnsName -Name $TestDomain -Server $DNSServer -ErrorAction Stop
        $results.DNSResolution = $true
    } catch {
        Write-Warning "DNS resolution failed: $_"
    }
    
    # Test internet connectivity
    try {
        $pingResult = Test-NetConnection -ComputerName "8.8.8.8" -Port 53
        $results.InternetConnectivity = $pingResult.TcpTestSucceeded
        $results.Latency = $pingResult.PingReplyDetails.RoundtripTime
    } catch {
        Write-Warning "Internet connectivity test failed: $_"
    }
    
    # Test Control D verification
    try {
        $controlDResult = Resolve-DnsName -Name "verify.controld.com" -Server $DNSServer
        $results.ControlDActive = $controlDResult.IPAddress -eq "147.185.34.1"
    } catch {
        Write-Warning "Control D verification failed: $_"
    }
    
    return $results
}

# Continuous monitoring
while ($true) {
    $health = Test-NetworkHealth
    
    if (-not $health.DNSResolution) {
        # Emergency DNS recovery
        Write-Host "🚨 DNS failure detected - initiating recovery" -ForegroundColor Red
        & "$PSScriptRoot\EMERGENCY_DNS_RECOVERY.ps1"
    }
    
    # Log results
    $health | ConvertTo-Json | Out-File -Append "NetworkHealth.log"
    
    Start-Sleep -Seconds 60
}
```

---

## 🔧 **Integration with Control D Setup**

### **Automated ctrld Management**
```bash
#!/bin/bash
# ctrld-manager.sh

RESOLVER_ID="1o6nbq1u58h"
CONFIG_PATH="/etc/controld/ctrld.toml"
LOG_PATH="/var/log/ctrld-manager.log"

log() {
    echo "$(date): $1" >> $LOG_PATH
}

check_service() {
    if systemctl is-active --quiet ctrld; then
        log "ctrld service is running"
        return 0
    else
        log "ctrld service is not running"
        return 1
    fi
}

update_config() {
    local new_resolver="$1"
    log "Updating resolver ID to $new_resolver"
    
    # Backup current config
    cp $CONFIG_PATH "${CONFIG_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Update resolver ID
    sed -i "s/endpoint = 'https:\/\/dns\.controld\.com\/.*'/endpoint = 'https:\/\/dns.controld.com\/$new_resolver'/g" $CONFIG_PATH
    
    # Reload service
    sudo ctrld reload
    log "Configuration updated and service reloaded"
}

monitor_performance() {
    # Test DNS resolution speed
    local start_time=$(date +%s%N)
    dig @127.0.0.1 google.com > /dev/null 2>&1
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))
    
    log "DNS resolution time: ${duration}ms"
    
    if [ $duration -gt 1000 ]; then
        log "WARNING: DNS resolution slow (${duration}ms)"
    fi
}

# Main execution
case "$1" in
    "status")
        check_service && echo "Service OK" || echo "Service FAILED"
        ;;
    "update")
        update_config "$2"
        ;;
    "monitor")
        while true; do
            monitor_performance
            sleep 30
        done
        ;;
    *)
        echo "Usage: $0 {status|update <resolver_id>|monitor}"
        exit 1
        ;;
esac
```

---

## 📊 **Monitoring & Visualization Tools**

### **Grafana + Prometheus for DNS Metrics**
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  grafana-data:
```

### **Prometheus Configuration**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ctrld-metrics'
    static_configs:
      - targets: ['192.168.1.74:9090']
  
  - job_name: 'blackbox-dns'
    static_configs:
      - targets:
        - google.com
        - verify.controld.com
    metrics_path: /probe
    params:
      module: [dns_tcp]
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - target_label: __address__
        replacement: 192.168.1.74:9115
```

---

## 🎯 **Recommended Toolkit for Your Setup**

### **Immediate Implementation** (Today):
1. **EMERGENCY_DNS_RECOVERY.ps1** ✅ Already created
2. **ctrld-manager.sh** - Service management
3. **NetworkHealthMonitor.ps1** - Continuous monitoring

### **Short-term** (This Week):
1. **DNSControl** - Version-controlled DNS management
2. **Ansible playbooks** - Automated deployment
3. **Prometheus monitoring** - Performance tracking

### **Long-term** (This Month):
1. **Terraform integration** - Infrastructure as Code
2. **Python automation scripts** - Custom network tools
3. **Grafana dashboards** - Visual monitoring

### **Priority Order for Your Network**:
1. 🥇 **Emergency recovery tools** (Critical)
2. 🥈 **Monitoring scripts** (Important)  
3. 🥉 **Automation frameworks** (Enhancement)

---

## 📚 **Learning Resources**

### **Documentation**:
- DNSControl: https://docs.dnscontrol.org/
- Terraform DNS: https://registry.terraform.io/providers/hashicorp/dns/
- Ansible Network: https://docs.ansible.com/ansible/latest/network/

### **Community Scripts**:
- GitHub: https://github.com/topics/dns-automation
- Reddit: r/homelab, r/networking
- Stack Overflow: terraform+dns, powershell+network

---

*This toolkit provides enterprise-grade network management capabilities while maintaining the simplicity needed for homelab environments.*