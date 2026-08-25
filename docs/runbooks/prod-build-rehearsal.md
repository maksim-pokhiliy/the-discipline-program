# Prod-build rehearsal — the real App-Store binary against the prod shim (apex-sunset P3.1)

Proves the REAL App-Store build on a REAL iPhone against the production shim through the
apex hostname — while public DNS still points at the legacy VPS (D-5 layer 3). The gate:
login → published day → profile pass on the real binary. Everything here is a one-off LAN
stand on the operator machine; nothing is exposed to the internet and no DNS record that
serves real traffic is touched.

**Status: PASSED 2026-08-25.** The v1.0.9 App-Store binary on a real iPhone signed in as
the demo athlete, browsed six published days, opened the profile and signed out — every
request `200` through the stand, verified in the caddy access log under the app's own
User-Agent (`TheDisciplineProgram/9 CFNetwork/… Darwin`), with the phone's apex lookups
answered by the DNS override. The recipe below is the configuration that actually worked,
not the one first designed — see "Host quirks" for what changed and why.

## Architecture (as it worked)

```
iPhone (Wi-Fi manual DNS → <LAN_IP>)
  → DNS responder ON WINDOWS  scripts: dns-override.ps1 — apex → <LAN_IP> (A), HTTPS-RR/AAAA → NODATA,
                              every other name forwarded to 1.1.1.1
  → caddy in Docker Desktop   <LAN_IP>:443 — genuine Let's Encrypt cert for the apex; reverse_proxy →
                              https://platform.thedisciplineprogram.com with the Host header rewritten
  → prod shim (Vercel) → Neon
```

Scripts live next to this runbook in `docs/runbooks/prod-build-rehearsal/`: `firewall.ps1`
(the two firewall layers, `-Remove` to undo), `dns-override.ps1` (the Windows-side DNS
responder), `teardown.ps1` (stops the responder, deletes its log, removes the rules).

## Host quirks (WSL mirrored networking + Docker Desktop) — read before building the stand

- **UDP published ports are NOT reachable from the LAN.** A dnsmasq container bound to
  `<LAN_IP>:53/udp` answered every probe from inside WSL and received ZERO queries from the
  phone; a PowerShell UDP responder on the Windows side of the same IP received the phone's
  queries within a second of starting. So the DNS override runs as a Windows process, not
  a container. (Symptom on the phone: an endless spinner — its only DNS server never
  answers — while Safari to `https://<LAN_IP>` works, because that needs no DNS.)
- **TCP published ports need TWO firewall layers.** Inbound from the LAN to a WSL listener
  passes the classic Windows Firewall (Private profile default = block; the Docker Desktop
  rules are per-program and do not match a WSL-stack listener, so port-based rules are
  needed) AND the Hyper-V firewall for the WSL VM creator (`{40E0AC32-…}`, default = block).
  `firewall.ps1` creates both pairs (UDP 53 + TCP 443).
- **The network profile must be Private** (Settings → Wi-Fi → the network → Private).
- **Windows-side reachability tests are not diagnostic**: in mirrored mode `Test-NetConnection
<LAN_IP> -Port 443` and `Resolve-DnsName -Server <LAN_IP>` fail from Windows even while the
  phone gets through, and WSL cannot reach the Windows-side responder by LAN IP. The phone
  is the test (Safari by IP for TCP; the responder log for UDP).
- **Bind on the LAN IP, not the wildcard**: `-p 0.0.0.0:53` was silently not bound at all
  (`NetworkSettings.Ports` empty); `-p <LAN_IP>:53:53/udp` binds.
- **Docker Desktop file bind-mounts go stale after a reboot** (`docker start` fails with
  "not a directory") — recreate containers with `docker run`, never `docker start`.
- With `appendWindowsPath=false` in `/etc/wsl.conf`, `docker pull` from WSL cannot find the
  credential helper: prefix commands with
  `PATH="$PATH:/mnt/c/Program Files/Docker/Docker/resources/bin"`.
- An IPv4-only dnsmasq `host-record` FORWARDS AAAA queries upstream (dnsmasq 2.90) — an
  iPhone would prefer the real IPv6 address and bypass the stand silently, turning the gate
  into a false positive against the legacy backend. The Windows responder answers NODATA for
  every non-A type on the apex name. Keep that property in any replacement.

## Live-verified facts this design rests on (2026-08-21 … 2026-08-25)

- The app is hardcoded to `https://thedisciplineprogram.com/api/v1` and does NO certificate
  pinning (standard URLSession/ATS) — a genuine publicly-trusted cert is accepted as-is.
- The Vercel edge refuses a request whose Host header differs from the TLS SNI
  (403 Forbidden, anti-domain-fronting) — the proxy MUST rewrite Host to
  `platform.thedisciplineprogram.com`. Consequence for P3.2: a bare DNS flip is not enough
  either — the apex must be added as a custom domain on the Vercel project.
- The apex is a Cloudflare-proxied A record; `www`/`platform`/`admin` are unproxied CNAMEs
  to Vercel; the zone has no CAA records, so Let's Encrypt can issue. The Cloudflare MCP
  token is read-only (write → `10000: Authentication error`) — the DNS-01 TXT is a human
  action in the dashboard.
- The catalog endpoints (`trainingLevel/all`, `userPlans`) are PUBLIC by legacy contract —
  the authorization check to smoke is `GET /program` with a garbage token → 403.
- The App Store listing is DELISTED (0 results in every storefront by 2026-08-21; the lapsed
  membership was processed). Installed copies keep working; a previously-used Apple ID can
  reinstall via App Store → account → Purchased; a fresh Apple ID cannot install.
- The legacy backend was alive and fast throughout (demo credentials → 403 in 0.5 s), so an
  app that reaches the VPS shows a login error, not a spinner — a spinner means no route.

## Prerequisites

- A real iPhone with the App-Store build installed; phone and PC on the same Wi-Fi with
  client isolation off; the PC's network profile set to Private.
- Admin PowerShell once (the firewall rules). Cloudflare dashboard access for ONE
  `_acme-challenge` TXT record.
- Docker Desktop running; port 443 free on the host.
- Working directory OUTSIDE any repo: `~/projects/contrib/tdp/rehearsal/` — certs and ACME
  state live here and never enter a repository.
- Demo athlete credentials (operator-held, never committed — see
  `docs/runbooks/appetize-stand.md`); its published window must cover the rehearsal date.

## 1 — Certificate (Let's Encrypt, DNS-01, apex name only)

certbot runs non-interactively with a blocking manual auth hook: the hook writes the
required TXT value into an exchange file, then waits for a `proceed` flag while the operator
sets the record and confirms propagation.

```sh
mkdir -p ~/projects/contrib/tdp/rehearsal/{exchange,letsencrypt,certs}
cd ~/projects/contrib/tdp/rehearsal
cat > auth-hook.sh <<'HOOK'
#!/bin/sh
echo "_acme-challenge.$CERTBOT_DOMAIN TXT $CERTBOT_VALIDATION" > /exchange/txt-instruction.txt
while [ ! -f /exchange/proceed ]; do sleep 2; done
HOOK
chmod +x auth-hook.sh
rm -f exchange/proceed exchange/txt-instruction.txt
export PATH="$PATH:/mnt/c/Program Files/Docker/Docker/resources/bin"

docker run -d --name tdp-rehearsal-certbot --memory=512m \
  -v "$PWD/letsencrypt:/etc/letsencrypt" \
  -v "$PWD/exchange:/exchange" \
  -v "$PWD/auth-hook.sh:/auth-hook.sh:ro" \
  certbot/certbot certonly --manual --preferred-challenges dns \
  --manual-auth-hook /auth-hook.sh \
  -d thedisciplineprogram.com \
  --agree-tos --register-unsafely-without-email --non-interactive
```

Then:

1. Read `exchange/txt-instruction.txt`; create that TXT record in the Cloudflare zone
   (name `_acme-challenge`, unproxied, TTL auto).
2. Confirm propagation via DoH:
   `curl -s "https://cloudflare-dns.com/dns-query?name=_acme-challenge.thedisciplineprogram.com&type=TXT" -H 'accept: application/dns-json'`
   — the Answer must carry the value from the instruction file.
3. `touch exchange/proceed` — certbot validates and writes the cert under
   `letsencrypt/live/thedisciplineprogram.com/`.
4. `docker logs tdp-rehearsal-certbot` must end in "Successfully received certificate";
   then materialize the symlinked PEMs for mounting (the files are root-owned):
   `docker run --rm -v "$PWD/letsencrypt:/etc/letsencrypt" -v "$PWD/certs:/certs" --entrypoint sh certbot/certbot -c "cp -L /etc/letsencrypt/live/thedisciplineprogram.com/fullchain.pem /etc/letsencrypt/live/thedisciplineprogram.com/privkey.pem /certs/"`
5. If the hook waited for hours (the TXT landed the next day), certbot may die with exit
   255 after `touch proceed` — just rerun the `docker run` (after `docker rm -f` of the old
   container): Let's Encrypt reuses the pending authorization, so the SAME TXT value is
   requested and the record already in place validates immediately.
6. The TXT record can be deleted right away. The cert (90 days) is kept on the operator
   machine until P3.2 completes, then discarded — the cutover uses a Vercel-issued cert.

## 2 — Firewall (admin PowerShell, once)

```powershell
powershell -ExecutionPolicy Bypass -File <repo>\docs\runbooks\prod-build-rehearsal\firewall.ps1
```

Prints "created" for both Hyper-V rules and both Windows Firewall port rules (idempotent).

## 3 — DNS responder (Windows side)

```powershell
# from any PowerShell (port 53 needs no elevation on Windows); runs hidden, logs to
# %USERPROFILE%\tdp-rehearsal-dns.log, pid to %USERPROFILE%\tdp-rehearsal-dns.pid
Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass',
  '-File','<repo>\docs\runbooks\prod-build-rehearsal\dns-override.ps1','-LanIp','<LAN_IP>'
```

`<LAN_IP>` = the PC's IPv4 on the Wi-Fi network (`ip -4 addr show | grep 192.168` in WSL;
the same address shows in Windows Wi-Fi properties). The log is the UDP-path test: once the
phone's DNS points at the PC, its queries appear within seconds. The log holds every name
the phone resolves — `teardown.ps1` deletes it.

## 4 — caddy (Docker Desktop; TLS termination + Host-rewritten forward)

```sh
cd ~/projects/contrib/tdp/rehearsal
cat > Caddyfile <<'CADDY'
thedisciplineprogram.com {
	log
	tls /certs/fullchain.pem /certs/privkey.pem
	reverse_proxy https://platform.thedisciplineprogram.com {
		header_up Host platform.thedisciplineprogram.com
		transport http {
			tls_server_name platform.thedisciplineprogram.com
		}
	}
}
CADDY

docker run -d --name tdp-rehearsal-proxy --memory=256m \
  -p <LAN_IP>:443:443 \
  -v "$PWD/Caddyfile:/etc/caddy/Caddyfile:ro" \
  -v "$PWD/certs:/certs:ro" \
  caddy:2-alpine
```

`log` enables the access log (`docker logs tdp-rehearsal-proxy`, one JSON line per handled
request, User-Agent included) — without it a working stand looks silent. Phone requests
arrive with `remote_ip 172.17.0.1` (docker-proxy NAT), so filter by User-Agent, not by IP.

## 5 — PC-side smoke (before touching the phone)

```sh
curl -sS --resolve thedisciplineprogram.com:443:<LAN_IP> \
  -X POST https://thedisciplineprogram.com/api/v1/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"username":"<demo email>","password":"<operator-held>"}' \
  -o /dev/null -w 'signin via stand: %{http_code}\n'
```

200 proves TLS with the genuine cert → Host-rewritten forward → prod shim (only our shim
knows the demo credentials; the legacy backend answers 403 to them). A garbage-token
`GET /api/v1/program?userId=990001&scheduledDate=<today>` through the same `--resolve` must
return 403. `openssl s_client -connect <LAN_IP>:443 -servername thedisciplineprogram.com`
shows the Let's Encrypt cert.

## 6 — Phone gate (the owner drives)

1. Settings → Wi-Fi → (i) on the current network → Configure DNS → Manual → delete the
   automatic entries, add `<LAN_IP>` (IPv4 only — no IPv6 entry) → Save.
2. **TCP path check:** Safari → `https://<LAN_IP>` → a certificate warning means the request
   reached caddy (the apex cert does not match an IP — expected). An endless load means the
   firewall layers are not open.
3. **UDP path check:** the responder log shows the phone's queries; the apex lookup shows
   `-> local <LAN_IP>` and the HTTPS-RR (type 65) lookup `-> nodata`.
4. Kill and reopen the installed App-Store app; sign in as the demo athlete.
5. Today's published day renders; browse a few days forward; open the profile; sign out.
6. Verify in the caddy access log: `POST /api/v1/auth/signin 200`, `GET /api/v1/program…
200` per day browsed, `GET /api/v1/user/990001 200`, all under the app's User-Agent.
7. Settings → Wi-Fi → Configure DNS → back to Automatic.

## 7 — Teardown

```sh
docker rm -f tdp-rehearsal-proxy tdp-rehearsal-certbot
```

```powershell
# admin PowerShell: stops the responder, deletes its log and pid file, removes all four rules
powershell -ExecutionPolicy Bypass -File <repo>\docs\runbooks\prod-build-rehearsal\teardown.ps1
```

Phone DNS back to Automatic (step 6.7) BEFORE stopping the responder, or the phone loses
name resolution on that Wi-Fi. Keep `~/projects/contrib/tdp/rehearsal/` until P3.2
completes, then delete it (the cert key with it). The stand must never be port-forwarded
beyond the LAN.
