import { useChainId } from 'wagmi';

interface ContractMap {
  [chainId: number]: `0x${string}`;
}

export function useStakeManagerContract() {
  const chainId = useChainId();

  const contract: ContractMap = {
    11155111: '0x9f5227c1d41a88348a86924020D4896C844134C0',
    41454: '0x69d66356FcF62d8eAb1FB2d86f3374508D611b3d',
    20143: '0x69d66356FcF62d8eAb1FB2d86f3374508D611b3d',
    10143: '0x2c9C959516e9AAEdB2C748224a41249202ca8BE7'
  };

  return contract[chainId];
}
