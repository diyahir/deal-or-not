import { expect } from "chai";
import { ethers } from "hardhat";

describe("MonadVRF Contract", function () {
  let mockEntropyAddress: string;

  beforeEach(async () => {
    await ethers.getSigners();
    // Use a mock entropy address for testing
    mockEntropyAddress = "0x1234567890123456789012345678901234567890";
  });

  describe("Contract Deployment", function () {
    it("Should deploy successfully with mock entropy address", async function () {
      // The contract should deploy successfully with a mock entropy address
      const MonadVRFFactory = await ethers.getContractFactory("MonadVRF");
      const monadVRF = await MonadVRFFactory.deploy(mockEntropyAddress);

      expect(await monadVRF.getAddress()).to.match(/^0x[a-fA-F0-9]{40}$/);
      expect(await monadVRF.entropy()).to.equal(mockEntropyAddress);
    });

    it("Should be deployable contract factory", async function () {
      // Verify the contract factory exists and is valid
      const MonadVRFFactory = await ethers.getContractFactory("MonadVRF");
      expect(MonadVRFFactory).to.be.an("object");
    });
  });

  describe("Network Compatibility", function () {
    it("Should acknowledge local network limitations", async function () {
      // This test documents that the contract can be deployed on local network
      // but entropy functionality will be limited to mock addresses
      const MonadVRFFactory = await ethers.getContractFactory("MonadVRF");
      const monadVRF = await MonadVRFFactory.deploy(mockEntropyAddress);

      // Contract deploys successfully with mock entropy
      expect(await monadVRF.getAddress()).to.match(/^0x[a-fA-F0-9]{40}$/);
      expect(await monadVRF.entropy()).to.equal(mockEntropyAddress);

      // But entropy provider will be zero address initially
      expect(await monadVRF.entropyProvider()).to.equal(ethers.ZeroAddress);
    });
  });
});
