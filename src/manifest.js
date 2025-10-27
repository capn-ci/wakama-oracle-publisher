/** CREATED BY WAKAMA.farm & Supported by Solana foundation */
import fs from "fs";

export function appendRow(row){
  if (!fs.existsSync("./runs")) fs.mkdirSync("./runs");
  const f = `./runs/devnet_${new Date().toISOString().slice(0,10)}.csv`;
  const header = "file,cid,sha256,tx,ts\n";
  if (!fs.existsSync(f)) fs.writeFileSync(f, header);
  const line = `${row.file},${row.cid},${row.sha256},${row.tx},${row.ts}\n`;
  fs.appendFileSync(f, line);
}
