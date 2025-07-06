'use client';

import { Loading } from '@/components/Loading';
import SwitchNetwork from '@/components/Wallet/SwitchNetwork';
import { useAppContext } from '@/contexts/AppContext';
import { useGameContract } from '@/hooks/useGameContract';
import { cn } from '@/lib/utils';
import DealOrNotABI from '@/shared/abi/DealOrNot.json';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import { formatEther } from 'viem';
import { useAccount, usePublicClient, useReadContract, useWriteContract } from 'wagmi';

export function BankOffer() {
  const client = usePublicClient();
  const { game } = useAppContext();
  const { address, chain } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAccept, setIsLoadingAccept] = useState(false);
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

  // TODO: implement reset context and only accept when you actually can, maybe put something different on offer accepted, toast accepted
  const acceptDeal = async () => {
    setIsLoadingAccept(true);
    const hash = await writeContractAsync({
      abi: DealOrNotABI,
      address: gameContract,
      functionName: 'acceptDeal',
      args: [gameId]
    });
    await client?.waitForTransactionReceipt({
      hash
    });
    setIsLoadingAccept(false);
  };

  const startGame = async () => {
    setIsLoading(true);
    const hash = await writeContractAsync({
      abi: DealOrNotABI,
      address: gameContract,
      functionName: 'startGame',
      // 12 ether
      value: 100000000000000000n
    });
    await client?.waitForTransactionReceipt({
      hash
    });
    setIsLoading(false);
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

          <button
            onClick={acceptDeal}
            className="bg-[#3fa43e] text-2xl font-semibold rounded-lg py-4 px-8 min-w-[155px] flex justify-center"
          >
            {isLoadingAccept ? <Loading /> : 'ACCEPT'}
          </button>
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
