'use client';

import VaultClose from '@/assets/vault-close.png';
import { useAppContext } from '@/contexts/AppContext';
import { useGameContract } from '@/hooks/useGameContract';
import DealOrNotABI from '@/shared/abi/DealOrNot.json';
import MonadVRFABI from '@/shared/abi/MonadVRF.json';
import Image from 'next/image';
import { useState } from 'react';
import { usePublicClient, useWriteContract } from 'wagmi';
import { LoadingSmall } from './Loading';

export function Case({ caseNumber, gameId }: { caseNumber: number; gameId: bigint | undefined }) {
  const [loading, setLoading] = useState(false);
  const { game, setGame } = useAppContext();
  const { writeContractAsync } = useWriteContract();
  const client = usePublicClient();
  const gameContract = useGameContract();

  const eliminateBoxes = async () => {
    if (typeof gameId !== 'bigint') {
      return;
    }
    const { eliminations } = game;
    if (
      eliminations === 0 ||
      eliminations === 6 ||
      eliminations === 11 ||
      eliminations === 15 ||
      eliminations === 18 ||
      eliminations > 19
    ) {
      setLoading(true);
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
    }
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
      selectedBoxes: game.selectedBoxes.concat([caseNumber])
    });
    setLoading(false);
  };

  return (
    <div onClick={eliminateBoxes} className="flex flex-col items-center justify-end cursor-pointer">
      <Image alt="box" src={VaultClose} width="100" height="100" />
      <span className="-mt-4 rounded-full border-[#f86e02] border bg-[#03213f] px-3 text-sm h-[22px] flex items-center">
        {loading ? <LoadingSmall /> : caseNumber}
      </span>
    </div>
  );
}
