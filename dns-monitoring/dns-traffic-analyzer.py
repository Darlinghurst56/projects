#!/usr/bin/env python3
"""
Control D DNS Traffic Analyzer
Analyzes DNS query logs to provide network traffic insights
"""

import json
import re
from datetime import datetime
from collections import defaultdict, Counter
import argparse

class DNSTrafficAnalyzer:
    def __init__(self, log_file):
        self.log_file = log_file
        self.queries = []
        self.client_stats = defaultdict(list)
        self.domain_stats = Counter()
        self.query_types = Counter()
        
    def parse_log_line(self, line):
        """Parse a single log line from ctrld"""
        try:
            log_entry = json.loads(line.strip())
            if 'QUERY' in log_entry.get('message', ''):
                # Extract query info using regex
                message = log_entry['message']
                query_match = re.search(r'(\d+\.\d+\.\d+\.\d+):\d+ \(([^)]+)\) -> listener\.\d+: (\w+) (.+)', message)
                
                if query_match:
                    client_ip = query_match.group(1)
                    query_type = query_match.group(3)
                    domain = query_match.group(4)
                    timestamp = log_entry.get('time', '')
                    
                    query_info = {
                        'timestamp': timestamp,
                        'client_ip': client_ip,
                        'query_type': query_type,
                        'domain': domain,
                        'level': log_entry.get('level', 'info')
                    }
                    
                    self.queries.append(query_info)
                    self.client_stats[client_ip].append(query_info)
                    self.domain_stats[domain] += 1
                    self.query_types[query_type] += 1
                    
                    return query_info
        except json.JSONDecodeError:
            pass
        return None
    
    def analyze_log_file(self):
        """Analyze the entire log file"""
        print(f"Analyzing DNS log file: {self.log_file}")
        
        try:
            with open(self.log_file, 'r', encoding='utf-8', errors='ignore') as f:
                for line_num, line in enumerate(f, 1):
                    self.parse_log_line(line)
                    
        except FileNotFoundError:
            print(f"Error: Log file {self.log_file} not found")
            return False
        
        print(f"Processed {len(self.queries)} DNS queries")
        return True
    
    def generate_report(self):
        """Generate comprehensive traffic analysis report"""
        if not self.queries:
            print("No DNS queries found to analyze")
            return
        
        print("\n" + "="*60)
        print("DNS TRAFFIC ANALYSIS REPORT")
        print("="*60)
        
        # Top clients by query count
        print(f"\nTOP CLIENTS BY QUERY COUNT:")
        print("-" * 40)
        client_counts = {ip: len(queries) for ip, queries in self.client_stats.items()}
        for ip, count in sorted(client_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"{ip:<15} {count:>6} queries")
        
        # Top domains queried
        print(f"\nTOP DOMAINS QUERIED:")
        print("-" * 40)
        for domain, count in self.domain_stats.most_common(20):
            print(f"{domain:<40} {count:>6} queries")
        
        # Query types distribution
        print(f"\nQUERY TYPES DISTRIBUTION:")
        print("-" * 40)
        total_queries = sum(self.query_types.values())
        for qtype, count in self.query_types.most_common():
            percentage = (count / total_queries) * 100
            print(f"{qtype:<10} {count:>6} queries ({percentage:5.1f}%)")
        
        # Recent activity
        print(f"\nRECENT DNS ACTIVITY (Last 10 queries):")
        print("-" * 60)
        for query in self.queries[-10:]:
            timestamp = query['timestamp'][:19] if len(query['timestamp']) > 19 else query['timestamp']
            print(f"{timestamp} {query['client_ip']:<15} {query['query_type']:<6} {query['domain']}")
    
    def get_client_analysis(self, client_ip):
        """Get detailed analysis for a specific client"""
        if client_ip not in self.client_stats:
            print(f"No queries found for client {client_ip}")
            return
        
        queries = self.client_stats[client_ip]
        print(f"\nDETAILED ANALYSIS FOR CLIENT: {client_ip}")
        print("=" * 50)
        print(f"Total queries: {len(queries)}")
        
        # Domain distribution for this client
        client_domains = Counter(q['domain'] for q in queries)
        print(f"\nTop domains for {client_ip}:")
        for domain, count in client_domains.most_common(10):
            print(f"  {domain:<30} {count:>4} queries")
        
        # Query types for this client
        client_types = Counter(q['query_type'] for q in queries)
        print(f"\nQuery types for {client_ip}:")
        for qtype, count in client_types.most_common():
            print(f"  {qtype:<10} {count:>4} queries")

def main():
    parser = argparse.ArgumentParser(description='Analyze Control D DNS traffic logs')
    parser.add_argument('log_file', help='Path to ctrld.log file')
    parser.add_argument('--client', help='Analyze specific client IP')
    parser.add_argument('--live', action='store_true', help='Monitor log file in real-time')
    
    args = parser.parse_args()
    
    analyzer = DNSTrafficAnalyzer(args.log_file)
    
    if analyzer.analyze_log_file():
        analyzer.generate_report()
        
        if args.client:
            analyzer.get_client_analysis(args.client)

if __name__ == "__main__":
    main()