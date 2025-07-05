'use client';

import { useAppContext } from '@/contexts/AppContext';
import { formatEther } from 'viem';

export function Amounts() {
  const { game } = useAppContext();

  return (
    <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 p-4 rounded-lg shadow-lg border-2 border-yellow-700">
      <div className="grid grid-cols-2 gap-2 text-sm">
        {game.amounts.map((amount) => (
          <div key={amount.qty} className="flex justify-between items-center p-2 rounded border">
            <span className="font-bold">
              {formatEther(amount.qty)} {amount.available ? 'yes' : 'no'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
