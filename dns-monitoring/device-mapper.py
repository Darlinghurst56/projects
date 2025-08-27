#!/usr/bin/env python3
"""
Device Mapper - Control D DNS Device Management
Manages device identification and routing table for network DNS monitoring
"""

import json
import sys
import os
from datetime import datetime
from collections import defaultdict

class DeviceMapper:
    def __init__(self, device_map_file="device-map.json"):
        self.device_map_file = os.path.abspath(device_map_file)
        self.data = self._load_device_map()
    
    def _load_device_map(self):
        """Load device mapping data from JSON file"""
        try:
            with open(self.device_map_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Device map file not found: {self.device_map_file}")
            return self._create_empty_map()
        except json.JSONDecodeError as e:
            print(f"Error parsing device map: {e}")
            return self._create_empty_map()
    
    def _create_empty_map(self):
        """Create empty device mapping structure"""
        return {
            "metadata": {
                "last_updated": datetime.now().strftime("%Y-%m-%d"),
                "network_range": "192.168.1.0/24",
                "total_devices": 0,
                "source": "Control D DNS log analysis"
            },
            "devices": {},
            "network_insights": {
                "device_types": {},
                "top_services": {},
                "activity_patterns": {}
            }
        }
    
    def save_device_map(self):
        """Save device mapping data to JSON file"""
        self.data["metadata"]["last_updated"] = datetime.now().strftime("%Y-%m-%d")
        self.data["metadata"]["total_devices"] = len(self.data["devices"])
        
        try:
            with open(self.device_map_file, 'w') as f:
                json.dump(self.data, f, indent=2)
            print(f"Device map saved to: {self.device_map_file}")
            return True
        except Exception as e:
            print(f"Error saving device map: {e}")
            return False
    
    def add_device(self, ip, name, device_type, category, description=""):
        """Add or update a device in the mapping"""
        self.data["devices"][ip] = {
            "name": name,
            "type": device_type,
            "category": category,
            "description": description,
            "added": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        print(f"Added device: {ip} -> {name} ({device_type})")
    
    def get_device_info(self, ip):
        """Get device information by IP address"""
        return self.data["devices"].get(ip, {
            "name": f"Unknown-{ip.split('.')[-1]}",
            "type": "Unknown",
            "category": "Unknown",
            "description": "Unidentified network device"
        })
    
    def list_devices(self):
        """List all devices in the mapping"""
        print("\nDevice Routing Table:")
        print("=" * 80)
        print(f"{'IP Address':<15} {'Name':<25} {'Type':<15} {'Category':<15}")
        print("-" * 80)
        
        for ip, info in sorted(self.data["devices"].items()):
            name = info.get('name', 'Unknown')[:24]
            device_type = info.get('type', 'Unknown')[:14]
            category = info.get('category', 'Unknown')[:14]
            print(f"{ip:<15} {name:<25} {device_type:<15} {category:<15}")
        
        print(f"\nTotal devices: {len(self.data['devices'])}")
    
    def analyze_dns_log(self, log_file):
        """Analyze DNS log file to update device activity"""
        try:
            device_activity = defaultdict(int)
            device_domains = defaultdict(set)
            
            with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    try:
                        log_entry = json.loads(line.strip())
                        if 'QUERY' in log_entry.get('message', ''):
                            message = log_entry['message']
                            # Extract client IP from query
                            import re
                            match = re.search(r'(\d+\.\d+\.\d+\.\d+):\d+ \([^)]+\) -> listener\.\d+: \w+ (.+)', message)
                            if match:
                                client_ip = match.group(1)
                                domain = match.group(2)
                                device_activity[client_ip] += 1
                                device_domains[client_ip].add(domain)
                    except json.JSONDecodeError:
                        continue
            
            # Update device information with activity data
            for ip, count in device_activity.items():
                if ip in self.data["devices"]:
                    self.data["devices"][ip]["query_count"] = count
                    self.data["devices"][ip]["common_domains"] = list(device_domains[ip])[:5]  # Top 5 domains
                else:
                    # Auto-detect new device
                    self.add_device(
                        ip=ip,
                        name=f"Auto-detected-{ip.split('.')[-1]}",
                        device_type="Unknown",
                        category="Unknown",
                        description=f"Auto-detected from DNS logs with {count} queries"
                    )
                    self.data["devices"][ip]["query_count"] = count
                    self.data["devices"][ip]["common_domains"] = list(device_domains[ip])[:5]
            
            print(f"Analysis complete. Found activity from {len(device_activity)} devices.")
            return True
            
        except FileNotFoundError:
            print(f"DNS log file not found: {log_file}")
            return False
        except Exception as e:
            print(f"Error analyzing DNS log: {e}")
            return False
    
    def generate_routing_table(self):
        """Generate routing table for network analysis"""
        routing_table = []
        
        for ip, info in sorted(self.data["devices"].items()):
            routing_entry = {
                "ip": ip,
                "name": info.get('name', 'Unknown'),
                "type": info.get('type', 'Unknown'),
                "category": info.get('category', 'Unknown'),
                "activity": info.get('query_count', 0),
                "top_domains": info.get('common_domains', [])[:3],
                "last_seen": info.get('added', 'Unknown')
            }
            routing_table.append(routing_entry)
        
        return routing_table
    
    def export_routing_table(self, output_file="device-routing-table.json"):
        """Export routing table to JSON file"""
        routing_table = self.generate_routing_table()
        
        try:
            with open(output_file, 'w') as f:
                json.dump({
                    "generated": datetime.now().isoformat(),
                    "total_devices": len(routing_table),
                    "network_range": self.data["metadata"]["network_range"],
                    "routing_table": routing_table
                }, f, indent=2)
            
            print(f"Routing table exported to: {output_file}")
            return True
        except Exception as e:
            print(f"Error exporting routing table: {e}")
            return False

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Control D DNS Device Mapper')
    parser.add_argument('--list', action='store_true', help='List all devices')
    parser.add_argument('--add', nargs=5, metavar=('IP', 'NAME', 'TYPE', 'CATEGORY', 'DESCRIPTION'),
                       help='Add device: IP NAME TYPE CATEGORY DESCRIPTION')
    parser.add_argument('--analyze', metavar='LOG_FILE', help='Analyze DNS log file')
    parser.add_argument('--export', metavar='OUTPUT_FILE', nargs='?', const='device-routing-table.json',
                       help='Export routing table to file')
    parser.add_argument('--device-map', default='device-map.json', help='Device map file path')
    
    args = parser.parse_args()
    
    # Initialize device mapper
    mapper = DeviceMapper(args.device_map)
    
    if args.list:
        mapper.list_devices()
    
    elif args.add:
        ip, name, device_type, category, description = args.add
        mapper.add_device(ip, name, device_type, category, description)
        mapper.save_device_map()
    
    elif args.analyze:
        if mapper.analyze_dns_log(args.analyze):
            mapper.save_device_map()
    
    elif args.export:
        mapper.export_routing_table(args.export)
    
    else:
        print("Control D Device Mapper")
        print("Usage examples:")
        print("  python3 device-mapper.py --list")
        print("  python3 device-mapper.py --analyze /mnt/c/ctrld.log")
        print("  python3 device-mapper.py --export routing-table.json")
        print("  python3 device-mapper.py --add 192.168.1.100 'Smart TV' 'Entertainment' 'Media' 'Living room TV'")

if __name__ == "__main__":
    main()