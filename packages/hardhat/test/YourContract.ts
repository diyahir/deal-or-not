import { expect } from "chai";
import { ethers } from "hardhat";
import { DealOrNot, MockERC20 } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("DealOrNot", function () {
  let dealOrNot: DealOrNot;
  let gameToken: MockERC20;
  let owner: HardhatEthersSigner;
  let player1: HardhatEthersSigner;
  let player2: HardhatEthersSigner;

  const ENTRY_FEE = ethers.parseEther("100"); // 100 tokens
  const HOUSE_FUNDS = ethers.parseEther("200000"); // 200,000 tokens (enough to cover max prizes)

  before(async () => {
    [owner, player1, player2] = await ethers.getSigners();
    const dealOrNotFactory = await ethers.getContractFactory("DealOrNot");

    const vrfContractFactory = await ethers.getContractFactory("BaseVRF");
    const vrfContract = await vrfContractFactory.deploy();
    await vrfContract.waitForDeployment();
    const vrfContractAddress = await vrfContract.getAddress();

    const gameTokenFactory = await ethers.getContractFactory("MockERC20");
    gameToken = await gameTokenFactory.deploy("Test Token", "TT", 18, ethers.parseEther("1000000"));
    await gameToken.waitForDeployment();
    const gameTokenAddress = await gameToken.getAddress();

    // Mint tokens to all players
    await gameToken.mint(owner.address, ethers.parseEther("100000"));
    await gameToken.mint(player1.address, ethers.parseEther("100000"));
    await gameToken.mint(player2.address, ethers.parseEther("100000"));

    const isMonad = false;

    dealOrNot = await dealOrNotFactory.deploy(owner.address, vrfContractAddress, isMonad, gameTokenAddress, ENTRY_FEE);
    await dealOrNot.waitForDeployment();

    // Approve tokens for contract usage
    await gameToken.connect(owner).approve(await dealOrNot.getAddress(), ethers.parseEther("300000"));
    await gameToken.connect(player1).approve(await dealOrNot.getAddress(), ethers.parseEther("100000"));
    await gameToken.connect(player2).approve(await dealOrNot.getAddress(), ethers.parseEther("100000"));

    // Deposit house funds for testing
    await dealOrNot.connect(owner).depositHouseFunds(HOUSE_FUNDS);
  });

  describe("Deployment", function () {
    it("Should have the correct initial state", async function () {
      expect(await dealOrNot.TOTAL_BOXES()).to.equal(26);
      expect(await dealOrNot.entryFee()).to.equal(ENTRY_FEE);
      expect(await dealOrNot.HOUSE_OFFER_PERCENTAGE()).to.equal(75);
      expect(await dealOrNot.nextGameId()).to.equal(0);
      expect(await dealOrNot.getHouseFunds()).to.equal(HOUSE_FUNDS);
    });

    it("Should have the correct prize pool", async function () {
      const prizePool = await dealOrNot.getPrizePool();
      expect(prizePool.length).to.equal(26);
      // Check that first prize is entry fee divided by 10000
      expect(prizePool[0]).to.equal(ENTRY_FEE / 10000n);
      // Check that last prize is entry fee multiplied by 1000
      expect(prizePool[25]).to.equal(ENTRY_FEE * 1000n);
    });

    it("Should set the correct owner", async function () {
      expect(await dealOrNot.owner()).to.equal(owner.address);
    });
  });

  describe("Game Creation", function () {
    it("Should allow starting a new game with correct entry fee", async function () {
      const tx = await dealOrNot.connect(player1).startGame();
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

    it("Should reject game creation without sufficient token allowance", async function () {
      // Create a new player without token approval
      const [, , , newPlayer] = await ethers.getSigners();
      await gameToken.mint(newPlayer.address, ethers.parseEther("1000"));

      await expect(dealOrNot.connect(newPlayer).startGame()).to.be.revertedWithCustomError(
        gameToken,
        "ERC20InsufficientAllowance",
      );
    });

    it("Should track player games correctly", async function () {
      const playerGames = await dealOrNot.getPlayerGames(player1.address);
      expect(playerGames.length).to.equal(1);
      expect(playerGames[0]).to.equal(0);
    });
  });

  describe("Box Elimination", function () {
    it("Should allow eliminating boxes in round 1 (6 boxes)", async function () {
      // Start a new game for this test
      const tx = await dealOrNot.connect(player2).startGame();
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      const eliminateTx = await dealOrNot.connect(player2).eliminateBoxes(gameId);
      await eliminateTx.wait();

      const gameState = await dealOrNot.getGameState(gameId);
      const newRemainingBoxes = await dealOrNot.getRemainingBoxes(gameId);
      const eliminatedBoxes = await dealOrNot.getEliminatedBoxes(gameId);

      expect(gameState.currentRound).to.equal(1);
      expect(gameState.state).to.equal(2); // GameState.OfferMade
      expect(newRemainingBoxes.length).to.equal(19); // 25 - 6
      expect(eliminatedBoxes.length).to.equal(6);

      // Check that current offer is greater than 0
      const currentOffer = await dealOrNot.getCurrentOffer(gameId);
      expect(currentOffer).to.be.greaterThan(0);
    });

    it("Should only allow the game owner to eliminate boxes", async function () {
      // Start a new game for this test
      const tx = await dealOrNot.connect(player2).startGame();
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      await expect(dealOrNot.connect(player1).eliminateBoxes(gameId)).to.be.revertedWith("Not your game");
    });

    it("Should allow eliminating boxes when game is in OfferMade state (rejecting deal)", async function () {
      // Start a new game for this test
      const tx = await dealOrNot.connect(player2).startGame();
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      // Eliminate boxes first to move to OfferMade state
      await dealOrNot.connect(player2).eliminateBoxes(gameId);

      let gameState = await dealOrNot.getGameState(gameId);
      expect(gameState.state).to.equal(2); // GameState.OfferMade

      // Eliminate more boxes while in OfferMade state (this should reject the deal and continue)
      await dealOrNot.connect(player2).eliminateBoxes(gameId);

      gameState = await dealOrNot.getGameState(gameId);
      expect(gameState.state).to.equal(2); // GameState.OfferMade (new offer)
      expect(gameState.currentRound).to.equal(2);
    });

    it("Should prevent eliminating boxes when game is completed", async function () {
      // Start a new game for this test
      const tx = await dealOrNot.connect(player2).startGame();
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      // Eliminate boxes and accept the deal to complete the game
      await dealOrNot.connect(player2).eliminateBoxes(gameId);
      await dealOrNot.connect(player2).acceptDeal(gameId);

      const gameState = await dealOrNot.getGameState(gameId);
      expect(gameState.state).to.equal(3); // GameState.DealTaken

      // Try to eliminate boxes when game is completed
      await expect(dealOrNot.connect(player2).eliminateBoxes(gameId)).to.be.revertedWith("Invalid game state");
    });

    it("Should eliminate different numbers of boxes per round", async function () {
      // Start a new game for this test
      const tx = await dealOrNot.connect(player2).startGame();
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      // Round 1: Should eliminate 6 boxes
      await dealOrNot.connect(player2).eliminateBoxes(gameId);
      let eliminatedBoxes = await dealOrNot.getEliminatedBoxes(gameId);
      expect(eliminatedBoxes.length).to.equal(6);

      // Eliminate more boxes (implicitly rejects deal and continues to round 2)
      await dealOrNot.connect(player2).eliminateBoxes(gameId);
      eliminatedBoxes = await dealOrNot.getEliminatedBoxes(gameId);
      expect(eliminatedBoxes.length).to.equal(11); // 6 + 5
    });

    it("Should not eliminate player's box or already eliminated boxes", async function () {
      // Start a new game for this test
      const tx = await dealOrNot.connect(player2).startGame();
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      const gameState = await dealOrNot.getGameState(gameId);
      const playerBoxIndex = gameState.playerBoxIndex;

      // Eliminate boxes
      await dealOrNot.connect(player2).eliminateBoxes(gameId);

      const eliminatedBoxes = await dealOrNot.getEliminatedBoxes(gameId);

      // Verify player's box is not eliminated
      expect(eliminatedBoxes).to.not.include(playerBoxIndex);
    });
  });

  describe("Deal Acceptance and Rejection", function () {
    it("Should allow accepting a deal", async function () {
      // Start a new game and eliminate first round
      const tx = await dealOrNot.connect(player1).startGame();
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      const eliminateTx = await dealOrNot.connect(player1).eliminateBoxes(gameId);
      await eliminateTx.wait();

      const offer = await dealOrNot.getCurrentOffer(gameId);
      const houseBalanceBefore = await dealOrNot.getHouseFunds();
      const playerBalanceBefore = await gameToken.balanceOf(player1.address);

      const acceptTx = await dealOrNot.connect(player1).acceptDeal(gameId);
      await acceptTx.wait();

      const gameStateAfter = await dealOrNot.getGameState(gameId);
      const houseBalanceAfter = await dealOrNot.getHouseFunds();
      const playerBalanceAfter = await gameToken.balanceOf(player1.address);

      expect(gameStateAfter.state).to.equal(3); // GameState.DealTaken
      expect(gameStateAfter.isActive).to.equal(false);
      expect(houseBalanceAfter).to.equal(houseBalanceBefore - offer);
      expect(playerBalanceAfter).to.equal(playerBalanceBefore + offer);
    });

    it("Should allow rejecting a deal by eliminating more boxes", async function () {
      // Start a new game and eliminate first round
      const tx = await dealOrNot.connect(player1).startGame();
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      const eliminateTx = await dealOrNot.connect(player1).eliminateBoxes(gameId);
      await eliminateTx.wait();

      // Game should be in OfferMade state after first elimination
      let gameState = await dealOrNot.getGameState(gameId);
      expect(gameState.state).to.equal(2); // GameState.OfferMade

      // Eliminate more boxes (implicitly rejects the deal)
      const eliminateMoreTx = await dealOrNot.connect(player1).eliminateBoxes(gameId);
      await eliminateMoreTx.wait();

      gameState = await dealOrNot.getGameState(gameId);
      expect(gameState.state).to.equal(2); // GameState.OfferMade (new offer)
      expect(gameState.isActive).to.equal(true);
      expect(gameState.currentRound).to.equal(2);
    });

    it("Should only allow the game owner to accept deals", async function () {
      // Start a new game and eliminate first round
      const tx = await dealOrNot.connect(player1).startGame();
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      const eliminateTx = await dealOrNot.connect(player1).eliminateBoxes(gameId);
      await eliminateTx.wait();

      await expect(dealOrNot.connect(player2).acceptDeal(gameId)).to.be.revertedWith("Not your game");
    });
  });

  describe("House Offer Calculation", function () {
    it("Should calculate offers as 75% of expected value", async function () {
      // Start a game
      const tx = await dealOrNot.connect(player1).startGame();
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      // Get initial state
      const gameState = await dealOrNot.getGameState(gameId);
      const prizePool = await dealOrNot.getPrizePool();

      // Eliminate boxes first
      const eliminateTx = await dealOrNot.connect(player1).eliminateBoxes(gameId);
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
      expect(currentOffer).to.be.closeTo(expectedOffer, ethers.parseEther("1"));
    });
  });

  describe("House Fund Management", function () {
    it("Should allow owner to deposit house funds", async function () {
      const initialBalance = await dealOrNot.getHouseFunds();
      const depositAmount = ethers.parseEther("1000");

      const tx = await dealOrNot.connect(owner).depositHouseFunds(depositAmount);
      await tx.wait();

      const finalBalance = await dealOrNot.getHouseFunds();
      expect(finalBalance).to.equal(initialBalance + depositAmount);
    });

    it("Should allow owner to withdraw house funds", async function () {
      const initialBalance = await dealOrNot.getHouseFunds();
      const withdrawAmount = ethers.parseEther("500");

      const tx = await dealOrNot.connect(owner).withdrawHouseFunds(withdrawAmount);
      await tx.wait();

      const finalBalance = await dealOrNot.getHouseFunds();
      expect(finalBalance).to.equal(initialBalance - withdrawAmount);
    });

    it("Should reject house fund operations from non-owner", async function () {
      await expect(
        dealOrNot.connect(player1).depositHouseFunds(ethers.parseEther("100")),
      ).to.be.revertedWithCustomError(dealOrNot, "OwnableUnauthorizedAccount");

      await expect(
        dealOrNot.connect(player1).withdrawHouseFunds(ethers.parseEther("100")),
      ).to.be.revertedWithCustomError(dealOrNot, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    it("Should return correct box values", async function () {
      const prizePool = await dealOrNot.getPrizePool();
      expect(await dealOrNot.getBoxValue(0)).to.equal(prizePool[0]);
      expect(await dealOrNot.getBoxValue(25)).to.equal(prizePool[25]);

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
      const vrfContractFactory = await ethers.getContractFactory("BaseVRF");
      const vrfContract = await vrfContractFactory.deploy();
      await vrfContract.waitForDeployment();
      const vrfContractAddress = await vrfContract.getAddress();

      const gameTokenFactory = await ethers.getContractFactory("MockERC20");
      const newGameToken = await gameTokenFactory.deploy("Test Token", "TT", 18, ethers.parseEther("1000"));
      await newGameToken.waitForDeployment();
      const gameTokenAddress = await newGameToken.getAddress();

      const testContract = await newContract.deploy(
        owner.address,
        vrfContractAddress,
        false,
        gameTokenAddress,
        ENTRY_FEE,
      );
      await testContract.waitForDeployment();

      // Mint and approve tokens
      await newGameToken.mint(owner.address, ethers.parseEther("1000"));
      await newGameToken.mint(player1.address, ethers.parseEther("1000"));
      await newGameToken.connect(owner).approve(await testContract.getAddress(), ethers.parseEther("1000"));
      await newGameToken.connect(player1).approve(await testContract.getAddress(), ethers.parseEther("1000"));

      // Deposit minimal house funds
      await testContract.connect(owner).depositHouseFunds(ethers.parseEther("10"));

      // Start a game
      const tx = await testContract.connect(player1).startGame();
      await tx.wait();

      // Try to accept a deal (should fail due to insufficient house funds)
      await testContract.connect(player1).eliminateBoxes(0);

      await expect(testContract.connect(player1).acceptDeal(0)).to.be.revertedWith("House insufficient funds");
    });

    it("Should handle multiple concurrent games", async function () {
      // Start multiple games
      const tx1 = await dealOrNot.connect(player1).startGame();
      await tx1.wait();
      const tx2 = await dealOrNot.connect(player2).startGame();
      await tx2.wait();

      const player1Games = await dealOrNot.getPlayerGames(player1.address);
      const player2Games = await dealOrNot.getPlayerGames(player2.address);

      expect(player1Games.length).to.be.greaterThan(0);
      expect(player2Games.length).to.be.greaterThan(0);
    });

    it("Should complete game when reaching final round", async function () {
      // Start a new game
      const tx = await dealOrNot.connect(player1).startGame();
      await tx.wait();

      // Get the current game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;

      // Play through all rounds by eliminating boxes (implicitly rejecting deals)
      const roundEliminations = [6, 5, 4, 3, 2, 1]; // From contract

      for (let i = 0; i < roundEliminations.length; i++) {
        await dealOrNot.connect(player1).eliminateBoxes(gameId);

        // If not the final round, eliminate more boxes (reject the deal)
        if (i < roundEliminations.length - 1) {
          const gameState = await dealOrNot.getGameState(gameId);
          expect(gameState.state).to.equal(2); // GameState.OfferMade
        }
      }

      // At this point, we should be in final round with an offer
      const gameState = await dealOrNot.getGameState(gameId);
      expect(gameState.state).to.equal(2); // GameState.OfferMade
      expect(gameState.currentRound).to.equal(6);

      // Try to eliminate more boxes (reject the final deal) to complete the game
      await dealOrNot.connect(player1).eliminateBoxes(gameId);

      const finalGameState = await dealOrNot.getGameState(gameId);
      expect(finalGameState.state).to.equal(4); // GameState.GameCompleted
      expect(finalGameState.isActive).to.equal(false);
    });
  });
});
