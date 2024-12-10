import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { EMPTY, mergeAll, mergeMap, of, Subject } from 'rxjs';
import { SerialPort } from 'serialport';

type PortData = ConstructorParameters<typeof SerialPort>[0];

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

export const usePortProvider = () => {
  const [port, setPort] = useState<SerialPort>();
  const [isOpened, setIsOpened] = useState(false);
  const [subject] = useState(new Subject<Uint8Array>());
  const [data, setData] = useState<
    Readonly<{
      globalTime: number;
      globalVersion: number;
      number: number;
      version: number;
      time: number;
      yaw: number;
      pitch: number;
      roll: number;
      xAccel: number;
      yAccel: number;
      zAccel: number;
      joyX: number;
      joyY: number;
      buttons: Readonly<[boolean, boolean, boolean, boolean]>;
    }>
  >();
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async (option: PortData) => {
    setPort(new SerialPort(option));
    setConnecting(true);
  }, []);

  const disconnect = useCallback(() => {
    if (port) {
      port.close();
    }
  }, [port]);

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
    const handler = (e: BeforeUnloadEvent) => {
      if (isOpened) {
        disconnect();
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [isOpened, disconnect]);

  useEffect(() => {
    let buffer = new Uint8Array();
    const subscriber = subject
      .pipe(
        mergeAll(),
        mergeMap((next) => {
          buffer = new Uint8Array([...buffer, next]);
          buffer = buffer.slice(Math.max(0, buffer.length - 160), buffer.length);

          if (buffer.length < signature.length) {
            return EMPTY;
          }

          if (
            buffer
              .slice(buffer.length - endSignature.length, buffer.length)
              .every((v, i) => v === endSignature[i])
          ) {
            const packet = buffer.slice(buffer.length - 80, buffer.length);
            if (!packet.slice(0, signature.length).every((v, i) => v === signature[i])) {
              buffer = new Uint8Array();
              return EMPTY;
            }

            const buttonMap = packet.slice(56, 60);
            const result = {
              globalTime: new Uint32Array(packet.slice(8, 12).buffer)[0],
              count: new Uint16Array(packet.slice(12, 14).buffer)[0],
              globalVersion: new Uint16Array(packet.slice(14, 16).buffer)[0],
              number: new Uint16Array(packet.slice(16, 18).buffer)[0],
              version: new Uint16Array(packet.slice(18, 20).buffer)[0],
              time: new Uint32Array(packet.slice(20, 24).buffer)[0],
              yaw: new Float32Array(packet.slice(24, 28).buffer)[0],
              pitch: new Float32Array(packet.slice(28, 32).buffer)[0],
              roll: new Float32Array(packet.slice(32, 36).buffer)[0],
              xAccel: new Int16Array(packet.slice(36, 38).buffer)[0],
              yAccel: new Int16Array(packet.slice(38, 40).buffer)[0],
              zAccel: new Int16Array(packet.slice(40, 42).buffer)[0],
              joyX: new Float32Array(packet.slice(48, 52).buffer)[0],
              joyY: new Float32Array(packet.slice(52, 56).buffer)[0],
              buttons: [
                !!(buttonMap[0] & 0b00000001),
                !!(buttonMap[0] & 0b00000010),
                !!(buttonMap[0] & 0b00000100),
                !!(buttonMap[0] & 0b00001000),
              ] as const,
            } as const;
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

  return { port, data, isOpened, connecting, connect, disconnect };
};

export const portContext = createContext<ReturnType<typeof usePortProvider> | null>(null);

export const usePort = () => {
  const data = useContext(portContext);
  if (!data) {
    throw new Error('PortProvider is not found');
  }
  return data;
};
