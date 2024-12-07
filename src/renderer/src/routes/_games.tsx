import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

const Layout = () => {
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
