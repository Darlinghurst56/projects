# Network Infrastructure Enhancement Usage Examples

## Overview

This document provides practical, real-world usage scenarios for the Network Infrastructure Enhancement tools, demonstrating how to leverage the unified monitoring and automation capabilities for effective home network management.

## Quick Start Scenarios

### Scenario 1: Daily Network Health Check

**Use Case**: Start each day with a comprehensive network status overview.

```bash
# Quick morning network health check
./network-status.sh --quick

# Expected output:
🌐 Network Infrastructure Status Report
========================================

🔧 DNS Service (ctrld)
  ✅ Service running (PID: 12345)
  ✅ DNS resolution working (23ms)
  ✅ Control D verification passed

🔄 Block-list Sync (ctrld-sync)
  ✅ Last sync: 06:30 08/14 (successful)
  ℹ️  Next estimated sync: 12:30 08/14

📊 Router Monitoring (router_logs)
  ✅ Collection service active
  ℹ️  Recent activity: 15 events (last 24h)

⚡ Performance Summary
  ℹ️  DNS resolution: 23ms
  ✅ External connectivity verified
```

### Scenario 2: Troubleshooting Internet Connectivity Issues

**Use Case**: Family reports "internet is slow" - need to quickly identify the problem.

```bash
# Step 1: Quick diagnosis
./network-status.sh --component performance

# Step 2: If DNS issues detected, run comprehensive DNS diagnostics
./network-tasks.sh dns diagnose

# Step 3: Check router logs for recent issues
./network-tasks.sh router query "network connectivity problems in last 2 hours"

# Step 4: If problems persist, restart DNS service
./network-tasks.sh dns restart
```

**Sample Troubleshooting Workflow:**
```bash
# Quick check reveals DNS issues
./network-status.sh --quick
# Output shows: ❌ DNS resolution failed

# Run DNS diagnostics
./network-tasks.sh dns diagnose
# Shows: DNS service running but resolution failing

# Check Control D status
./network-tasks.sh dns test-resolution google.com
# Identifies upstream DNS issues

# Switch to emergency DNS if needed
./network-tasks.sh dns emergency-recovery
```

### Scenario 3: Weekly Maintenance Routine

**Use Case**: Saturday morning weekly network maintenance.

```bash
# Complete maintenance script
#!/bin/bash
echo "🔧 Weekly Network Maintenance - $(date)"
echo "========================================"

# 1. Full system health check
echo "1. System Health Check:"
./network-status.sh

# 2. Clean up old logs
echo "2. Log Cleanup:"
./network-tasks.sh router cleanup-logs
./network-tasks.sh system optimize

# 3. Force sync update
echo "3. Manual Sync Update:"
./network-tasks.sh sync run

# 4. Create backup
echo "4. Configuration Backup:"
./network-tasks.sh system backup

# 5. Performance summary
echo "5. Performance Review:"
./network-status.sh --component performance

echo "✅ Weekly maintenance completed!"
```

## DNS Management Scenarios

### Scenario 4: Switching DNS Profiles

**Use Case**: Need to switch from family-safe DNS profile to work profile during business hours.

```bash
# Check current resolver
./network-status.sh --component dns

# Update to work profile resolver
./network-tasks.sh dns update-resolver "work_profile_id_here"

# Verify the change
./network-tasks.sh dns test-resolution linkedin.com

# Later, switch back to family profile
./network-tasks.sh dns update-resolver "family_profile_id_here"
```

### Scenario 5: DNS Service Recovery

**Use Case**: DNS service crashed and needs immediate restoration.

```bash
# Emergency recovery sequence
echo "🚨 DNS Emergency Recovery"

# Step 1: Check service status
./network-status.sh --component dns

# Step 2: Attempt service restart
./network-tasks.sh dns restart

# Step 3: If restart fails, run diagnostics
if ! ./network-tasks.sh dns status | grep -q "running"; then
    ./network-tasks.sh dns diagnose
fi

# Step 4: Test DNS resolution
./network-tasks.sh dns test-resolution

# Step 5: If still failing, emergency fallback
if ! dig @127.0.0.1 google.com; then
    echo "Initiating emergency DNS recovery..."
    ./network-tasks.sh dns emergency-recovery
fi
```

### Scenario 6: DNS Performance Monitoring

**Use Case**: Monitor DNS performance throughout the day to identify patterns.

```bash
# Create performance monitoring script
#!/bin/bash
LOG_FILE="/var/log/dns-performance-$(date +%Y%m%d).log"

while true; do
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Test DNS performance
    start_time=$(date +%s%N)
    dig @127.0.0.1 google.com >/dev/null 2>&1
    end_time=$(date +%s%N)
    
    response_time=$(( (end_time - start_time) / 1000000 ))
    
    # Log performance data
    echo "$timestamp,$response_time" >> "$LOG_FILE"
    
    # Alert on slow performance
    if [ $response_time -gt 500 ]; then
        echo "⚠️  Slow DNS response: ${response_time}ms at $timestamp"
        ./network-tasks.sh dns diagnose
    fi
    
    sleep 300  # Check every 5 minutes
done
```

## Block-list Synchronization Scenarios

### Scenario 7: Adding New Security Profiles

**Use Case**: Set up DNS filtering for a new family member or device group.

```bash
# Add new profile to sync configuration
./network-tasks.sh sync add-profile "teens_profile_id"

# Verify configuration
./network-tasks.sh sync test-config

# Run immediate sync to activate
./network-tasks.sh sync run

# Check sync results
./network-tasks.sh sync status
```

### Scenario 8: Troubleshooting Sync Issues

**Use Case**: Block-list sync is failing and need to identify the problem.

```bash
# Check sync status and logs
./network-tasks.sh sync status

# Review recent sync attempts
cd /home/darlinghurstlinux/projects/miniprojects/ctrld-sync
find . -name "*.log" -mtime -3 | xargs tail -50

# Test API connectivity
./network-tasks.sh sync test-config

# Manual sync with verbose output
cd /home/darlinghurstlinux/projects/miniprojects/ctrld-sync
uv run python main.py --verbose
```

### Scenario 9: Scheduled Sync Management

**Use Case**: Set up automated sync scheduling with monitoring.

```bash
# Create sync monitoring script
#!/bin/bash
SYNC_LOG="/var/log/sync-monitor.log"

check_sync_health() {
    cd /home/darlinghurstlinux/projects/miniprojects/ctrld-sync
    
    # Check if sync is overdue (more than 8 hours)
    last_sync=$(find . -name "*.log" -mtime -1 | head -1)
    if [[ -z "$last_sync" ]]; then
        echo "$(date): WARNING - No sync in last 24 hours" >> "$SYNC_LOG"
        
        # Trigger manual sync
        ./network-tasks.sh sync run
    fi
    
    # Check sync success rate
    success_count=$(grep -c "Successfully" *.log 2>/dev/null || echo 0)
    total_count=$(ls *.log 2>/dev/null | wc -l)
    
    if [[ $total_count -gt 0 ]]; then
        success_rate=$(( success_count * 100 / total_count ))
        echo "$(date): Sync success rate: $success_rate%" >> "$SYNC_LOG"
        
        if [[ $success_rate -lt 80 ]]; then
            echo "$(date): WARNING - Low sync success rate: $success_rate%" >> "$SYNC_LOG"
        fi
    fi
}

# Run sync health check
check_sync_health
```

## Router Monitoring Scenarios

### Scenario 10: Network Security Investigation

**Use Case**: Suspicious network activity detected, need to investigate using LLM analysis.

```bash
# Investigate suspicious activity
./network-tasks.sh router query "show any unusual connection patterns or security events in the last 24 hours"

# Check for failed login attempts
./network-tasks.sh router query "find failed authentication attempts and suspicious IP addresses"

# Look for bandwidth anomalies
./network-tasks.sh router query "identify devices with unusual bandwidth usage patterns"

# Check for new or unknown devices
./network-tasks.sh router query "list any new devices that connected in the last week"
```

### Scenario 11: Family Internet Usage Analysis

**Use Case**: Parents want to understand family internet usage patterns.

```bash
# Analyze usage patterns by time
./network-tasks.sh router query "show internet usage patterns by hour of day for the last week"

# Device-specific analysis
./network-tasks.sh router query "which devices use the most bandwidth and when"

# Content filtering effectiveness
./network-tasks.sh router query "show blocked content attempts and which devices made them"

# Peak usage identification
./network-tasks.sh router query "identify peak usage hours and potential bandwidth bottlenecks"
```

### Scenario 12: Router Maintenance and Optimization

**Use Case**: Monthly router maintenance and performance optimization.

```bash
# Router maintenance script
#!/bin/bash
echo "🔧 Router Maintenance - $(date)"
echo "================================"

# 1. Check current monitoring status
echo "1. Monitoring Status:"
./network-tasks.sh router status

# 2. Collect fresh data
echo "2. Data Collection:"
./network-tasks.sh router collect-now

# 3. Analyze recent performance
echo "3. Performance Analysis:"
./network-tasks.sh router query "analyze network performance trends over the last month"

# 4. Check for device issues
echo "4. Device Health Check:"
./network-tasks.sh router query "identify devices with connection problems or errors"

# 5. Clean up old logs
echo "5. Log Cleanup:"
./network-tasks.sh router cleanup-logs

# 6. Restart monitoring service
echo "6. Service Restart:"
./network-tasks.sh router restart-monitoring

echo "✅ Router maintenance completed"
```

## System Administration Scenarios

### Scenario 13: Proactive System Monitoring

**Use Case**: Set up continuous monitoring with automated responses.

```bash
# Create comprehensive monitoring script
#!/bin/bash
MONITOR_LOG="/var/log/network-monitor.log"
ALERT_EMAIL="admin@example.com"

system_health_check() {
    # Run comprehensive health check
    status_output=$(./network-status.sh --json)
    
    # Check for critical issues
    critical_issues=$(echo "$status_output" | jq -r '.components[] | select(.status=="error") | .message')
    
    if [[ -n "$critical_issues" ]]; then
        echo "$(date): CRITICAL - $critical_issues" >> "$MONITOR_LOG"
        
        # Attempt automated recovery
        ./network-tasks.sh system optimize
        
        # Send alert if available
        if command -v mail >/dev/null; then
            echo "Critical network issues detected: $critical_issues" | mail -s "Network Alert" "$ALERT_EMAIL"
        fi
    fi
    
    # Performance monitoring
    dns_time=$(./network-status.sh --component performance | grep "DNS resolution" | grep -o "[0-9]*ms")
    if [[ ${dns_time%ms} -gt 100 ]]; then
        echo "$(date): PERFORMANCE - Slow DNS: $dns_time" >> "$MONITOR_LOG"
    fi
}

# Main monitoring loop
while true; do
    system_health_check
    sleep 300  # Check every 5 minutes
done
```

### Scenario 14: Automated Backup and Recovery

**Use Case**: Implement automated backup with disaster recovery testing.

```bash
# Comprehensive backup script
#!/bin/bash
BACKUP_DIR="/backup/network-enhancement"
DATE=$(date +%Y%m%d_%H%M%S)

create_backup() {
    mkdir -p "$BACKUP_DIR"
    
    echo "🗄️  Creating backup: $DATE"
    
    # System backup
    ./network-tasks.sh system backup
    
    # Component-specific backups
    ./network-tasks.sh dns backup
    
    # Archive current configurations
    tar -czf "$BACKUP_DIR/network-config-$DATE.tar.gz" \
        configs/ \
        scripts/ \
        ~/.config/network-enhancement/ \
        /etc/controld/ 2>/dev/null || true
    
    echo "✅ Backup completed: $BACKUP_DIR/network-config-$DATE.tar.gz"
}

test_backup_integrity() {
    latest_backup=$(ls -t "$BACKUP_DIR"/*.tar.gz | head -1)
    
    if [[ -n "$latest_backup" ]]; then
        echo "🧪 Testing backup integrity: $(basename "$latest_backup")"
        
        if tar -tzf "$latest_backup" >/dev/null 2>&1; then
            echo "✅ Backup integrity verified"
        else
            echo "❌ Backup integrity check failed"
            return 1
        fi
    fi
}

# Create weekly backup
create_backup
test_backup_integrity

# Cleanup old backups (keep last 4 weeks)
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +28 -delete
```

### Scenario 15: Performance Optimization Routine

**Use Case**: Monthly performance review and optimization.

```bash
# Performance optimization script
#!/bin/bash
echo "⚡ Performance Optimization - $(date)"
echo "===================================="

# 1. Current performance baseline
echo "1. Performance Baseline:"
./network-status.sh --component performance

# 2. System resource usage
echo "2. Resource Usage Analysis:"
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}'

echo "Memory Usage:"
free -h

echo "Disk Usage:"
df -h /var/log

# 3. DNS performance optimization
echo "3. DNS Performance Check:"
for domain in google.com facebook.com amazon.com; do
    echo -n "Testing $domain: "
    response_time=$(dig @127.0.0.1 +stats "$domain" | grep "Query time:" | awk '{print $4}')
    echo "${response_time:-unknown}ms"
done

# 4. Log file optimization
echo "4. Log File Optimization:"
./scripts/optimize-performance.sh

# 5. Service optimization
echo "5. Service Health Check:"
./network-tasks.sh system health-check

# 6. Generate performance report
echo "6. Performance Report:"
{
    echo "Performance Report - $(date)"
    echo "=============================="
    echo ""
    echo "DNS Performance:"
    ./network-status.sh --component performance
    echo ""
    echo "System Resources:"
    echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')"
    echo "Memory: $(free | awk 'NR==2{printf "%.1f%%\n", $3*100/$2}')"
    echo "Disk: $(df /var/log | awk 'NR==2{print $5}')"
} > "/var/log/network-enhancement/performance-report-$(date +%Y%m%d).txt"

echo "✅ Performance optimization completed"
```

## Advanced Integration Scenarios

### Scenario 16: Multi-Component Coordination

**Use Case**: Coordinate actions across DNS, sync, and router components.

```bash
# Coordinated maintenance script
#!/bin/bash
echo "🔄 Coordinated System Maintenance"
echo "================================="

# 1. Pre-maintenance status
echo "1. Pre-maintenance Status:"
./network-status.sh --quick

# 2. Coordinate DNS and sync updates
echo "2. DNS Profile Update:"
./network-tasks.sh dns update-resolver "new_resolver_id"

echo "3. Sync New Rules:"
./network-tasks.sh sync run

# 4. Verify changes took effect
echo "4. Verification:"
sleep 10
./network-tasks.sh dns test-resolution

# 5. Update router monitoring
echo "5. Router Monitoring Update:"
./network-tasks.sh router restart-monitoring

# 6. Final status check
echo "6. Post-maintenance Status:"
./network-status.sh --quick

echo "✅ Coordinated maintenance completed"
```

### Scenario 17: Automated Problem Resolution

**Use Case**: Implement intelligent problem detection and automated resolution.

```bash
# Intelligent problem resolution
#!/bin/bash

detect_and_resolve() {
    echo "🔍 Detecting and Resolving Issues"
    
    # Get current status
    status_json=$(./network-status.sh --json)
    
    # Check DNS issues
    if echo "$status_json" | jq -r '.components[] | select(.component=="dns" and .status=="error")' | grep -q error; then
        echo "🔧 DNS issue detected - attempting resolution"
        
        # Try restart first
        ./network-tasks.sh dns restart
        sleep 5
        
        # If still failing, try diagnostics and repair
        if ! ./network-tasks.sh dns test-resolution >/dev/null; then
            ./network-tasks.sh dns diagnose
            ./network-tasks.sh dns emergency-recovery
        fi
    fi
    
    # Check sync issues
    if echo "$status_json" | jq -r '.components[] | select(.component=="sync" and .status=="error")' | grep -q error; then
        echo "🔧 Sync issue detected - attempting resolution"
        
        # Test configuration and retry
        ./network-tasks.sh sync test-config
        ./network-tasks.sh sync run
    fi
    
    # Check router monitoring
    if echo "$status_json" | jq -r '.components[] | select(.component=="router" and .status=="error")' | grep -q error; then
        echo "🔧 Router monitoring issue detected - attempting resolution"
        
        # Restart monitoring service
        ./network-tasks.sh router restart-monitoring
    fi
    
    # Final verification
    echo "✅ Issue resolution completed - running final check"
    ./network-status.sh --quick
}

# Run problem detection and resolution
detect_and_resolve
```

## Monitoring and Alerting Scenarios

### Scenario 18: Custom Alert System

**Use Case**: Create custom alerting for specific network conditions.

```bash
# Custom alert system
#!/bin/bash
ALERT_CONFIG="/etc/network-alerts.conf"

# Alert configuration (create if not exists)
if [[ ! -f "$ALERT_CONFIG" ]]; then
    cat > "$ALERT_CONFIG" << 'EOF'
DNS_THRESHOLD=100       # Alert if DNS > 100ms
UPTIME_THRESHOLD=95     # Alert if uptime < 95%
SYNC_AGE_THRESHOLD=12   # Alert if sync > 12 hours old
ENABLE_EMAIL_ALERTS=true
ALERT_EMAIL="admin@example.com"
EOF
fi

source "$ALERT_CONFIG"

check_alerts() {
    local alerts=()
    
    # DNS performance alert
    dns_time=$(dig +stats @127.0.0.1 google.com | grep "Query time:" | awk '{print $4}')
    if [[ ${dns_time:-999} -gt $DNS_THRESHOLD ]]; then
        alerts+=("DNS performance: ${dns_time}ms (threshold: ${DNS_THRESHOLD}ms)")
    fi
    
    # Sync freshness alert
    cd /home/darlinghurstlinux/projects/miniprojects/ctrld-sync
    last_sync_file=$(find . -name "*.log" -mtime -1 | head -1)
    if [[ -z "$last_sync_file" ]]; then
        alerts+=("Block-list sync: No sync in last 24 hours")
    fi
    
    # Service uptime alert
    if ! systemctl is-active ctrld >/dev/null 2>&1; then
        alerts+=("DNS service: Not running")
    fi
    
    # Send alerts if any found
    if [[ ${#alerts[@]} -gt 0 ]]; then
        alert_message="Network alerts detected:\n$(printf '%s\n' "${alerts[@]}")"
        echo -e "$alert_message"
        
        if [[ "$ENABLE_EMAIL_ALERTS" == "true" && -n "$ALERT_EMAIL" ]]; then
            echo -e "$alert_message" | mail -s "Network Infrastructure Alert" "$ALERT_EMAIL" 2>/dev/null || true
        fi
    fi
}

# Run alert check
check_alerts
```

### Scenario 19: Performance Trending

**Use Case**: Track performance trends over time for capacity planning.

```bash
# Performance trending script
#!/bin/bash
TREND_DATA="/var/log/network-enhancement/trends.csv"

collect_metrics() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # DNS performance
    local dns_start=$(date +%s%N)
    dig @127.0.0.1 google.com >/dev/null 2>&1
    local dns_end=$(date +%s%N)
    local dns_time=$(( (dns_end - dns_start) / 1000000 ))
    
    # System resources
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    local memory_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    
    # Network connectivity
    local ping_time=$(ping -c 1 8.8.8.8 2>/dev/null | grep "time=" | grep -o "time=[0-9.]*" | cut -d= -f2)
    
    # Log data
    echo "$timestamp,$dns_time,$cpu_usage,$memory_usage,$ping_time" >> "$TREND_DATA"
    
    # Keep only last 30 days of data
    if [[ $(wc -l < "$TREND_DATA") -gt 43200 ]]; then  # 30 days * 24 hours * 60 minutes
        tail -43200 "$TREND_DATA" > "$TREND_DATA.tmp"
        mv "$TREND_DATA.tmp" "$TREND_DATA"
    fi
}

generate_trend_report() {
    if [[ ! -f "$TREND_DATA" ]]; then
        echo "No trend data available"
        return 1
    fi
    
    echo "📊 Performance Trend Report (Last 7 Days)"
    echo "========================================="
    
    # Average DNS performance
    local avg_dns=$(tail -10080 "$TREND_DATA" | awk -F',' '{sum+=$2; count++} END {printf "%.1f", sum/count}')
    echo "Average DNS Response: ${avg_dns}ms"
    
    # Peak CPU usage
    local max_cpu=$(tail -10080 "$TREND_DATA" | awk -F',' '{if($3>max) max=$3} END {printf "%.1f", max}')
    echo "Peak CPU Usage: ${max_cpu}%"
    
    # Average memory usage
    local avg_memory=$(tail -10080 "$TREND_DATA" | awk -F',' '{sum+=$4; count++} END {printf "%.1f", sum/count}')
    echo "Average Memory Usage: ${avg_memory}%"
    
    # Network latency trend
    local avg_ping=$(tail -10080 "$TREND_DATA" | awk -F',' '{sum+=$5; count++} END {printf "%.1f", sum/count}')
    echo "Average Network Latency: ${avg_ping}ms"
}

# Collect current metrics
collect_metrics

# Generate report (weekly)
if [[ $(date +%w) -eq 0 ]]; then  # Sunday
    generate_trend_report
fi
```

## Troubleshooting Scenarios

### Scenario 20: Complete System Recovery

**Use Case**: Major network failure requiring complete system recovery.

```bash
# Complete system recovery procedure
#!/bin/bash
echo "🚨 Network Infrastructure Emergency Recovery"
echo "==========================================="

# Phase 1: Emergency DNS Recovery
echo "Phase 1: Emergency DNS Recovery"
./network-tasks.sh dns emergency-recovery

# Phase 2: Service Status Assessment
echo "Phase 2: Service Assessment"
./network-status.sh --json > /tmp/recovery-status.json

# Phase 3: Systematic Service Recovery
echo "Phase 3: Service Recovery"

# DNS Service Recovery
if ! grep -q '"status":"ok"' /tmp/recovery-status.json | grep -q dns; then
    echo "Recovering DNS service..."
    ./network-tasks.sh dns stop
    sleep 5
    ./network-tasks.sh dns start
    ./network-tasks.sh dns test-resolution
fi

# Sync Service Recovery
echo "Recovering sync service..."
./network-tasks.sh sync test-config
./network-tasks.sh sync run

# Router Monitoring Recovery
echo "Recovering router monitoring..."
./network-tasks.sh router stop-monitoring
./network-tasks.sh router start-monitoring

# Phase 4: System Optimization
echo "Phase 4: System Optimization"
./network-tasks.sh system optimize

# Phase 5: Final Verification
echo "Phase 5: Final Verification"
./network-status.sh

echo "🔧 Recovery procedure completed"
echo "If issues persist, check individual component logs"
```

## Best Practices and Tips

### Daily Usage Tips

1. **Morning Routine**: Start each day with `./network-status.sh --quick`
2. **Before Important Calls**: Run `./network-tasks.sh system quick-check`
3. **After Network Changes**: Always verify with `./network-status.sh`
4. **Performance Issues**: Use `./network-status.sh --component performance`

### Maintenance Tips

1. **Weekly**: Run full status check and cleanup logs
2. **Monthly**: Execute system backup and performance review
3. **Quarterly**: Update DNS profiles and review security settings
4. **As Needed**: Monitor router logs for security events

### Automation Tips

1. **Use Cron Jobs**: Schedule regular health checks and cleanups
2. **System Service**: Enable continuous monitoring with systemd
3. **Custom Scripts**: Create project-specific automation scripts
4. **Integration**: Combine multiple tasks into coordinated workflows

### Security Tips

1. **Credentials**: Always use secure credential storage
2. **Permissions**: Regularly verify file and directory permissions
3. **Logging**: Monitor logs for unusual activity
4. **Recovery**: Test emergency procedures regularly

## Conclusion

These usage examples demonstrate the power and flexibility of the Network Infrastructure Enhancement tools. The unified interface allows for both simple daily operations and complex automated workflows, providing comprehensive network management capabilities for home infrastructure.

The key to effective usage is:
1. Start with simple commands to understand the system
2. Build custom scripts for recurring tasks
3. Use JSON output for integration with other tools
4. Monitor performance and security regularly
5. Test recovery procedures before you need them

For additional help, use `--help` with any command or refer to the implementation guide for detailed setup instructions.

---

**Document Information:**
- **Created**: 2025-08-14
- **Version**: 1.0
- **Author**: gem_doc_agent
- **Last Updated**: 2025-08-14
- **Related Documents**: NETWORK_ENHANCEMENT_PLAN.md, IMPLEMENTATION_GUIDE.md