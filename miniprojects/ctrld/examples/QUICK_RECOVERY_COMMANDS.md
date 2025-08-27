# 🚨 QUICK RECOVERY COMMANDS - DNS EMERGENCY

## IMMEDIATE INTERNET RESTORATION (Copy & Paste)

### Windows PowerShell (Run as Administrator)
```powershell
# EMERGENCY DNS RESTORATION - COPY ALL LINES
netsh interface portproxy delete v4tov4 listenport=53 listenaddress=192.168.1.74 protocol=udp
netsh interface portproxy delete v4tov4 listenport=53 listenaddress=192.168.1.74 protocol=tcp
netsh advfirewall firewall delete rule name="DNS Server UDP"  
netsh advfirewall firewall delete rule name="DNS Server TCP"
ipconfig /flushdns
ipconfig /release
ipconfig /renew
```

### Router Quick Access (Try These URLs)
```
http://192.168.1.1
http://192.168.0.1
http://10.0.0.1
```
**LOGIN**: admin/admin OR admin/password OR admin/(blank)

### Router DNS Settings (Set Immediately)
```
Primary DNS: 8.8.8.8
Secondary DNS: 8.8.4.4
```

### WSL Emergency Stop
```bash
# If WSL is causing issues
sudo ctrld stop
# OR force shutdown WSL
wsl --shutdown
```

### Device DNS Reset (Manual)
**Windows**: Control Panel → Network → IPv4 → DNS: 8.8.8.8, 8.8.4.4  
**macOS**: System Preferences → Network → DNS: 8.8.8.8  
**Mobile**: WiFi Settings → DNS: 8.8.8.8

---

## TEST CONNECTIVITY
```cmd
ping 8.8.8.8
nslookup google.com 8.8.8.8
```

## BACKUP INTERNET
- Enable mobile hotspot
- Use different WiFi network  
- USB tethering from phone

---

**🔥 REMEMBER: Router DNS change affects entire network immediately!**  
**✅ Always have backup internet ready before DNS changes!**