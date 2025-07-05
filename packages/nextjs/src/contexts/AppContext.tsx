import { createContext, useContext, useState, type Dispatch, type SetStateAction } from 'react';

type Game = {
  amounts: { available: boolean; qty: bigint }[];
  eliminations: number;
  selectedBoxes: number[];
};

type AppContext = {
  game: Game;
  setGame: Dispatch<SetStateAction<Game>>;
};

const AppContext = createContext<AppContext>({
  game: {
    amounts: [
      { available: true, qty: 10000000000000n }, // 0.00001 ether
      { available: true, qty: 100000000000000n }, // 0.0001 ether
      { available: true, qty: 500000000000000n }, // 0.0005 ether
      { available: true, qty: 1000000000000000n }, // 0.001 ether
      { available: true, qty: 2500000000000000n }, // 0.0025 ether
      { available: true, qty: 5000000000000000n }, // 0.005 ether
      { available: true, qty: 7500000000000000n }, // 0.0075 ether
      { available: true, qty: 10000000000000000n }, // 0.01 ether
      { available: true, qty: 20000000000000000n }, // 0.02 ether
      { available: true, qty: 30000000000000000n }, // 0.03 ether
      { available: true, qty: 40000000000000000n }, // 0.04 ether
      { available: true, qty: 50000000000000000n }, // 0.05 ether
      { available: true, qty: 75000000000000000n }, // 0.075 ether
      { available: true, qty: 100000000000000000n }, // 0.1 ether
      { available: true, qty: 500000000000000000n }, // 0.5 ether
      { available: true, qty: 1000000000000000000n }, // 1 ether
      { available: true, qty: 2500000000000000000n }, // 2.5 ether
      { available: true, qty: 5000000000000000000n }, // 5 ether
      { available: true, qty: 7500000000000000000n }, // 7.5 ether
      { available: true, qty: 10000000000000000000n }, // 10 ether
      { available: true, qty: 20000000000000000000n }, // 20 ether
      { available: true, qty: 30000000000000000000n }, // 30 ether
      { available: true, qty: 40000000000000000000n }, // 40 ether
      { available: true, qty: 50000000000000000000n }, // 50 ether
      { available: true, qty: 75000000000000000000n }, // 75 ether
      { available: true, qty: 100000000000000000000n } // 100 ether
    ],
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
      { available: true, qty: 10000000000000n }, // 0.00001 ether
      { available: true, qty: 100000000000000n }, // 0.0001 ether
      { available: true, qty: 500000000000000n }, // 0.0005 ether
      { available: true, qty: 1000000000000000n }, // 0.001 ether
      { available: true, qty: 2500000000000000n }, // 0.0025 ether
      { available: true, qty: 5000000000000000n }, // 0.005 ether
      { available: true, qty: 7500000000000000n }, // 0.0075 ether
      { available: true, qty: 10000000000000000n }, // 0.01 ether
      { available: true, qty: 20000000000000000n }, // 0.02 ether
      { available: true, qty: 30000000000000000n }, // 0.03 ether
      { available: true, qty: 40000000000000000n }, // 0.04 ether
      { available: true, qty: 50000000000000000n }, // 0.05 ether
      { available: true, qty: 75000000000000000n }, // 0.075 ether
      { available: true, qty: 100000000000000000n }, // 0.1 ether
      { available: true, qty: 500000000000000000n }, // 0.5 ether
      { available: true, qty: 1000000000000000000n }, // 1 ether
      { available: true, qty: 2500000000000000000n }, // 2.5 ether
      { available: true, qty: 5000000000000000000n }, // 5 ether
      { available: true, qty: 7500000000000000000n }, // 7.5 ether
      { available: true, qty: 10000000000000000000n }, // 10 ether
      { available: true, qty: 20000000000000000000n }, // 20 ether
      { available: true, qty: 30000000000000000000n }, // 30 ether
      { available: true, qty: 40000000000000000000n }, // 40 ether
      { available: true, qty: 50000000000000000000n }, // 50 ether
      { available: true, qty: 75000000000000000000n }, // 75 ether
      { available: true, qty: 100000000000000000000n } // 100 ether
    ],
    eliminations: 0,
    selectedBoxes: []
  });

  return <AppContext.Provider value={{ game, setGame }}>{children}</AppContext.Provider>;
};

export default AppProvider;
