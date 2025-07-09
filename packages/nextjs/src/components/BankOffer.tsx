'use client';

import Lizza from '@/assets/lizza.png';
import { useAppContext } from '@/contexts/AppContext';
import { useGameContract } from '@/hooks/useGameContract';
import { cn } from '@/lib/utils';
import DealOrNotABI from '@/shared/abi/DealOrNot.json';
import Image from 'next/image';
import { useAccount, useReadContract } from 'wagmi';
import { DealNoDeal } from './DealNoDeal';
import { FundGame } from './FundGame';
import { StartGame } from './StartGame';
import { VaultsLeft } from './VaultsLeft';

// TODO: rename this, fix tailwind styles minor
export function BankOffer() {
  const { game } = useAppContext();
  const { address } = useAccount();
  const gameContract = useGameContract();
  const { data: gameId, refetch } = useReadContract({
    abi: DealOrNotABI,
    address: gameContract,
    functionName: 'gameIds',
    args: [address],
    query: {
      enabled: !!address
    }
  });
  const { data: gameState } = useReadContract({
    abi: DealOrNotABI,
    address: gameContract,
    functionName: 'getGameState',
    args: [gameId],
    query: {
      enabled: typeof gameId === 'bigint'
    }
  });
  const _gameState = gameState as { isActive?: boolean; entryFee?: bigint };

  return (
    <div className="flex items-center justify-center" style={{ marginTop: '-50px' }}>
      <div
        className={cn(
          'border mx-auto border-[#f86e02] rounded-xl text-white bg-[#01152C] p-4 flex flex-col justify-center gap-6',
          'items-center w-[625px] h-[200px]'
        )}
      >
        {_gameState?.isActive && _gameState?.entryFee && typeof gameId === 'bigint' ? (
          // TODO: last -> this part should read contract if reload
          game.eliminations === 0 ? (
            <StartGame gameId={gameId} entryFee={_gameState.entryFee} />
          ) : game.canAccept ? (
            <DealNoDeal gameId={gameId} />
          ) : (
            <VaultsLeft />
          )
        ) : (
          <FundGame refetch={refetch} />
        )}
      </div>
      <Image
        src={Lizza}
        alt="lizza"
        className="h-[200px] w-auto ml-4 object-contain"
        style={{ height: '300px', marginTop: '0px' }}
      />
    </div>
  );
}
