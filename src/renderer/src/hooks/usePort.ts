import { useEffect, useState } from 'react';
import { EMPTY, mergeAll, mergeMap, of, Subject } from 'rxjs';
import { SerialPort } from 'serialport';

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

export const usePort = (option?: ConstructorParameters<typeof SerialPort>[0]) => {
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
