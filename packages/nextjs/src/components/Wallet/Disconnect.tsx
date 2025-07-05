import { IoLogOutOutline } from 'react-icons/io5';
import { useDisconnect } from 'wagmi';

export default function Disconnect() {
  const { disconnect } = useDisconnect();

  return (
    <div className="grid grid-cols-4 gap-2 p-2 cursor-pointer" onClick={() => disconnect()}>
      <div className="flex justify-center items-center col-span-1">
        <IoLogOutOutline />
      </div>
      <span className="col-span-3">Disconnect</span>
    </div>
  );
}
