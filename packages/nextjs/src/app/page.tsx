import { HomePageClient } from '@/components/HomePageClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nad or no Nad',
  description: 'Nad or no Nad Game'
};

export default function Page() {
  return <HomePageClient />;
}
