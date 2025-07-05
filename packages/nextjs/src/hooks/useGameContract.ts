import { useChainId } from 'wagmi';

interface ContractMap {
  [chainId: number]: `0x${string}`;
}

export function useGameContract() {
  const chainId = useChainId();

  const contract: ContractMap = {
    31337: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    10143: '0x324898D960b8d8509dbf98AD16C6cE1e08B263dF'
  };

  return contract[chainId];
}
