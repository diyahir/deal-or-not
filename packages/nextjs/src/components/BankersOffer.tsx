'use client';

import { useGameContract } from '@/hooks/useGameContract';
import DealOrNotABI from '@/shared/abi/DealOrNot.json';
import { formatEther } from 'viem';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';

export function BankersOffer() {
  const gameContract = useGameContract();
  const { address } = useAccount();
  const { data: gameId } = useReadContract({
    abi: DealOrNotABI,
    address: gameContract,
    functionName: 'gameIds',
    args: [address],
    query: {
      enabled: !!address
    }
  });
  const { data: offer } = useReadContract({
    abi: DealOrNotABI,
    address: gameContract,
    functionName: 'getCurrentOffer',
    // TODO:  think about gameid logic in whole app
    args: [gameId]
  });
  const { writeContractAsync } = useWriteContract();
  const acceptDeal = async () => {
    await writeContractAsync({
      abi: DealOrNotABI,
      address: gameContract,
      functionName: 'acceptDeal',
      args: [gameId]
    });
  };

  return (
    <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 p-4 rounded-lg shadow-lg border-2 border-yellow-700">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-black mb-2">Banker&apos;s Offer</h2>
        <span>{offer ? formatEther(offer as bigint) : '0'} ETH</span>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={acceptDeal}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-8 rounded-lg shadow-md transition-colors duration-200 border-2 border-green-800"
        >
          DEAL
        </button>
        {/* TODO no deal */}
        <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-8 rounded-lg shadow-md transition-colors duration-200 border-2 border-red-800">
          NO DEAL
        </button>
      </div>
    </div>
  );
}
