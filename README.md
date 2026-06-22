# LocalShare

Share text and files across any devices on the same WiFi, like AirDrop for your local network, $0, no internet required

## Requirements

- Node.js 18+

## Setup

```bash
npm install
```

## Run

```bash
npm start
```

## Usage

Open the LAN URL printed in the terminal on any device on the same WiFi, or scan the QR code at <LAN URL>/qr from a phone.

No cloud hosting or credit card is needed since everything runs on the local network.

## Deploy Online With Your Domain

LocalShare now groups sharing by the client IP the server sees. That means one public deployment can serve many separate local networks at the same time: people behind the same router will land in the same room, and people behind different routers will land in different rooms.

### Recommended setup: one public server + your domain

Best fit when you already own a domain and want free, no-card public access.

What you need:

- Any always-on Node.js host. A small VPS, home server, mini PC, NAS, or Raspberry Pi all work.
- Your domain
- A way to route your domain to the app, either directly with a public IP or through a free tunnel

Steps:

1. Install dependencies and start the app on the host:

```bash
npm install
npm start
```

2. Point your domain or subdomain, such as `share.yourdomain.com`, to that app.
3. Open `https://share.yourdomain.com` from anywhere.
4. Users on the same router will automatically share the same room because the server sees the same public IP for them.

Important:

- You do not need one deployment per city. One deployment can host many rooms automatically.
- The privacy boundary is the public IP visible to the server. If two people come from the same router or NAT, they will share the same room.
- If two different networks happen to share the same outbound public IP through carrier NAT or a corporate VPN, they will also share the same room.

### If you use a tunnel or reverse proxy

The server must receive the real client IP in `X-Forwarded-For` for room isolation to work correctly.

- Cloudflare Tunnel works well for this because it forwards the original client IP.
- If you use Nginx, Caddy, or another proxy, make sure it forwards the real IP headers.

### If you want a hosted demo instead

Hugging Face Spaces can run a small Node.js app, but it is better for demos than for private file sharing. File storage is not a good long-term fit there, and sleeping apps are common on free tiers. Use it only if you want to test the app online quickly.

### Why this approach works

LocalShare stores uploads in the local filesystem and groups sockets by the client IP the server sees. That makes it behave like a local AirDrop-style room, but still reachable from the internet through your domain.