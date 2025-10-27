/** CREATED BY WAKAMA.farm & Supported by Solana foundation */
import fs from "fs-extra";
import crypto from "node:crypto";
import pinataSDK from "@pinata/sdk";
import 'dotenv/config.js';

const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT });
const dir = "../wakama-oracle-ingest/batches";

async function main() {
  if (!process.env.PINATA_JWT) {
    console.error("Missing PINATA_JWT in .env");
    process.exit(1);
  }
  const files = (await fs.readdir(dir)).filter(f=>f.endsWith(".json"));
  for (const f of files) {
    const p = `${dir}/${f}`;
    const data = await fs.readFile(p);
    const sha256 = crypto.createHash("sha256").update(data).digest("hex");
    const json = JSON.parse(data.toString("utf-8"));
    const res = await pinata.pinJSONToIPFS(json, {
      pinataMetadata: { name: f },
      pinataOptions: { cidVersion: 1 }
    });
    const cid = res.IpfsHash;
    console.log(JSON.stringify({ file:f, cid, sha256 }));
    // TODO: emit Solana devnet event here (next step)
  }
}
main().catch(e=>{ console.error(e); process.exit(1); });
