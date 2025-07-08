import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the MonadVRF contract using Pyth Entropy for randomness
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployMonadVRF: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
        On localhost, the deployer account is the one that comes with Hardhat, which is already funded.
    
        When deploying to live networks (e.g `yarn deploy --network monadTestnet`), the deployer account
        should have sufficient balance to pay for the gas fees for contract creation.
    
        You can generate a random account with `yarn generate` or `yarn account:import` to import your
        existing PK which will fill DEPLOYER_PRIVATE_KEY_ENCRYPTED in the .env file (then used on hardhat.config.ts)
        You can run the `yarn account` command to check your balance in every network.
      */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log(`🔑 Using deployer account: ${deployer}`);

  // Check deployer balance
  const deployerBalance = await hre.ethers.provider.getBalance(deployer);
  console.log(
    `💰 Deployer balance: ${hre.ethers.formatEther(deployerBalance)} ${hre.network.name === "monadTestnet" ? "MON" : "ETH"}`,
  );

  if (deployerBalance === 0n) {
    throw new Error(`Deployer ${deployer} has insufficient balance. Please fund this account.`);
  }

  console.log("");

  // Default entropy provider addresses for different networks
  // Note: Update these with actual Pyth Entropy contract addresses when available
  const entropyProviders: Record<string, string> = {
    // Mock addresses for testing - replace with actual addresses
    localhost: "0x1234567890123456789012345678901234567890", // Mock address for local testing
    hardhat: "0x1234567890123456789012345678901234567890", // Mock address for hardhat testing
    monadTestnet: "0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320", // Actual Monad testnet entropy provider address
    // Add more networks as needed
    sepolia: "0x41c9e39574F40Ad34c79f1C99B66A45eFB830d4c", // Example from Ethereum Sepolia (verify this)
  };

  const entropyAddress = entropyProviders[hre.network.name];

  if (!entropyAddress || entropyAddress === "0x0000000000000000000000000000000000000000") {
    console.warn(`⚠️  No entropy provider address configured for network: ${hre.network.name}`);
    console.warn("⚠️  Using placeholder address. Please update with actual Pyth Entropy contract address.");
    console.warn("⚠️  Check https://docs.pyth.network/entropy for deployed contract addresses.");
  } else if (entropyAddress === "0x1234567890123456789012345678901234567890") {
    console.warn(`⚠️  Using mock entropy address for testing on ${hre.network.name}`);
    console.warn("⚠️  This is fine for testing but won't provide real randomness.");
  } else {
    console.log(`✅ Using real entropy provider address for ${hre.network.name}`);
  }

  console.log(`🔄 Deploying MonadVRF contract on ${hre.network.name}...`);
  console.log(`📍 Entropy provider address: ${entropyAddress}`);

  // Deploy using standard hardhat-deploy pattern
  const monadVRF = await deploy("MonadVRF", {
    from: deployer,
    args: [entropyAddress],
    log: true,
    autoMine: true,
  });

  console.log(`✅ MonadVRF deployed to: ${monadVRF.address}`);

  // Get the deployed contract to interact with it after deploying.
  const monadVRFContract = await hre.ethers.getContract<Contract>("MonadVRF", deployer);
  console.log("🎯 MonadVRF contract deployed!");
  console.log(`📍 Contract address: ${monadVRF.address}`);
  console.log(`🔗 Entropy contract: ${await monadVRFContract.entropy()}`);
  console.log(`🎲 Entropy provider: ${await monadVRFContract.entropyProvider()}`);
  console.log(`👤 Owner: ${await monadVRFContract.owner()}`);

  // Try to initialize entropy provider from the entropy contract
  console.log("🔄 Attempting to initialize entropy provider...");
  try {
    const tx = await monadVRFContract.initializeEntropyProvider();
    await tx.wait();
    console.log("✅ Entropy provider initialized successfully!");
    console.log(`🎲 New entropy provider: ${await monadVRFContract.entropyProvider()}`);
  } catch (error) {
    console.warn("⚠️  Could not initialize entropy provider automatically.");
    console.warn("⚠️  This might be expected if using a test/mock entropy contract.");
    console.warn("⚠️  You can set it manually using setEntropyProvider() function.");
    console.warn(`⚠️  Error: ${error instanceof Error ? error.message : String(error)}`);

    // For Monad testnet with real entropy, try setting the provider directly
    if (hre.network.name === "monadTestnet" && entropyAddress === "0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320") {
      console.log("🔄 Attempting to set Monad testnet entropy provider directly...");
      try {
        const setTx = await monadVRFContract.setEntropyProvider("0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320");
        await setTx.wait();
        console.log("✅ Monad testnet entropy provider set successfully!");
        console.log(`🎲 New entropy provider: ${await monadVRFContract.entropyProvider()}`);
      } catch (setError) {
        console.warn("⚠️  Could not set entropy provider directly either.");
        console.warn(`⚠️  Error: ${setError instanceof Error ? setError.message : String(setError)}`);
      }
    }
  }

  // Display network-specific information
  if (hre.network.name === "monadTestnet") {
    console.log("🌐 Monad Testnet Deployment Information:");
    console.log(`   - Chain ID: 10143`);
    console.log(`   - RPC URL: https://testnet-rpc.monad.xyz`);
    console.log(`   - Block Explorer: https://testnet.monadexplorer.com`);
    console.log(`   - Faucet: https://faucet.monad.xyz`);
    console.log(`   - Contract Address: ${monadVRF.address}`);
    console.log(`   - Verify at: https://testnet.monadexplorer.com/address/${monadVRF.address}`);
  }

  // Display usage instructions
  console.log("\n📋 Usage Instructions:");
  console.log("1. Set entropy provider: await contract.setEntropyProvider('0x...')");
  console.log("2. Or initialize from entropy contract: await contract.initializeEntropyProvider()");
  console.log("3. Request random number: await contract.requestRandomNumber('0x...', { value: fee })");
  console.log("4. Get random number: await contract.getRandomNumber(sequenceNumber)");

  const gMonTokenAddress = "0xaEef2f6B429Cb59C9B2D7bB2141ADa993E8571c3";

  console.log("deployer", deployer);
  await deploy("DealOrNot", {
    from: deployer,
    // Contract constructor arguments
    args: [deployer, monadVRF.address, true, gMonTokenAddress],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  const dealOrNotContract = await hre.ethers.getContract<Contract>("DealOrNot", deployer);
  console.log("🎯 DealOrNot contract deployed!");
  console.log("📊 Total boxes:", await dealOrNotContract.TOTAL_BOXES());
  console.log("🏦 House funds:", hre.ethers.formatEther(await dealOrNotContract.getHouseFunds()), "ETH");
};

export default deployMonadVRF;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags MonadVRF
deployMonadVRF.tags = ["MonadVRF"];
