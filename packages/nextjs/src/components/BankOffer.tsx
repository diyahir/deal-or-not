'use client';

import { Loading } from '@/components/Loading';
import SwitchNetwork from '@/components/Wallet/SwitchNetwork';
import { useGameContract } from '@/hooks/useGameContract';
import { cn } from '@/lib/utils';
import DealOrNotABI from '@/shared/abi/DealOrNot.json';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import { formatEther } from 'viem';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';

export function BankOffer() {
  const { address, chain } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const gameContract = useGameContract();
  const { data: gameId } = useReadContract({
    abi: DealOrNotABI,
    address: gameContract,
    functionName: 'gameIds',
    args: [address],
    query: {
      enabled: !!address
    }
  });
  const { data: gameState } = useReadContract({
    abi: DealOrNotABI,
    address: gameContract,
    functionName: 'getGameState',
    args: [gameId],
    query: {
      enabled: typeof gameId === 'bigint'
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
    // TODO: implement reset context
    console.log('Declining deal...');
  };

  const startGame = async () => {
    await writeContractAsync({
      abi: DealOrNotABI,
      address: gameContract,
      functionName: 'startGame',
      // 12 ether
      value: 12000000000000000000n
    });
  };

  return (
    <div className="border mx-auto border-[#f86e02] rounded-xl text-white bg-[#01152C] p-4 flex flex-col justify-center gap-6 items-center w-[625px] h-[200px]">
      {(gameState as { isActive?: boolean })?.isActive ? (
        <>
          <div className="flex items-center w-fit mx-auto justify-between bg-[#1b4061] rounded-full">
            <span className="text-2xl font-semibold bg-[#f86e02] rounded-full p-4">BANK OFFER:</span>
            <span className="text-[#F86E00] text-2xl font-semibold pl-12 pr-4">
              {Number(formatEther((offer as bigint) || 0n)).toFixed(5)} gMON
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 bg-[#1b4061] rounded-lg p-1.5 text-white">
            <button onClick={acceptDeal} className="bg-[#3fa43e] text-2xl font-semibold rounded-lg py-4 px-8">
              ACCEPT
            </button>
            <span className="bg-[#f86e02] text-[#1b4061] font-semibold text-xl px-1 h-fit">OR</span>
            <button onClick={declineDeal} className="bg-[#de5151] text-2xl font-semibold rounded-lg py-4 px-8">
              DECLINE
            </button>
          </div>
        </>
      ) : (
        <ConnectButton.Custom>
          {({ account, openConnectModal, mounted }) => {
            const isConnected = mounted && account;

            if (isConnected && !chain) {
              return <SwitchNetwork />;
            }

            return (
              <button
                className={cn(
                  'bg-[#F86E00] text-white py-2 px-4 rounded-full min-w-[72px] w-full flex justify-center items-center'
                )}
                onClick={!isConnected ? openConnectModal : startGame}
                disabled={isLoading}
              >
                {isLoading ? <Loading /> : !isConnected ? 'Connect Wallet' : 'Start Game'}
              </button>
            );
          }}
        </ConnectButton.Custom>
      )}
    </div>
  );
}
