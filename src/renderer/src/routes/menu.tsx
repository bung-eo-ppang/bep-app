import { usePort } from '@renderer/hooks/usePort';
import { createFileRoute, Link, Navigate } from '@tanstack/react-router';

const links = [
  { to: '/pingpong', label: 'Ping Pong' },
  { to: '/', label: 'Main' },
] as const;

const Menu = () => {
  const { disconnect, isOpened } = usePort();
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
        {links.map(({ to, label }) => (
          <Link
            to={to}
            key={to}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-center h-fit"
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
