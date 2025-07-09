'use client';

import { Loading } from '@/components/Loading';
import SwitchNetwork from '@/components/Wallet/SwitchNetwork';
import { useAppContext } from '@/contexts/AppContext';
import { useGameContract } from '@/hooks/useGameContract';
import { cn } from '@/lib/utils';
import DealOrNotABI from '@/shared/abi/DealOrNot.json';
import MonadVRFABI from '@/shared/abi/MonadVRF.json';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { formatEther } from 'viem';
import { useAccount, usePublicClient, useReadContract, useWriteContract } from 'wagmi';

export function DealNoDeal({ gameId }: { gameId: bigint }) {
  const client = usePublicClient();
  const { game, setGame } = useAppContext();
  const { chain, isConnected } = useAccount();
  const [isLoadingDecline, setIsLoadingDecline] = useState(false);
  const [isLoadingAccept, setIsLoadingAccept] = useState(false);
  const gameContract = useGameContract();
  const { data: offer } = useReadContract({
    abi: DealOrNotABI,
    address: gameContract,
    functionName: 'getCurrentOffer',
    args: [gameId],
    query: {
      refetchInterval: 500
    }
  });
  const { writeContractAsync } = useWriteContract();

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
    // TODO: play game later on?
    toast(<span>Accepted deal: {Number(formatEther((offer as bigint) || 0n)).toFixed(5)} gMON!</span>, {
      hideProgressBar: true,
      position: 'bottom-left',
      theme: 'dark',
      autoClose: 1000,
      className: 'border border-[#F86E00] rounded-[32px] !bg-[#00203e]'
    });
    setIsLoadingAccept(false);
  };

  const declineDeal = async () => {
    setIsLoadingDecline(true);
    // Fetch VRF address from the game contract
    const vrfAddress = (await client?.readContract({
      address: gameContract,
      abi: DealOrNotABI,
      functionName: 'vrf'
    })) as `0x${string}`;

    // Fetch entropy fee from the VRF contract
    const entropyFee = (await client?.readContract({
      address: vrfAddress,
      abi: MonadVRFABI,
      functionName: 'getEntropyFee'
    })) as bigint;

    const hash = await writeContractAsync({
      abi: DealOrNotABI,
      address: gameContract,
      functionName: 'eliminateBoxes',
      args: [gameId],
      value: (entropyFee * 110n) / 100n
    });
    await client?.waitForTransactionReceipt({
      hash
    });
    const eliminatedBoxesIndexes = await client?.readContract({
      address: gameContract,
      abi: DealOrNotABI,
      functionName: 'getEliminatedBoxes',
      args: [gameId]
    });
    setGame({
      ...game,
      amounts: game.amounts.map((amount, i) => {
        return {
          ...amount,
          available: i === Number((eliminatedBoxesIndexes as bigint[])[game.eliminations]) ? false : amount.available
        };
      }),
      canAccept: false
    });
    setIsLoadingDecline(false);
  };

  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({ account, openConnectModal, mounted }) => {
          const isConnected = mounted && account;

          if (isConnected && !chain) {
            return <SwitchNetwork />;
          }

          return (
            <button
              className="bg-[#F86E00] text-white text-2xl font-semibold rounded-lg py-4 px-8 min-w-[190px] flex justify-center"
              onClick={openConnectModal}
            >
              Connect Wallet
            </button>
          );
        }}
      </ConnectButton.Custom>
    );
  }

  return (
    <>
      <div className={cn('flex items-center w-fit mx-auto justify-between bg-[#1b4061] rounded-full')}>
        <span className="text-2xl font-semibold bg-[#f86e02] rounded-full p-4">BANK OFFER:</span>
        <span className="text-[#F86E00] text-2xl font-semibold pl-12 pr-4">
          {Number(formatEther((offer as bigint) || 0n)).toFixed(5)} gMON
        </span>
      </div>
      <div className="flex items-center justify-center gap-2 bg-[#1b4061] rounded-lg p-1.5 text-white">
        <button
          onClick={acceptDeal}
          className={cn(
            'bg-[#3fa43e] text-2xl font-semibold rounded-lg py-4 px-8 min-w-[155px] flex justify-center',
            isLoadingAccept || (isLoadingDecline && 'cursor-not-allowed')
          )}
          disabled={isLoadingAccept || isLoadingDecline}
        >
          {isLoadingAccept ? <Loading /> : 'ACCEPT'}
        </button>
        <span className="bg-[#f86e02] text-[#1b4061] font-semibold text-xl px-1 h-fit">OR</span>
        <button
          onClick={declineDeal}
          className={cn(
            'bg-[#de5151] text-2xl font-semibold rounded-lg py-4 px-8 min-w-[160px] flex justify-center',
            isLoadingAccept || (isLoadingDecline && 'cursor-not-allowed')
          )}
          disabled={isLoadingAccept || isLoadingDecline}
        >
          {isLoadingDecline ? <Loading /> : 'DECLINE'}
        </button>
      </div>
    </>
  );
}
