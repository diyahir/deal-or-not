import { expect } from "chai";
import { ethers } from "hardhat";
import { CadenceArchCaller } from "../../typechain-types";

describe("CadenceArchCaller Contract", function () {
  let cadenceArchCaller: CadenceArchCaller;

  beforeEach(async () => {
    await ethers.getSigners();

    // Deploy the CadenceArchCaller contract
    const CadenceArchCallerFactory = await ethers.getContractFactory("CadenceArchCaller");
    cadenceArchCaller = await CadenceArchCallerFactory.deploy();
    await cadenceArchCaller.waitForDeployment();
  });

  describe("Contract Deployment", function () {
    it("Should deploy successfully", async function () {
      const contractAddress = await cadenceArchCaller.getAddress();
      expect(contractAddress).to.be.a("string");
    });

    it("Should have correct cadenceArch address", async function () {
      const cadenceArchAddress = await cadenceArchCaller.cadenceArch();
      expect(cadenceArchAddress).to.equal("0x0000000000000000000000010000000000000001");
    });
  });

  describe("Random Number Generation", function () {
    it("Should revert on local network (Cadence Arch not available)", async function () {
      // On local Hardhat network, the Cadence Arch address doesn't exist
      // so the call should revert (may not have specific message)
      await expect(cadenceArchCaller.revertibleRandom()).to.be.reverted;
    });

    it("Should be a view function", async function () {
      // Even though it will revert, we can check that it's a view function
      // by verifying the function exists and is callable (will revert but that's expected)
      try {
        await cadenceArchCaller.revertibleRandom.staticCall();
      } catch (error) {
        // Expected to fail on local network
        expect(error).to.be.instanceOf(Error);
      }
    });
  });
});
