'use client';

import VaultClose from '@/assets/vault-close.png';
import { useAppContext } from '@/contexts/AppContext';
import { useGameContract } from '@/hooks/useGameContract';
import { cn } from '@/lib/utils';
import DealOrNotABI from '@/shared/abi/DealOrNot.json';
import Image from 'next/image';
import { useState } from 'react';
import { usePublicClient } from 'wagmi';
import { LoadingSmall } from './Loading';

// TODO: last -> somehow set same size on every case, also glitch when clicking on boxes, see if it removes when removing loading
export function Case({ caseNumber, gameId }: { caseNumber: number; gameId: bigint | undefined }) {
  const [loading, setLoading] = useState(false);
  const { game, setGame } = useAppContext();
  const client = usePublicClient();
  const gameContract = useGameContract();

  const eliminateBoxes = async () => {
    const eliminations = game.eliminations + 1;
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
      canAccept:
        eliminations === 6 || eliminations === 11 || eliminations === 15 || eliminations === 18 || eliminations > 19,
      eliminations,
      selectedBoxes: game.selectedBoxes.concat([caseNumber])
    });
    setLoading(false);
  };

  return (
    <button
      onClick={eliminateBoxes}
      className={cn('flex flex-col items-center justify-end cursor-pointer', game.canAccept && 'cursor-not-allowed')}
      disabled={game.canAccept}
    >
      <Image alt="box" src={VaultClose} width="100" height="100" />
      <span className="-mt-4 rounded-full border-[#f86e02] border bg-[#03213f] px-3 text-sm h-[22px] flex items-center">
        {loading ? <LoadingSmall /> : caseNumber}
      </span>
    </button>
  );
}
