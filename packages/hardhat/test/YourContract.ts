import { expect } from "chai";
import { ethers } from "hardhat";
import { DealOrNot } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("DealOrNot", function () {
  let dealOrNot: DealOrNot;
  let owner: HardhatEthersSigner;
  let player1: HardhatEthersSigner;
  let player2: HardhatEthersSigner;

  const ENTRY_FEE = ethers.parseEther("1");
  const HOUSE_FUNDS = ethers.parseEther("100");

  before(async () => {
    [owner, player1, player2] = await ethers.getSigners();
    const dealOrNotFactory = await ethers.getContractFactory("DealOrNot");
    dealOrNot = (await dealOrNotFactory.deploy(owner.address)) as DealOrNot;
    await dealOrNot.waitForDeployment();

    // Deposit house funds for testing
    await dealOrNot.connect(owner).depositHouseFunds({ value: HOUSE_FUNDS });
  });

  describe("Deployment", function () {
    it("Should have the correct initial state", async function () {
      expect(await dealOrNot.TOTAL_BOXES()).to.equal(26);
      expect(await dealOrNot.ENTRY_FEE()).to.equal(ENTRY_FEE);
      expect(await dealOrNot.HOUSE_OFFER_PERCENTAGE()).to.equal(75);
      expect(await dealOrNot.nextGameId()).to.equal(0);
      expect(await dealOrNot.getHouseFunds()).to.equal(HOUSE_FUNDS);
    });

    it("Should have the correct prize pool", async function () {
      const prizePool = await dealOrNot.getPrizePool();
      expect(prizePool.length).to.equal(26);
      expect(prizePool[0]).to.equal(ethers.parseEther("0.01"));
      expect(prizePool[25]).to.equal(ethers.parseEther("30"));
    });

    it("Should set the correct owner", async function () {
      expect(await dealOrNot.owner()).to.equal(owner.address);
    });
  });

  describe("Game Creation", function () {
    it("Should allow starting a new game with correct entry fee", async function () {
      const tx = await dealOrNot.connect(player1).startGame({ value: ENTRY_FEE });
      await tx.wait();

      const gameId = 0;
      const gameState = await dealOrNot.getGameState(gameId);

      expect(gameState.player).to.equal(player1.address);
      expect(gameState.deposit).to.equal(ENTRY_FEE);
      expect(gameState.gameId).to.equal(gameId);
      expect(gameState.state).to.equal(1); // GameState.Playing
      expect(gameState.isActive).to.equal(true);
      expect(gameState.currentRound).to.equal(0);
      expect(gameState.playerBoxIndex).to.be.lessThan(26);

      // Check that player's box is not in remaining boxes
      const remainingBoxes = await dealOrNot.getRemainingBoxes(gameId);
      expect(remainingBoxes.length).to.equal(25);
      expect(remainingBoxes).to.not.include(gameState.playerBoxIndex);
    });

    it("Should reject game creation with incorrect entry fee", async function () {
      await expect(dealOrNot.connect(player1).startGame({ value: ethers.parseEther("0.5") })).to.be.revertedWith(
        "Must deposit exactly 1 ETH",
      );

      await expect(dealOrNot.connect(player1).startGame({ value: ethers.parseEther("2") })).to.be.revertedWith(
        "Must deposit exactly 1 ETH",
      );
    });

    it("Should track player games correctly", async function () {
      const playerGames = await dealOrNot.getPlayerGames(player1.address);
      expect(playerGames.length).to.equal(1);
      expect(playerGames[0]).to.equal(0);
    });
  });

  describe("Box Elimination", function () {
    it("Should allow eliminating the correct number of boxes in round 1", async function () {
      // Start a new game for this test
      const tx = await dealOrNot.connect(player2).startGame({ value: ENTRY_FEE });
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      const remainingBoxes = await dealOrNot.getRemainingBoxes(gameId);
      const boxesToEliminate = Array.from(remainingBoxes.slice(0, 6)); // First 6 boxes

      const eliminateTx = await dealOrNot.connect(player2).eliminateBoxes(gameId, boxesToEliminate);
      await eliminateTx.wait();

      const gameState = await dealOrNot.getGameState(gameId);
      const newRemainingBoxes = await dealOrNot.getRemainingBoxes(gameId);
      const eliminatedBoxes = await dealOrNot.getEliminatedBoxes(gameId);

      expect(gameState.currentRound).to.equal(1);
      expect(gameState.state).to.equal(2); // GameState.OfferMade
      expect(newRemainingBoxes.length).to.equal(19); // 25 - 6
      expect(eliminatedBoxes.length).to.equal(6);
      expect(gameState.lastOffer).to.be.greaterThan(0);
    });

    it("Should reject eliminating wrong number of boxes", async function () {
      // Start a new game for this test
      const tx = await dealOrNot.connect(player2).startGame({ value: ENTRY_FEE });
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      const remainingBoxes = await dealOrNot.getRemainingBoxes(gameId);
      const wrongNumberOfBoxes = Array.from(remainingBoxes.slice(0, 5)); // Should be 6 for round 1

      await expect(dealOrNot.connect(player2).eliminateBoxes(gameId, wrongNumberOfBoxes)).to.be.revertedWith(
        "Wrong number of boxes",
      );
    });

    it("Should reject eliminating boxes not in remaining boxes", async function () {
      // Start a new game for this test
      const tx = await dealOrNot.connect(player2).startGame({ value: ENTRY_FEE });
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      const gameState = await dealOrNot.getGameState(gameId);
      const invalidBoxes = [gameState.playerBoxIndex, 0, 1, 2, 3, 4]; // Player's box is not available

      await expect(dealOrNot.connect(player2).eliminateBoxes(gameId, invalidBoxes)).to.be.revertedWith(
        "Box not available",
      );
    });

    it("Should only allow the game owner to eliminate boxes", async function () {
      // Start a new game for this test
      const tx = await dealOrNot.connect(player2).startGame({ value: ENTRY_FEE });
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      const remainingBoxes = await dealOrNot.getRemainingBoxes(gameId);
      const boxesToEliminate = Array.from(remainingBoxes.slice(0, 6));

      await expect(dealOrNot.connect(player1).eliminateBoxes(gameId, boxesToEliminate)).to.be.revertedWith(
        "Not your game",
      );
    });
  });

  describe("Deal Acceptance and Rejection", function () {
    it("Should allow accepting a deal", async function () {
      // Start a new game and eliminate first round
      const tx = await dealOrNot.connect(player1).startGame({ value: ENTRY_FEE });
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      const remainingBoxes = await dealOrNot.getRemainingBoxes(gameId);
      const boxesToEliminate = Array.from(remainingBoxes.slice(0, 6));

      const eliminateTx = await dealOrNot.connect(player1).eliminateBoxes(gameId, boxesToEliminate);
      await eliminateTx.wait();

      const gameStateBefore = await dealOrNot.getGameState(gameId);
      const offer = gameStateBefore.lastOffer;
      const houseBalanceBefore = await dealOrNot.getHouseFunds();
      const playerBalanceBefore = await ethers.provider.getBalance(player1.address);

      const acceptTx = await dealOrNot.connect(player1).acceptDeal(gameId);
      await acceptTx.wait();

      const gameStateAfter = await dealOrNot.getGameState(gameId);
      const houseBalanceAfter = await dealOrNot.getHouseFunds();
      const playerBalanceAfter = await ethers.provider.getBalance(player1.address);

      expect(gameStateAfter.state).to.equal(3); // GameState.DealTaken
      expect(gameStateAfter.isActive).to.equal(false);
      expect(houseBalanceAfter).to.equal(houseBalanceBefore - offer);
      expect(playerBalanceAfter).to.be.greaterThan(playerBalanceBefore);
    });

    it("Should allow rejecting a deal and continue to next round", async function () {
      // Start a new game and eliminate first round
      const tx = await dealOrNot.connect(player1).startGame({ value: ENTRY_FEE });
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      const remainingBoxes = await dealOrNot.getRemainingBoxes(gameId);
      const boxesToEliminate = Array.from(remainingBoxes.slice(0, 6));

      const eliminateTx = await dealOrNot.connect(player1).eliminateBoxes(gameId, boxesToEliminate);
      await eliminateTx.wait();

      const rejectTx = await dealOrNot.connect(player1).rejectDeal(gameId);
      await rejectTx.wait();

      const gameState = await dealOrNot.getGameState(gameId);
      expect(gameState.state).to.equal(1); // GameState.Playing
      expect(gameState.isActive).to.equal(true);
    });

    it("Should only allow the game owner to accept/reject deals", async function () {
      // Start a new game and eliminate first round
      const tx = await dealOrNot.connect(player1).startGame({ value: ENTRY_FEE });
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      const remainingBoxes = await dealOrNot.getRemainingBoxes(gameId);
      const boxesToEliminate = Array.from(remainingBoxes.slice(0, 6));

      const eliminateTx = await dealOrNot.connect(player1).eliminateBoxes(gameId, boxesToEliminate);
      await eliminateTx.wait();

      await expect(dealOrNot.connect(player2).acceptDeal(gameId)).to.be.revertedWith("Not your game");

      await expect(dealOrNot.connect(player2).rejectDeal(gameId)).to.be.revertedWith("Not your game");
    });
  });

  describe("House Offer Calculation", function () {
    it("Should calculate offers as 75% of expected value", async function () {
      // Start a game
      const tx = await dealOrNot.connect(player1).startGame({ value: ENTRY_FEE });
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      // Get initial state
      const gameState = await dealOrNot.getGameState(gameId);
      const remainingBoxes = await dealOrNot.getRemainingBoxes(gameId);
      const prizePool = await dealOrNot.getPrizePool();

      // Eliminate boxes first
      const boxesToEliminate = Array.from(remainingBoxes.slice(0, 6));
      const eliminateTx = await dealOrNot.connect(player1).eliminateBoxes(gameId, boxesToEliminate);
      await eliminateTx.wait();

      // Get updated state after elimination
      const updatedRemainingBoxes = await dealOrNot.getRemainingBoxes(gameId);

      // Calculate expected offer AFTER elimination
      let totalValue = prizePool[Number(gameState.playerBoxIndex)];
      for (let i = 0; i < updatedRemainingBoxes.length; i++) {
        totalValue += prizePool[Number(updatedRemainingBoxes[i])];
      }
      const expectedValue = totalValue / BigInt(updatedRemainingBoxes.length + 1);
      const expectedOffer = (expectedValue * 75n) / 100n;

      const currentOffer = await dealOrNot.getCurrentOffer(gameId);
      // Allow some tolerance for rounding
      expect(currentOffer).to.be.closeTo(expectedOffer, ethers.parseEther("0.1"));
    });
  });

  describe("House Fund Management", function () {
    it("Should allow owner to deposit house funds", async function () {
      const initialBalance = await dealOrNot.getHouseFunds();
      const depositAmount = ethers.parseEther("50");

      const tx = await dealOrNot.connect(owner).depositHouseFunds({ value: depositAmount });
      await tx.wait();

      const finalBalance = await dealOrNot.getHouseFunds();
      expect(finalBalance).to.equal(initialBalance + depositAmount);
    });

    it("Should allow owner to withdraw house funds", async function () {
      const initialBalance = await dealOrNot.getHouseFunds();
      const withdrawAmount = ethers.parseEther("10");

      const tx = await dealOrNot.connect(owner).withdrawHouseFunds(withdrawAmount);
      await tx.wait();

      const finalBalance = await dealOrNot.getHouseFunds();
      expect(finalBalance).to.equal(initialBalance - withdrawAmount);
    });

    it("Should reject house fund operations from non-owner", async function () {
      await expect(
        dealOrNot.connect(player1).depositHouseFunds({ value: ethers.parseEther("10") }),
      ).to.be.revertedWithCustomError(dealOrNot, "OwnableUnauthorizedAccount");

      await expect(
        dealOrNot.connect(player1).withdrawHouseFunds(ethers.parseEther("10")),
      ).to.be.revertedWithCustomError(dealOrNot, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    it("Should return correct box values", async function () {
      expect(await dealOrNot.getBoxValue(0)).to.equal(ethers.parseEther("0.01"));
      expect(await dealOrNot.getBoxValue(25)).to.equal(ethers.parseEther("30"));

      await expect(dealOrNot.getBoxValue(26)).to.be.revertedWith("Invalid box index");
    });

    it("Should return correct game statistics", async function () {
      const totalGames = await dealOrNot.getTotalGames();
      expect(totalGames).to.be.greaterThan(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle insufficient house funds", async function () {
      // Deploy a new contract with minimal house funds
      const newContract = await ethers.getContractFactory("DealOrNot");
      const testContract = await newContract.deploy(owner.address);
      await testContract.waitForDeployment();

      // Deposit minimal house funds
      await testContract.connect(owner).depositHouseFunds({ value: ethers.parseEther("0.1") });

      // Start a game
      const tx = await testContract.connect(player1).startGame({ value: ENTRY_FEE });
      await tx.wait();

      // Try to accept a deal (should fail due to insufficient house funds)
      const remainingBoxes = await testContract.getRemainingBoxes(0);
      const boxesToEliminate = Array.from(remainingBoxes.slice(0, 6));

      await testContract.connect(player1).eliminateBoxes(0, boxesToEliminate);

      await expect(testContract.connect(player1).acceptDeal(0)).to.be.revertedWith("House insufficient funds");
    });

    it("Should handle multiple concurrent games", async function () {
      // Start multiple games
      const tx1 = await dealOrNot.connect(player1).startGame({ value: ENTRY_FEE });
      await tx1.wait();
      const tx2 = await dealOrNot.connect(player2).startGame({ value: ENTRY_FEE });
      await tx2.wait();

      const player1Games = await dealOrNot.getPlayerGames(player1.address);
      const player2Games = await dealOrNot.getPlayerGames(player2.address);

      expect(player1Games.length).to.be.greaterThan(0);
      expect(player2Games.length).to.be.greaterThan(0);
    });
  });
});
