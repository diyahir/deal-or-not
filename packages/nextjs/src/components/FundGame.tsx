'use client';

import { Loading } from '@/components/Loading';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import SwitchNetwork from '@/components/Wallet/SwitchNetwork';
import { useGameContract } from '@/hooks/useGameContract';
import { useGMONContract } from '@/hooks/useGMON';
import { getEntropyFee } from '@/lib/utils';
import DealOrNotABI from '@/shared/abi/DealOrNot.json';
import GMonTokenABI from '@/shared/abi/GMonToken.json';
import MonadVRFABI from '@/shared/abi/MonadVRF.json';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { parseEther } from 'viem';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';

export function FundGame({ refetch }: { refetch: () => void }) {
  const [value, setValue] = useState('1');
  const client = usePublicClient();
  const { chain } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const gameContract = useGameContract();
  const gMONContract = useGMONContract();
  const { writeContractAsync } = useWriteContract();

  const fundGame = async () => {
    setIsLoading(true);
    // Fetch VRF address from the DealOrNot contract
    const vrfAddress = (await client?.readContract({
      address: gameContract,
      abi: DealOrNotABI,
      functionName: 'vrf'
    })) as `0x${string}`;

    // Fetch entropy fee from the VRF contract
    const entropyFee = (await client?.readContract({
      address: vrfAddress,
      abi: MonadVRFABI,
      functionName: 'getEntropyFee'
    })) as bigint;

    const approveHash = await writeContractAsync({
      abi: GMonTokenABI,
      address: gMONContract,
      functionName: 'approve',
      args: [gameContract, parseEther(value)]
    });
    await client?.waitForTransactionReceipt({
      hash: approveHash
    });

    const hash = await writeContractAsync({
      abi: DealOrNotABI,
      address: gameContract,
      functionName: 'startGame',
      args: [parseEther(value)],
      value: getEntropyFee(entropyFee)
    });
    await client?.waitForTransactionReceipt({
      hash
    });
    await refetch();
    toast(<span>Game funded with {value} gMON!</span>, {
      hideProgressBar: true,
      position: 'bottom-left',
      theme: 'dark',
      autoClose: 3000,
      className: 'border border-[#F86E00] rounded-[32px] !bg-[#00203e]'
    });
  };

  return (
    <>
      <span className="text-xl font-semibold">Select an amount to play with</span>
      <RadioGroup value={value} onValueChange={(value) => setValue(value)} className="flex justify-center">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="1" id="1" />
          <Label htmlFor="1">1 gMON</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="10" id="10" />
          <Label htmlFor="10">10 gMON</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="100" id="100" />
          <Label htmlFor="100">100 gMON</Label>
        </div>
      </RadioGroup>

      <ConnectButton.Custom>
        {({ account, openConnectModal, mounted }) => {
          const isConnected = mounted && account;

          if (isConnected && !chain) {
            return <SwitchNetwork />;
          }

          return (
            <button
              className="bg-[#F86E00] text-white text-2xl font-semibold rounded-lg py-4 px-8 min-w-[190px] flex justify-center"
              onClick={!isConnected ? openConnectModal : fundGame}
              disabled={isLoading}
            >
              {isLoading ? <Loading /> : !isConnected ? 'Connect Wallet' : 'Fund Game'}
            </button>
          );
        }}
      </ConnectButton.Custom>
    </>
  );
}
