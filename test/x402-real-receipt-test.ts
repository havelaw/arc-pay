import { GatewayClient } from "@circle-fin/x402-batching/client";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "fs";

const PAID_API_URL = "https://arc-pay-nine.vercel.app/api/parse-receipt-paid";
const privateKey = process.env.BUYER_PRIVATE_KEY as `0x${string}`;
const account = privateKeyToAccount(privateKey);

console.log("=== x402 Real Receipt Test ===");
console.log(`Buyer: ${account.address}\n`);

const client = new GatewayClient({ chain: "arcTestnet", privateKey });

async function main() {
  // 1. Balance
  const balances = await client.getBalances();
  console.log(`Gateway balance: ${balances.gateway.formattedAvailable} USDC`);

  // 2. Read receipt image
  console.log("\nReading receipt image...");
  const imagePath = process.argv[2];
  if (!imagePath) {
    console.error("Usage: npx tsx --env-file=.env test/x402-real-receipt-test.ts <image-path>");
    process.exit(1);
  }
  const imageBuffer = readFileSync(imagePath);
  const base64 = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
  console.log(`Image size: ${(imageBuffer.length / 1024).toFixed(1)} KB`);

  // 3. Pay and call API
  console.log("\nCalling paid API with x402 payment...");
  const { data, status, formattedAmount, transaction } = await client.pay(PAID_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64 }),
  });

  console.log(`\nStatus: ${status}`);
  console.log(`Amount paid: ${formattedAmount} USDC`);
  console.log(`Transaction: ${transaction}`);
  console.log(`\nParsed receipt:`);
  console.log(JSON.stringify(data, null, 2));

  // 4. Final balance
  const final = await client.getBalances();
  console.log(`\nFinal Gateway balance: ${final.gateway.formattedAvailable} USDC`);

  console.log("\n=== Test Complete ===");
}

main().catch(console.error);
