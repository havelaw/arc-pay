import { createWalletClient, createPublicClient, http, parseAbi, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const arcTestnet = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
} as const;

const USDC = "0x3600000000000000000000000000000000000000" as `0x${string}`;
const BUYER = "0x2c370df487338266B25354FEF863632f8583eb58" as `0x${string}`;
const AMOUNT = parseUnits("2", 6); // 2 USDC

const deployerKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
const account = privateKeyToAccount(deployerKey);

const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() });

async function main() {
  const balance = await publicClient.readContract({
    address: USDC,
    abi: parseAbi(["function balanceOf(address) view returns (uint256)"]),
    functionName: "balanceOf",
    args: [account.address],
  });
  console.log(`Deployer USDC balance: ${Number(balance) / 1e6}`);

  console.log(`\nSending 2 USDC to buyer ${BUYER}...`);
  const hash = await walletClient.writeContract({
    address: USDC,
    abi: parseAbi(["function transfer(address,uint256) returns (bool)"]),
    functionName: "transfer",
    args: [BUYER, AMOUNT],
  });
  console.log(`Tx: ${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Status: ${receipt.status}`);

  const buyerBalance = await publicClient.readContract({
    address: USDC,
    abi: parseAbi(["function balanceOf(address) view returns (uint256)"]),
    functionName: "balanceOf",
    args: [BUYER],
  });
  console.log(`Buyer USDC balance: ${Number(buyerBalance) / 1e6}`);
}

main().catch(console.error);
