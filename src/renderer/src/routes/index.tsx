import { createFileRoute } from '@tanstack/react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { EMPTY, mergeAll, mergeMap, of, Subject } from 'rxjs';
import { SerialPort } from 'serialport';
import z from 'zod';

const pad = [
  ['1', '2', '3', 'A'],
  ['4', '5', '6', 'B'],
  ['7', '8', '9', 'C'],
  ['*', 'O', '#', 'D'],
];

const rates = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 74880, 115200, 230400, 250000];

const signature = new Uint8Array([
  0x94,
  'B'.charCodeAt(0),
  'E'.charCodeAt(0),
  'P'.charCodeAt(0),
  0x0d,
  0x0a,
  0x1a,
  0x0a,
]);
const version = new Uint8Array([0x00, 0x00]);
const endSignature = new Uint8Array([
  0x95,
  'B'.charCodeAt(0),
  'E'.charCodeAt(0),
  'P'.charCodeAt(0),
  0x0d,
  0x0a,
  0x1a,
  0x0a,
]);

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
  const [subject] = useState(new Subject<Uint8Array>());
  const [data, setData] = useState<{
    number: number;
    version: number;
    time: number;
    yaw: number;
    pitch: number;
    roll: number;
    joyX: number;
    joyY: number;
  }>();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!option) {
      setPort(undefined);
      return;
    }
    const port = new SerialPort(option);
    setPort(port);
    setConnecting(true);

    return () => {
      port.close();
    };
  }, [option]);

  useEffect(() => {
    if (!port) return;
    const handler = (data: Uint8Array) => {
      subject.next(data);
    };
    port.on('data', handler);
    return () => {
      port.off('data', handler);
    };
  }, [port]);

  useEffect(() => {
    if (!port) {
      setIsOpened(false);
      return;
    }
    const handler = () => {
      setIsOpened(port.isOpen);
      setConnecting(false);
    };
    port.on('open', handler);
    port.on('close', handler);
    return () => {
      port.off('open', handler);
      port.off('close', handler);
    };
  }, [port]);

  useEffect(() => {
    let buffer = new Uint8Array();
    const subscriber = subject
      .pipe(
        mergeAll(),
        mergeMap((next) => {
          buffer = new Uint8Array([...buffer, next]);

          if (buffer.length < signature.length) {
            return EMPTY;
          }

          if (
            buffer
              .slice(buffer.length - endSignature.length, buffer.length)
              .every((v, i) => v === endSignature[i])
          ) {
            const packet = buffer.slice(buffer.length - 64 + signature.length * 2, buffer.length);
            const angles = new Float32Array(packet.slice(8, 28).buffer);
            const result = {
              number: (packet[0] << 8) | packet[1],
              version: (packet[2] << 8) | packet[3],
              time: new Uint32Array(packet.slice(4, 8).buffer)[0],
              yaw: angles[0],
              pitch: angles[1],
              roll: angles[2],
              joyX: angles[3],
              joyY: angles[4],
            };
            buffer = new Uint8Array();
            return of(result);
          }

          return EMPTY;
        }),
      )
      .subscribe(setData);
    return () => {
      subscriber.unsubscribe();
    };
  }, []);

  return { port, data, isOpened, connecting };
};

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
