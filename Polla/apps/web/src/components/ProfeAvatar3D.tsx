'use client';

import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface AvatarModelProps {
  isTalking?: boolean;
}

function AvatarModel({ isTalking = false }: AvatarModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/images/avatar.glb');
  const { actions, names } = useAnimations(animations, group);

  // Play the first available animation as idle
  useEffect(() => {
    if (names.length > 0 && actions[names[0]]) {
      actions[names[0]]!.reset().fadeIn(0.5).play();
    }
    return () => {
      names.forEach((name) => actions[name]?.fadeOut(0.5));
    };
  }, [actions, names]);

  // Subtle auto-rotation for liveliness
  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={group} scale={1.8} position={[0, -2.2, 0]}>
      <primitive object={scene} />
    </group>
  );
}

// Preload the model so it starts downloading early
useGLTF.preload('/images/avatar.glb');

interface ProfeAvatar3DProps {
  isTalking?: boolean;
}

export default function ProfeAvatar3D({ isTalking = false }: ProfeAvatar3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 2], fov: 35 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ alpha: true, antialias: true }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 2]} intensity={1.2} castShadow />
      <spotLight position={[-2, 2, 2]} intensity={0.5} angle={0.5} penumbra={1} />

      {/* Soft environment lighting for realism */}
      <Environment preset="city" />

      {/* The Avatar */}
      <Suspense fallback={null}>
        <AvatarModel isTalking={isTalking} />
      </Suspense>

      {/* Limited orbit for subtle interaction */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2}
        autoRotate={false}
      />
    </Canvas>
  );
}
