import { useChainId } from 'wagmi';

interface ContractMap {
  [chainId: number]: `0x${string}`;
}

export function useGameContract() {
  const chainId = useChainId();

  const contract: ContractMap = {
    31337: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    10143: '0x752aAF45DDeb1298F5925d10d45a575758b206C4'
    // 10143: '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44'
  };

  return contract[chainId];
}
