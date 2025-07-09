import { useChainId } from 'wagmi';

interface ContractMap {
  [chainId: number]: `0x${string}`;
}

export function useGameContract() {
  const chainId = useChainId();

  const contract: ContractMap = {
    31337: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    10143: '0x0E15bd4D20c0e59d1fe5723292637aB012960af4'
  };

  return contract[chainId];
}
