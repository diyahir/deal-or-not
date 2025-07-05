'use client';

import { BsSubstack } from 'react-icons/bs';
import { FaDiscord } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export default function HeaderSocials() {
  return (
    <div className="flex justify-between gap-4">
      <a
        href="https://discord.com/invite/magmastaking"
        target="_blank"
        className="border border-white rounded-full h-[50px] w-[50px] flex justify-center items-center hover:opacity-65"
      >
        <FaDiscord fontSize={25} color="#F86E00" />
      </a>
      <a
        href="https://x.com/magmastaking"
        target="_blank"
        className="border border-white rounded-full h-[50px] w-[50px] flex justify-center items-center hover:opacity-65"
      >
        <FaXTwitter fontSize={25} color="#F86E00" />
      </a>
      <a
        href="https://blog.magmastaking.xyz/"
        target="_blank"
        className="border border-white rounded-full h-[50px] w-[50px] flex justify-center items-center hover:opacity-65"
      >
        <BsSubstack fontSize={25} color="#F86E00" />
      </a>
    </div>
  );
}
