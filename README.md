# wakama-oracle-publisher

🔁 Pins JSON sensor batches to **IPFS (Pinata)**  
🟣 Posts a **Solana Devnet** transaction with a memo `{ cid, sha256, count, ts_min, ts_max }`  
🧾 Writes a JSON **receipt** in `receipts/` and a CSV log in `runs/`  
📡 Regenerates the dashboard snapshot: `../wakama-dashboard/public/now.json`

**Developed by** Wakama Edge Ventures (Wakama.farm) — **dev@wakama.farm**  
**Supported by** Solana Foundation

---

## ✨ What it does

- Reads a batch:
  - either from **ingest**: `../wakama-oracle-ingest/batches/*.json` (latest file)
  - or **simulated**: `node src/publish.cjs --sim`
- Computes **SHA-256** on the **exact file bytes** before upload
- Uploads to **Pinata** using **API key + secret (v1)**  
  ➜ **JWT v3 was dropped** because it didn’t return a stable `IpfsHash` in our tests
- Emits a **0 SOL** transfer on **Solana Devnet** with the batch metadata in the **memo**
- Writes:
  - a JSON receipt in `receipts/<ts>-receipt.json`
  - a CSV line in `runs/devnet_YYYY-MM-DD.csv`
  - a consolidated snapshot to `../wakama-dashboard/public/now.json` (so the dashboard shows it)

---

## 🧱 Architecture

```text
ingest (or simulated)
      ↓
src/publish.cjs
      ↓
Pinata (file → CID) + Solana Devnet tx (memo)
      ↓
receipts/*.json
      ↓
tools/build-now.cjs ──→ ../wakama-dashboard/public/now.json
      ↓
Dashboard Now Playing (CID / Tx / Status / Source)
publisher = producer

dashboard = viewer

🗂 Repo layout (expected)
text
Copier le code
~/dev/wakama/
  ├─ wakama-dashboard
  │    └─ public/now.json              ← written by this repo
  └─ wakama-oracle-publisher
       ├─ src/publish.cjs
       ├─ tools/build-now.cjs
       ├─ tools/export-now.cjs
       ├─ receipts/                    ← generated receipts
       ├─ runs/                        ← CSV logs
       ├─ tmp/                         ← simulated batches
       └─ .env                         ← NOT committed
The path ../wakama-dashboard/public/now.json is important. Don’t change it unless you also change the dashboard.

🔧 Prerequisites
Node.js 18+

Solana CLI installed and configured on Devnet:

bash
Copier le code
solana config get
# RPC URL: https://api.devnet.solana.com
# Keypair: /home/wakama/.config/solana/wakama-devnet.json
A Pinata account with API key and API secret (not JWT)

The dashboard repo present at: ../wakama-dashboard

⚙️ Environment
Create a .env file at the root of wakama-oracle-publisher:

dotenv
Copier le code
PINATA_API_KEY=your_pinata_key_here
PINATA_API_SECRET=your_pinata_secret_here

ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
ANCHOR_WALLET=/home/wakama/.config/solana/wakama-devnet.json

# optional: where to read ingest batches from
# INGEST_DIR=/home/wakama/dev/wakama/wakama-oracle-ingest
# PUBLISH_RETRY_MAX=5
# PUBLISH_BACKOFF_MS=800
👉 Important change vs your old README:
PINATA_JWT is no longer used. We use PINATA_API_KEY + PINATA_API_SECRET because that’s what actually gave us a stable IpfsHash in the current workflow.

We keep a committable example file:

📄 .env.example
dotenv
Copier le code
# Pinata API (v1)
PINATA_API_KEY=YOUR_PINATA_API_KEY
PINATA_API_SECRET=YOUR_PINATA_API_SECRET

# Solana Devnet setup
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
ANCHOR_WALLET=/home/wakama/.config/solana/wakama-devnet.json

# Optional: path to ingest batches
# INGEST_DIR=/home/wakama/dev/wakama/wakama-oracle-ingest

# Optional: retries
# PUBLISH_RETRY_MAX=5
# PUBLISH_BACKOFF_MS=800
Add this file to the repo, keep .env ignored.

📦 Install
bash
Copier le code
npm install
🏃‍♂️ NPM scripts
Package.json should contain:

json
Copier le code
{
  "scripts": {
    "publish_safe": "node src/publish.cjs && npm run export_now",
    "publish_sim": "node src/publish.cjs --sim && npm run export_now",
    "export_now": "node tools/build-now.cjs receipts ../wakama-dashboard/public/now.json",
    "verify": "node src/verify.cjs"
  }
}
▶️ Simulated publish (demo)
bash
Copier le code
npm run publish_sim
What this does:

builds a simulated sensor batch (DHT22, DS18B20, soil)

pins it to Pinata

sends a Solana Devnet tx with memo

writes receipts/<ts>-receipt.json

regenerates ../wakama-dashboard/public/now.json

Then open the dashboard → you should see:

Source = simulated

Status = confirmed / unknown

Tx = clickable Devnet link

▶️ Real/ingest publish
bash
Copier le code
npm run publish_safe
This will take the latest JSON from INGEST_DIR/batches, publish it, and refresh the dashboard snapshot.

🧾 Receipts & CSV
Each publish produces a receipt:

json
Copier le code
{
  "cid": "QmXJ96ELnmvueG7Sv...",
  "sha256": "bc0bc2e170d40f83ef7...",
  "tx": "3eNEgaPszzU2tsHfK5n...",
  "file": "wakama-batch-2025-10-29T22-27-20-617Z.json",
  "gw": "https://gateway.pinata.cloud/ipfs",
  "source": "simulated",
  "status": "confirmed",
  "slot": 288328921,
  "ts": "2025-10-29T22:27:20.617Z"
}
And a CSV line in:

text
Copier le code
runs/devnet_YYYY-MM-DD.csv
with:

text
Copier le code
file,cid,sha256,tx,ts
This is compatible with your old README (you keep the CSV trace for audit).

🔐 Data integrity
We kept your wording but updated to the current flow:

SHA-256 is computed before upload → this is the reference hash

After upload, we re-download from the Pinata gateway and re-hash: if it doesn’t match → we fail

Solana tx memo contains the same tuple: {cid, sha256, count, ts_min, ts_max}

Retry/backoff on:

Pinata upload

Solana memo

Dashboard always shows what is in public/now.json → which comes only from receipts

🔍 Verify
Tx:

bash
Copier le code
solana confirm <tx> --url https://api.devnet.solana.com --output json
API:

bash
Copier le code
curl -s http://localhost:3000/api/now
IPFS:
open:
https://gateway.pinata.cloud/ipfs/<CID>

📝 Credits
© 2025 Wakama Edge Ventures — Wakama.farm
Developed by Wakama Edge Ventures — dev@wakama.farm
Supported by Solana Foundation
