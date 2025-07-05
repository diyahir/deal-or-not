import { ethers, deployments } from "hardhat";

// Helper function to poll for random number with timeout
async function pollForRandomNumber(
  contract: any,
  sequenceNumber: bigint,
  timeoutSeconds: number,
): Promise<string | null> {
  const startTime = Date.now();
  const timeoutMs = timeoutSeconds * 1000;

  console.log(`⏳ Starting polling for sequence ${sequenceNumber} (timeout: ${timeoutSeconds}s)`);

  while (Date.now() - startTime < timeoutMs) {
    try {
      const randomNumber = await contract.getRandomNumber(sequenceNumber);
      const isZero = randomNumber === "0x0000000000000000000000000000000000000000000000000000000000000000";

      if (!isZero) {
        console.log(`🎲 Random number received for sequence ${sequenceNumber}: ${randomNumber}`);
        return randomNumber;
      }

      // Wait 10 seconds before next poll
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      console.log(
        `⏳ Sequence ${sequenceNumber}: Random number not ready yet (${elapsed}s elapsed), waiting 10 seconds...`,
      );
      await new Promise(resolve => setTimeout(resolve, 10000));
    } catch (error) {
      console.log(
        `❌ Error polling sequence ${sequenceNumber}: ${error instanceof Error ? error.message : String(error)}`,
      );
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  console.log(`⏰ Timeout reached for sequence ${sequenceNumber} (${timeoutSeconds}s) - random number not received`);
  return null;
}

async function main() {
  console.log("🚀 Testing Real MonadVRF Contract on Monad Testnet");
  console.log("=".repeat(60));

  // Get the deployed contract address from deployments
  const deployment = await deployments.get("MonadVRF");
  const DEPLOYED_CONTRACT_ADDRESS = deployment.address;

  console.log(`📍 Contract Address: ${DEPLOYED_CONTRACT_ADDRESS}`);
  console.log(`🌐 Network: Monad Testnet (Chain ID: 10143)`);
  console.log("=".repeat(60));

  // Get the signer from private key
  const privateKey = process.env.MONAD_PK!;
  const signer = new ethers.Wallet(privateKey, ethers.provider);
  console.log(`👤 Testing with private key signer: ${signer.address}`);

  // Also log the default hardhat signer for comparison
  const [defaultSigner] = await ethers.getSigners();
  console.log(`🔑 Default hardhat signer: ${defaultSigner.address}`);
  const defaultBalance = await ethers.provider.getBalance(defaultSigner.address);
  console.log(`💰 Default signer balance: ${ethers.formatEther(defaultBalance)} MON`);

  // Check signer balance
  const balance = await ethers.provider.getBalance(signer.address);
  console.log(`💰 Signer balance: ${ethers.formatEther(balance)} MON`);

  if (balance === 0n) {
    console.log("⚠️  Warning: Signer has no MON tokens. Get some from the faucet:");
    console.log("🚰 Faucet: https://faucet.monad.xyz");
    console.log("ℹ️  Continuing with tests anyway...");
  }
  console.log("");

  // Connect to the deployed contract
  const monadVRF = await ethers.getContractAt("MonadVRF", DEPLOYED_CONTRACT_ADDRESS, signer);
  console.log("✅ Connected to deployed contract");

  // Get contract state
  console.log("\n🔍 Contract State:");
  console.log("-".repeat(40));

  try {
    const owner = await monadVRF.owner();
    const entropyContract = await monadVRF.entropy();
    const entropyProvider = await monadVRF.entropyProvider();

    console.log(`👑 Owner: ${owner}`);
    console.log(`🔗 Entropy Contract: ${entropyContract}`);
    console.log(`🎲 Entropy Provider: ${entropyProvider}`);

    const isOwner = owner.toLowerCase() === signer.address.toLowerCase();
    console.log(`🔑 Current signer is owner: ${isOwner}`);

    // If current signer is owner and no entropy provider is set, try to set one
    if (isOwner && entropyProvider === "0x0000000000000000000000000000000000000000") {
      console.log("\n🔧 Setting up entropy provider...");

      // Try to initialize entropy provider from the entropy contract
      try {
        console.log("🔄 Attempting to initialize entropy provider from entropy contract...");
        const initTx = await monadVRF.initializeEntropyProvider();
        console.log(`📝 Transaction sent: ${initTx.hash}`);
        await initTx.wait();
        console.log("✅ Entropy provider initialized successfully!");

        const newProvider = await monadVRF.entropyProvider();
        console.log(`🎲 New entropy provider: ${newProvider}`);
      } catch (error) {
        console.log("❌ Failed to initialize from entropy contract (expected with mock)");
        console.log(`ℹ️  Error: ${error instanceof Error ? error.message : String(error)}`);

        // Try to set a mock entropy provider for testing
        console.log("🔄 Setting mock entropy provider for testing...");
        try {
          const mockProvider = "0x1234567890123456789012345678901234567890";
          const setTx = await monadVRF.setEntropyProvider(mockProvider);
          console.log(`📝 Transaction sent: ${setTx.hash}`);
          await setTx.wait();
          console.log(`✅ Mock entropy provider set: ${mockProvider}`);
        } catch (setError) {
          console.log("❌ Failed to set mock entropy provider");
          console.log(`ℹ️  Error: ${setError instanceof Error ? setError.message : String(setError)}`);
        }
      }
    }
  } catch (error) {
    console.log("❌ Error reading contract state:");
    console.log(`ℹ️  Error: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  // Test random number generation
  console.log("\n🎯 Testing Random Number Generation:");
  console.log("-".repeat(40));

  const numberOfTests = 3;
  const testResults: Array<{
    testNumber: number;
    userInput: string;
    txHash?: string;
    sequenceNumber?: bigint;
    gasUsed?: bigint;
    success: boolean;
    error?: string;
    randomNumber?: string | null;
  }> = [];

  for (let i = 0; i < numberOfTests; i++) {
    console.log(`\n🔄 Test ${i + 1}/${numberOfTests}:`);

    // Generate random user input
    const userRandomNumber = ethers.randomBytes(32);
    const userRandomNumberHex = ethers.hexlify(userRandomNumber);

    console.log(`📥 User input: ${userRandomNumberHex}`);

    try {
      // Try to get the fee first
      const currentProvider = await monadVRF.entropyProvider();

      if (currentProvider === "0x0000000000000000000000000000000000000000") {
        console.log("⚠️  No entropy provider set, cannot calculate fee");
        testResults.push({
          testNumber: i + 1,
          userInput: userRandomNumberHex,
          success: false,
          error: "No entropy provider set",
        });
        continue;
      }

      console.log(`🎲 Using entropy provider: ${currentProvider}`);

      // Try to get fee from entropy contract
      let fee = ethers.parseEther("0.001"); // Default fee

      try {
        const entropyAddress = await monadVRF.entropy();
        console.log(`🔗 Querying fee from entropy contract: ${entropyAddress}`);

        // This will likely fail with mock entropy contract, but let's try
        const entropyContract = await ethers.getContractAt("IEntropy", entropyAddress);
        const actualFee = await entropyContract.getFee(currentProvider);
        fee = actualFee;
        console.log(`💰 Actual fee from entropy contract: ${ethers.formatEther(fee)} MON`);
      } catch (feeError) {
        console.log(`⚠️  Could not get fee from entropy contract, using default: ${ethers.formatEther(fee)} MON`);
        console.log(`ℹ️  Fee error: ${feeError instanceof Error ? feeError.message : String(feeError)}`);
      }

      // Check if we have enough balance
      const currentBalance = await ethers.provider.getBalance(signer.address);
      if (currentBalance < fee) {
        console.log(
          `❌ Insufficient balance. Need ${ethers.formatEther(fee)} MON, have ${ethers.formatEther(currentBalance)} MON`,
        );
        testResults.push({
          testNumber: i + 1,
          userInput: userRandomNumberHex,
          success: false,
          error: "Insufficient balance",
        });
        continue;
      }

      // Make the actual request
      console.log(`🚀 Requesting random number with fee: ${ethers.formatEther(fee)} MON`);

      // Get the sequence number by calling the function first to predict the return value,
      // then make the actual transaction
      let sequenceNumber: bigint | undefined;
      let requestTx: any;
      let receipt: any;

      try {
        // Make the transaction directly
        requestTx = await monadVRF.requestRandomNumber(userRandomNumberHex, {
          value: fee,
          gasLimit: 500000,
        });

        console.log(`📝 Transaction sent: ${requestTx.hash}`);
        console.log(`⏳ Waiting for confirmation...`);

        // Check if the transaction response contains return data
        console.log(`📋 Transaction response properties:`, Object.keys(requestTx));
        if (requestTx.value !== undefined) {
          console.log(`📋 Transaction value: ${requestTx.value}`);
        }
        if ((requestTx as any).data !== undefined) {
          console.log(`📋 Transaction data: ${(requestTx as any).data}`);
        }

        receipt = await requestTx.wait();

        if (!receipt) {
          throw new Error("Transaction receipt is null");
        }

        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

        // Extract sequence number from the RandomNumberRequested event
        console.log(`📋 Receipt logs count: ${receipt.logs.length}`);
        console.log(`📋 Parsing logs for RandomNumberRequested event...`);

        // Parse logs using the contract interface to find the RandomNumberRequested event
        for (let i = 0; i < receipt.logs.length; i++) {
          const log = receipt.logs[i];
          console.log(`📋 Log ${i + 1}:`);
          console.log(`   Address: ${log.address}`);
          console.log(`   Topics: [${log.topics.join(", ")}]`);
          console.log(`   Data: ${log.data}`);
          console.log(`   Our contract: ${log.address.toLowerCase() === DEPLOYED_CONTRACT_ADDRESS.toLowerCase()}`);

          try {
            // Try to parse the log with the contract interface
            const parsedLog = monadVRF.interface.parseLog({
              topics: log.topics,
              data: log.data,
            });

            if (parsedLog && parsedLog.name === "RandomNumberRequested") {
              // Extract sequence number from the event
              sequenceNumber = parsedLog.args.sequenceNumber;
              console.log(`🎯 Found RandomNumberRequested event!`);
              console.log(`📋 Sequence Number: ${sequenceNumber}`);
              console.log(`📋 User Random Number: ${parsedLog.args.userRandomNumber}`);
              break;
            } else if (parsedLog) {
              console.log(`📋 Found other event from our contract: ${parsedLog.name}`);
            }
          } catch {
            // This log might not be from our contract or might be from entropy contract
            console.log(`📋 Could not parse log with our contract interface (likely from entropy contract)`);
          }
        }

        // Fallback: if event parsing failed, try raw log decoding (previous method)
        if (!sequenceNumber) {
          console.log(`⚠️  Event parsing failed, trying raw log decoding as fallback...`);
          for (const log of receipt.logs) {
            console.log(`📋 Log topic: ${log.topics[0]}`);
            console.log(`📋 Log data: ${log.data}`);
            if (log.data && log.data !== "0x") {
              try {
                if (log.data.length >= 66) {
                  // 32 bytes hex
                  const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["uint64"], log.data);
                  sequenceNumber = BigInt(decoded[0]);
                  console.log(`📋 Found sequence number in raw log: ${sequenceNumber}`);
                  break;
                }
              } catch {
                // Continue to next log
              }
            }
          }
        }
      } catch (error) {
        console.log(`❌ Error getting sequence number: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }

      if (sequenceNumber === undefined) {
        // Last resort: examine all properties of receipt for debugging
        console.log(`📋 All receipt properties:`, receipt);
        throw new Error("Could not extract sequence number from transaction response or receipt");
      }

      console.log(`🔢 Final sequence number: ${sequenceNumber}`);

      // Poll for random number with timeout
      console.log(`\n⏳ Polling for random number (sequence: ${sequenceNumber})...`);
      const randomNumber = await pollForRandomNumber(monadVRF, sequenceNumber, 120); // 2 minute timeout

      testResults.push({
        testNumber: i + 1,
        userInput: userRandomNumberHex,
        txHash: receipt.hash,
        sequenceNumber: sequenceNumber, // Use extracted sequence number
        gasUsed: receipt.gasUsed,
        success: true,
        randomNumber: randomNumber,
      });

      if (randomNumber && randomNumber !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        console.log(`🎉 Test ${i + 1} completed successfully! Random number: ${randomNumber}`);
      } else {
        console.log(`⚠️  Test ${i + 1} completed but random number not received within timeout`);
      }
    } catch (error) {
      console.log(`❌ Test ${i + 1} failed:`);
      console.log(`ℹ️  Error: ${error instanceof Error ? error.message : String(error)}`);

      testResults.push({
        testNumber: i + 1,
        userInput: userRandomNumberHex,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Display polling results summary
  console.log("\n🔍 Random Number Results Summary:");
  console.log("-".repeat(40));

  for (const result of testResults) {
    if (result.success && result.sequenceNumber) {
      if (
        result.randomNumber &&
        result.randomNumber !== "0x0000000000000000000000000000000000000000000000000000000000000000"
      ) {
        console.log(`🎲 Sequence ${result.sequenceNumber}: ${result.randomNumber}`);
      } else {
        console.log(`⚪ Sequence ${result.sequenceNumber}: No random number received (timed out)`);
      }
    }
  }

  // Summary
  console.log("\n📊 Test Results Summary:");
  console.log("=".repeat(60));

  const successfulTests = testResults.filter(r => r.success).length;
  const failedTests = testResults.filter(r => !r.success).length;
  const randomsReceived = testResults.filter(
    r => r.randomNumber && r.randomNumber !== "0x0000000000000000000000000000000000000000000000000000000000000000",
  ).length;

  console.log(`✅ Successful requests: ${successfulTests}/${numberOfTests}`);
  console.log(`❌ Failed requests: ${failedTests}/${numberOfTests}`);
  console.log(`🎲 Random numbers received: ${randomsReceived}/${numberOfTests}`);
  console.log(`⛽ Total gas used: ${testResults.reduce((sum, r) => sum + (r.gasUsed || 0n), 0n).toString()}`);

  // Detailed results
  console.log("\n📋 Detailed Test Results:");
  console.log("-".repeat(60));

  testResults.forEach(result => {
    console.log(`\n🔢 Test ${result.testNumber}:`);
    console.log(`   User Input: ${result.userInput}`);
    console.log(`   Success: ${result.success ? "✅" : "❌"}`);

    if (result.success) {
      console.log(`   Transaction: ${result.txHash}`);
      console.log(`   Gas Used: ${result.gasUsed?.toString()}`);
      console.log(`   Sequence Number: ${result.sequenceNumber}`);

      // Show the random number if it was received during polling
      if (
        result.randomNumber &&
        result.randomNumber !== "0x0000000000000000000000000000000000000000000000000000000000000000"
      ) {
        console.log(`   Random Number: ${result.randomNumber}`);
      } else {
        console.log(`   Random Number: ⏳ Not received (timed out)`);
      }
    } else {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log("\n🎯 Test completed!");
  console.log(`🔗 View contract on explorer: https://testnet.monadexplorer.com/address/${DEPLOYED_CONTRACT_ADDRESS}`);
}

// Handle errors
main().catch(error => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});
