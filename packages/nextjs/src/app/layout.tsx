'use client';

import AppProvider from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { alchemyRpcUrl, blockExplorer, monadRpcUrl } from '@/shared/constants';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { defineChain } from 'viem';
import { createConfig, fallback, http, WagmiProvider } from 'wagmi';
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

const config = createConfig({
  chains: [monadTestnet],
  batch: {
    multicall: true
  },
  transports: {
    [monadTestnet.id]: fallback([http(alchemyRpcUrl), http(monadRpcUrl)])
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
            <AppProvider>{children}</AppProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
