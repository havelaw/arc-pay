import { GatewayClient } from "@circle-fin/x402-batching/client";
import { privateKeyToAccount } from "viem/accounts";

const PAID_API_URL = "https://arc-pay-nine.vercel.app/api/parse-receipt-paid";

const privateKey = process.env.BUYER_PRIVATE_KEY as `0x${string}`;
if (!privateKey) {
  console.error("BUYER_PRIVATE_KEY not set in .env");
  process.exit(1);
}

const account = privateKeyToAccount(privateKey);
console.log("=== x402 Buyer Test ===");
console.log(`Buyer address: ${account.address}\n`);

const client = new GatewayClient({
  chain: "arcTestnet",
  privateKey,
});

async function main() {
  // 1. Check balance
  console.log("1. Checking Gateway balance...");
  const balances = await client.getBalances();
  console.log(`   Gateway: ${balances.gateway.formattedAvailable} USDC`);

  // 2. Deposit if needed
  if (balances.gateway.available < 100_000n) {
    console.log("\n2. Depositing 1 USDC to Gateway...");
    const deposit = await client.deposit("1");
    console.log(`   Deposit tx: ${deposit.depositTxHash}`);

    const updated = await client.getBalances();
    console.log(`   Gateway after deposit: ${updated.gateway.formattedAvailable} USDC`);
  } else {
    console.log("\n2. Gateway balance sufficient, skipping deposit.");
  }

  // 3. Call paid API
  const testImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA//9k=";

  console.log("\n3. Calling paid API...");
  try {
    const { data, status, formattedAmount, transaction } = await client.pay(PAID_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: testImage }),
    });
    console.log(`   Status: ${status}`);
    console.log(`   Amount paid: ${formattedAmount} USDC`);
    console.log(`   Transaction: ${transaction}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error(`   Error: ${err.message}`);
  }

  // 4. Final balance
  console.log("\n4. Final balance...");
  const final = await client.getBalances();
  console.log(`   Gateway: ${final.gateway.formattedAvailable} USDC`);

  console.log("\n=== Test Complete ===");
}

main().catch(console.error);
