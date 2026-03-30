"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Model(props: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { nodes, materials } = useGLTF('/sphere.glb') as any;
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle continuous rotation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.2;
    }
  });

  return (
    <group ref={groupRef} {...props} dispose={null}>
      <group scale={0.01}>
        {/* PIEZA ABSTRACTA materials and geometry */}
        <mesh geometry={nodes.Cube001_Material003_0.geometry} material={materials['Material.003']} position={[0, 142.847, 0]} rotation={[-Math.PI / 4, 0, 0]} scale={80.836} />
        <mesh geometry={nodes.Icosphere001_Material002_0.geometry} material={materials['Material.002']} position={[0, 142.847, 0]} rotation={[Math.PI / 2, -0.002, 0]} scale={[-86.718, 86.718, 86.718]} />
        <mesh geometry={nodes.Icosphere002_Material005_0.geometry} material={materials['Material.005']} position={[0, 142.847, 0]} rotation={[1.856, -1.023, -0.285]} scale={[-57.816, 57.816, 57.816]} />
      </group>
    </group>
  );
}

// Preload the model
useGLTF.preload('/sphere.glb');

export function SphereBlob() {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }}>
        {/* Lights */}
        <ambientLight intensity={0.6} />
        <spotLight position={[10, 15, 10]} angle={0.2} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1.5} color="#06b6d4" />
        <pointLight position={[10, -10, -10]} intensity={2.0} color="#3b82f6" />
        
        {/* Floating animated model */}
        <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.5}>
          <Model position={[0, -1.4, 0]} scale={1.2} /> 
        </Float>
        
        {/* Environment map for realistic reflections */}
        <Environment preset="city" />
        
        {/* Floor Shadow */}
        <ContactShadows position={[0, -2.5, 0]} opacity={0.5} scale={10} blur={2.5} far={4} color="#000000" />
      </Canvas>
    </div>
  );
}
