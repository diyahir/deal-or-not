import { cn } from '@/lib/utils';

interface AmountsProps {
  revealedAmounts?: number[];
}

export function Amounts({ revealedAmounts = [] }: AmountsProps) {
  const amounts = [
    0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000, 5000, 10000, 25000, 50000, 75000, 100000, 200000,
    300000, 400000, 500000, 750000, 1000000
  ];

  const formatAmount = (amount: number) => {
    if (amount < 1) {
      return `$${amount.toFixed(2)}`;
    } else if (amount >= 1000) {
      return `$${amount.toLocaleString()}`;
    } else {
      return `$${amount}`;
    }
  };

  return (
    <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 p-4 rounded-lg shadow-lg border-2 border-yellow-700">
      <div className="grid grid-cols-2 gap-2 text-sm">
        {amounts.map((amount, index) => (
          <div
            key={index}
            className={cn('flex justify-between items-center p-2 rounded border', {
              'bg-red-200 text-red-800 line-through opacity-50': revealedAmounts.includes(amount),
              'bg-white text-black hover:bg-gray-100': !revealedAmounts.includes(amount)
            })}
          >
            <span className="font-bold">{formatAmount(amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
