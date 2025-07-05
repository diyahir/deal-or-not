import { Amounts } from '@/components/Amounts';
import { BankersOffer } from '@/components/BankersOffer';
import { Cases } from '@/components/Cases';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nad or no Nad',
  description: 'Nad or no Nad Game'
};

export default function Page() {
  return (
    <div className="grid grid-cols-5 gap-6 p-4">
      <div className="col-span-1">
        <Amounts />
      </div>
      <div className="col-span-3 flex flex-col gap-6">
        <Cases />
        <BankersOffer />
      </div>

      <div className="col-span-1">
        <Amounts isLast />
      </div>
    </div>
  );
}
