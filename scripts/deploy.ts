import hre from "hardhat";

async function main() {
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

  console.log("Deploying ArcSplit to Arc Testnet...");
  console.log("USDC address:", USDC_ADDRESS);

  const arcSplit = await hre.ethers.deployContract("ArcSplit", [USDC_ADDRESS]);
  console.log("Waiting for deployment...");

  const address = await arcSplit.getAddress();
  console.log("\n✅ ArcSplit deployed to:", address);
  console.log("\nAdd this to your .env:");
  console.log(`VITE_ARCSPLIT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
