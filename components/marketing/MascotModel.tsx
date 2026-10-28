"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer, useAnimations, useGLTF } from "@react-three/drei";
import { Box3, Vector3, type Group } from "three";
import { MODEL_URL, type MascotPose, type Mood } from "@/components/marketing/mascot-pose";

// Whatever size/origin the Blender export has, normalize it to this height
// (world units) and center it, so re-exporting never needs camera tweaks.
const TARGET_HEIGHT = 2.6;

function Model({ poseRef }: { poseRef: RefObject<MascotPose> }) {
  const { scene, animations } = useGLTF(MODEL_URL);
  const group = useRef<Group>(null);
  const { actions, names } = useAnimations(animations, group);
  const [mood, setMood] = useState<Mood>("idle");

  const fit = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const scale = TARGET_HEIGHT / size.y;
    return { scale, offset: center.multiplyScalar(-scale) };
  }, [scene]);

  // Blender Actions export as clips; any whose name contains the mood word
  // (e.g. "Mischievous", "orbit_sleepy") gets cross-faded in. Models with no
  // clips just skip this and rely on the pose rotation below.
  const clip =
    names.find((n) => n.toLowerCase().includes(mood)) ?? names.find((n) => n.toLowerCase().includes("idle"));
  useEffect(() => {
    const action = clip ? actions[clip] : null;
    if (!action) return;
    action.reset().fadeIn(0.3).play();
    return () => {
      action.fadeOut(0.3);
    };
  }, [clip, actions]);

  useFrame(() => {
    const pose = poseRef.current;
    group.current?.rotation.set(pose.pitch, pose.yaw + pose.spin, 0);
    if (pose.mood !== mood) setMood(pose.mood);
  });

  return (
    <group ref={group}>
      <primitive object={scene} scale={fit.scale} position={fit.offset} />
    </group>
  );
}

export default function MascotModel({ poseRef }: { poseRef: RefObject<MascotPose> }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 6], fov: 30 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      {/* Purple rim lights to match the antenna orbs and halo. */}
      <pointLight position={[-3, 1, 2]} color="#9147ff" intensity={18} />
      <pointLight position={[3, -1, -2]} color="#a78bfa" intensity={12} />
      <Suspense fallback={null}>
        <Float speed={2.5} rotationIntensity={0.15} floatIntensity={0.5}>
          <Model poseRef={poseRef} />
        </Float>
        {/* Local lightformers instead of an HDRI preset, so nothing is fetched from a CDN. */}
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2} position={[0, 3, 4]} scale={[6, 2, 1]} />
          <Lightformer form="ring" color="#a463ff" intensity={3} position={[-4, 0, 2]} scale={2} />
          <Lightformer form="rect" intensity={1.5} position={[4, 1, -2]} scale={[2, 4, 1]} />
        </Environment>
      </Suspense>
      <ContactShadows position={[0, -1.45, 0]} opacity={0.35} blur={2.5} scale={6} far={2} color="#4b1d9e" />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
