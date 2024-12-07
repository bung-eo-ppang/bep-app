import { useEffect, useState } from 'react';
import { SerialPort } from 'serialport';

export const usePorts = () => {
  const [ports, setPorts] = useState<Awaited<ReturnType<typeof SerialPort.list>>>([]);

  useEffect(() => {
    SerialPort.list().then(setPorts);
  }, []);

  return ports;
};
