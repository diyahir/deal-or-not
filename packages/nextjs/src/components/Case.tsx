'use client';

import VaultClose from '@/assets/vault-close.png';
import { useAppContext } from '@/contexts/AppContext';
import { useGameContract } from '@/hooks/useGameContract';
import DealOrNotABI from '@/shared/abi/DealOrNot.json';
import Image from 'next/image';
import { useState } from 'react';
import { usePublicClient } from 'wagmi';
import { LoadingSmall } from './Loading';

export function Case({ caseNumber, gameId }: { caseNumber: number; gameId: bigint | undefined }) {
  const [loading, setLoading] = useState(false);
  const { game, setGame } = useAppContext();
  const client = usePublicClient();
  const gameContract = useGameContract();

  const eliminateBoxes = async () => {
    if (typeof gameId !== 'bigint') {
      return;
    }
    setLoading(true);
    // TODO: last -> this could be moved to hook and maybe remove loading
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
