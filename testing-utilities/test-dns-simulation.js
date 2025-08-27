#!/usr/bin/env node

/**
 * DNS Testing and Traffic Simulation for Control D Monitoring System
 * Tests DNS resolution and simulates network traffic to verify monitoring
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;

class DNSTestSimulator {
    constructor() {
        this.testDomains = [
            'google.com',
            'apple.com', 
            'amazon.com',
            'spotify.com',
            'netflix.com',
            'facebook.com',
            'github.com',
            'microsoft.com'
        ];
        
        this.controlDEndpoint = '1ee9g7o5xyg.dns.controld.com';
        this.results = [];
    }

    async testLocalDNSResolution() {
        console.log('🧪 Testing DNS Resolution with Current Configuration...\n');
        
        for (const domain of this.testDomains) {
            try {
                const start = Date.now();
                const { stdout, stderr } = await execAsync(`nslookup ${domain}`);
                const responseTime = Date.now() - start;
                
                // Check if Control D is being used
                const usingControlD = stdout.includes(this.controlDEndpoint);
                
                this.results.push({
                    domain,
                    success: true,
                    responseTime,
                    usingControlD,
                    output: stdout.trim()
                });
                
                console.log(`✅ ${domain}: ${responseTime}ms ${usingControlD ? '(via Control D)' : '(direct)'}`);
                
            } catch (error) {
                this.results.push({
                    domain,
                    success: false,
                    error: error.message,
                    usingControlD: false
                });
                
                console.log(`❌ ${domain}: Failed - ${error.message}`);
            }
        }
    }

    async testControlDService() {
        console.log('\n🔍 Testing Control D Service Directly...\n');
        
        try {
            // Test if we can query Control D endpoint directly
            const { stdout } = await execAsync(`nslookup google.com ${this.controlDEndpoint}`);
            console.log('✅ Control D endpoint is responsive');
            console.log(stdout);
            return true;
        } catch (error) {
            console.log('❌ Control D endpoint test failed:', error.message);
            return false;
        }
    }

    async checkWindowsControlDService() {
        console.log('\n🖥️  Checking Windows Control D Service Status...\n');
        
        try {
            // Check if ctrld.exe is running
            const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq ctrld.exe" /FO CSV | findstr ctrld.exe');
            if (stdout.trim()) {
                console.log('✅ Control D service (ctrld.exe) is running on Windows');
                console.log(stdout);
                return true;
            } else {
                console.log('⚠️  Control D service (ctrld.exe) not found in running processes');
                return false;
            }
        } catch (error) {
            console.log('❌ Could not check Windows service status:', error.message);
            console.log('💡 This might be normal if running in WSL/Linux environment');
            return false;
        }
    }

    async checkConfigFile() {
        console.log('\n⚙️  Checking Control D Configuration...\n');
        
        const configPath = '/mnt/c/ControlD/ctrld.toml';
        
        try {
            const config = await fs.readFile(configPath, 'utf8');
            
            // Check key configuration points
            const isNetworkWide = config.includes('ip = \'0.0.0.0\'');
            const hasDebugLogging = config.includes('log_level = "debug"');
            const isUnrestricted = config.includes('restricted = false');
            
            console.log(`✅ Config file exists: ${configPath}`);
            console.log(`${isNetworkWide ? '✅' : '❌'} Network-wide listening (0.0.0.0:53)`);
            console.log(`${hasDebugLogging ? '✅' : '❌'} Debug logging enabled`);
            console.log(`${isUnrestricted ? '✅' : '❌'} Unrestricted access enabled`);
            
            return { isNetworkWide, hasDebugLogging, isUnrestricted };
        } catch (error) {
            console.log('❌ Could not read config file:', error.message);
            return null;
        }
    }

    async simulateNetworkTraffic() {
        console.log('\n🌐 Simulating Network DNS Traffic...\n');
        
        // Simulate queries from different "devices" on the network
        const deviceQueries = [
            { device: 'workstation', domains: ['github.com', 'stackoverflow.com', 'google.com'] },
            { device: 'mobile', domains: ['apple.com', 'icloud.com', 'spotify.com'] },
            { device: 'smart_tv', domains: ['netflix.com', 'youtube.com'] },
            { device: 'alexa', domains: ['amazon.com', 'api.amazonalexa.com'] }
        ];

        for (const { device, domains } of deviceQueries) {
            console.log(`📱 Simulating ${device} queries...`);
            
            for (const domain of domains) {
                try {
                    const start = Date.now();
                    await execAsync(`nslookup ${domain}`);
                    const responseTime = Date.now() - start;
                    console.log(`   ${domain}: ${responseTime}ms`);
                } catch (error) {
                    console.log(`   ${domain}: Failed`);
                }
            }
        }
    }

    async generateReport() {
        console.log('\n📊 DNS Testing Report\n' + '='.repeat(50));
        
        const successfulQueries = this.results.filter(r => r.success).length;
        const controlDQueries = this.results.filter(r => r.usingControlD).length;
        const avgResponseTime = this.results
            .filter(r => r.success)
            .reduce((sum, r) => sum + r.responseTime, 0) / successfulQueries || 0;
        
        console.log(`✅ Successful DNS queries: ${successfulQueries}/${this.results.length}`);
        console.log(`🔄 Queries via Control D: ${controlDQueries}/${this.results.length}`);
        console.log(`⚡ Average response time: ${Math.round(avgResponseTime)}ms`);
        
        // Save detailed results
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: {
                totalQueries: this.results.length,
                successfulQueries,
                controlDQueries,
                avgResponseTime: Math.round(avgResponseTime)
            },
            results: this.results
        };
        
        await fs.writeFile(
            '/home/darlinghurstlinux/dns-test-results.json', 
            JSON.stringify(reportData, null, 2)
        );
        
        console.log('\n📋 Detailed results saved to: dns-test-results.json');
        
        // Recommendations
        console.log('\n💡 Recommendations:');
        
        if (controlDQueries === 0) {
            console.log('❗ Control D service may not be running or configured as DNS server');
            console.log('  → Check Windows service status');
            console.log('  → Verify network DNS settings point to this machine');
        } else if (controlDQueries < this.results.length) {
            console.log('⚠️  Mixed DNS resolution detected');
            console.log('  → Some queries bypass Control D');
            console.log('  → Check DNS configuration priority');
        } else {
            console.log('✅ All queries routing through Control D successfully');
        }
        
        return reportData;
    }

    async runFullTest() {
        console.log('🚀 Starting DNS Monitoring Test Suite\n');
        console.log('=' .repeat(60));
        
        // Test sequence
        await this.checkConfigFile();
        await this.checkWindowsControlDService();
        await this.testControlDService();
        await this.testLocalDNSResolution();
        await this.simulateNetworkTraffic();
        
        const report = await this.generateReport();
        
        console.log('\n✅ DNS testing complete!');
        return report;
    }
}

// Run the test suite
if (require.main === module) {
    const tester = new DNSTestSimulator();
    tester.runFullTest().catch(console.error);
}

module.exports = DNSTestSimulator;