import { ethers, deployments } from "hardhat";

async function main() {
  console.log("🎮 Testing DealOrNot Contract on Monad Testnet");
  console.log("=".repeat(60));

  // Get deployed contract addresses
  const dealOrNotDeployment = await deployments.get("DealOrNot");
  const vrfDeployment = await deployments.get("MonadVRF");

  const DEAL_OR_NOT_ADDRESS = dealOrNotDeployment.address;
  const VRF_ADDRESS = vrfDeployment.address;

  console.log(`📍 DealOrNot Contract: ${DEAL_OR_NOT_ADDRESS}`);
  console.log(`📍 MonadVRF Contract: ${VRF_ADDRESS}`);
  console.log(`🌐 Network: Monad Testnet (Chain ID: 10143)`);
  console.log("=".repeat(60));

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer/Player: ${deployer.address}`);

  // Check balances
  const deployerBalance = await ethers.provider.getBalance(deployer.address);

  console.log(`💰 Deployer balance: ${ethers.formatEther(deployerBalance)} MON`);

  if (deployerBalance === 0n) {
    console.log("⚠️  Warning: Deployer has no MON tokens. Get some from:");
    console.log("🚰 Faucet: https://faucet.monad.xyz");
  }
  console.log("");

  // Connect to contracts
  const dealOrNot = await ethers.getContractAt("DealOrNot", DEAL_OR_NOT_ADDRESS, deployer);

  console.log("✅ Connected to deployed contracts");

  // Get contract state
  console.log("\n🔍 Contract State:");
  console.log("-".repeat(40));

  try {
    const owner = await dealOrNot.owner();
    const gameToken = await dealOrNot.gameToken();
    const houseFunds = await dealOrNot.getHouseFunds();
    const totalGames = await dealOrNot.getTotalGames();
    const vrfAddress = await dealOrNot.vrf();

    console.log(`👑 Owner: ${owner}`);
    console.log(`🪙 Game Token: ${gameToken}`);
    console.log(`🏠 House Funds: ${ethers.formatEther(houseFunds)} tokens`);
    console.log(`🎯 Total Games: ${totalGames}`);
    console.log(`🎲 VRF Address: ${vrfAddress}`);
    console.log(`🔗 VRF Match: ${vrfAddress.toLowerCase() === VRF_ADDRESS.toLowerCase() ? "✅" : "❌"}`);

    // Get game token contract
    const gameTokenContract = await ethers.getContractAt("IERC20", gameToken);

    // Check token balances
    const contractTokenBalance = await gameTokenContract.balanceOf(DEAL_OR_NOT_ADDRESS);
    const deployerTokenBalance = await gameTokenContract.balanceOf(deployer.address);

    console.log(`💰 Contract token balance: ${ethers.formatEther(contractTokenBalance)} tokens`);
    console.log(`💰 Deployer token balance: ${ethers.formatEther(deployerTokenBalance)} tokens`);
  } catch (error) {
    console.log(`❌ Error getting contract state: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Pre-fund the contract with ETH for VRF fees
  console.log("\n💰 Pre-funding contract with ETH for VRF fees...");
  try {
    const vrfContract = await ethers.getContractAt("MonadVRF", VRF_ADDRESS);
    let vrfFee = ethers.parseEther("0.001"); // Default fee

    try {
      vrfFee = await vrfContract.getEntropyFee();
      console.log(`🎲 VRF fee per request: ${ethers.formatEther(vrfFee)} MON`);
    } catch (feeError) {
      console.log(`⚠️ Could not get VRF fee, using default: ${ethers.formatEther(vrfFee)} MON`);
      console.log(`ℹ️  Error: ${feeError instanceof Error ? feeError.message : String(feeError)}`);
    }

    // Estimate total VRF fees needed (startGame + multiple eliminateBoxes calls)
    const estimatedVrfCalls = 10; // Conservative estimate
    const totalVrfFees = vrfFee * BigInt(estimatedVrfCalls);

    console.log(`💰 Estimated total VRF fees needed: ${ethers.formatEther(totalVrfFees)} MON`);

    // Check deployer balance
    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Deployer balance: ${ethers.formatEther(deployerBalance)} MON`);

    if (deployerBalance >= totalVrfFees) {
      // Send ETH to contract for VRF fees
      console.log(`📤 Sending ${ethers.formatEther(totalVrfFees)} MON to contract for VRF fees...`);
      const fundTx = await deployer.sendTransaction({
        to: DEAL_OR_NOT_ADDRESS,
        value: totalVrfFees,
      });
      await fundTx.wait();
      console.log(`✅ Contract funded with ETH for VRF fees`);
    } else {
      console.log("⚠️ Insufficient MON balance for VRF fees");
      console.log("🚰 Get MON from faucet: https://faucet.monad.xyz");
    }
  } catch (error) {
    console.log(`❌ Error pre-funding contract: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Test Game Flow
  console.log("\n🎯 Testing Game Flow:");
  console.log("-".repeat(40));

  const testResults: Array<{
    testName: string;
    gameId?: bigint;
    success: boolean;
    error?: string;
    gasUsed?: bigint;
  }> = [];

  // Test 1: Start a new game
  console.log("\n🎮 Test 1: Starting a new game (deployer as player)");
  try {
    const entryFee = ethers.parseEther("0.001"); // 0.001 tokens

    // Get game token contract
    const gameToken = await dealOrNot.gameToken();
    const gameTokenContract = await ethers.getContractAt("IERC20", gameToken);

    // Check deployer balance and approve tokens
    const deployerBalance = await gameTokenContract.balanceOf(deployer.address);
    console.log(`💰 Deployer token balance: ${ethers.formatEther(deployerBalance)} tokens`);

    if (deployerBalance < entryFee) {
      console.log("⚠️ Deployer doesn't have enough tokens for entry fee");
      testResults.push({
        testName: "Start Game",
        success: false,
        error: "Insufficient tokens",
      });
    } else {
      // Approve tokens
      console.log("🔓 Approving tokens for game entry...");
      const approveTx = await gameTokenContract.connect(deployer).approve(DEAL_OR_NOT_ADDRESS, entryFee);
      await approveTx.wait();

      // Start game (contract should have ETH for VRF fees)
      console.log(`🚀 Starting game with entry fee: ${ethers.formatEther(entryFee)} tokens`);
      const startTx = await dealOrNot.connect(deployer).startGame(entryFee);
      const receipt = await startTx.wait();

      if (!receipt) {
        throw new Error("Transaction receipt is null");
      }

      // Get game ID from events
      const gameStartedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = dealOrNot.interface.parseLog(log);
          return parsed?.name === "GameStarted";
        } catch {
          return false;
        }
      });

      let gameId: bigint;
      if (gameStartedEvent) {
        const parsed = dealOrNot.interface.parseLog(gameStartedEvent);
        gameId = parsed?.args.gameId;
        console.log(`🎯 Game started with ID: ${gameId}`);
      } else {
        // Fallback: get latest game ID
        const totalGames = await dealOrNot.getTotalGames();
        gameId = totalGames - 1n;
        console.log(`🎯 Game ID (fallback): ${gameId}`);
      }

      // Get game state
      const gameState = await dealOrNot.getGameState(gameId);
      console.log(`👤 Player: ${gameState.player}`);
      console.log(`📦 Player's Box: ${gameState.playerBoxIndex}`);
      console.log(`🎲 Current Round: ${gameState.currentRound}`);
      console.log(`🎮 Game State: ${gameState.state}`);

      testResults.push({
        testName: "Start Game",
        gameId: gameId,
        success: true,
        gasUsed: receipt.gasUsed,
      });

      // Test 2: Eliminate boxes (Round 1)
      console.log("\n🎮 Test 2: Eliminating boxes (Round 1)");
      try {
        const eliminateTx = await dealOrNot.connect(deployer).eliminateBoxes(gameId);
        const eliminateReceipt = await eliminateTx.wait();

        if (!eliminateReceipt) {
          throw new Error("Elimination transaction receipt is null");
        }

        console.log(`📝 Elimination transaction: ${eliminateTx.hash}`);
        console.log(`⛽ Gas used: ${eliminateReceipt.gasUsed}`);

        // Get updated game state
        const updatedGameState = await dealOrNot.getGameState(gameId);
        const eliminatedBoxes = await dealOrNot.getEliminatedBoxes(gameId);
        const remainingBoxes = await dealOrNot.getRemainingBoxes(gameId);
        const currentOffer = await dealOrNot.getCurrentOffer(gameId);

        console.log(`🎲 Current Round: ${updatedGameState.currentRound}`);
        console.log(`🎮 Game State: ${updatedGameState.state}`);
        console.log(
          `📦 Eliminated Boxes: ${eliminatedBoxes.length} [${eliminatedBoxes.slice(0, 3).join(", ")}${eliminatedBoxes.length > 3 ? "..." : ""}]`,
        );
        console.log(`📦 Remaining Boxes: ${remainingBoxes.length}`);
        console.log(`💰 Current Offer: ${ethers.formatEther(currentOffer)} tokens`);

        testResults.push({
          testName: "Eliminate Boxes Round 1",
          gameId: gameId,
          success: true,
          gasUsed: eliminateReceipt.gasUsed,
        });

        // Test 3: Accept deal
        console.log("\n🎮 Test 3: Accepting deal");
        try {
          const acceptTx = await dealOrNot.connect(deployer).acceptDeal(gameId);
          const acceptReceipt = await acceptTx.wait();

          if (!acceptReceipt) {
            throw new Error("Accept deal transaction receipt is null");
          }

          console.log(`📝 Accept deal transaction: ${acceptTx.hash}`);
          console.log(`⛽ Gas used: ${acceptReceipt.gasUsed}`);

          // Get final game state
          const finalGameState = await dealOrNot.getGameState(gameId);
          console.log(`🎮 Final Game State: ${finalGameState.state}`);
          console.log(`🎯 Game Active: ${finalGameState.isActive}`);
          console.log(`💰 Payout: ${ethers.formatEther(currentOffer)} tokens`);

          testResults.push({
            testName: "Accept Deal",
            gameId: gameId,
            success: true,
            gasUsed: acceptReceipt.gasUsed,
          });
        } catch (error) {
          console.log(`❌ Error accepting deal: ${error instanceof Error ? error.message : String(error)}`);
          testResults.push({
            testName: "Accept Deal",
            gameId: gameId,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } catch (error) {
        console.log(`❌ Error eliminating boxes: ${error instanceof Error ? error.message : String(error)}`);
        testResults.push({
          testName: "Eliminate Boxes Round 1",
          gameId: gameId,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } catch (error) {
    console.log(`❌ Error starting game: ${error instanceof Error ? error.message : String(error)}`);
    testResults.push({
      testName: "Start Game",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 4: Full game playthrough (reject deals)
  console.log("\n🎮 Test 4: Full game playthrough (deployer rejects deals until end)");
  try {
    const entryFee = ethers.parseEther("0.001"); // 0.001 tokens

    // Get game token contract
    const gameToken = await dealOrNot.gameToken();
    const gameTokenContract = await ethers.getContractAt("IERC20", gameToken);

    // Check deployer balance
    const deployerBalance = await gameTokenContract.balanceOf(deployer.address);
    console.log(`💰 Deployer token balance: ${ethers.formatEther(deployerBalance)} tokens`);

    if (deployerBalance >= entryFee) {
      // Approve tokens
      console.log("🔓 Approving tokens for game entry...");
      const approveTx = await gameTokenContract.connect(deployer).approve(DEAL_OR_NOT_ADDRESS, entryFee);
      await approveTx.wait();

      // Start game (contract should have ETH for VRF fees)
      console.log(`🚀 Starting full playthrough game with entry fee: ${ethers.formatEther(entryFee)} tokens`);
      const startTx = await dealOrNot.connect(deployer).startGame(entryFee);
      const receipt = await startTx.wait();

      if (!receipt) {
        throw new Error("Transaction receipt is null");
      }

      // Get game ID
      const totalGames = await dealOrNot.getTotalGames();
      const gameId = totalGames - 1n;
      console.log(`🎯 Full playthrough game ID: ${gameId}`);

      // Play through all rounds
      const roundEliminations = [6, 5, 4, 3, 2, 1]; // From contract
      let completedRounds = 0;

      for (let i = 0; i < roundEliminations.length; i++) {
        console.log(`\n🎲 Round ${i + 1}: Eliminating ${roundEliminations[i]} boxes`);

        try {
          const eliminateTx = await dealOrNot.connect(deployer).eliminateBoxes(gameId);
          await eliminateTx.wait();

          const gameState = await dealOrNot.getGameState(gameId);
          const eliminatedBoxes = await dealOrNot.getEliminatedBoxes(gameId);
          const currentOffer = await dealOrNot.getCurrentOffer(gameId);

          console.log(`   📦 Total eliminated: ${eliminatedBoxes.length}`);
          console.log(`   💰 Current offer: ${ethers.formatEther(currentOffer)} tokens`);
          console.log(`   🎮 Game state: ${gameState.state}`);

          completedRounds++;

          // If this is the last round, the next elimination should complete the game
          if (i === roundEliminations.length - 1) {
            console.log(`\n🏁 Final round: Rejecting final deal to complete game`);
            const finalEliminateTx = await dealOrNot.connect(deployer).eliminateBoxes(gameId);
            await finalEliminateTx.wait();

            const finalGameState = await dealOrNot.getGameState(gameId);
            console.log(`   🎮 Final game state: ${finalGameState.state}`);
            console.log(`   🎯 Game completed: ${!finalGameState.isActive}`);

            // Get player's final box value
            const prizePool = await dealOrNot.getPrizePool(gameId);
            const playerBoxValue = prizePool[Number(finalGameState.playerBoxIndex)];
            console.log(`   💰 Player's box value: ${ethers.formatEther(playerBoxValue)} tokens`);
          }
        } catch (error) {
          console.log(`   ❌ Error in round ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
          break;
        }
      }

      testResults.push({
        testName: "Full Game Playthrough",
        gameId: gameId,
        success: completedRounds === roundEliminations.length,
        gasUsed: receipt.gasUsed,
      });
    } else {
      console.log("⚠️ Deployer doesn't have enough tokens for entry fee");
      testResults.push({
        testName: "Full Game Playthrough",
        success: false,
        error: "Insufficient tokens",
      });
    }
  } catch (error) {
    console.log(`❌ Error in full playthrough: ${error instanceof Error ? error.message : String(error)}`);
    testResults.push({
      testName: "Full Game Playthrough",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Summary
  console.log("\n📊 Test Results Summary:");
  console.log("=".repeat(60));

  const successfulTests = testResults.filter(r => r.success).length;
  const failedTests = testResults.filter(r => !r.success).length;
  const totalGasUsed = testResults.reduce((sum, r) => sum + (r.gasUsed || 0n), 0n);

  console.log(`✅ Successful tests: ${successfulTests}/${testResults.length}`);
  console.log(`❌ Failed tests: ${failedTests}/${testResults.length}`);
  console.log(`⛽ Total gas used: ${totalGasUsed.toString()}`);

  // Detailed results
  console.log("\n📋 Detailed Test Results:");
  console.log("-".repeat(60));

  testResults.forEach((result, index) => {
    console.log(`\n🔢 Test ${index + 1}: ${result.testName}`);
    console.log(`   Success: ${result.success ? "✅" : "❌"}`);

    if (result.success) {
      if (result.gameId !== undefined) {
        console.log(`   Game ID: ${result.gameId}`);
      }
      if (result.gasUsed) {
        console.log(`   Gas Used: ${result.gasUsed.toString()}`);
      }
    } else {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log("\n🎯 Tests completed!");
  console.log(`🔗 DealOrNot Contract: https://testnet.monadexplorer.com/address/${DEAL_OR_NOT_ADDRESS}`);
  console.log(`🔗 MonadVRF Contract: https://testnet.monadexplorer.com/address/${VRF_ADDRESS}`);
}

// Handle errors
main().catch(error => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});
