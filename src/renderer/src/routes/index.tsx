import { createFileRoute, Link } from '@tanstack/react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { usePorts } from '@renderer/hooks/usePorts';
import { usePort } from '@renderer/hooks/usePort';

const pad = [
  ['1', '2', '3', 'A'],
  ['4', '5', '6', 'B'],
  ['7', '8', '9', 'C'],
  ['*', 'O', '#', 'D'],
];

const rates = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 74880, 115200, 230400, 250000];

const schema = z.object({
  path: z.string(),
  baudRate: z.coerce.number(),
});

const SelectorPage = () => {
  const ports = usePorts();
  const navigate = Route.useNavigate();
  const { handleSubmit, register } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  const [portData, setPortData] = useState<z.infer<typeof schema>>();
  const { data, connecting, isOpened } = usePort(portData);

  const handleSelect = (data: z.infer<typeof schema>) => {
    if (isOpened) {
      setPortData(undefined);
      return;
    }
    setPortData(data);
  };

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isOpened) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, []);

  return (
    <div className="grid place-items-center min-h-screen">
      <form className="flex gap-2 flex-col" onSubmit={handleSubmit(handleSelect)}>
        <div className="text-2xl font-bold">Select Board Port</div>
        {ports.length === 0 ? (
          <div>Loading...</div>
        ) : (
          <select
            {...register('path')}
            className="border border-gray-300 rounded p-1"
            defaultValue={ports.find((port) => port.path.includes('usb'))?.path}
          >
            {ports.map((port) => (
              <option key={port.path} value={port.path}>
                {port.path}
              </option>
            ))}
          </select>
        )}
        <div className="text-2xl font-bold">Select Baud Rate</div>
        <select
          {...register('baudRate')}
          className="border border-gray-300 rounded p-1"
          defaultValue={115200}
        >
          {rates.map((rate) => (
            <option key={rate} value={rate}>
              {rate}
            </option>
          ))}
        </select>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={connecting}
        >
          {isOpened ? 'Disconnect' : 'Connect'}
        </button>
        <Link
          to="/pingpong"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Ping Pong
        </Link>
        {isOpened && (
          <div className="flex flex-col gap-2 items-center">
            {pad.map((row, i) => (
              <div key={i} className="flex gap-2">
                {row.map((key) => (
                  <button
                    key={key}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    // style={{ backgroundColor: data?.includes(key) ? 'red' : 'blue' }}
                  >
                    {key}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export const Route = createFileRoute('/')({
  component: SelectorPage,
});
