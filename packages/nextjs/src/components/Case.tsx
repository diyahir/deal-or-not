import { cn } from '@/lib/utils';

interface CaseProps {
  number: number;
  isSelected?: boolean;
  isOpened?: boolean;
  onClick?: () => void;
}

export function Case({ number, isSelected, isOpened, onClick }: CaseProps) {
  return (
    <button
      // onClick={onClick}
      className={cn(
        'relative w-16 h-16 rounded-lg shadow-md transition-all duration-200 font-bold text-black border-2',
        {
          'bg-blue-400 border-blue-600 transform scale-105': isSelected,
          'bg-gray-300 border-gray-400 opacity-50 cursor-not-allowed': isOpened,
          'bg-gray-200 border-gray-400 hover:bg-gray-100 hover:shadow-lg': !isSelected && !isOpened
        }
      )}
      disabled={isOpened}
    >
      {number}
    </button>
  );
}
