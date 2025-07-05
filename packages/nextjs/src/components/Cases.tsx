import { Case } from './Case';

interface CasesProps {
  selectedCase?: number;
  openedCases?: number[];
  onCaseClick?: (caseNumber: number) => void;
}

export function Cases({ selectedCase, openedCases = [], onCaseClick }: CasesProps) {
  const caseRows = [
    [21, 22, 23, 24, 25, 26],
    [14, 15, 16, 17, 18, 19, 20],
    [7, 8, 9, 10, 11, 12, 13],
    [1, 2, 3, 4, 5, 6]
  ];

  return (
    <div className="bg-gradient-to-b from-red-900 to-red-700 p-8 rounded-lg shadow-lg border-4 border-red-800">
      <div className="space-y-4">
        {caseRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-3">
            {row.map((caseNumber) => (
              <Case
                key={caseNumber}
                number={caseNumber}
                isSelected={selectedCase === caseNumber}
                isOpened={openedCases.includes(caseNumber)}
                onClick={() => onCaseClick?.(caseNumber)}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <div className="bg-black bg-opacity-50 text-white p-3 rounded-lg">
          <h3 className="text-lg font-bold">Select your case</h3>
        </div>
      </div>
    </div>
  );
}
