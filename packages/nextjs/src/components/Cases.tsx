'use client';

import VaultOpen from '@/assets/vault-open.png';
import { useAppContext } from '@/contexts/AppContext';
import { useGameContract } from '@/hooks/useGameContract';
import DealOrNotABI from '@/shared/abi/DealOrNot.json';
import Image from 'next/image';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { Case } from './Case';

const caseRows = [
  [21, 22, 23, 24, 25, 26],
  [14, 15, 16, 17, 18, 19, 20],
  [7, 8, 9, 10, 11, 12, 13],
  [1, 2, 3, 4, 5, 6]
];

export function Cases() {
  const { address, chain } = useAccount();
  const { game } = useAppContext();
  const { data: writeHash, writeContractAsync } = useWriteContract();
  const gameContract = useGameContract();
  const { data: gameId } = useReadContract({
    abi: DealOrNotABI,
    address: gameContract,
    functionName: 'gameIds',
    args: [address],
    query: {
      enabled: !!writeHash
    }
  });

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
    <div className="border border-[#f86e02] rounded-xl text-white bg-[#01152C] p-8">
      {caseRows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-3">
          {row.map((caseNumber) =>
            game.selectedBoxes.find((selected) => selected === caseNumber) ? (
              <div className="flex flex-col items-center justify-end cursor-not-allowed">
                <Image alt="box" src={VaultOpen} width="100" height="100" />
                <span className="-mt-4 rounded-full border-[#f86e02] border bg-[#03213f] px-3 text-sm">
                  {caseNumber}
                </span>
              </div>
            ) : (
              <Case
                key={caseNumber}
                caseNumber={caseNumber}
                // TODO: gameid can be undefined, also wait for tx but display ui as fallback
                gameId={gameId as bigint}
              />
            )
          )}
        </div>
      ))}
    </div>
  );
}
