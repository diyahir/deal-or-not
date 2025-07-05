'use client';

import Header from '@/components/Header/Header';
import AppProvider from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { alchemyRpcUrl, blockExplorer, monadRpcUrl } from '@/shared/constants';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { defineChain } from 'viem';
import { fallback, http, WagmiProvider } from 'wagmi';
import { anvil } from 'wagmi/chains';
import { audiowide, roboto } from './fonts';
import './globals.css';

const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'TMON', symbol: 'TMON', decimals: 18 },
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
  appName: 'Deal or no deal',
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
    <html lang="en" className={cn(roboto.className, audiowide.variable, 'bg-[#001427] sm:bg-[#00152C]')}>
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <AppProvider>
                <Header />
                {children}
              </AppProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
