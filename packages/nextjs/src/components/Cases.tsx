'use client';

import { Loading } from '@/components/Loading';
import SwitchNetwork from '@/components/Wallet/SwitchNetwork';
import { cn } from '@/lib/utils';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Case } from './Case';

interface CasesProps {
  selectedCase?: number;
  openedCases?: number[];
  onCaseClick?: (caseNumber: number) => void;
}

export function Cases({ selectedCase, openedCases = [], onCaseClick }: CasesProps) {
  const { chain } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
          <ConnectButton.Custom>
            {({ account, openConnectModal, mounted }) => {
              const isConnected = mounted && account;

              if (isConnected && !chain) {
                return <SwitchNetwork />;
              }

              return (
                <button
                  className={cn(
                    'bg-[#F86E00] text-white py-2 px-4 rounded-full min-w-[72px] w-full flex justify-center items-center',
                    isMounted && 'cursor-not-allowed opacity-50 hover:opacity-50'
                  )}
                  onClick={
                    // isConnected ? 'fn' :
                    openConnectModal
                  }
                  disabled={isLoading}
                >
                  {!isMounted || isLoading ? <Loading /> : isConnected ? 'Select your case' : 'Connect Wallet'}
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </div>
  );
}
