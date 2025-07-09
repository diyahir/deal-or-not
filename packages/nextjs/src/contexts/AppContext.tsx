import { createContext, useContext, useState, type Dispatch, type SetStateAction } from 'react';

type Game = {
  amounts: { available: boolean; qty: (entryFee: bigint) => bigint }[];
  canAccept: boolean;
  eliminations: number;
  selectedBoxes: number[];
};

type AppContext = {
  game: Game;
  setGame: Dispatch<SetStateAction<Game>>;
};

export const getQty = (multiplier: bigint, divider: bigint) => multiplier / divider;

const AppContext = createContext<AppContext>({
  game: {
    amounts: [
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 10000n }, // 0.0001x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 1000n }, // 0.001x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 200n }, // 0.005x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 100n }, // 0.01x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 40n }, // 0.025x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 20n }, // 0.05x
      { available: true, qty: (entryFee: bigint) => (entryFee * 75n) / 1000n }, // 0.075x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 10n }, // 0.1x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 5n }, // 0.2x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 3n }, // 0.3x
      { available: true, qty: (entryFee: bigint) => (entryFee * 2n) / 5n }, // 0.4x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 2n }, // 0.5x
      { available: true, qty: (entryFee: bigint) => (entryFee * 3n) / 4n }, // 0.75x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 1n }, // 1x
      { available: true, qty: (entryFee: bigint) => (entryFee * 3n) / 2n }, // 1.5x
      { available: true, qty: (entryFee: bigint) => (entryFee * 2n) / 1n }, // 2x
      { available: true, qty: (entryFee: bigint) => (entryFee * 5n) / 2n }, // 2.5x
      { available: true, qty: (entryFee: bigint) => (entryFee * 3n) / 1n }, // 3x
      { available: true, qty: (entryFee: bigint) => (entryFee * 7n) / 2n }, // 3.5x
      { available: true, qty: (entryFee: bigint) => (entryFee * 15n) / 4n }, // 3.75x
      { available: true, qty: (entryFee: bigint) => (entryFee * 4n) / 1n }, // 4x
      { available: true, qty: (entryFee: bigint) => (entryFee * 17n) / 4n }, // 4.25x
      { available: true, qty: (entryFee: bigint) => (entryFee * 9n) / 2n }, // 4.5x
      { available: true, qty: (entryFee: bigint) => (entryFee * 5n) / 1n }, // 5x
      { available: true, qty: (entryFee: bigint) => (entryFee * 15n) / 2n }, // 7.5x
      { available: true, qty: (entryFee: bigint) => (entryFee * 10n) / 1n } // 10x
    ],
    canAccept: false,
    eliminations: 0,
    selectedBoxes: []
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setGame: (game) => {}
});

export function useAppContext() {
  return useContext(AppContext);
}

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [game, setGame] = useState<Game>({
    amounts: [
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 10000n }, // 0.0001x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 1000n }, // 0.001x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 200n }, // 0.005x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 100n }, // 0.01x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 40n }, // 0.025x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 20n }, // 0.05x
      { available: true, qty: (entryFee: bigint) => (entryFee * 75n) / 1000n }, // 0.075x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 10n }, // 0.1x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 5n }, // 0.2x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 3n }, // 0.3x
      { available: true, qty: (entryFee: bigint) => (entryFee * 2n) / 5n }, // 0.4x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 2n }, // 0.5x
      { available: true, qty: (entryFee: bigint) => (entryFee * 3n) / 4n }, // 0.75x
      { available: true, qty: (entryFee: bigint) => (entryFee * 1n) / 1n }, // 1x
      { available: true, qty: (entryFee: bigint) => (entryFee * 3n) / 2n }, // 1.5x
      { available: true, qty: (entryFee: bigint) => (entryFee * 2n) / 1n }, // 2x
      { available: true, qty: (entryFee: bigint) => (entryFee * 5n) / 2n }, // 2.5x
      { available: true, qty: (entryFee: bigint) => (entryFee * 3n) / 1n }, // 3x
      { available: true, qty: (entryFee: bigint) => (entryFee * 7n) / 2n }, // 3.5x
      { available: true, qty: (entryFee: bigint) => (entryFee * 15n) / 4n }, // 3.75x
      { available: true, qty: (entryFee: bigint) => (entryFee * 4n) / 1n }, // 4x
      { available: true, qty: (entryFee: bigint) => (entryFee * 17n) / 4n }, // 4.25x
      { available: true, qty: (entryFee: bigint) => (entryFee * 9n) / 2n }, // 4.5x
      { available: true, qty: (entryFee: bigint) => (entryFee * 5n) / 1n }, // 5x
      { available: true, qty: (entryFee: bigint) => (entryFee * 15n) / 2n }, // 7.5x
      { available: true, qty: (entryFee: bigint) => (entryFee * 10n) / 1n } // 10x
    ],
    canAccept: false,
    eliminations: 0,
    selectedBoxes: []
  });

  return <AppContext.Provider value={{ game, setGame }}>{children}</AppContext.Provider>;
};

export default AppProvider;
