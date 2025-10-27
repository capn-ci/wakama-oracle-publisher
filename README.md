# wakama-oracle-publisher
Pins JSON batches to IPFS (Pinata). Posts a Solana Memo on devnet with `{cid, sha256, count, ts_min, ts_max}`. Writes a daily CSV manifest in `runs/`.

## How it works
1) Reads `../wakama-oracle-ingest/batches/*.json`
2) Computes SHA-256 of file bytes
3) Pinata pin (CID v1)
4) Solana Memo tx on devnet with payload
5) Append `{file,cid,sha256,tx,ts}` to `runs/devnet_YYYY-MM-DD.csv`

## Verify
- `solana confirm <tx>` on devnet
- Open IPFS CID via a public gateway

**Signature:** CREATED BY WAKAMA.farm & Supported by Solana foundation
