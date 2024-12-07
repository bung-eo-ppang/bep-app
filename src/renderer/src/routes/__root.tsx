import * as React from 'react';
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { PortProvider } from '@renderer/hooks/PortProvider';

export const Route = createRootRoute({
  component: () => (
    <React.Fragment>
      <PortProvider>
        <Outlet />
      </PortProvider>
    </React.Fragment>
  ),
});
