import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, DeployResult } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "DealOrNot" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployDealOrNot: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` or `yarn account:import` to import your
    existing PK which will fill DEPLOYER_PRIVATE_KEY_ENCRYPTED in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  let vrfContract: DeployResult;
  if (hre.network.name === "flowTestnet") {
    console.log("🔄 Deploying to Flow Testnet");
    vrfContract = await deploy("FlowVRF", {
      from: deployer,
      args: [],
      log: true,
      autoMine: true,
    });
  } else if (hre.network.name === "flareTestnet") {
    console.log("🔄 Deploying to Flare Testnet");
    vrfContract = await deploy("FlareVRF", {
      from: deployer,
      args: [],
      log: true,
      autoMine: true,
    });
  } else if (hre.network.name === "oasisTestnet") {
    console.log("🔄 Deploying to Oasis Testnet");
    vrfContract = await deploy("OasisVRF", {
      from: deployer,
      args: [],
      log: true,
      autoMine: true,
    });
  } else {
    // Get the deployed contract to interact with it after deploying.
    vrfContract = await deploy("BaseVRF", {
      from: deployer,
      args: [],
      log: true,
      autoMine: true,
    });
  }

  await deploy("DealOrNot", {
    from: deployer,
    // Contract constructor arguments
    args: [deployer, vrfContract.address],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  const dealOrNotContract = await hre.ethers.getContract<Contract>("DealOrNot", deployer);
  console.log("🎯 DealOrNot contract deployed!");
  console.log("📊 Total boxes:", await dealOrNotContract.TOTAL_BOXES());
  console.log("💰 Entry fee:", hre.ethers.formatEther(await dealOrNotContract.ENTRY_FEE()), "ETH");
  console.log("🏦 House funds:", hre.ethers.formatEther(await dealOrNotContract.getHouseFunds()), "ETH");

  // Optional: Deposit some initial house funds for testing
  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    console.log("🏦 Depositing initial house funds for testing...");
    const depositAmount = hre.ethers.parseEther("100"); // 100 ETH for testing
    await dealOrNotContract.depositHouseFunds({ value: depositAmount });
    console.log("✅ Deposited", hre.ethers.formatEther(depositAmount), "ETH to house funds");
  }
};

export default deployDealOrNot;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags DealOrNot
deployDealOrNot.tags = ["DealOrNot"];
