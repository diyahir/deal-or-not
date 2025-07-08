import { useChainId } from 'wagmi';

interface ContractMap {
  [chainId: number]: `0x${string}`;
}

export function useGMONContract() {
  const chainId = useChainId();

  const contract: ContractMap = {
    31337: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    10143: '0xaEef2f6B429Cb59C9B2D7bB2141ADa993E8571c3',
    114: '0x324898D960b8d8509dbf98AD16C6cE1e08B263dF',
    545: '0x720B1E2a3fCc52B2c8df125911D42D453e5A473d'
  };

  return contract[chainId];
}
