interface BankersOfferProps {
  offer?: number;
  onDeal?: () => void;
  onNoDeal?: () => void;
}

export function BankersOffer({ offer, onDeal, onNoDeal }: BankersOfferProps) {
  return (
    <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 p-4 rounded-lg shadow-lg border-2 border-yellow-700">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-black mb-2">Banker&apos;s Offer</h2>
        {offer && <div className="text-2xl font-bold text-black">${offer.toLocaleString()}</div>}
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={onDeal}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-8 rounded-lg shadow-md transition-colors duration-200 border-2 border-green-800"
        >
          DEAL
        </button>
        <button
          onClick={onNoDeal}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-8 rounded-lg shadow-md transition-colors duration-200 border-2 border-red-800"
        >
          NO DEAL
        </button>
      </div>
    </div>
  );
}
