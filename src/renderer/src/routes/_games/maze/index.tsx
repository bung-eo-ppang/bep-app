import { Canvas, useFrame } from '@react-three/fiber';
import {
  CuboidCollider,
  euler,
  Physics,
  quat,
  RapierRigidBody,
  RigidBody,
} from '@react-three/rapier';
import { usePort } from '@renderer/hooks/usePort';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

const generateRandomMaze = (width: number, height: number) => {
  const maze = [] as number[][];
  for (let i = 0; i < height; i++) {
    const row = [] as number[];
    for (let j = 0; j < width; j++) {
      row.push(Math.random() > 0.7 ? 1 : 0);
    }
    maze.push(row);
  }
  return maze;
};

const Point = () => {
  return (
    <RigidBody type="fixed" position={[0, 0.5, 0]}>
      <mesh>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
    </RigidBody>
  );
};

const Maze = () => {
  const [maze] = useState(generateRandomMaze(10, 10));
  const ref = useRef<RapierRigidBody>(null);
  const { data } = usePort();

  useFrame(() => {
    if (data?.pitch) {
      ref.current?.setNextKinematicRotation(
        quat().setFromEuler(euler({ x: data.roll / 50, y: -data.yaw / 50, z: data.pitch / 50 })),
      );
    }
  });

  return (
    <>
      <Point />
      <RigidBody type="kinematicPosition" ref={ref}>
        <group>
          {maze.map((row, i) =>
            row.map((cell, j) =>
              cell === 1 ? (
                <mesh key={`${i}-${j}`} position={[i - 5, 0.5, j - 5]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="#8b4513" />
                </mesh>
              ) : null,
            ),
          )}
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshPhongMaterial color="#d7ffcc" />
          </mesh>
          <CuboidCollider args={[10, 0.1, 10]} position={[0, 1.1, 0]} />
        </group>
      </RigidBody>
    </>
  );
};

const Ball = () => {
  return (
    <RigidBody colliders="ball" position={[0, 0.5, 0]} mass={1} restitution={0.9}>
      <mesh castShadow>
        <sphereGeometry args={[0.5, 64, 64]} />
        <meshStandardMaterial />
      </mesh>
    </RigidBody>
  );
};

const Page = () => {
  return (
    <div className="h-screen">
      <Canvas camera={{ fov: 50, position: [5, 10, 12] }} shadows>
        <color attach="background" args={['#ececec']} />
        <ambientLight intensity={0.5 * Math.PI} />
        <pointLight decay={0} intensity={Math.PI} position={[-10, -10, -10]} />
        <spotLight
          angle={0.3}
          castShadow
          decay={0}
          intensity={Math.PI}
          penumbra={1}
          position={[10, 10, 10]}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        <Physics gravity={[0, -50, 0]} debug>
          <Maze />
          <Ball />
        </Physics>
      </Canvas>
    </div>
  );
};

export const Route = createFileRoute('/_games/maze/')({
  component: Page,
});
