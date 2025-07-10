import { ethers, deployments } from "hardhat";

async function main() {
  console.log("🔧 Initializing Entropy Provider for MonadVRF Contract");
  console.log("=".repeat(60));

  // Get deployed contract address
  const vrfDeployment = await deployments.get("MonadVRF");
  const VRF_ADDRESS = vrfDeployment.address;

  console.log(`📍 MonadVRF Contract: ${VRF_ADDRESS}`);
  console.log(`🌐 Network: ${process.env.HARDHAT_NETWORK || "monadTestnet"}`);
  console.log("=".repeat(60));

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Check deployer balance
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance: ${ethers.formatEther(deployerBalance)} MON`);

  // Connect to the VRF contract
  const vrfContract = await ethers.getContractAt("MonadVRF", VRF_ADDRESS, deployer);

  // Check current state
  console.log("\n🔍 Current Contract State:");
  console.log("-".repeat(40));

  const owner = await vrfContract.owner();
  const entropyContract = await vrfContract.entropy();
  const currentEntropyProvider = await vrfContract.entropyProvider();

  console.log(`👑 Owner: ${owner}`);
  console.log(`🔗 Entropy Contract: ${entropyContract}`);
  console.log(`🎲 Current Entropy Provider: ${currentEntropyProvider}`);

  const isOwner = owner.toLowerCase() === deployer.address.toLowerCase();
  console.log(`🔑 Deployer is owner: ${isOwner}`);

  if (!isOwner) {
    console.log("❌ Error: Deployer is not the contract owner");
    console.log("❌ Only the owner can initialize the entropy provider");
    return;
  }

  if (currentEntropyProvider !== "0x0000000000000000000000000000000000000000") {
    console.log("✅ Entropy provider already set!");
    console.log("ℹ️  No action needed");
    return;
  }

  // Try to initialize entropy provider
  console.log("\n🚀 Initializing Entropy Provider:");
  console.log("-".repeat(40));

  try {
    console.log("🔄 Attempting to initialize entropy provider from entropy contract...");
    const initTx = await vrfContract.initializeEntropyProvider();
    console.log(`📝 Transaction sent: ${initTx.hash}`);

    const receipt = await initTx.wait();
    console.log(`✅ Transaction confirmed! Gas used: ${receipt?.gasUsed}`);

    // Check new state
    const newEntropyProvider = await vrfContract.entropyProvider();
    console.log(`🎲 New entropy provider: ${newEntropyProvider}`);

    // Test getting fee
    try {
      const fee = await vrfContract.getEntropyFee();
      console.log(`💰 VRF fee: ${ethers.formatEther(fee)} MON`);
      console.log("✅ VRF is now ready to use!");
    } catch (feeError) {
      console.log("⚠️ VRF fee check failed, but provider is set");
      console.log(`ℹ️  Error: ${feeError instanceof Error ? feeError.message : String(feeError)}`);
    }
  } catch (error) {
    console.log("❌ Failed to initialize entropy provider from entropy contract");
    console.log(`ℹ️  Error: ${error instanceof Error ? error.message : String(error)}`);

    // Fallback: Try to set Monad testnet entropy provider directly
    console.log("\n🔄 Attempting fallback: Setting Monad testnet entropy provider directly...");

    try {
      // This should be the entropy contract address on Monad testnet
      const monadEntropyProvider = "0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320";

      const setTx = await vrfContract.setEntropyProvider(monadEntropyProvider);
      console.log(`📝 Transaction sent: ${setTx.hash}`);

      const receipt = await setTx.wait();
      console.log(`✅ Transaction confirmed! Gas used: ${receipt?.gasUsed}`);

      // Check new state
      const newEntropyProvider = await vrfContract.entropyProvider();
      console.log(`🎲 New entropy provider: ${newEntropyProvider}`);

      // Test getting fee
      try {
        const fee = await vrfContract.getEntropyFee();
        console.log(`💰 VRF fee: ${ethers.formatEther(fee)} MON`);
        console.log("✅ VRF is now ready to use!");
      } catch (feeError) {
        console.log("⚠️ VRF fee check failed, but provider is set");
        console.log(`ℹ️  Error: ${feeError instanceof Error ? feeError.message : String(feeError)}`);
      }
    } catch (setError) {
      console.log("❌ Failed to set entropy provider directly");
      console.log(`ℹ️  Error: ${setError instanceof Error ? setError.message : String(setError)}`);

      console.log("\n🔧 Manual Setup Required:");
      console.log("1. Make sure you have the correct entropy contract address");
      console.log("2. Call vrfContract.setEntropyProvider(entropyProviderAddress)");
      console.log("3. Or check if the entropy contract supports getDefaultProvider()");
    }
  }

  console.log("\n🎯 Entropy provider initialization completed!");
}

// Handle errors
main().catch(error => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});
