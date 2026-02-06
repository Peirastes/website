import { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { FieldModel, ChargeGeometry } from '../models/types';

interface ChargeGeometryRendererProps {
  model: FieldModel;
}

export function ChargeGeometryRenderer({ model }: ChargeGeometryRendererProps) {
  const geometries = model.getGeometry();
  
  return (
    <group>
      {geometries.map((geo, idx) => (
        <ChargeObject key={idx} geometry={geo} />
      ))}
    </group>
  );
}

function ChargeObject({ geometry }: { geometry: ChargeGeometry }) {
  const { type, position, charge, dimensions } = geometry;
  
  const color = charge > 0 ? '#e74c3c' : '#3498db';
  const emissiveColor = charge > 0 ? '#ff6b6b' : '#74b9ff';
  
  switch (type) {
    case 'point':
      return (
        <group position={[position.x, position.y, position.z]}>
          <mesh>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={emissiveColor}
              emissiveIntensity={0.5}
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>
          <Text
            position={[0, 0.35, 0]}
            fontSize={0.2}
            color="white"
            anchorX="center"
            anchorY="bottom"
          >
            {charge > 0 ? '+' : '−'}
          </Text>
        </group>
      );
      
    case 'line':
      const lineLength = dimensions?.length || 2;
      const lineNormal = dimensions?.normal || new THREE.Vector3(0, 1, 0);
      
      // Create rotation to align cylinder with line direction
      const lineQuaternion = new THREE.Quaternion();
      lineQuaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), lineNormal);
      
      return (
        <group position={[position.x, position.y, position.z]}>
          <mesh quaternion={lineQuaternion}>
            <cylinderGeometry args={[0.05, 0.05, lineLength, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={emissiveColor}
              emissiveIntensity={0.3}
              metalness={0.3}
              roughness={0.5}
            />
          </mesh>
        </group>
      );
      
    case 'ring':
      const ringRadius = dimensions?.radius || 1;
      const ringNormal = dimensions?.normal || new THREE.Vector3(1, 0, 0);
      
      const ringQuaternion = new THREE.Quaternion();
      ringQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), ringNormal);
      
      return (
        <group position={[position.x, position.y, position.z]}>
          <mesh quaternion={ringQuaternion}>
            <torusGeometry args={[ringRadius, 0.05, 16, 64]} />
            <meshStandardMaterial
              color={color}
              emissive={emissiveColor}
              emissiveIntensity={0.3}
              metalness={0.3}
              roughness={0.5}
            />
          </mesh>
        </group>
      );
      
    case 'disk':
      const diskRadius = dimensions?.radius || 1;
      const diskNormal = dimensions?.normal || new THREE.Vector3(1, 0, 0);
      
      const diskQuaternion = new THREE.Quaternion();
      diskQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), diskNormal);
      
      return (
        <group position={[position.x, position.y, position.z]}>
          <mesh quaternion={diskQuaternion}>
            <circleGeometry args={[diskRadius, 64]} />
            <meshStandardMaterial
              color={color}
              emissive={emissiveColor}
              emissiveIntensity={0.2}
              metalness={0.2}
              roughness={0.6}
              side={THREE.DoubleSide}
              transparent
              opacity={0.8}
            />
          </mesh>
          {/* Ring outline */}
          <mesh quaternion={diskQuaternion}>
            <torusGeometry args={[diskRadius, 0.03, 8, 64]} />
            <meshStandardMaterial
              color={color}
              emissive={emissiveColor}
              emissiveIntensity={0.4}
            />
          </mesh>
        </group>
      );
      
    case 'plate':
      const plateWidth = dimensions?.width || 2;
      const plateHeight = dimensions?.height || 2;
      const plateNormal = dimensions?.normal || new THREE.Vector3(1, 0, 0);
      
      const plateQuaternion = new THREE.Quaternion();
      plateQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), plateNormal);
      
      return (
        <group position={[position.x, position.y, position.z]}>
          <mesh quaternion={plateQuaternion}>
            <planeGeometry args={[plateWidth, plateHeight]} />
            <meshStandardMaterial
              color={color}
              emissive={emissiveColor}
              emissiveIntensity={0.2}
              metalness={0.2}
              roughness={0.6}
              side={THREE.DoubleSide}
              transparent
              opacity={0.7}
            />
          </mesh>
          {/* Border */}
          <lineSegments quaternion={plateQuaternion}>
            <edgesGeometry args={[new THREE.PlaneGeometry(plateWidth, plateHeight)]} />
            <lineBasicMaterial color={emissiveColor} linewidth={2} />
          </lineSegments>
        </group>
      );
      
    default:
      return null;
  }
}
