'use client';

import { useAppContext } from '@/contexts/AppContext';

export function VaultsLeft() {
  const { game } = useAppContext();

  const stepsLeft = () => {
    if (game.eliminations > 19) {
      return 1;
    }
    return [6, 11, 15, 18]
      .map((num) => num - game.eliminations)
      .sort((a, b) => a - b)
      .filter((num) => num >= 0)
      .slice(0, 1)[0];
  };

  return (
    <>
      <h1 className="text-4xl font-bold text-center">
        Open <span className="text-[#f86e02]">{stepsLeft()}</span>&nbsp;{stepsLeft() < 2 ? 'vault' : 'vaults'}
      </h1>
      <h1 className="text-4xl font-bold text-center">You opened vault 22, value: 20 gMON</h1>
    </>
  );
}
