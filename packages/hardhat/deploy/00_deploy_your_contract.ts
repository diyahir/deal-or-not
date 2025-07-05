import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "DealOrNoDeal" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployDealOrNoDeal: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
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

  await deploy("DealOrNoDeal", {
    from: deployer,
    // Contract constructor arguments
    args: [deployer],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const dealOrNoDealContract = await hre.ethers.getContract<Contract>("DealOrNoDeal", deployer);
  console.log("🎯 DealOrNoDeal contract deployed!");
  console.log("📊 Total boxes:", await dealOrNoDealContract.TOTAL_BOXES());
  console.log("💰 Entry fee:", hre.ethers.formatEther(await dealOrNoDealContract.ENTRY_FEE()), "ETH");
  console.log("🏦 House funds:", hre.ethers.formatEther(await dealOrNoDealContract.getHouseFunds()), "ETH");

  // Optional: Deposit some initial house funds for testing
  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    console.log("🏦 Depositing initial house funds for testing...");
    const depositAmount = hre.ethers.parseEther("100"); // 100 ETH for testing
    await dealOrNoDealContract.depositHouseFunds({ value: depositAmount });
    console.log("✅ Deposited", hre.ethers.formatEther(depositAmount), "ETH to house funds");
  }
};

export default deployDealOrNoDeal;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags DealOrNoDeal
deployDealOrNoDeal.tags = ["DealOrNoDeal"];
