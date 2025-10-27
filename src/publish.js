/** CREATED BY WAKAMA.farm & Supported by Solana foundation */
import fs from "fs-extra";
import os from "os";
import crypto from "node:crypto";
import pinataSDK from "@pinata/sdk";
import 'dotenv/config.js';
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js";
import { appendRow } from "./manifest.js";

const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT });
const dir = "../wakama-oracle-ingest/batches";
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

function expandHome(p){ return p?.startsWith("~/") ? p.replace("~", os.homedir()) : p; }

async function main() {
  if (!process.env.PINATA_JWT) throw new Error("Missing PINATA_JWT");
  const url = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  const connection = new Connection(url, "confirmed");

  const walletPath = expandHome(process.env.ANCHOR_WALLET || "~/.config/solana/id.json");
  const secret = Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")));
  const kp = Keypair.fromSecretKey(secret);

  const files = (await fs.readdir(dir)).filter(f=>f.endsWith(".json"));
  for (const f of files) {
    const p = `${dir}/${f}`;
    const data = await fs.readFile(p);
    const sha256 = crypto.createHash("sha256").update(data).digest("hex");
    const json = JSON.parse(data.toString("utf-8"));

    const res = await pinata.pinJSONToIPFS(json, { pinataMetadata:{name:f}, pinataOptions:{cidVersion:1} });
    const cid = res.IpfsHash;

    const memoObj = {
      cid, sha256,
      count: json.count ?? (json.measures?.length ?? 0),
      ts_min: json.ts_min ?? "", ts_max: json.ts_max ?? ""
    };
    const ix = new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(JSON.stringify(memoObj), "utf8")
    });
    const tx = new Transaction().add(ix);
    const sig = await sendAndConfirmTransaction(connection, tx, [kp], { commitment: "confirmed" });

    const out = { file:f, cid, sha256, tx:sig, ts:new Date().toISOString() };
    console.log(JSON.stringify(out));
    appendRow(out);
  }
}
main().catch(e=>{ console.error(e); process.exit(1); });
