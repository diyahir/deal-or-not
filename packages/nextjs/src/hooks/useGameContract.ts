import { useChainId } from 'wagmi';

interface ContractMap {
  [chainId: number]: `0x${string}`;
}

export function useGameContract() {
  const chainId = useChainId();

  const contract: ContractMap = {
    31337: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    10143: '0x0a9A5Ce00d5597adA1ef890C13fb8F32627E9d4d',
    114: '0xff67B22AD5c8c6EAA2EA2302EEe6b2333cA0c2cb',
    545: '0x720B1E2a3fCc52B2c8df125911D42D453e5A473d'
  };

  return contract[chainId];
}
