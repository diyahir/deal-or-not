'use client';

import { useGameContract } from '@/hooks/useGameContract';
import DealOrNotABI from '@/shared/abi/DealOrNot.json';
import { formatEther } from 'viem';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';

export function BankOffer() {
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

  const declineDeal = async () => {
    // TODO: Implement decline logic
    console.log('Declining deal...');
  };

  return (
    <div className="border-2 mx-auto border-[#F86E00] rounded-[32px] text-white bg-[#03213f] p-4 flex flex-col gap-6 items-center">
      <div className="flex items-center w-fit mx-auto justify-between bg-[#1b4061] rounded-full">
        <span className="text-2xl font-semibold bg-[#F86E00] rounded-full p-4">BANK OFFER:</span>
        <span className="text-[#F86E00] text-2xl font-semibold pl-12 pr-4">
          {formatEther((offer as bigint) || 0n)} gMON
        </span>
      </div>

      <div className="flex items-center justify-center gap-2 bg-[#1b4061] rounded-lg p-1.5 text-white">
        <button onClick={acceptDeal} className="bg-[#3fa43e] text-2xl font-semibold rounded-lg py-4 px-8">
          ACCEPT
        </button>
        <span className="bg-[#F86E00] text-[#1b4061] font-semibold text-xl px-1 h-fit">OR</span>
        <button onClick={declineDeal} className="bg-[#de5151] text-2xl font-semibold rounded-lg py-4 px-8">
          DECLINE
        </button>
      </div>
    </div>
  );
}
