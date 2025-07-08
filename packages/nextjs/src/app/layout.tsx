'use client';

import Header from '@/components/Header/Header';
import AppProvider from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { alchemyRpcUrl, blockExplorer, monadRpcUrl } from '@/shared/constants';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { defineChain } from 'viem';
import { fallback, http, WagmiProvider } from 'wagmi';
import { anvil } from 'wagmi/chains';
import { audiowide, roboto } from './fonts';
import './globals.css';

// TODO: remove anvil chain
const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: {
      http: [alchemyRpcUrl]
    }
  },
  blockExplorers: {
    default: {
      name: 'Monad block explorers',
      url: blockExplorer
    }
  },
  testnet: true
});

const config = getDefaultConfig({
  appName: 'Nad or no Nad',
  projectId: '134f0e99f1b28f5fc5482a9ac6126a51',
  chains: [monadTestnet, anvil],
  transports: {
    [monadTestnet.id]: fallback([http(alchemyRpcUrl), http(monadRpcUrl)]),
    [anvil.id]: http()
  },
  ssr: true
});

const queryClient = new QueryClient();

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        roboto.className,
        audiowide.variable,
        // eslint-disable-next-line quotes
        "bg-[#00152C] bg-[url('/hero.png')] bg-bottom bg-cover min-h-screen bg-no-repeat"
      )}
    >
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <AppProvider>
                <Header />
                {children}
                <ToastContainer />
              </AppProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
