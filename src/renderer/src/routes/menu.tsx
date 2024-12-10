import { usePort } from '@renderer/hooks/usePort';
import { cn } from '@renderer/lib/utils';
import { createFileRoute, Link, Navigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

const links = [
  { to: '/reactionSpeed', label: 'Reaction Speed' },
  { to: '/pingpong', label: 'Ping Pong' },
  { to: '/', label: 'Main' },
] as const;

const Menu = () => {
  const { disconnect, isOpened, data } = usePort();
  const [focusIndex, setFocusIndex] = useState(-1);
  const navigate = Route.useNavigate();

  useEffect(() => {
    if (data?.buttons[0]) {
      setFocusIndex((prev) => (prev + 1) % links.length);
    }
    if (data?.buttons[1]) {
      setFocusIndex((prev) => (prev - 1 + links.length) % links.length);
    }
    if (data?.buttons[2] && links[focusIndex]) {
      navigate({ to: links[focusIndex].to });
    }
  }, [data?.buttons[0], data?.buttons[1], data?.buttons[2]]);

  if (!isOpened) return <Navigate to="/" />;
  return (
    <div className="flex flex-col min-h-screen items-center gap-8">
      <div className="flex p-2 justify-end self-stretch">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>
      <div className="grid p-4 gap-4 grid-cols-4 max-w-5xl flex-1 place-content-start">
        {links.map(({ to, label }, index) => (
          <Link
            to={to}
            key={to}
            className={cn(
              'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-center h-fit',
              index === focusIndex && 'bg-blue-700',
            )}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export const Route = createFileRoute('/menu')({
  component: Menu,
});
