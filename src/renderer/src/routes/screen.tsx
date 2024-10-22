import { createFileRoute } from '@tanstack/react-router';

const ScreenPage = () => {
  return null;
};

export const Route = createFileRoute('/screen')({
  component: () => ScreenPage,
});
