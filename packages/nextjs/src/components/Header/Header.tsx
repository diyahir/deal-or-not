'use client';

import logo from '@/assets/logo.png';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import Wallet from '../Wallet/Wallet';

export default function Header() {
  return (
    <>
      <div className="w-full flex p-4 xl:px-[10vw] items-center bg-[#001427] lg:bg-[#00152C] justify-between">
        <div className="flex justify-start items-center">
          <Link href="/" className="cursor-pointer">
            <Image className="w-auto h-10 sm:h-[75px] cursor-pointer" alt="Magma" src={logo} />
          </Link>
        </div>
        <div className="hidden lg:flex items-center ml-4 gap-4 justify-end">
          <Wallet />
        </div>
      </div>
    </>
  );
}
