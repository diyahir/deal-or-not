'use client';

import VaultOpen from '@/assets/vault-open.png';
import { useAppContext } from '@/contexts/AppContext';
import Image from 'next/image';
import { Case } from './Case';

const caseRows = [
  [21, 22, 23, 24, 25, 26],
  [14, 15, 16, 17, 18, 19, 20],
  [7, 8, 9, 10, 11, 12, 13],
  [1, 2, 3, 4, 5, 6]
];

export function Cases({ gameId, entryFee }: { gameId: bigint | unknown; entryFee: bigint | undefined }) {
  const { game } = useAppContext();
  return (
    <div className="border border-[#f86e02] rounded-xl text-white bg-[#01152C] p-6">
      {caseRows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-3">
          {row.map((caseNumber) =>
            game.selectedBoxes.find((selected) => selected === caseNumber) ? (
              <div key={caseNumber} className="flex flex-col items-center justify-end cursor-not-allowed">
                <Image alt="box" src={VaultOpen} width="100" height="100" />
                <span className="-mt-4 rounded-full border-[#f86e02] border bg-[#03213f] px-3 text-sm">
                  {caseNumber}
                </span>
              </div>
            ) : (
              <Case key={caseNumber} caseNumber={caseNumber} gameId={gameId} entryFee={entryFee} />
            )
          )}
        </div>
      ))}
    </div>
  );
}
