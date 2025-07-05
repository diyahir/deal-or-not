import Monad from '@/assets/Monad.png';
import gMON from '@/assets/gMON.svg';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import useBalances from '@/hooks/useBalances';
import { useGMONContract } from '@/hooks/useGMON';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { cn, shortAddress } from '@/lib/utils';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';
import { IoAddCircleOutline } from 'react-icons/io5';
import { formatUnits } from 'viem';
import { useAccount, useWatchAsset } from 'wagmi';
import BlockieIdenticon from '../BlockieIdenticon';
import Disconnect from './Disconnect';
import SwitchNetwork from './SwitchNetwork';

export default function Wallet() {
  const { chain, address } = useAccount();
  const { watchAsset } = useWatchAsset();
  const gMONContract = useGMONContract();
  const { balanceMonad, balanceGMONAD } = useBalances();
  const { width } = useWindowDimensions();

  return (
    <ConnectButton.Custom>
      {({ account, openConnectModal, mounted }) => {
        const isConnected = mounted && account;

        if (isConnected) {
          if (!chain) {
            return <SwitchNetwork />;
          } else {
            return (
              <Popover>
                <PopoverTrigger
                  className={cn(
                    'text-xs sm:text-base bg-[#F86E00] text-white py-1 px-2 sm:py-2 sm:px-4',
                    'rounded-full flex justify-between items-center gap-2'
                  )}
                >
                  <BlockieIdenticon address={address as `0x${string}`} diameter={width > 640 ? 24 : 20} />
                  {shortAddress({ address: address as `0x${string}`, startLength: 6, endLength: 4 })}
                </PopoverTrigger>

                <PopoverContent className="p-6 w-max" align="end">
                  <div className="grid grid-cols-4 gap-2 p-2">
                    <div className="flex justify-center items-center col-span-1">
                      <Image src={Monad} alt="Monad" width={16} height={16} className="rounded-full" />
                    </div>
                    <span className="col-span-3">
                      {balanceMonad ? formatUnits(balanceMonad as bigint, 18) : formatUnits(0n, 18)} MON
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 p-2">
                    <div className="flex justify-center items-center col-span-1">
                      <Image src={gMON} alt="gMON" width={16} height={16} />
                    </div>
                    <span className="col-span-3">
                      {balanceGMONAD ? formatUnits(balanceGMONAD as bigint, 18) : formatUnits(0n, 18)} gMON
                    </span>
                  </div>
                  <div
                    className="grid grid-cols-4 gap-2 p-2 cursor-pointer"
                    onClick={() =>
                      watchAsset({
                        type: 'ERC20',
                        options: {
                          address: gMONContract,
                          symbol: 'gMON',
                          decimals: 18
                        }
                      })
                    }
                  >
                    <div className="flex justify-center items-center col-span-1">
                      <IoAddCircleOutline />
                    </div>
                    <span className="col-span-3">Add gMON</span>
                  </div>

                  <Disconnect />
                </PopoverContent>
              </Popover>
            );
          }
        } else {
          return (
            <button
              onClick={openConnectModal}
              className="text-xs sm:text-base bg-[#F86E00] text-white py-1 px-2 sm:py-2 sm:px-4 rounded-full"
            >
              Connect Wallet
            </button>
          );
        }
      }}
    </ConnectButton.Custom>
  );
}
