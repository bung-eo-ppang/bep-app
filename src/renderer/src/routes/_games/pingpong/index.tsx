import { createFileRoute } from '@tanstack/react-router'

import {
  CuboidCollider,
  euler,
  Physics,
  quat,
  RapierRigidBody,
  RigidBody,
  vec3,
} from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import lerp from 'lerp'
import clamp from 'lodash-es/clamp'
import { Suspense, useRef } from 'react'
import type { Group, Material, Mesh, Object3D, Skeleton } from 'three'
import { TextureLoader } from 'three'
import type { GLTF } from 'three-stdlib/loaders/GLTFLoader'
import { create } from 'zustand'

import earthImg from './-components/resources/cross.jpg'
import pingSound from './-components/resources/ping.mp3'
import Text from './-components/Text'
import pingpongGlb from './-components/resources/pingpong.glb'

type State = {
  api: {
    pong: (velocity: number) => void
    reset: (welcome: boolean) => void
  }
  count: number
  welcome: boolean
}

const ping = new Audio(pingSound)
const useStore = create<State>((set) => ({
  api: {
    pong(velocity) {
      ping.currentTime = 0
      ping.volume = clamp(velocity / 20, 0, 1)
      ping.play()
      if (velocity > 500) set((state) => ({ count: state.count + 1 }))
    },
    reset: (welcome) =>
      set((state) => ({ count: welcome ? state.count : 0, welcome })),
  },
  count: 0,
  welcome: true,
}))

type PingPongGLTF = GLTF & {
  materials: Record<
    'foam' | 'glove' | 'lower' | 'side' | 'upper' | 'wood',
    Material
  >
  nodes: Record<'Bone' | 'Bone003' | 'Bone006' | 'Bone010', Object3D> &
    Record<'mesh' | 'mesh_1' | 'mesh_2' | 'mesh_3' | 'mesh_4', Mesh> & {
      arm: Mesh & { skeleton: Skeleton }
    }
}

function Paddle() {
  const { nodes, materials } = useGLTF(pingpongGlb, '/draco/') as PingPongGLTF
  const { pong } = useStore((state) => state.api)
  const welcome = useStore((state) => state.welcome)
  const count = useStore((state) => state.count)
  const model = useRef<Group>(null)
  const rigidBody = useRef<RapierRigidBody>(null)
  const values = useRef([0, 0])
  useFrame((state) => {
    values.current[0] = lerp(
      values.current[0],
      (state.mouse.x * Math.PI) / 5,
      0.2,
    )
    values.current[1] = lerp(
      values.current[1],
      (state.mouse.x * Math.PI) / 5,
      0.2,
    )
    rigidBody.current?.setTranslation(
      vec3({ x: state.mouse.x * 10, y: state.mouse.y * 5, z: 0 }),
      true,
    )
    rigidBody.current?.setRotation(
      quat().setFromEuler(euler({ x: 0, y: 0, z: values.current[1] })),
      true,
    )
    if (!model.current) return
    model.current.rotation.x = lerp(
      model.current.rotation.x,
      welcome ? Math.PI / 2 : 0,
      0.2,
    )
    model.current.rotation.y = values.current[0]
  })

  return (
    <RigidBody
      type="fixed"
      ref={rigidBody}
      onContactForce={(e) => pong(e.totalForceMagnitude)}
      restitution={0.9}
      friction={0.9}
    >
      <mesh dispose={null}>
        <group
          ref={model}
          position={[-0.05, 0.37, 0.3]}
          scale={[0.15, 0.15, 0.15]}
        >
          <RigidBody colliders={false}>
            <Text
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 1, 2]}
              count={count.toString()}
            />
            <group rotation={[1.88, -0.35, 2.32]} scale={[2.97, 2.97, 2.97]}>
              <primitive object={nodes.Bone} />
              <primitive object={nodes.Bone003} />
              <primitive object={nodes.Bone006} />
              <primitive object={nodes.Bone010} />
              <skinnedMesh
                castShadow
                receiveShadow
                material={materials.glove}
                material-roughness={1}
                geometry={nodes.arm.geometry}
                skeleton={nodes.arm.skeleton}
              />
            </group>
          </RigidBody>
          <group rotation={[0, -0.04, 0]} scale={[141.94, 141.94, 141.94]}>
            <mesh
              castShadow
              receiveShadow
              material={materials.wood}
              geometry={nodes.mesh.geometry}
            />
            <mesh
              castShadow
              receiveShadow
              material={materials.side}
              geometry={nodes.mesh_1.geometry}
            />
            <mesh
              castShadow
              receiveShadow
              material={materials.foam}
              geometry={nodes.mesh_2.geometry}
            />
            <mesh
              castShadow
              receiveShadow
              material={materials.lower}
              geometry={nodes.mesh_3.geometry}
            />
            <mesh
              castShadow
              receiveShadow
              material={materials.upper}
              geometry={nodes.mesh_4.geometry}
            />
          </group>
        </group>
      </mesh>
    </RigidBody>
  )
}

function Ball() {
  const map = useLoader(TextureLoader, earthImg)

  return (
    <RigidBody colliders="ball" position={[0, 5, 0]} mass={1} restitution={0.9}>
      <mesh castShadow>
        <sphereGeometry args={[0.5, 64, 64]} />
        <meshStandardMaterial map={map} />
      </mesh>
    </RigidBody>
  )
}

function ContactGround() {
  const { reset } = useStore((state) => state.api)
  return (
    <RigidBody
      type="fixed"
      colliders="cuboid"
      onCollisionEnter={() => reset(true)}
      position={[0, -10, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <CuboidCollider args={[1000, 1000, 1]} />
    </RigidBody>
  )
}

const style = (welcome: boolean) =>
  ({
    color: 'white',
    display: welcome ? 'block' : 'none',
    fontSize: '1.2em',
    left: 50,
    position: 'absolute',
    top: 50,
  }) as const

const Page = () => {
  const welcome = useStore((state) => state.welcome)
  const { reset } = useStore((state) => state.api)

  return (
    <div className="h-screen">
      <Canvas
        camera={{ fov: 50, position: [0, 3, 12] }}
        onPointerMissed={() => welcome && reset(false)}
        shadows
      >
        <color attach="background" args={['#171720']} />
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
        <Physics gravity={[0, -40, 0]}>
          <mesh position={[0, 0, -10]} receiveShadow>
            <planeGeometry args={[1000, 1000]} />
            <meshPhongMaterial color="#172017" />
          </mesh>
          <ContactGround />
          {!welcome && <Ball />}
          <Suspense fallback={null}>
            <Paddle />
          </Suspense>
        </Physics>
      </Canvas>
      <div style={style(welcome)}>* click anywhere to start</div>
    </div>
  )
}

export const Route = createFileRoute('/_games/pingpong/')({
  component: Page,
})