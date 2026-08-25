param(
    [string]$LogPath = "$env:USERPROFILE\tdp-rehearsal-dns.log",
    [string]$PidPath = "$env:USERPROFILE\tdp-rehearsal-dns.pid"
)

if (Test-Path $PidPath) {
    $dnsPid = Get-Content $PidPath
    Stop-Process -Id $dnsPid -ErrorAction SilentlyContinue
    Remove-Item $PidPath
    Write-Host "dns responder pid=$dnsPid stopped"
}
if (Test-Path $LogPath) {
    Remove-Item $LogPath
    Write-Host "dns responder log deleted (it held every name the phone resolved)"
}
& (Join-Path $PSScriptRoot 'firewall.ps1') -Remove
