import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

function NeuralOrb({ isLoading }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      // Rotation
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1.2, 100, 100]} scale={1.5}>
        <MeshDistortMaterial
          color="#ffffff"
          speed={isLoading ? 6 : 2}
          distort={isLoading ? 0.4 : 0.2}
          radius={1}
          metalness={0.9}
          roughness={0.05}
          emissive="#ffffff"
          emissiveIntensity={0.05}
        />
      </Sphere>
    </Float>
  );
}

export default function NeuralCore3D({ isLoading }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#ff5f5f" />
        
        <NeuralOrb isLoading={isLoading} />
        
        <Environment preset="city" />
        <ContactShadows 
          position={[0, -2.5, 0]} 
          opacity={0.3} 
          scale={10} 
          blur={2.5} 
          far={4} 
        />
      </Canvas>
    </div>
  );
}
