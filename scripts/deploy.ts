import hre from "hardhat";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

async function main() {
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
  const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

  if (!PRIVATE_KEY) {
    throw new Error("DEPLOYER_PRIVATE_KEY not set in .env");
  }

  console.log("Deploying ArcSplit to Arc Testnet...");
  console.log("USDC address:", USDC_ADDRESS);

  const chain = {
    id: 5042002,
    name: "Arc Testnet",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
    rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
  } as const;

  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
  console.log("Deployer:", account.address);

  const walletClient = createWalletClient({ account, chain, transport: http() });
  const publicClient = createPublicClient({ chain, transport: http() });

  const artifact = await hre.artifacts.readArtifact("ArcSplit");

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode as `0x${string}`,
    args: [USDC_ADDRESS],
  });

  console.log("Tx hash:", hash);
  console.log("Waiting for confirmation...");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log("\n✅ ArcSplit deployed to:", receipt.contractAddress);
  console.log("\nAdd this to your .env:");
  console.log(`VITE_ARCSPLIT_ADDRESS=${receipt.contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
