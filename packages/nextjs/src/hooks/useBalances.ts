// import { useAppContext } from '@/contexts/AppContext';
import { useGMONContract } from '@/hooks/useGMON';
// import { useEffect } from 'react';
import { useAccount, useBalance, useReadContract } from 'wagmi';

export default function useBalances() {
  // const { refetchUseBalances, setRefetchUseBalances } = useAppContext();
  const gMONContract = useGMONContract();
  const { address } = useAccount();
  const { data: balanceGMONAD, refetch: refetchGMONAD } = useReadContract({
    abi: [
      {
        type: 'function',
        name: 'balanceOf',
        stateMutability: 'view',
        inputs: [{ type: 'address' }],
        outputs: [{ type: 'uint256' }]
      }
    ],
    address: gMONContract,
    functionName: 'balanceOf',
    args: [address as `0x${string}`]
  });

  const { data, refetch: refetchBalance } = useBalance({ address });

  // useEffect(() => {
  //   if (refetchUseBalances) {
  //     setRefetchUseBalances(false);
  //     refetchGMONAD();
  //     refetchBalance();
  //   }
  // }, [refetchUseBalances, refetchGMONAD, refetchBalance, setRefetchUseBalances]);

  return { balanceGMONAD, balanceMonad: data?.value };
}
