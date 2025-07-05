'use client';

import nad from '@/assets/nad.png';
import Image from 'next/image';
import React from 'react';
import Wallet from '../Wallet/Wallet';

export default function Header() {
  return (
    <>
      <div className="w-full grid grid-cols-3 p-4 pt-8 items-center bg-[#00152C]">
        <div className="col-start-2 col-span-1 flex justify-center items-center">
          <Image className="w-full" alt="Nad or No Nad" src={nad} />
        </div>
        <div className="col-start-3 col-span-1 flex items-center ml-4 gap-4 justify-end">
          <Wallet />
        </div>
      </div>
    </>
  );
}
