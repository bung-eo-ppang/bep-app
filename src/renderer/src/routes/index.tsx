import { createFileRoute } from '@tanstack/react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { SerialPort } from 'serialport';
import z from 'zod';

const rates = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 74880, 115200, 230400, 250000];

const usePorts = () => {
  const [ports, setPorts] = useState<Awaited<ReturnType<typeof SerialPort.list>>>([]);

  useEffect(() => {
    SerialPort.list().then(setPorts);
  }, []);

  return ports;
};

const schema = z.object({
  path: z.string(),
  baudRate: z.coerce.number(),
});

const usePort = (option?: ConstructorParameters<typeof SerialPort>[0]) => {
  const [port, setPort] = useState<SerialPort>();
  const [isOpened, setIsOpened] = useState(false);

  useEffect(() => {
    if (!option) {
      setPort(undefined);
      return;
    }
    const port = new SerialPort(option);
    setPort(port);

    return () => {
      port.close();
    };
  }, [option]);

  useEffect(() => {
    if (!port) return;
    const handler = (data: Uint8Array) => {
      console.log(new TextDecoder().decode(data));
    };
    port.on('data', handler);
    return () => {
      port.off('data', handler);
    };
  }, [port]);

  useEffect(() => {
    if (!port) return;
    const handler = () => setIsOpened(port.isOpen);
    port.on('open', handler);
    port.on('close', handler);
    return () => {
      port.off('open', handler);
      port.off('close', handler);
    };
  }, [port]);

  return port;
};

const SelectorPage = () => {
  const ports = usePorts();
  const navigate = Route.useNavigate();
  const { handleSubmit, register } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  const [portData, setPortData] = useState<z.infer<typeof schema>>();
  const port = usePort(portData);

  const handleSelect = (data: z.infer<typeof schema>) => {
    setPortData(data);
  };

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!!port?.isOpen) {
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
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          {port?.isOpen ? 'Disconnect' : 'Connect'}
        </button>
      </form>
    </div>
  );
};

export const Route = createFileRoute('/')({
  component: SelectorPage,
});
