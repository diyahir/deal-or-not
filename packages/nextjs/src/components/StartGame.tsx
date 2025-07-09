'use client';

import { Loading } from '@/components/Loading';
import SwitchNetwork from '@/components/Wallet/SwitchNetwork';
import { useAppContext } from '@/contexts/AppContext';
import { useGameContract } from '@/hooks/useGameContract';
import DealOrNotABI from '@/shared/abi/DealOrNot.json';
import MonadVRFABI from '@/shared/abi/MonadVRF.json';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { formatEther } from 'viem';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';

export function StartGame({ gameId, entryFee }: { gameId: bigint; entryFee: bigint }) {
  const { chain } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const { game, setGame } = useAppContext();
  const { writeContractAsync } = useWriteContract();
  const client = usePublicClient();
  const gameContract = useGameContract();

  const eliminateBoxes = async () => {
    setIsLoading(true);

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
      canAccept: true,
      eliminations: game.eliminations + 1,
      selectedBoxes: []
    });
    toast(<span>Game has started!</span>, {
      hideProgressBar: true,
      position: 'bottom-left',
      theme: 'dark',
      autoClose: 1000,
      className: 'border border-[#F86E00] rounded-[32px] !bg-[#00203e]'
    });
    setIsLoading(false);
  };

  return (
    // TODO: styles
    <>
      <span>Game funded with {formatEther(entryFee)} gMON</span>
      <ConnectButton.Custom>
        {({ account, openConnectModal, mounted }) => {
          const isConnected = mounted && account;

          if (isConnected && !chain) {
            return <SwitchNetwork />;
          }

          return (
            <button
              className="bg-[#F86E00] text-white text-2xl font-semibold rounded-lg py-4 px-8 min-w-[190px] flex justify-center"
              onClick={!isConnected ? openConnectModal : eliminateBoxes}
              disabled={isLoading}
            >
              {isLoading ? <Loading /> : !isConnected ? 'Connect Wallet' : 'Start Game'}
            </button>
          );
        }}
      </ConnectButton.Custom>
    </>
  );
}
