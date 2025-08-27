# EMERGENCY DNS RECOVERY SCRIPT
# Run as Administrator in PowerShell if DNS causes network outage
# This script will immediately restore internet connectivity

Write-Host "🚨 EMERGENCY DNS RECOVERY STARTING..." -ForegroundColor Red
Write-Host "This will restore internet connectivity by removing custom DNS configuration" -ForegroundColor Yellow

# Remove Control D port forwarding
Write-Host "Removing DNS port forwarding..." -ForegroundColor Cyan
try {
    netsh interface portproxy delete v4tov4 listenport=53 listenaddress=192.168.1.74 protocol=udp 2>$null
    netsh interface portproxy delete v4tov4 listenport=53 listenaddress=192.168.1.74 protocol=tcp 2>$null
    Write-Host "✅ Port forwarding removed" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Port forwarding removal failed (may not exist)" -ForegroundColor Yellow
}

# Remove firewall rules  
Write-Host "Removing firewall rules..." -ForegroundColor Cyan
try {
    netsh advfirewall firewall delete rule name="DNS Server UDP" 2>$null
    netsh advfirewall firewall delete rule name="DNS Server TCP" 2>$null
    Write-Host "✅ Firewall rules removed" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Firewall rule removal failed (may not exist)" -ForegroundColor Yellow
}

# Flush DNS cache
Write-Host "Flushing DNS cache..." -ForegroundColor Cyan
ipconfig /flushdns
Write-Host "✅ DNS cache flushed" -ForegroundColor Green

# Test internet connectivity
Write-Host "Testing internet connectivity..." -ForegroundColor Cyan
$testSites = @("8.8.8.8", "google.com", "cloudflare.com")

foreach ($site in $testSites) {
    try {
        $result = Test-NetConnection -ComputerName $site -Port 80 -WarningAction SilentlyContinue
        if ($result.TcpTestSucceeded) {
            Write-Host "✅ Connection to $site successful" -ForegroundColor Green
        } else {
            Write-Host "❌ Connection to $site failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Connection test to $site failed" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔧 MANUAL STEPS NEEDED:" -ForegroundColor Yellow
Write-Host "1. Access your router admin panel (usually http://192.168.1.1)" -ForegroundColor White
Write-Host "2. Navigate to DNS settings" -ForegroundColor White  
Write-Host "3. Set Primary DNS to: 8.8.8.8" -ForegroundColor White
Write-Host "4. Set Secondary DNS to: 8.8.4.4" -ForegroundColor White
Write-Host "5. Save settings and reboot router" -ForegroundColor White

Write-Host ""
Write-Host "📱 DEVICE-SPECIFIC DNS RESET:" -ForegroundColor Yellow
Write-Host "Windows: Control Panel → Network → Adapter Settings → IPv4 → DNS" -ForegroundColor White
Write-Host "macOS: System Preferences → Network → Advanced → DNS" -ForegroundColor White
Write-Host "iPhone: Settings → WiFi → Configure DNS → Manual" -ForegroundColor White
Write-Host "Android: WiFi Settings → Modify Network → Advanced → DNS" -ForegroundColor White

Write-Host ""
Write-Host "🆘 IF STILL NO INTERNET:" -ForegroundColor Red
Write-Host "1. Restart your router (unplug for 30 seconds)" -ForegroundColor White
Write-Host "2. Use mobile hotspot as backup internet" -ForegroundColor White
Write-Host "3. Contact ISP if problem persists" -ForegroundColor White

Write-Host ""
Write-Host "✅ EMERGENCY RECOVERY COMPLETED" -ForegroundColor Green
Write-Host "Your internet should be restored. If not, follow manual steps above." -ForegroundColor Cyan

pause