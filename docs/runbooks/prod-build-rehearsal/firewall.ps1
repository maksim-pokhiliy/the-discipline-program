param([switch]$Remove)

$vmCreator = '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}'
$rules = @(
    @{ Name = 'tdp-rehearsal-dns'; Protocol = 'UDP'; Port = 53 },
    @{ Name = 'tdp-rehearsal-https'; Protocol = 'TCP'; Port = 443 }
)

foreach ($r in $rules) {
    $hyperv = Get-NetFirewallHyperVRule -Name $r.Name -ErrorAction SilentlyContinue
    $hostRule = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
    if ($Remove) {
        if ($hyperv) { Remove-NetFirewallHyperVRule -Name $r.Name; Write-Host "$($r.Name): hyper-v rule removed" }
        if ($hostRule) { Remove-NetFirewallRule -DisplayName $r.Name; Write-Host "$($r.Name): windows firewall rule removed" }
        continue
    }
    if (-not $hyperv) {
        New-NetFirewallHyperVRule -Name $r.Name -DisplayName $r.Name -Direction Inbound `
            -VMCreatorId $vmCreator -Protocol $r.Protocol -LocalPorts $r.Port -Action Allow | Out-Null
        Write-Host "$($r.Name): hyper-v rule created (inbound $($r.Protocol) $($r.Port) for WSL)"
    } else {
        Write-Host "$($r.Name): hyper-v rule already exists"
    }
    if (-not $hostRule) {
        New-NetFirewallRule -DisplayName $r.Name -Direction Inbound -Protocol $r.Protocol `
            -LocalPort $r.Port -Action Allow -Profile Private, Public | Out-Null
        Write-Host "$($r.Name): windows firewall port rule created (inbound $($r.Protocol) $($r.Port))"
    } else {
        Write-Host "$($r.Name): windows firewall port rule already exists"
    }
}

Get-NetFirewallHyperVRule | Where-Object { $_.Name -like 'tdp-rehearsal-*' } |
    Select-Object Name, Direction, Action, Protocol, LocalPorts | Format-Table -AutoSize
Get-NetFirewallRule -DisplayName 'tdp-rehearsal-*' -ErrorAction SilentlyContinue |
    Select-Object DisplayName, Direction, Action, Enabled, Profile | Format-Table -AutoSize
