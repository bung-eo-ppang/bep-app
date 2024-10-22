import { createFileRoute } from '@tanstack/react-router';
import { Canvas } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';

const ScreenPage = () => {
  return (
    <div className="fixed inset-0">
      <Canvas>
        <CameraControls />
        <ambientLight intensity={0.1} />
        <directionalLight color="red" position={[1, 2, 5]} />
        <mesh>
          <boxGeometry />
          <meshStandardMaterial />
        </mesh>
      </Canvas>
    </div>
  );
};

export const Route = createFileRoute('/screen')({
  component: ScreenPage,
});
