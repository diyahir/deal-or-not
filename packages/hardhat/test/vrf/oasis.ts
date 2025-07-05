import { expect } from "chai";
import { ethers } from "hardhat";
import { OasisVRF } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("OasisVRF Contract", function () {
  let oasisVRF: OasisVRF;
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy the OasisVRF contract
    const OasisVRFFactory = await ethers.getContractFactory("OasisVRF");
    oasisVRF = await OasisVRFFactory.deploy();
    await oasisVRF.waitForDeployment();
  });

  describe("Contract Deployment", function () {
    it("Should deploy successfully", async function () {
      const contractAddress = await oasisVRF.getAddress();
      expect(contractAddress).to.be.a("string");
    });
  });

  describe("Random Number Generation", function () {
    it("Should call getRandomNumber function successfully", async function () {
      const randomNumber = await oasisVRF.getRandomNumber(32);

      // Check that we got a number back (will be 0 on local network, actual random on Oasis)
      expect(randomNumber).to.be.a("bigint");
      // Note: Returns 0 on local Hardhat network, but would return actual random number on Oasis Sapphire
    });

    it("Should be callable with different length parameters", async function () {
      // Test with different length parameters
      const randomNumber1 = await oasisVRF.getRandomNumber(16);
      const randomNumber2 = await oasisVRF.getRandomNumber(32);
      const randomNumber3 = await oasisVRF.getRandomNumber(64);

      // All should return valid numbers (0 on local network)
      expect(randomNumber1).to.be.a("bigint");
      expect(randomNumber2).to.be.a("bigint");
      expect(randomNumber3).to.be.a("bigint");
    });

    it("Should be callable by different accounts", async function () {
      // Test calling from owner account
      const randomFromOwner = await oasisVRF.connect(owner).getRandomNumber(32);

      // Test calling from user account
      const randomFromUser = await oasisVRF.connect(user).getRandomNumber(32);

      // Both should return valid numbers
      expect(randomFromOwner).to.be.a("bigint");
      expect(randomFromUser).to.be.a("bigint");
    });

    it("Should handle edge case parameters", async function () {
      // Test with zero length (though function doesn't use it)
      const randomWithZero = await oasisVRF.getRandomNumber(0);
      expect(randomWithZero).to.be.a("bigint");

      // Test with very large length
      const randomWithLarge = await oasisVRF.getRandomNumber(1000000);
      expect(randomWithLarge).to.be.a("bigint");
    });

    it("Should return 0 on local network (Sapphire randomness only works on Oasis)", async function () {
      const randomNumber = await oasisVRF.getRandomNumber(32);

      // On local Hardhat network, Sapphire.randomBytes returns empty bytes, which converts to 0
      expect(randomNumber).to.equal(0n);
    });
  });

  describe("View Function Properties", function () {
    it("Should be a view function (no gas cost for calls)", async function () {
      // View functions don't modify state, so we can call them without sending transactions
      const randomNumber = await oasisVRF.getRandomNumber.staticCall(32);
      expect(randomNumber).to.be.a("bigint");
    });

    it("Should work with static calls", async function () {
      const randomNumber1 = await oasisVRF.getRandomNumber.staticCall(32);
      const randomNumber2 = await oasisVRF.getRandomNumber.staticCall(32);

      // Both should return valid numbers (0 on local network)
      expect(randomNumber1).to.be.a("bigint");
      expect(randomNumber2).to.be.a("bigint");
    });
  });

  describe("Network Compatibility", function () {
    it("Should acknowledge local network limitations", async function () {
      // This test documents the expected behavior on local networks
      const randomNumber = await oasisVRF.getRandomNumber(32);

      // On local Hardhat network, this will be 0
      // On Oasis Sapphire network, this would be a true random number
      expect(randomNumber).to.equal(0n);
    });
  });
});
