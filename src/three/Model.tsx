/**
 * Memuat model 3D .glb/.gltf dari folder public/ (mis. public/models/roket.glb).
 * Sumber model gratis: Poly Pizza, Kenney, Quaternius (CC0), Sketchfab (cek lisensi tiap model), NASA 3D Resources.
 * Render menunggu model selesai dimuat (ThreeCanvas menangani Suspense), jadi tidak ada frame kosong.
 */
import { useLoader } from "@react-three/fiber";
import React, { useMemo } from "react";
import { staticFile } from "remotion";
import { Box3, Vector3, type Object3D } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { V3 } from "../lib";

/** skala otomatis supaya model muat dalam kotak berukuran `fit` unit dan berpusat di (0,0,0) */
const normalize = (obj: Object3D, fit: number) => {
  const box = new Box3().setFromObject(obj);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const s = fit / Math.max(size.x, size.y, size.z, 1e-6);
  return { s, center };
};

export const Model: React.FC<{ src: string; fit?: number; position?: V3; rotation?: V3; scale?: number }> = ({ src, fit = 2, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const gltf = useLoader(GLTFLoader, staticFile(src));
  const { scene, s, center } = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const n = normalize(clone, fit);
    return { scene: clone, ...n };
  }, [gltf, fit]);
  return (
    <group position={position} rotation={rotation} scale={scale * s}>
      <primitive object={scene} position={[-center.x, -center.y, -center.z]} />
    </group>
  );
};
