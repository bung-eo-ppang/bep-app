import { SerialPort } from 'serialport';
import { useEffect, useState } from 'react';

const usePorts = () => {
  const [ports, setPorts] = useState<Awaited<ReturnType<typeof SerialPort.list>>>([]);

  useEffect(() => {
    SerialPort.list().then(setPorts);
  }, []);

  return ports;
};

export const App = () => {
  const ports = usePorts();

  return <>{JSON.stringify(ports)}</>;
};
