# Prod-build rehearsal — the real App-Store binary against the prod shim (apex-sunset P3.1)

Proves the REAL App-Store build on a REAL iPhone against the production shim through the
apex hostname — while public DNS still points at the legacy VPS (D-5 layer 3). The gate:
login → published day → profile pass on the real binary. Everything here is a one-off
LAN stand on the operator machine; nothing is exposed to the internet and no DNS record
that serves real traffic is touched.

## Architecture

```
iPhone (Wi-Fi manual DNS → <LAN_IP>)
  → dnsmasq :53/udp   apex name only → <LAN_IP>; every other name forwarded upstream
  → caddy :443        genuine Let's Encrypt cert for the apex; reverse_proxy →
                      https://platform.thedisciplineprogram.com with the Host header rewritten
  → prod shim (Vercel) → Neon
```

## Live-verified facts this design rests on (2026-08-21)

- The app is hardcoded to `https://thedisciplineprogram.com/api/v1` and does NO
  certificate pinning (standard URLSession/ATS) — a genuine publicly-trusted cert for
  the apex is accepted as-is.
- The Vercel edge refuses a request whose Host header differs from the TLS SNI
  (403 Forbidden, anti-domain-fronting) — so the proxy MUST rewrite Host to
  `platform.thedisciplineprogram.com`; with the rewrite the shim answers normally.
  (Consequence for P3.2: a bare DNS flip is not enough either — the apex must be added
  as a custom domain on the Vercel project.)
- The apex is a Cloudflare-proxied A record; `www`/`platform`/`admin` are unproxied
  CNAMEs to Vercel. The zone has no CAA records, so Let's Encrypt can issue.
- WSL runs in mirrored networking mode and Docker is Docker Desktop — ports published
  by containers listen on the Windows host and are reachable from the LAN.
- The App Store listing is DELISTED (the lapsed membership was processed between
  2026-08-07 and 2026-08-21). Installed copies keep working; a previously-used Apple ID
  can reinstall via App Store → account → Purchased. A fresh Apple ID cannot install —
  the rehearsal needs a phone that already has (or once had) the app.

## Prerequisites

- A real iPhone with the App-Store build installed; phone and the operator PC on the
  same Wi-Fi network with client isolation off.
- Cloudflare access for ONE `_acme-challenge` TXT record (API token with DNS edit, or
  a human in the dashboard).
- Docker Desktop running; ports 53/udp and 443 free on the host (fallback if 53 is
  taken on the wildcard address: publish on the LAN IP only, `-p <LAN_IP>:53:53/udp`).
- Working directory on the operator machine, OUTSIDE any repo:
  `~/projects/contrib/tdp/rehearsal/` — certs and ACME state live here and never enter
  a repository.
- Demo athlete credentials (operator-held, never committed — see
  `docs/runbooks/appetize-stand.md`); its published window must cover the rehearsal
  date — re-seed recipe in the same runbook if the date slipped.

## 1 — Certificate (Let's Encrypt, DNS-01, apex name only)

certbot runs non-interactively with a blocking manual auth hook: the hook writes the
required TXT value into an exchange file, then waits for a `proceed` flag while the
operator sets the record and confirms propagation.

```sh
mkdir -p ~/projects/contrib/tdp/rehearsal/{exchange,letsencrypt,certs}
cd ~/projects/contrib/tdp/rehearsal
cat > auth-hook.sh <<'EOF'
#!/bin/sh
echo "_acme-challenge.$CERTBOT_DOMAIN TXT $CERTBOT_VALIDATION" > /exchange/txt-instruction.txt
while [ ! -f /exchange/proceed ]; do sleep 2; done
EOF
chmod +x auth-hook.sh
rm -f exchange/proceed exchange/txt-instruction.txt

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
   (name `_acme-challenge.thedisciplineprogram.com`, unproxied, TTL auto).
2. Confirm propagation via DoH:
   `curl -s "https://cloudflare-dns.com/dns-query?name=_acme-challenge.thedisciplineprogram.com&type=TXT" -H 'accept: application/dns-json'`
   — the Answer must carry the value from the instruction file.
3. `touch exchange/proceed` — certbot validates and writes the cert under
   `letsencrypt/live/thedisciplineprogram.com/`.
4. `docker logs tdp-rehearsal-certbot` must end in "Successfully received certificate";
   then materialize the symlinked PEMs for mounting:
   `cp -L letsencrypt/live/thedisciplineprogram.com/{fullchain.pem,privkey.pem} certs/`
5. The TXT record can be deleted right away. The cert (90 days) is kept on the operator
   machine until P3.2 completes, then discarded — the cutover itself uses a
   Vercel-issued cert, not this one.

## 2 — dnsmasq (apex override, everything else passed through)

`host-record` matches the exact apex name ONLY — `www`/`platform`/`admin` resolve
normally through the upstream, so the phone's browser and every other app keep working.

```sh
LAN_IP=<the PC's IPv4 on the Wi-Fi network>   # ip -4 addr show | grep 192.168
cat > dnsmasq.conf <<EOF
port=53
no-resolv
server=1.1.1.1
server=1.0.0.1
host-record=thedisciplineprogram.com,$LAN_IP
log-queries
EOF

docker run -d --name tdp-rehearsal-dns --memory=256m \
  -p 53:53/udp \
  -v "$PWD/dnsmasq.conf:/etc/dnsmasq.conf:ro" \
  alpine:3.20 sh -c "apk add --no-cache dnsmasq && exec dnsmasq -k -C /etc/dnsmasq.conf"
```

## 3 — caddy (TLS termination + Host-rewritten forward)

```sh
cat > Caddyfile <<'EOF'
thedisciplineprogram.com {
	tls /certs/fullchain.pem /certs/privkey.pem
	reverse_proxy https://platform.thedisciplineprogram.com {
		header_up Host platform.thedisciplineprogram.com
		transport http {
			tls_server_name platform.thedisciplineprogram.com
		}
	}
}
EOF

docker run -d --name tdp-rehearsal-proxy --memory=256m \
  -p 443:443 \
  -v "$PWD/Caddyfile:/etc/caddy/Caddyfile:ro" \
  -v "$PWD/certs:/certs:ro" \
  caddy:2-alpine
```

## 4 — PC-side smoke (before touching the phone)

```sh
curl -sS --resolve thedisciplineprogram.com:443:$LAN_IP \
  -X POST https://thedisciplineprogram.com/api/v1/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"username":"<demo email>","password":"<operator-held>"}' \
  -o /dev/null -w 'signin via stand: %{http_code}\n'
```

200 proves the whole chain: DNS-override name → local TLS with the genuine cert →
Host-rewritten forward → prod shim. A garbage-token
`GET /api/v1/trainingLevel/all` through the same `--resolve` must return the shim's 403
(JSON body), not Vercel's plain-text Forbidden.

## 5 — Phone gate (the owner drives)

1. Settings → Wi-Fi → (i) on the current network → Configure DNS → Manual → delete the
   automatic entries, add `<LAN_IP>` → Save.
2. Open the installed App-Store app (kill and reopen if it was backgrounded).
3. Sign in as the demo athlete.
4. Today's published day renders (the same content the Appetize stand shows).
5. Profile renders (name, plan, level).
6. Sign out.
7. Settings → Wi-Fi → Configure DNS → back to Automatic.

Any failure: check `docker logs tdp-rehearsal-dns` (were the phone's queries arriving?)
and `docker logs tdp-rehearsal-proxy` (did the request reach caddy, what did the
upstream answer?).

## 6 — Teardown

```sh
docker rm -f tdp-rehearsal-dns tdp-rehearsal-proxy tdp-rehearsal-certbot
```

Phone DNS back to Automatic (step 5.7). Keep `~/projects/contrib/tdp/rehearsal/` until
P3.2 completes, then delete it (the cert key with it). The stand must never be
port-forwarded beyond the LAN.
