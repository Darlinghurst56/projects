#!/bin/bash
# Control D Device Configuration Deployment Example
# 
# This script demonstrates the complete workflow for deploying
# ctrld with Control D device-specific routing based on the
# imported ctrld knowledge base.

set -e

# Configuration
RESOLVER_ID="644415lhr77v"
CONFIG_DIR="/etc/controld"
CONFIG_FILE="$CONFIG_DIR/ctrld.toml"
DEVICE_LIST="home_devices.json"

echo "Control D Device Configuration Deployment"
echo "========================================"
echo "Resolver ID: $RESOLVER_ID"
echo "Configuration will be saved to: $CONFIG_FILE"
echo ""

# Step 1: Generate configuration with device routing
echo "Step 1: Generating Control D configuration..."
python3 ../controld_device_config_generator.py \
  --resolver "$RESOLVER_ID" \
  --add-device admin 192.168.1.10 aa:bb:cc:dd:ee:01 admin-laptop \
  --add-device admin 192.168.1.11 aa:bb:cc:dd:ee:02 admin-desktop \
  --add-device family 192.168.1.20 11:22:33:44:55:01 family-tablet \
  --add-device family 192.168.1.21 11:22:33:44:55:02 family-phone \
  --add-device family 192.168.1.22 11:22:33:44:55:03 kids-laptop \
  --add-device guest 192.168.1.50 66:77:88:99:aa:01 guest-device \
  --add-device iot 192.168.1.100 99:88:77:66:55:01 smart-tv \
  --add-device iot 192.168.1.101 99:88:77:66:55:02 alexa-echo \
  --add-device iot 192.168.1.102 99:88:77:66:55:03 security-camera \
  --output "example_config.toml" \
  --validate

echo "✓ Configuration generated successfully"
echo ""

# Step 2: Validate configuration
echo "Step 2: Validating configuration..."
python3 ../controld_config_tester.py \
  --config "example_config.toml" \
  --validate-only

echo "✓ Configuration validation completed"
echo ""

# Step 3: Test Control D resolver connectivity
echo "Step 3: Testing Control D resolver connectivity..."
python3 ../controld_config_tester.py \
  --resolver "$RESOLVER_ID" \
  --report "resolver_test.json" || echo "⚠ Resolver test failed (may be normal in test environment)"

echo ""

# Step 4: Generate device report
echo "Step 4: Generating device configuration report..."
python3 ../controld_device_config_generator.py \
  --resolver "$RESOLVER_ID" \
  --add-device admin 192.168.1.10 aa:bb:cc:dd:ee:01 admin-laptop \
  --add-device family 192.168.1.20 11:22:33:44:55:01 family-tablet \
  --add-device iot 192.168.1.100 99:88:77:66:55:01 smart-tv \
  --report > device_report.txt

echo "✓ Device report generated: device_report.txt"
echo ""

# Step 5: Show deployment instructions
echo "Step 5: Deployment Instructions"
echo "==============================="
echo ""
echo "Your Control D configuration has been generated as 'example_config.toml'"
echo "This configuration implements the following ctrld features from the knowledge base:"
echo ""
echo "✓ Multiple listener configuration (0.0.0.0:53)"
echo "✓ Network policy driven DNS steering"  
echo "✓ Control D upstream integration with resolver $RESOLVER_ID"
echo "✓ LAN client discovery (mDNS, DHCP, ARP, PTR, hosts)"
echo "✓ Device-specific routing based on IP/MAC addresses"
echo ""

echo "Device Groups Configured:"
echo "- Admin devices: Primary Control D filtering"
echo "- Family devices: Control D with content filtering + fallback"
echo "- Guest devices: Secure public DNS (Cloudflare)"
echo "- IoT devices: Control D + local DNS fallback"
echo ""

echo "To deploy on your router/server:"
echo ""
echo "Option 1 - Service Mode (Recommended):"
echo "  sudo mkdir -p $CONFIG_DIR"
echo "  sudo cp example_config.toml $CONFIG_FILE"
echo "  sudo ctrld start --cd $RESOLVER_ID"
echo ""

echo "Option 2 - Unmanaged Service Mode:"
echo "  sudo mkdir -p $CONFIG_DIR"
echo "  sudo cp example_config.toml $CONFIG_FILE"
echo "  sudo ctrld service start --config $CONFIG_FILE"
echo "  # Then manually configure DNS on network interfaces"
echo ""

echo "Option 3 - Testing Mode:"
echo "  sudo ctrld run --config example_config.toml"
echo ""

echo "Monitoring Commands:"
echo "  sudo ctrld status                    # Check service status"
echo "  tail -f /var/log/ctrld.log           # Monitor logs"
echo "  curl http://127.0.0.1:9090/metrics   # View metrics"
echo "  ctrld clients list                   # List discovered devices"
echo ""

echo "Testing DNS Resolution:"
echo "  dig verify.controld.com @127.0.0.1   # Test Control D"
echo "  dig google.com @127.0.0.1            # Test general resolution"
echo ""

echo "Device Discovery Verification:"
echo "  grep -i 'discovered' /var/log/ctrld.log  # Check device discovery"
echo "  grep -i 'mac' /var/log/ctrld.log         # Verify MAC detection"
echo ""

echo "Configuration Features Based on ctrld Knowledge:"
echo "================================================"
echo ""
echo "Service Configuration:"
echo "- Caching enabled with 8192 cache size"
echo "- All LAN discovery methods enabled"
echo "- MAC-based client identification"
echo "- Prometheus metrics on port 9090"
echo ""

echo "Network Policies:"
echo "- IP-based network groups for device classification"
echo "- MAC address-specific routing rules"
echo "- Split-horizon DNS for .local, .lan, .home domains"
echo ""

echo "Upstream Configuration:"
echo "- Primary: Control D with resolver $RESOLVER_ID"
echo "- Fallback: Control D public DNS"
echo "- Secure: Cloudflare security DNS"
echo "- Local: Google DNS for IoT fallback"
echo ""

echo "Listener Configuration:"
echo "- Listens on all interfaces (0.0.0.0:53)"
echo "- Policy-based routing for device groups"
echo "- Unrestricted mode for router deployment"
echo ""

echo "Files Generated:"
echo "- example_config.toml    # ctrld configuration file"
echo "- device_report.txt      # Device configuration report"
echo "- resolver_test.json     # Resolver connectivity test results"
echo ""

echo "✓ Deployment example completed successfully!"