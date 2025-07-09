import { useChainId } from 'wagmi';

interface ContractMap {
  [chainId: number]: `0x${string}`;
}

export function useGMONContract() {
  const chainId = useChainId();

  const contract: ContractMap = {
    31337: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    10143: '0xaEef2f6B429Cb59C9B2D7bB2141ADa993E8571c3'
  };

  return contract[chainId];
}
