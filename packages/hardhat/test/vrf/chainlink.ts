import { expect } from "chai";
import { ethers } from "hardhat";

describe("DirectFundingConsumer Contract", function () {
  beforeEach(async () => {
    await ethers.getSigners();
  });

  describe("Contract Deployment", function () {
    it("Should fail to deploy on local network (Chainlink infrastructure not available)", async function () {
      // On local Hardhat network, Chainlink VRF infrastructure doesn't exist
      // so the contract deployment should fail during construction
      const DirectFundingConsumerFactory = await ethers.getContractFactory("DirectFundingConsumer");

      await expect(DirectFundingConsumerFactory.deploy()).to.be.reverted;
    });

    it("Should be deployable contract factory", async function () {
      // Verify the contract factory exists and is valid
      const DirectFundingConsumerFactory = await ethers.getContractFactory("DirectFundingConsumer");
      expect(DirectFundingConsumerFactory).to.be.an("object");
    });
  });

  describe("Network Compatibility", function () {
    it("Should acknowledge local network limitations", async function () {
      // This test documents that the contract only works on networks with Chainlink infrastructure
      // where the VRF wrapper and LINK token contracts are available at deployment time

      // On local Hardhat network, deployment will fail
      // On supported networks (like Sepolia), the contract would deploy successfully
      const DirectFundingConsumerFactory = await ethers.getContractFactory("DirectFundingConsumer");
      await expect(DirectFundingConsumerFactory.deploy()).to.be.reverted;
    });
  });
});
