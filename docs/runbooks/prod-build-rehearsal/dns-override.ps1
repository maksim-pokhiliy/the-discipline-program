param(
    [Parameter(Mandatory = $true)][string]$LanIp,
    [string]$OverrideName = 'thedisciplineprogram.com',
    [string]$Upstream = '1.1.1.1',
    [string]$LogPath = "$env:USERPROFILE\tdp-rehearsal-dns.log",
    [string]$PidPath = "$env:USERPROFILE\tdp-rehearsal-dns.pid"
)

$overrideIp = [System.Net.IPAddress]::Parse($LanIp)
Set-Content -Path $PidPath -Value $PID

function Write-Log([string]$line) {
    Add-Content -Path $LogPath -Value ("{0} {1}" -f (Get-Date -Format 'HH:mm:ss'), $line)
}

function Read-Question([byte[]]$msg) {
    $offset = 12
    $labels = @()
    while ($msg[$offset] -ne 0) {
        $len = $msg[$offset]
        $labels += [System.Text.Encoding]::ASCII.GetString($msg, $offset + 1, $len)
        $offset += $len + 1
    }
    $offset += 1
    $qtype = ($msg[$offset] -shl 8) -bor $msg[$offset + 1]
    return @{ Name = ($labels -join '.'); Type = $qtype; End = $offset + 4 }
}

function Build-Local([byte[]]$req, [int]$qEnd, [bool]$withA) {
    $flags = 0x8580 -bor ($req[2] -band 0x01) * 0x100
    $out = New-Object System.Collections.Generic.List[byte]
    $out.Add($req[0]); $out.Add($req[1])
    $out.Add([byte](($flags -shr 8) -band 0xFF)); $out.Add([byte]($flags -band 0xFF))
    $out.Add(0); $out.Add(1)
    $out.Add(0); $out.Add([byte]$(if ($withA) { 1 } else { 0 }))
    $out.Add(0); $out.Add(0); $out.Add(0); $out.Add(0)
    for ($i = 12; $i -lt $qEnd; $i++) { $out.Add($req[$i]) }
    if ($withA) {
        foreach ($b in @(0xC0, 0x0C, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x3C, 0x00, 0x04)) { $out.Add([byte]$b) }
        foreach ($b in $overrideIp.GetAddressBytes()) { $out.Add($b) }
    }
    return $out.ToArray()
}

function Forward-Upstream([byte[]]$req) {
    $client = New-Object System.Net.Sockets.UdpClient
    $client.Client.ReceiveTimeout = 3000
    try {
        [void]$client.Send($req, $req.Length, $Upstream, 53)
        $ep = New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Any, 0)
        return $client.Receive([ref]$ep)
    } catch {
        $fail = [byte[]]$req.Clone()
        $fail[2] = 0x81; $fail[3] = 0x82
        return $fail
    } finally {
        $client.Close()
    }
}

$server = New-Object System.Net.Sockets.UdpClient(New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Any, 53))
Write-Log "listening on 0.0.0.0:53 pid=$PID override $OverrideName -> $LanIp"
while ($true) {
    $remote = New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Any, 0)
    try {
        $req = $server.Receive([ref]$remote)
        $q = Read-Question $req
        if ($q.Name -ieq $OverrideName) {
            $resp = Build-Local $req $q.End ($q.Type -eq 1)
            Write-Log ("{0} {1} type={2} -> local {3}" -f $remote.Address, $q.Name, $q.Type, $(if ($q.Type -eq 1) { $LanIp } else { 'nodata' }))
        } else {
            $resp = Forward-Upstream $req
            Write-Log ("{0} {1} type={2} -> upstream" -f $remote.Address, $q.Name, $q.Type)
        }
        [void]$server.Send($resp, $resp.Length, $remote)
    } catch {
        Write-Log ("error: {0}" -f $_.Exception.Message)
    }
}
