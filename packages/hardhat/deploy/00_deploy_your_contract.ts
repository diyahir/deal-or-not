import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
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

  // Deploy a mock ERC20 token for testing (you can replace this with your actual game token)
  const gameToken = await deploy("MockERC20", {
    contract: "MockERC20",
    from: deployer,
    args: ["GameToken", "GT", 18, hre.ethers.parseEther("1000000")], // 1M tokens
    log: true,
    autoMine: true,
  });

  console.log("🪙 Game token deployed at:", gameToken.address);

  // Set entry fee and VRF fee (in token units)
  const entryFee = hre.ethers.parseEther("100"); // 100 tokens entry fee

  // Get the deployed contract to interact with it after deploying.
  const vrfContract = await deploy("BaseVRF", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  await deploy("DealOrNot", {
    from: deployer,
    // Contract constructor arguments
    args: [deployer, vrfContract.address, false, gameToken.address, entryFee],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  const dealOrNotContract = await hre.ethers.getContract<Contract>("DealOrNot", deployer);
  console.log("🎯 DealOrNot contract deployed!");
  console.log("📊 Total boxes:", await dealOrNotContract.TOTAL_BOXES());
  console.log("💰 Entry fee:", hre.ethers.formatEther(await dealOrNotContract.entryFee()), "tokens");
  console.log("🏦 House funds:", hre.ethers.formatEther(await dealOrNotContract.getHouseFunds()), "tokens");

  // Optional: Deposit some initial house funds for testing
  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    console.log("🏦 Depositing initial house funds for testing...");
    const depositAmount = hre.ethers.parseEther("100000"); // 100k tokens for testing

    // Get the game token contract and approve the DealOrNot contract
    const gameTokenContract = await hre.ethers.getContract<Contract>("MockERC20", deployer);
    await gameTokenContract.approve(dealOrNotContract.getAddress(), depositAmount);

    await dealOrNotContract.depositHouseFunds(depositAmount);
    console.log("✅ Deposited", hre.ethers.formatEther(depositAmount), "tokens to house funds");
  }
};

export default deployDealOrNot;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags DealOrNot
deployDealOrNot.tags = ["DealOrNot"];
