/**
 * Otak 3D asli (template MNI ICBM152) + hipokampus kiri-kanan, dari public/models/otak-hipokampus.glb
 * (dibuat oleh scripts/make_brain.py dari data NiiVue, BSD-2-Clause).
 * Semua prop = keadaan pada satu frame:
 *  - rot   : rotasi [x, y, z] (y = -1.57 -> tampak samping, dahi di kiri)
 *  - xray  : 0..1 permukaan otak jadi tembus pandang (hipokampus terlihat)
 *  - glow  : 0..1 cahaya hipokampus
 *  - grow  : skala hipokampus (1 = asli). Dipakai untuk penekanan visual, bukan skala data.
 */
import { useLoader } from "@react-three/fiber";
import React, { useMemo } from "react";
import { staticFile } from "remotion";
import { Color, type Mesh, MeshPhysicalMaterial, MeshStandardMaterial, type BufferGeometry } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { V3 } from "../lib";
import { hi, mixHex, type Theme } from "../themes";

/** pusat hipokampus di koordinat model (lihat output make_brain.py) */
export const HIP_CENTER: V3 = [0, -0.189, -0.075];
/** titik label hipokampus kiri (sisi kamera saat tampak samping kiri) */
export const HIP_LEFT: V3 = [-0.3, -0.19, -0.08];

const useBrainGeo = () => {
  const gltf = useLoader(GLTFLoader, staticFile("models/otak-hipokampus.glb"));
  return useMemo(() => {
    let otak: BufferGeometry | null = null;
    let hip: BufferGeometry | null = null;
    gltf.scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      if (o.name.includes("hipokampus")) hip = m.geometry;
      else otak = m.geometry;
    });
    const o = otak as unknown as BufferGeometry;
    if (!o.getAttribute("normal")) o.computeVertexNormals();
    const h = (hip as unknown as BufferGeometry).clone();
    if (!h.getAttribute("normal")) h.computeVertexNormals();
    h.translate(-HIP_CENTER[0], -HIP_CENTER[1], -HIP_CENTER[2]);
    return { otak: o, hip: h };
  }, [gltf]);
};

export const Brain: React.FC<{ th: Theme; rot: V3; xray?: number; glow?: number; grow?: number; position?: V3; scale?: number }> = ({
  th,
  rot,
  xray = 0,
  glow = 0,
  grow = 1,
  position = [0, 0, 0],
  scale = 1,
}) => {
  const { otak, hip } = useBrainGeo();
  const brainColor = useMemo(() => mixHex(th.dark ? "#E9C6C0" : "#F3C9C1", th.accent, 0.12), [th]);
  const brainMat = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color(brainColor),
        roughness: Math.max(0.35, th.mat.roughness * 0.8),
        metalness: 0,
        clearcoat: th.mat.clearcoat * 0.6,
        sheen: 0.4,
        sheenColor: new Color("#ffffff"),
        transparent: true,
      }),
    [th, brainColor],
  );
  const hipMat = useMemo(() => new MeshStandardMaterial({ color: new Color(hi(th)), emissive: new Color(hi(th)), roughness: 0.4 }), [th]);
  brainMat.opacity = 1 - 0.78 * xray;
  brainMat.depthWrite = xray < 0.4;
  hipMat.emissiveIntensity = 0.15 + 0.9 * glow;
  return (
    <group position={position} rotation={rot} scale={scale}>
      {/* geometri hipokampus sudah digeser ke pusatnya sendiri, jadi bisa "membesar" di tempat */}
      <mesh geometry={hip} material={hipMat} renderOrder={1} position={HIP_CENTER} scale={grow} />
      <mesh geometry={otak} material={brainMat} renderOrder={2} />
    </group>
  );
};
