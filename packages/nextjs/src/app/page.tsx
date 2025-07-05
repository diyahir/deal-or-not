import volcanoImage from '@/assets/volcano.png';
import { Amounts } from '@/components/Amounts';
import { BankersOffer } from '@/components/BankersOffer';
import { Cases } from '@/components/Cases';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Deal or No Deal',
  description: 'Deal or No Deal Game'
};

export default function Page() {
  return (
    <div
      className="min-h-screen p-4"
      style={{
        backgroundImage: `url(${volcanoImage.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-6">
          <div className="lg:col-span-1">
            <Cases />
            <div className="mt-6">
              <BankersOffer />
            </div>
          </div>

          <div className="lg:col-span-1">
            <Amounts />
          </div>
        </div>
      </div>
    </div>
  );
}
