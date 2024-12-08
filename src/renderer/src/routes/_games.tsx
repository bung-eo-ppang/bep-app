import { usePort } from '@renderer/hooks/usePort';
import { createFileRoute, Link, Navigate, Outlet } from '@tanstack/react-router';

const Layout = () => {
  const { isOpened } = usePort();
  if (!isOpened) return <Navigate to="/" />;
  return (
    <div>
      <Outlet />
      <Link to="/">
        <button className="fixed text-white right-8 top-8 text-6xl">X</button>
      </Link>
    </div>
  );
};

export const Route = createFileRoute('/_games')({
  component: Layout,
});
