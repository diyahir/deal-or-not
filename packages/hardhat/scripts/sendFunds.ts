import { ethers } from "hardhat";

async function main() {
  // Get signers
  const [sender] = await ethers.getSigners();

  // Target recipient address
  const recipientAddress = "0x2bfe7Af51f337F814c70238fA7888314d1c3c927"; // Replace with actual address

  console.log(`Sender: ${sender.address}`);
  console.log(`Recipient: ${recipientAddress}`);

  // Check sender balance
  const senderBalance = await ethers.provider.getBalance(sender.address);
  console.log(`Sender balance: ${ethers.formatEther(senderBalance)} ETH`);

  // 1. Send ETH
  console.log("\n📤 Sending ETH...");
  const ethAmount = ethers.parseEther("1"); // 0.1 ETH

  const ethTx = await sender.sendTransaction({
    to: recipientAddress,
    value: ethAmount,
  });

  await ethTx.wait();
  console.log(`✅ Sent ${ethers.formatEther(ethAmount)} ETH`);
  console.log(`Transaction: ${ethTx.hash}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
