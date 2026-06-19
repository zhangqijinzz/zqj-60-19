import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import type { MemoryNode } from '@/types';

interface EditableMemoryNodeProps {
  node: MemoryNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onPositionChange: (id: string, position: [number, number, number]) => void;
  onDragEnd?: (id: string) => void;
  otherNodes: MemoryNode[];
  minDistance?: number;
}

const NODE_RADIUS = 0.35;
const HANDLE_RADIUS = 0.15;

export function EditableMemoryNode({
  node,
  isSelected,
  onSelect,
  onPositionChange,
  onDragEnd,
  otherNodes,
  minDistance = 1.0,
}: EditableMemoryNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const handleGroupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragAxis, setDragAxis] = useState<'x' | 'y' | 'z' | null>(null);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane());
  const dragStartPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const dragStartIntersectRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const { camera, gl } = useThree();
  const tempPosRef = useRef<[number, number, number]>([...node.position]);

  const hueColors = [
    '#fcd34d',
    '#f472b6',
    '#a78bfa',
    '#22d3ee',
    '#4ade80',
    '#fb923c',
  ];
  const color = hueColors[Math.abs(node.label.charCodeAt(0)) % hueColors.length];

  useEffect(() => {
    tempPosRef.current = [...node.position];
  }, [node.position]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
    if (isSelected && handleGroupRef.current && !isDragging) {
      handleGroupRef.current.rotation.y += delta * 0.5;
    }
  });

  const getIntersectPoint = (
    clientX: number,
    clientY: number,
    plane: THREE.Plane
  ): THREE.Vector3 | null => {
    const rect = gl.domElement.getBoundingClientRect();
    mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    const intersectPoint = new THREE.Vector3();
    raycasterRef.current.ray.intersectPlane(plane, intersectPoint);
    return intersectPoint;
  };

  const checkCollision = (newPos: [number, number, number]): boolean => {
    for (const other of otherNodes) {
      if (other.id === node.id) continue;
      const dx = newPos[0] - other.position[0];
      const dy = newPos[1] - other.position[1];
      const dz = newPos[2] - other.position[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distance < minDistance) {
        return true;
      }
    }
    return false;
  };

  const clampToBounds = (pos: [number, number, number]): [number, number, number] => {
    const [x, y, z] = pos;
    return [
      Math.max(-8, Math.min(8, x)),
      Math.max(0.2, Math.min(4, y)),
      Math.max(-8, Math.min(2, z)),
    ];
  };

  const handlePointerDown = (
    e: any,
    axis: 'x' | 'y' | 'z' | null
  ) => {
    e.stopPropagation();
    if (!isSelected) {
      onSelect(node.id);
    }
    if (!axis || !groupRef.current) return;

    setIsDragging(true);
    setDragAxis(axis);

    const currentPos = new THREE.Vector3(...node.position);
    dragStartPosRef.current.copy(currentPos);
    dragStartIntersectRef.current.copy(currentPos);

    const normal = new THREE.Vector3();
    if (axis === 'x') {
      normal.set(0, 1, 0);
    } else if (axis === 'y') {
      normal.set(0, 0, 1);
    } else {
      normal.set(0, 1, 0);
    }
    dragPlaneRef.current.setFromNormalAndCoplanarPoint(
      normal,
      currentPos
    );

    const intersect = getIntersectPoint(
      e.clientX || e.pointer?.clientX || 0,
      e.clientY || e.pointer?.clientY || 0,
      dragPlaneRef.current
    );
    if (intersect) {
      dragStartIntersectRef.current.copy(intersect);
    }

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging || !dragAxis) return;
    e.stopPropagation();

    const intersect = getIntersectPoint(
      e.clientX || e.pointer?.clientX || 0,
      e.clientY || e.pointer?.clientY || 0,
      dragPlaneRef.current
    );

    if (!intersect) return;

    const delta = new THREE.Vector3().subVectors(
      intersect,
      dragStartIntersectRef.current
    );

    let newPos: [number, number, number] = [...node.position];

    if (dragAxis === 'x') {
      newPos[0] = dragStartPosRef.current.x + delta.x;
    } else if (dragAxis === 'y') {
      newPos[1] = dragStartPosRef.current.y + delta.y;
    } else if (dragAxis === 'z') {
      newPos[2] = dragStartPosRef.current.z + delta.z;
    }

    newPos = clampToBounds(newPos);

    if (!checkCollision(newPos)) {
      tempPosRef.current = newPos;
      onPositionChange(node.id, newPos);
    }
  };

  const handlePointerUp = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();
    setIsDragging(false);
    setDragAxis(null);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (onDragEnd) {
      onDragEnd(node.id);
    }
  };

  const handleNodeClick = (e: any) => {
    e.stopPropagation();
    onSelect(node.id);
  };

  return (
    <group ref={groupRef} position={node.position}>
      <mesh
        onClick={handleNodeClick}
        onPointerDown={(e) => handlePointerDown(e, null)}
      >
        <octahedronGeometry args={[NODE_RADIUS, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 1.5 : 0.6}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>

      <pointLight
        color={color}
        intensity={isSelected ? 2.5 : 0.8}
        distance={2.5}
        decay={2}
      />

      {isSelected && (
        <group ref={handleGroupRef}>
          <mesh
            position={[0.8, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            onPointerDown={(e) => handlePointerDown(e, 'x')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <cylinderGeometry args={[HANDLE_RADIUS, HANDLE_RADIUS, 0.6, 16]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#ef4444"
              emissiveIntensity={0.8}
            />
          </mesh>

          <mesh
            position={[0, 0.8, 0]}
            onPointerDown={(e) => handlePointerDown(e, 'y')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <cylinderGeometry args={[HANDLE_RADIUS, HANDLE_RADIUS, 0.6, 16]} />
            <meshStandardMaterial
              color="#22c55e"
              emissive="#22c55e"
              emissiveIntensity={0.8}
            />
          </mesh>

          <mesh
            position={[0, 0, 0.8]}
            rotation={[Math.PI / 2, 0, 0]}
            onPointerDown={(e) => handlePointerDown(e, 'z')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <cylinderGeometry args={[HANDLE_RADIUS, HANDLE_RADIUS, 0.6, 16]} />
            <meshStandardMaterial
              color="#3b82f6"
              emissive="#3b82f6"
              emissiveIntensity={0.8}
            />
          </mesh>

          <mesh position={[0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
          <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
            <meshBasicMaterial color="#3b82f6" />
          </mesh>
        </group>
      )}
    </group>
  );
}

interface EditorGizmoProps {
  alignment?: 'top-right' | string;
  margin?: [number, number];
}

export function EditorGizmo({
  alignment = 'top-right',
  margin = [80, 80],
}: EditorGizmoProps) {
  return (
    <GizmoHelper alignment={alignment as any} margin={margin}>
      <GizmoViewport
        axisColors={['#ef4444', '#22c55e', '#3b82f6']}
        labelColor="white"
      />
    </GizmoHelper>
  );
}
