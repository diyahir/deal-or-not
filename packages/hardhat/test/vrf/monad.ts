import { expect } from "chai";
import { ethers } from "hardhat";

describe("MonadVRF Contract", function () {
  beforeEach(async () => {
    await ethers.getSigners();
  });

  describe("Contract Deployment", function () {
    it("Should fail to deploy on local network (Pyth Network entropy not available)", async function () {
      // On local Hardhat network, Pyth Network's entropy infrastructure doesn't exist
      // so the contract deployment should fail during construction
      const MonadVRFFactory = await ethers.getContractFactory("MonadVRF");

      await expect(MonadVRFFactory.deploy()).to.be.reverted;
    });

    it("Should be deployable contract factory", async function () {
      // Verify the contract factory exists and is valid
      const MonadVRFFactory = await ethers.getContractFactory("MonadVRF");
      expect(MonadVRFFactory).to.be.an("object");
    });
  });

  describe("Network Compatibility", function () {
    it("Should acknowledge local network limitations", async function () {
      // This test documents that the contract only works on Monad network
      // where Pyth Network's entropy infrastructure is available at deployment time

      // On local Hardhat network, deployment will fail
      // On Monad network, the contract would deploy successfully with entropy access
      const MonadVRFFactory = await ethers.getContractFactory("MonadVRF");
      await expect(MonadVRFFactory.deploy()).to.be.reverted;
    });
  });
});
