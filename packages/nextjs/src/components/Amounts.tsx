'use client';

import { useAppContext } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { formatEther } from 'viem';

export function Amounts({ isLast }: { isLast?: boolean }) {
  const { game } = useAppContext();
  const amounts = !isLast ? game.amounts.slice(0, 13) : game.amounts.slice(13, 26);

  return (
    <div className="border border-[#f86e02] rounded-xl text-white bg-[#01152C] p-4">
      <div className="flex flex-col justify-between items-center gap-4">
        {amounts.map((amount) => (
          <div
            key={amount.qty}
            className={cn(
              'rounded-full bg-[#f86e02] w-full flex justify-end items-center pr-4',
              !amount.available && 'line-through text-[#01152C]'
            )}
          >
            <span>{formatEther(amount.qty)} gMON</span>
          </div>
        ))}
      </div>
    </div>
  );
}
