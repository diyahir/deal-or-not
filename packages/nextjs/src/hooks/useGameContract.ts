import { useChainId } from 'wagmi';

interface ContractMap {
  [chainId: number]: `0x${string}`;
}

export function useGameContract() {
  const chainId = useChainId();

  const contract: ContractMap = {
    31337: '0x5FbDB2315678afecb367f032d93F642f64180aa3'
  };

  return contract[chainId];
}
