import { Amounts } from '@/components/Amounts';
import { BankersOffer } from '@/components/BankersOffer';
import { Cases } from '@/components/Cases';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Deal or No Deal',
  description: 'Deal or No Deal Game'
};

// TODO: eliminate boxes, then call get game info and map data
// TODO: every 3 and 4 get offer
export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-400 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-black mb-2 drop-shadow-lg">Deal or No Deal</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <BankersOffer />
          </div>

          <div className="lg:col-span-2">
            <Cases />
          </div>

          <div className="lg:col-span-1">
            <Amounts />
          </div>
        </div>
      </div>
    </div>
  );
}
