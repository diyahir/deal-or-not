'use client';

import { useAppContext } from '@/contexts/AppContext';
import { useGameContract } from '@/hooks/useGameContract';
import DealOrNotABI from '@/shared/abi/DealOrNot.json';
import { usePublicClient, useWriteContract } from 'wagmi';

// TODO: styles when removing and loadings
export function Case({ caseNumber, gameId }: { caseNumber: number; gameId: bigint }) {
  const { game, setGame } = useAppContext();
  const { writeContractAsync } = useWriteContract();
  const client = usePublicClient();
  const gameContract = useGameContract();
  const eliminateBoxes = async () => {
    const { eliminations } = game;
    if (
      eliminations === 0 ||
      eliminations === 6 ||
      eliminations === 11 ||
      eliminations === 15 ||
      eliminations === 18 ||
      eliminations > 19
    ) {
      const hash = await writeContractAsync({
        abi: DealOrNotABI,
        address: gameContract,
        functionName: 'eliminateBoxes',
        args: [gameId]
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
      eliminations: game.eliminations + 1,
      selectedBoxes: game.selectedBoxes.concat([caseNumber])
    });
  };

  return <button onClick={eliminateBoxes}>{caseNumber}</button>;
}
