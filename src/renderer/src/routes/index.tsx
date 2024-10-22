import { createFileRoute } from '@tanstack/react-router';

import { SerialPort } from 'serialport';
import { useEffect, useState } from 'react';

const usePorts = () => {
  const [ports, setPorts] = useState<Awaited<ReturnType<typeof SerialPort.list>>>([]);

  useEffect(() => {
    SerialPort.list().then(setPorts);
  }, []);

  return ports;
};

const SelectorPage = () => {
  const ports = usePorts();
  const navigate = Route.useNavigate();

  const handleSelect = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate({ to: '/screen' });
  };

  return (
    <div className="grid place-items-center min-h-screen">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Select Board Port</h1>
        <form className="flex gap-2" onSubmit={handleSelect}>
          <select name="" id="" className="border border-gray-300 rounded p-1">
            {ports.map((port) => (
              <option key={port.path} value={port.path}>
                {port.path}
              </option>
            ))}
          </select>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Connect
          </button>
        </form>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/')({
  component: SelectorPage,
});
