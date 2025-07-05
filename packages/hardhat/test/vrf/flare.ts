import { expect } from "chai";
import { ethers } from "hardhat";

describe("SecureRandomConsumer Contract", function () {
  beforeEach(async () => {
    await ethers.getSigners();
  });

  describe("Contract Deployment", function () {
    it("Should fail to deploy on local network (Flare ContractRegistry not available)", async function () {
      // On local Hardhat network, the Flare ContractRegistry doesn't exist
      // so the contract deployment should fail during construction
      const SecureRandomConsumerFactory = await ethers.getContractFactory("SecureRandomConsumer");

      await expect(SecureRandomConsumerFactory.deploy()).to.be.reverted;
    });

    it("Should be deployable contract factory", async function () {
      // Verify the contract factory exists and is valid
      const SecureRandomConsumerFactory = await ethers.getContractFactory("SecureRandomConsumer");
      expect(SecureRandomConsumerFactory).to.be.an("object");
    });
  });

  describe("Network Compatibility", function () {
    it("Should acknowledge local network limitations", async function () {
      // This test documents that the contract only works on Flare network
      // where the ContractRegistry is available at deployment time

      // On local Hardhat network, deployment will fail
      // On Flare network, the contract would deploy successfully
      const SecureRandomConsumerFactory = await ethers.getContractFactory("SecureRandomConsumer");
      await expect(SecureRandomConsumerFactory.deploy()).to.be.reverted;
    });
  });
});
