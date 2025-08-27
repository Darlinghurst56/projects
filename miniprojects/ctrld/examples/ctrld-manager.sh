#!/bin/bash
# ctrld-manager.sh - Advanced Control D Service Management
# Integrates with network management tools and provides automation

RESOLVER_ID="1o6nbq1u58h"
CONFIG_PATH="/etc/controld/ctrld.toml"
LOG_PATH="/var/log/ctrld-manager.log"
WSL_IP="172.22.150.21"
HOST_IP="192.168.1.74"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" | tee -a $LOG_PATH
}

print_status() {
    local status="$1"
    local message="$2"
    case $status in
        "success") echo -e "${GREEN}✅ $message${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "error") echo -e "${RED}❌ $message${NC}" ;;
        "info") echo -e "ℹ️  $message" ;;
    esac
}

check_service() {
    if sudo ctrld status | grep -q "Service is running"; then
        log "ctrld service is running"
        return 0
    else
        log "ctrld service is not running"
        return 1
    fi
}

check_port_forwarding() {
    # Check if Windows port forwarding is active
    if ss -tulpn | grep -q ":53.*ctrld"; then
        print_status "success" "DNS service listening on port 53"
        return 0
    else
        print_status "error" "DNS service not listening on port 53"
        return 1
    fi
}

test_dns_resolution() {
    local test_domain="${1:-google.com}"
    local dns_server="${2:-127.0.0.1}"
    
    print_status "info" "Testing DNS resolution for $test_domain via $dns_server"
    
    if dig +short @$dns_server $test_domain > /dev/null 2>&1; then
        local result=$(dig +short @$dns_server $test_domain)
        print_status "success" "DNS resolution successful: $result"
        return 0
    else
        print_status "error" "DNS resolution failed for $test_domain"
        return 1
    fi
}

test_controld_verification() {
    print_status "info" "Testing Control D verification"
    
    local result=$(dig +short @127.0.0.1 verify.controld.com)
    if echo "$result" | grep -q "147.185.34.1"; then
        print_status "success" "Control D verification successful"
        return 0
    else
        print_status "warning" "Control D verification failed or different result: $result"
        return 1
    fi
}

update_resolver() {
    local new_resolver="$1"
    if [[ -z "$new_resolver" ]]; then
        print_status "error" "Resolver ID required"
        exit 1
    fi
    
    log "Updating resolver ID from $RESOLVER_ID to $new_resolver"
    
    # Backup current config
    local backup_file="${CONFIG_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
    sudo cp $CONFIG_PATH "$backup_file"
    log "Configuration backed up to $backup_file"
    
    # Update resolver ID in config
    sudo sed -i "s|endpoint = 'https://dns\.controld\.com/.*'|endpoint = 'https://dns.controld.com/$new_resolver'|g" $CONFIG_PATH
    
    # Update resolver ID variable for future use
    RESOLVER_ID="$new_resolver"
    
    # Reload service
    sudo ctrld reload
    log "Configuration updated and service reloaded"
    
    # Test new configuration
    sleep 2
    test_dns_resolution
    test_controld_verification
}

monitor_performance() {
    print_status "info" "Starting DNS performance monitoring..."
    
    while true; do
        # Test DNS resolution speed
        local start_time=$(date +%s%N)
        dig @127.0.0.1 google.com > /dev/null 2>&1
        local end_time=$(date +%s%N)
        local duration=$(( (end_time - start_time) / 1000000 ))
        
        log "DNS resolution time: ${duration}ms"
        
        if [ $duration -gt 1000 ]; then
            print_status "warning" "DNS resolution slow (${duration}ms)"
        elif [ $duration -gt 2000 ]; then
            print_status "error" "DNS resolution very slow (${duration}ms) - investigating"
            diagnose_issues
        else
            print_status "success" "DNS resolution fast (${duration}ms)"
        fi
        
        # Test Control D verification every 10th check
        if [ $(($(date +%s) % 300)) -eq 0 ]; then
            test_controld_verification
        fi
        
        sleep 30
    done
}

diagnose_issues() {
    print_status "info" "Running diagnostic checks..."
    
    # Check service status
    if ! check_service; then
        print_status "error" "ctrld service is not running - attempting restart"
        sudo ctrld restart
    fi
    
    # Check port forwarding
    check_port_forwarding
    
    # Check WSL connectivity
    if ping -c 1 $WSL_IP > /dev/null 2>&1; then
        print_status "success" "WSL connectivity OK ($WSL_IP)"
    else
        print_status "error" "WSL connectivity failed ($WSL_IP)"
    fi
    
    # Check network interfaces
    ip addr show | grep inet
    
    # Check DNS upstream connectivity
    if curl -s --max-time 5 "https://dns.controld.com/$RESOLVER_ID" > /dev/null; then
        print_status "success" "Control D upstream reachable"
    else
        print_status "warning" "Control D upstream connectivity issues"
    fi
}

install_service() {
    print_status "info" "Installing ctrld as system service"
    
    # Create systemd service file
    sudo tee /etc/systemd/system/ctrld-manager.service > /dev/null << EOF
[Unit]
Description=Control D Manager Service
After=network.target

[Service]
Type=simple
User=root
ExecStart=$PWD/ctrld-manager.sh monitor
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable ctrld-manager.service
    print_status "success" "ctrld-manager service installed"
}

generate_ansible_playbook() {
    print_status "info" "Generating Ansible playbook for network deployment"
    
    cat > ctrld-deployment.yml << EOF
---
- name: Deploy Control D DNS Server
  hosts: localhost
  become: yes
  
  vars:
    resolver_id: "$RESOLVER_ID"
    wsl_ip: "$WSL_IP"
    host_ip: "$HOST_IP"
  
  tasks:
    - name: Ensure ctrld is installed
      get_url:
        url: https://github.com/Control-D-Inc/ctrld/releases/latest/download/ctrld_\$(uname -s)_\$(uname -m).tar.gz
        dest: /tmp/ctrld.tar.gz
      
    - name: Extract ctrld binary
      unarchive:
        src: /tmp/ctrld.tar.gz
        dest: /usr/local/bin/
        remote_src: yes
        creates: /usr/local/bin/ctrld
    
    - name: Create Control D directory
      file:
        path: /etc/controld
        state: directory
        mode: '0755'
    
    - name: Generate ctrld configuration
      template:
        src: ctrld.toml.j2
        dest: /etc/controld/ctrld.toml
        backup: yes
      notify: restart ctrld
    
    - name: Start and enable ctrld service
      shell: ctrld start --cd {{ resolver_id }}
      
    - name: Configure Windows port forwarding
      win_shell: |
        netsh interface portproxy add v4tov4 listenport=53 listenaddress={{ host_ip }} connectport=53 connectaddress={{ wsl_ip }} protocol=udp
        netsh interface portproxy add v4tov4 listenport=53 listenaddress={{ host_ip }} connectport=53 connectaddress={{ wsl_ip }} protocol=tcp
      delegate_to: localhost
      when: ansible_os_family == "Windows"
  
  handlers:
    - name: restart ctrld
      shell: ctrld reload
EOF

    print_status "success" "Ansible playbook generated: ctrld-deployment.yml"
}

generate_terraform() {
    print_status "info" "Generating Terraform configuration for DNS management"
    
    cat > dns.tf << EOF
# Terraform configuration for Control D DNS setup
terraform {
  required_providers {
    dns = {
      source = "hashicorp/dns"
      version = "~> 3.0"
    }
  }
}

provider "dns" {
  update {
    server = "$HOST_IP"
  }
}

# Local DNS records
resource "dns_a_record_set" "dns_server" {
  zone = "home.local."
  name = "dns"
  addresses = ["$HOST_IP"]
  ttl = 300
}

resource "dns_a_record_set" "server" {
  zone = "home.local."
  name = "server"
  addresses = ["$HOST_IP"]
  ttl = 300
}

resource "dns_cname_record" "router" {
  zone  = "home.local."
  name  = "router"
  cname = "dns.home.local."
  ttl   = 300
}

# Output current configuration
output "dns_server_ip" {
  value = "$HOST_IP"
}

output "resolver_id" {
  value = "$RESOLVER_ID"
}
EOF

    print_status "success" "Terraform configuration generated: dns.tf"
}

backup_configuration() {
    local backup_dir="/tmp/ctrld-backup-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup configuration files
    sudo cp $CONFIG_PATH "$backup_dir/" 2>/dev/null || true
    cp "$0" "$backup_dir/"
    
    # Export current settings
    cat > "$backup_dir/settings.env" << EOF
RESOLVER_ID="$RESOLVER_ID"
WSL_IP="$WSL_IP"
HOST_IP="$HOST_IP"
CONFIG_PATH="$CONFIG_PATH"
BACKUP_DATE="$(date)"
EOF

    # Export DNS records
    dig @127.0.0.1 axfr home.local > "$backup_dir/dns_records.txt" 2>/dev/null || true
    
    # Create archive
    tar -czf "ctrld-backup-$(date +%Y%m%d_%H%M%S).tar.gz" -C /tmp "$(basename $backup_dir)"
    
    print_status "success" "Configuration backed up to ctrld-backup-$(date +%Y%m%d_%H%M%S).tar.gz"
}

show_status() {
    print_status "info" "Control D DNS Server Status Report"
    echo "=================================="
    
    echo -e "\n🔧 Configuration:"
    echo "  Resolver ID: $RESOLVER_ID"
    echo "  WSL IP: $WSL_IP"
    echo "  Host IP: $HOST_IP"
    echo "  Config Path: $CONFIG_PATH"
    
    echo -e "\n🚀 Service Status:"
    if check_service; then
        print_status "success" "ctrld service is running"
    else
        print_status "error" "ctrld service is not running"
    fi
    
    echo -e "\n🌐 Network Tests:"
    test_dns_resolution "google.com" "127.0.0.1"
    test_dns_resolution "google.com" "$HOST_IP" 2>/dev/null || print_status "warning" "External DNS test failed (may need port forwarding)"
    test_controld_verification
    
    echo -e "\n📊 Performance:"
    monitor_performance &
    local monitor_pid=$!
    sleep 5
    kill $monitor_pid 2>/dev/null || true
    
    echo -e "\n🔍 Port Status:"
    check_port_forwarding
    
    echo -e "\n📝 Recent Logs:"
    if [[ -f "$LOG_PATH" ]]; then
        tail -n 5 "$LOG_PATH"
    else
        print_status "warning" "No log file found at $LOG_PATH"
    fi
}

# Main execution
case "$1" in
    "status"|"")
        show_status
        ;;
    "start")
        sudo ctrld start --cd $RESOLVER_ID
        ;;
    "stop")
        sudo ctrld stop
        ;;
    "restart")
        sudo ctrld restart
        ;;
    "reload")
        sudo ctrld reload
        ;;
    "update")
        update_resolver "$2"
        ;;
    "monitor")
        monitor_performance
        ;;
    "diagnose")
        diagnose_issues
        ;;
    "test")
        test_dns_resolution "$2" "$3"
        ;;
    "backup")
        backup_configuration
        ;;
    "install-service")
        install_service
        ;;
    "generate-ansible")
        generate_ansible_playbook
        ;;
    "generate-terraform")
        generate_terraform
        ;;
    *)
        echo "Usage: $0 {status|start|stop|restart|reload|update <resolver_id>|monitor|diagnose|test [domain] [dns_server]|backup|install-service|generate-ansible|generate-terraform}"
        echo ""
        echo "Commands:"
        echo "  status              Show detailed service status"
        echo "  start               Start ctrld service"
        echo "  stop                Stop ctrld service"
        echo "  restart             Restart ctrld service"
        echo "  reload              Reload ctrld configuration"
        echo "  update <id>         Update resolver ID"
        echo "  monitor             Continuous performance monitoring"
        echo "  diagnose            Run diagnostic checks"
        echo "  test [domain] [dns] Test DNS resolution"
        echo "  backup              Backup current configuration"
        echo "  install-service     Install as systemd service"
        echo "  generate-ansible    Generate Ansible deployment playbook"
        echo "  generate-terraform  Generate Terraform configuration"
        exit 1
        ;;
esac