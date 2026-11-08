import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect } from "react";
import type { OrthographicCamera, PerspectiveCamera } from "three";
import type { Cam } from "../lib";
import type { Theme } from "../themes";

/** Menyetel kamera R3F tiap frame dari objek `cam` (fungsi murni dari waktu). */
const CameraRig: React.FC<{ cam: Cam }> = ({ cam }) => {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(...cam.pos);
    camera.up.set(0, 1, 0);
    camera.lookAt(...cam.target);
    if ((camera as PerspectiveCamera).isPerspectiveCamera) {
      (camera as PerspectiveCamera).fov = cam.fov;
    } else {
      (camera as OrthographicCamera).zoom = cam.zoom ?? 100;
    }
    (camera as PerspectiveCamera).updateProjectionMatrix();
    camera.updateMatrixWorld(true);
  });
  return null;
};

export const Lights: React.FC<{ th: Theme }> = ({ th }) => (
  <>
    <ambientLight intensity={th.light.ambient} />
    <hemisphereLight args={[th.light.hemiSky, th.light.hemiGround, th.light.hemi]} />
    <directionalLight position={th.light.keyPos} intensity={th.light.key} color={th.light.keyColor} />
    <directionalLight position={th.light.rimPos} intensity={th.light.rim} color={th.light.rimColor} />
  </>
);

/** Kanvas 3D standar kit: transparan (latar dari DOM), clipping aktif, kamera dikendalikan dari luar. */
export const Stage: React.FC<{ th: Theme; cam: Cam; width?: number; height?: number; children: React.ReactNode }> = ({
  th,
  cam,
  width = 1080,
  height = 1920,
  children,
}) => (
  <ThreeCanvas
    width={width}
    height={height}
    flat
    dpr={1}
    orthographic={!!cam.ortho}
    gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
    camera={cam.ortho ? { position: cam.pos, zoom: cam.zoom ?? 100, near: 0.1, far: 200 } : { position: cam.pos, fov: cam.fov, near: 0.05, far: 200 }}
    onCreated={({ gl }) => {
      gl.localClippingEnabled = true;
      gl.setClearColor(0x000000, 0);
    }}
    style={{ position: "absolute", left: 0, top: 0 }}
  >
    <CameraRig cam={cam} />
    <Lights th={th} />
    {children}
  </ThreeCanvas>
);
