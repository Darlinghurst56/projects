# DNS Migration Plan & Recovery Procedures
## Network: 192.168.1.1-255 → Control D DNS Server

### ⚠️ CRITICAL SAFETY NOTICE
**INTERNET CONNECTIVITY RISK**: Improper DNS configuration will cause complete network outage.  
**HAVE RECOVERY PLAN READY BEFORE STARTING**

---

## 🎯 Migration Plan Overview

### Current Status
- **WSL DNS Server**: 172.22.150.21 (ctrld with Control D resolver 1o6nbq1u58h)
- **Target Host IP**: 192.168.1.74 
- **Network Range**: 192.168.1.1-255
- **Router**: Likely 192.168.1.1

### Migration Strategy: **PHASED ROLLOUT**
1. **Phase 1**: Single device testing
2. **Phase 2**: Port forwarding setup
3. **Phase 3**: Limited device rollout
4. **Phase 4**: Network-wide deployment

---

## 🔧 Phase 1: Single Device Testing (SAFE)

### Test Control D Service Directly
```bash
# Test from any device on 192.168.1.x network
nslookup google.com 172.22.150.21
nslookup verify.controld.com 172.22.150.21
```

**Expected Results:**
- google.com → should resolve to IP addresses
- verify.controld.com → should resolve to Control D verification

**❌ STOP HERE if tests fail - service not ready**

---

## 🔧 Phase 2: Windows Port Forwarding (MODERATE RISK)

### Prerequisites Checklist
- [ ] Test device has backup DNS (8.8.8.8) configured
- [ ] WSL ctrld service confirmed running
- [ ] Windows PowerShell admin access available
- [ ] Recovery commands documented (see below)

### Setup Commands (Run as Windows Administrator)
```powershell
# Create port forwarding rules
netsh interface portproxy add v4tov4 listenport=53 listenaddress=192.168.1.74 connectport=53 connectaddress=172.22.150.21 protocol=udp
netsh interface portproxy add v4tov4 listenport=53 listenaddress=192.168.1.74 connectport=53 connectaddress=172.22.150.21 protocol=tcp

# Configure Windows Firewall
netsh advfirewall firewall add rule name="DNS Server UDP" dir=in action=allow protocol=udp localport=53
netsh advfirewall firewall add rule name="DNS Server TCP" dir=in action=allow protocol=tcp localport=53
```

### Immediate Testing
```cmd
# Test from Windows host machine
nslookup google.com 192.168.1.74
nslookup verify.controld.com 192.168.1.74

# Verify port forwarding active
netsh interface portproxy show v4tov4
```

---

## 🔧 Phase 3: Limited Device Testing (HIGHER RISK)

### Safety Protocol
1. **ONE DEVICE ONLY** - start with non-critical device
2. **Manual DNS Configuration** - DO NOT change router settings yet
3. **Keep backup device** with working internet connection

### Single Device DNS Configuration

**Windows Device:**
```
Control Panel → Network → Change adapter settings → Properties → IPv4 Properties
- Primary DNS: 192.168.1.74
- Secondary DNS: 8.8.8.8 (CRITICAL BACKUP)
```

**macOS/iOS Device:**
```
System Settings → Network → DNS Servers
- Add: 192.168.1.74
- Keep existing DNS as backup
```

**Android Device:**
```
WiFi Settings → Modify Network → Advanced → DNS
- Primary: 192.168.1.74  
- Secondary: 8.8.8.8
```

### Test Sequence
1. **Basic Connectivity**: Browse to google.com, youtube.com
2. **Control D Verification**: Visit verify.controld.com
3. **Streaming Test**: Test Netflix, etc. (Control D filtering impact)
4. **Performance Test**: Compare page load speeds

---

## 🔧 Phase 4: Network-Wide Deployment (HIGHEST RISK)

### ⚠️ DANGER ZONE - NETWORK OUTAGE POSSIBLE

**Prerequisites:**
- [ ] All previous phases completed successfully
- [ ] Multiple devices tested individually
- [ ] Recovery plan rehearsed
- [ ] Backup internet connection available (mobile hotspot)

### Router Configuration Options

**Option A: Primary DNS Only (Recommended)**
- Primary DNS: 192.168.1.74
- Secondary DNS: 8.8.8.8 (fallback)

**Option B: Full Control D**  
- Primary DNS: 192.168.1.74
- Secondary DNS: (blank - forces Control D usage)

### Router Access
```bash
# Common router addresses
http://192.168.1.1
http://192.168.0.1

# Common login credentials
admin/admin
admin/password  
admin/(blank)
```

---

## 🚨 EMERGENCY RECOVERY PROCEDURES

### IMMEDIATE INTERNET RESTORATION

#### Method 1: Router DNS Reset (FASTEST)
```
1. Access router admin panel (192.168.1.1)
2. Navigate to DNS settings
3. Set Primary DNS: 8.8.8.8
4. Set Secondary DNS: 8.8.4.4
5. Save settings
6. Reboot router
```

#### Method 2: Individual Device Recovery
```
Each affected device:
- Change DNS to 8.8.8.8 and 8.8.4.4
- Release/renew IP (ipconfig /release && ipconfig /renew)
- Clear DNS cache (ipconfig /flushdns)
```

#### Method 3: Windows Host Recovery
```powershell
# Remove port forwarding (run as admin)
netsh interface portproxy delete v4tov4 listenport=53 listenaddress=192.168.1.74 protocol=udp
netsh interface portproxy delete v4tov4 listenport=53 listenaddress=192.168.1.74 protocol=tcp

# Remove firewall rules
netsh advfirewall firewall delete rule name="DNS Server UDP"
netsh advfirewall firewall delete rule name="DNS Server TCP"
```

#### Method 4: WSL Service Recovery
```bash
# Stop problematic ctrld service
sudo ctrld stop --pin <deactivation_pin>

# Or restart WSL entirely
wsl --shutdown
```

---

## 🔍 Troubleshooting Guide

### Problem: No Internet After DNS Change
**Symptoms**: Can't reach any websites, DNS timeouts
**Solution**: 
1. Immediately revert DNS to 8.8.8.8
2. Check port forwarding status
3. Verify ctrld service running

### Problem: Slow DNS Resolution
**Symptoms**: Websites load slowly, DNS timeouts
**Solution**:
1. Check WSL resource usage
2. Restart ctrld service
3. Add secondary DNS (8.8.8.8)

### Problem: Control D Not Working
**Symptoms**: verify.controld.com doesn't resolve correctly
**Solution**:
1. Check ctrld service status
2. Verify resolver ID (1o6nbq1u58h)
3. Test direct WSL connection

### Problem: Some Sites Blocked
**Symptoms**: Certain websites won't load
**Solution**:
1. Check Control D dashboard for blocks
2. Temporarily use 8.8.8.8 to verify
3. Adjust Control D filtering rules

---

## 📋 Testing Checklist

### Pre-Migration Tests
- [ ] WSL ctrld service running and responding
- [ ] Control D resolver working (verify.controld.com)
- [ ] Port forwarding configured
- [ ] Firewall rules in place
- [ ] Single device test successful

### Post-Migration Tests  
- [ ] General web browsing (google.com, news sites)
- [ ] Video streaming (youtube.com, netflix.com)
- [ ] Email access (gmail.com, outlook.com)
- [ ] Gaming services (Steam, Xbox Live)
- [ ] Mobile devices connecting
- [ ] IoT devices functioning

### Performance Benchmarks
- [ ] DNS resolution speed (should be <100ms)
- [ ] Website load times comparable
- [ ] No timeout errors
- [ ] Consistent performance across devices

---

## 🛠️ Service Commands Reference

### WSL/Linux Commands
```bash
# Check service status
sudo ctrld status

# Restart service
sudo ctrld restart

# View logs
sudo tail -f /var/log/ctrld.log

# Test DNS locally
dig google.com @127.0.0.1
dig verify.controld.com @127.0.0.1
```

### Windows Commands
```powershell
# Check port forwarding
netsh interface portproxy show v4tov4

# Test DNS resolution
nslookup google.com 192.168.1.74

# Flush DNS cache
ipconfig /flushdns

# Check firewall rules
netsh advfirewall firewall show rule name="DNS Server UDP"
```

---

## 🎯 Success Criteria

### Migration Considered Successful When:
- [ ] All devices have internet connectivity
- [ ] Control D filtering active (verify.controld.com resolves)
- [ ] DNS resolution speed <100ms average
- [ ] No user complaints about blocked legitimate sites
- [ ] Streaming services working normally
- [ ] Gaming/apps functioning correctly

### Rollback Triggers
- **Any device loses internet connectivity**
- **DNS resolution >500ms consistently**  
- **Critical services stop working**
- **User experience significantly degraded**

---

## 📞 Emergency Contacts & Resources

### Backup DNS Servers (Always Available)
- Google: 8.8.8.8, 8.8.4.4
- Cloudflare: 1.1.1.1, 1.0.0.1
- Quad9: 9.9.9.9, 149.112.112.112

### Control D Support
- Dashboard: https://controld.com/dashboard
- Resolver ID: 1o6nbq1u58h
- Support: https://controld.com/support

### Network Recovery Tools
- Mobile hotspot for backup internet
- Router reset button (30-second hold)
- Alternative device with working DNS

---

## ⏱️ Estimated Timeline

- **Phase 1 Testing**: 15 minutes
- **Phase 2 Port Forward**: 30 minutes  
- **Phase 3 Device Test**: 1 hour
- **Phase 4 Network Deploy**: 2 hours
- **Total Migration**: 4 hours (with testing)

---

## 🔄 Rollback Plan Summary

**If ANY issues occur:**
1. **IMMEDIATE**: Router DNS → 8.8.8.8 + 8.8.4.4
2. **Secondary**: Individual device DNS reset  
3. **TERTIARY**: Remove Windows port forwarding
4. **LAST RESORT**: Stop WSL ctrld service

**Remember: Better to rollback quickly than debug during outage!**

---

*Document Version: 1.0*  
*Last Updated: 2025-08-13*  
*Network: 192.168.1.x*  
*DNS Server: 192.168.1.74 (forwarded to 172.22.150.21)*