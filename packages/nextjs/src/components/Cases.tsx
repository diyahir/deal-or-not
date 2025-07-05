'use client';

import { Loading } from '@/components/Loading';
import SwitchNetwork from '@/components/Wallet/SwitchNetwork';
import { useAppContext } from '@/contexts/AppContext';
import { useGameContract } from '@/hooks/useGameContract';
import { cn } from '@/lib/utils';
import DealOrNotABI from '@/shared/abi/DealOrNot.json';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import React, { useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
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
    <div className="bg-gradient-to-b from-red-900 to-red-700 p-8 rounded-lg shadow-lg border-4 border-red-800">
      <div className="space-y-4">
        {caseRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-3">
            {row.map((caseNumber) =>
              game.selectedBoxes.find((selected) => selected === caseNumber) ? null : (
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
                    'bg-[#F86E00] text-white py-2 px-4 rounded-full min-w-[72px] w-full flex justify-center items-center'
                  )}
                  onClick={!isConnected ? openConnectModal : startGame}
                  disabled={isLoading}
                >
                  {/* TODO: this text and allow to start game again? also is Loading?  */}
                  {isLoading ? <Loading /> : !isConnected ? 'Connect Wallet' : 'Start Game'}
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </div>
  );
}
