import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HiOutlineSwitchHorizontal } from 'react-icons/hi';
import { useSwitchChain } from 'wagmi';
import Disconnect from './Disconnect';

export default function SwitchNetwork() {
  const { chains, switchChain } = useSwitchChain();
  const handleSwitchNetwork = async () => {
    await switchChain({ chainId: chains[0].id });
  };

  return (
    <Popover>
      <PopoverTrigger className="bg-red-500 text-white text-xs sm:text-base py-1 px-2 sm:py-2 sm:px-4  rounded-full w-full">
        Wrong Network
      </PopoverTrigger>
      <PopoverContent className="p-6 w-max" align="end">
        <div className="grid grid-cols-4 gap-2 p-2 cursor-pointer" onClick={handleSwitchNetwork}>
          <div className="flex justify-center items-center col-span-1">
            <HiOutlineSwitchHorizontal />
          </div>
          <span className="col-span-3">
            Switch to <strong>{chains[0].name}</strong>
          </span>
        </div>
        <Disconnect />
      </PopoverContent>
    </Popover>
  );
}
