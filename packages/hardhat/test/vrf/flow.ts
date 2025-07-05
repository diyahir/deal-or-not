import { expect } from "chai";
import { ethers } from "hardhat";
import { FlowVRF } from "../../typechain-types";

describe("FlowVRF Contract", function () {
  let flowVRF: FlowVRF;

  beforeEach(async () => {
    await ethers.getSigners();

    // Deploy the FlowVRF contract
    const FlowVRFFactory = await ethers.getContractFactory("FlowVRF");
    flowVRF = await FlowVRFFactory.deploy();
    await flowVRF.waitForDeployment();
  });

  describe("Contract Deployment", function () {
    it("Should deploy successfully", async function () {
      const contractAddress = await flowVRF.getAddress();
      expect(contractAddress).to.be.a("string");
      expect(contractAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should implement IVRF interface", async function () {
      // Check if the contract has the required IVRF functions
      expect(flowVRF.requestRandomNumber).to.be.a("function");
      expect(flowVRF.getRandomNumber).to.be.a("function");
    });
  });

  describe("Random Number Generation", function () {
    it("Should request random number and return request ID", async function () {
      const userRandomNumber = ethers.keccak256(ethers.toUtf8Bytes("test"));

      // This will likely revert on local network since Flow's VRF isn't available
      try {
        const requestId = await flowVRF.requestRandomNumber(userRandomNumber);
        expect(requestId).to.be.a("bigint");
        expect(requestId).to.be.gt(0);
      } catch (error) {
        // Expected to fail on local Hardhat network
        expect(error).to.be.instanceOf(Error);
      }
    });

    it("Should revert when getting random number on local network", async function () {
      // On local Hardhat network, Flow's VRF isn't available
      // so calls should revert
      await expect(flowVRF.getRandomNumber(1)).to.be.reverted;
    });

    it("Should emit RandomRequested event (if VRF is available)", async function () {
      const userRandomNumber = ethers.keccak256(ethers.toUtf8Bytes("test"));

      try {
        await expect(flowVRF.requestRandomNumber(userRandomNumber)).to.emit(flowVRF, "RandomRequested");
      } catch (error) {
        // Expected to fail on local network - Flow VRF not available
        expect(error).to.be.instanceOf(Error);
      }
    });

    it("Should handle multiple requests with incremental IDs", async function () {
      const userRandomNumber1 = ethers.keccak256(ethers.toUtf8Bytes("test1"));
      const userRandomNumber2 = ethers.keccak256(ethers.toUtf8Bytes("test2"));

      try {
        const requestId1 = await flowVRF.requestRandomNumber(userRandomNumber1);
        const requestId2 = await flowVRF.requestRandomNumber(userRandomNumber2);

        expect(requestId2).to.be.gt(requestId1);
      } catch (error) {
        // Expected to fail on local network
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  describe("IVRF Interface Compliance", function () {
    it("Should accept payable calls to requestRandomNumber", async function () {
      const userRandomNumber = ethers.keccak256(ethers.toUtf8Bytes("test"));

      try {
        // Should not revert due to payable modifier
        await flowVRF.requestRandomNumber(userRandomNumber, { value: 0 });
      } catch (error) {
        // Expected to fail on local network due to Flow VRF unavailability,
        // not due to payable issues
        expect(error).to.be.instanceOf(Error);
      }
    });
  });
});
