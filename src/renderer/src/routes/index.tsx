import { createFileRoute, Navigate } from '@tanstack/react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { usePort } from '@renderer/hooks/usePort';
import { usePorts } from '@renderer/hooks/usePorts';
import { useForm } from 'react-hook-form';
import z from 'zod';

const rates = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 74880, 115200, 230400, 250000];

const schema = z.object({
  path: z.string(),
  baudRate: z.coerce.number(),
});

const SelectorPage = () => {
  const ports = usePorts();
  const { handleSubmit, register } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  const { connecting, isOpened, connect, disconnect } = usePort();

  const handleSelect = (data: z.infer<typeof schema>) => {
    if (isOpened) {
      disconnect();
      return;
    }
    connect(data);
  };

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
        {isOpened && <Navigate to="/menu" />}
      </form>
    </div>
  );
};

export const Route = createFileRoute('/')({
  component: SelectorPage,
});
