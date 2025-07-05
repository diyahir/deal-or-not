import { createContext, useContext, useState, type Dispatch, type SetStateAction } from 'react';

type AppContext = {
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
};

const AppContext = createContext<AppContext>({
  loading: false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setLoading: (loading) => {}
});

export function useAppContext() {
  return useContext(AppContext);
}

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(false);

  return <AppContext.Provider value={{ loading, setLoading }}>{children}</AppContext.Provider>;
};

export default AppProvider;
