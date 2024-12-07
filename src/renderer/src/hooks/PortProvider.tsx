import { PropsWithChildren } from 'react';
import { portContext, usePortProvider } from './usePort';

export const PortProvider = ({ children }: PropsWithChildren) => {
  const data = usePortProvider();
  return <portContext.Provider value={data}>{children}</portContext.Provider>;
};
