import React, { useState, useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { createXRStore, XR, Interactive } from '@react-three/xr';
import { Sphere, Cylinder, Torus, Billboard, Text, shaderMaterial, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import { MdViewInAr, MdVolumeUp, MdPsychology, MdClose, MdFiberManualRecord } from "react-icons/md";

// Create the XR store for AR
const store = createXRStore({
  depthSensing: true,
  handTracking: true,
  hitTest: true
});

// ── Holographic shader for XR ────────────────────────────────────────────────
const XRHologramMaterial = shaderMaterial(
  {
    hologramColor: new THREE.Color("#00f0ff"),
    time: 0.0,
    opacity: 0.9,
    voiceVolume: 0.0,
    glitchIntensity: 0.06,
    cloakAlpha: 1.0,
    fadeMin: -1.2,
    fadeMax: 2.5,
  },
  /* glsl */ `
    uniform float time;
    uniform float glitchIntensity;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying float vY;
    float rand(float n) { return fract(sin(n) * 43758.5453123); }
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;
      vY = position.y;
      vec3 pos = position;
      float glitchLine = step(0.97, sin(time * 18.0 + pos.y * 80.0));
      pos.x += glitchLine * (rand(time + pos.y) - 0.5) * glitchIntensity;
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  /* glsl */ `
    uniform vec3 hologramColor;
    uniform float time;
    uniform float opacity;
    uniform float voiceVolume;
    uniform float cloakAlpha;
    uniform float fadeMin;
    uniform float fadeMax;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying float vY;
    float rand(vec2 co) { return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec3 viewDir = normalize(vViewPosition);
      vec3 n = normalize(vNormal);
      float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 2.5);
      float scanline = 0.82 + 0.18 * sin(vY * 28.0 - time * 2.5);
      float noise = rand(vUv + fract(time * 0.04)) * 0.05;
      float fade = smoothstep(fadeMin, fadeMax, vY);
      float flicker = 0.95 + 0.05 * sin(time * 19.7);
      float voicePulse = 1.0 + voiceVolume * 1.5;
      float emissive = (0.65 + fresnel * 1.1) * voicePulse * flicker;
      float alpha = (0.68 + fresnel * 0.32 + noise) * opacity * fade * scanline * cloakAlpha;
      gl_FragColor = vec4(hologramColor * emissive, alpha);
    }
  `
);
extend({ XRHologramMaterial });

/**
 * HologramCharacterXR - Full humanoid hologram optimized for AR/WebXR
 * Includes spatial audio, look-at, and enhanced shader effects
 */
const HologramCharacterXR = ({ agent, scale = 1, animationState = 'idle', voiceVolume = 0 }) => {
  const groupRef = useRef();
  const headRef = useRef();
  const bodyRef = useRef();
  const mat0 = useRef();
  const mat1 = useRef();
  const mat2 = useRef();
  const mat3 = useRef();
  const [hovered, setHovered] = useState(false);

  const hologramColor = agent?.persona?.avatar_color || '#00f0ff';
  const col = useMemo(() => new THREE.Color(hologramColor), [hologramColor]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Floating animation
    groupRef.current.position.y = Math.sin(t * 1.2) * 0.08;

    if (animationState === 'speaking') {
      groupRef.current.position.y += Math.sin(t * 4) * 0.05;
      if (headRef.current) headRef.current.rotation.z = Math.sin(t * 2.5) * 0.08;
    } else if (animationState === 'thinking') {
      groupRef.current.rotation.y += 0.008;
      if (headRef.current) headRef.current.rotation.z = Math.sin(t * 1.2) * 0.15;
    }

    // Update shader uniforms
    const mats = [mat0, mat1, mat2, mat3];
    mats.forEach(m => {
      if (m.current) {
        m.current.time = t;
        m.current.voiceVolume = voiceVolume;
        m.current.opacity = hovered ? 1.0 : 0.9;
      }
    });
  });

  return (
    <group
      ref={groupRef}
      scale={scale}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Head */}
      <Sphere ref={headRef} args={[0.4, 32, 32]} position={[0, 1.22, 0]}>
        <xRHologramMaterial ref={mat0} hologramColor={col} transparent depthWrite={false} side={THREE.DoubleSide} />
      </Sphere>

      {/* Body */}
      <Cylinder ref={bodyRef} args={[0.3, 0.26, 1, 32]} position={[0, 0.5, 0]}>
        <xRHologramMaterial ref={mat1} hologramColor={col} transparent depthWrite={false} side={THREE.DoubleSide} />
      </Cylinder>

      {/* Left leg */}
      <Cylinder args={[0.09, 0.09, 0.62, 16]} position={[-0.15, -0.32, 0]}>
        <xRHologramMaterial ref={mat2} hologramColor={col} transparent depthWrite={false} side={THREE.DoubleSide} />
      </Cylinder>

      {/* Right leg */}
      <Cylinder args={[0.09, 0.09, 0.62, 16]} position={[0.15, -0.32, 0]}>
        <xRHologramMaterial ref={mat3} hologramColor={col} transparent depthWrite={false} side={THREE.DoubleSide} />
      </Cylinder>

      {/* Orbital ring */}
      <Torus args={[0.85, 0.03, 16, 100]} position={[0, 0.5, 0]}>
        <meshBasicMaterial color={col} transparent opacity={0.6} />
      </Torus>

      {/* Aura glow */}
      <Sphere args={[0.55, 16, 16]} position={[0, 0.5, 0]}>
        <meshBasicMaterial color={col} transparent opacity={hovered ? 0.1 : 0.04} depthWrite={false} />
      </Sphere>

      {/* Spatial Audio attached to head position */}
      <group position={[0, 1.22, 0]}>
        <PositionalAudio
          url=""
          distance={3}
          loop={false}
          autoplay={false}
        />
      </group>

      {/* Spatial subtitle */}
      {animationState === 'speaking' && (
        <Billboard position={[0, 2.2, 0]}>
          <Text
            fontSize={0.2}
            color={hologramColor}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            {agent?.name || 'AGENT'} SPEAKING
          </Text>
        </Billboard>
      )}

      {/* Thinking data streams */}
      {animationState === 'thinking' && (
        <>
          <Torus args={[1.4, 0.025, 12, 100]} position={[0, 0.5, 0]}>
            <meshBasicMaterial color={col} transparent opacity={0.4} wireframe />
          </Torus>
          <Torus args={[1.4, 0.025, 12, 100]} position={[0, 0.5, 0]} rotation={[Math.PI / 3, 0, 0]}>
            <meshBasicMaterial color={col} transparent opacity={0.3} wireframe />
          </Torus>
        </>
      )}
    </group>
  );
};

/**
 * ARHologramViewer - Main AR experience component with spatial audio & enhanced XR
 */
const ARHologramViewer = ({ agent, onClose }) => {
  const [animationState, setAnimationState] = useState('idle');
  const [voiceVolume, setVoiceVolume] = useState(0);

  const handleSpeak = () => {
    setAnimationState('speaking');
    setVoiceVolume(0.7);
    setTimeout(() => {
      setAnimationState('idle');
      setVoiceVolume(0);
    }, 3000);
  };

  const handleThink = () => {
    setAnimationState('thinking');
    setTimeout(() => setAnimationState('idle'), 2000);
  };

  return (
    <div className="ar-container">
      {/* AR Viewport */}
      <div className="ar-canvas">
        <button
          className="btn btn-primary btn-view-ar"
          onClick={() => store.enterAR()}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000 }}
        >
          <MdViewInAr /> Initialize AR Projection
        </button>

        <XR store={store}>
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 8, 5]} intensity={1.2} color="#ffffff" />
          <pointLight position={[-5, -3, -5]} intensity={0.6} color={agent?.persona?.avatar_color || '#00f0ff'} />

          <Interactive>
            <HologramCharacterXR
              agent={agent}
              scale={0.5}
              animationState={animationState}
              voiceVolume={voiceVolume}
            />
          </Interactive>
        </XR>
      </div>

      {/* AR Overlay UI */}
      <div className="ar-overlay">
        <button className="btn-speak" onClick={handleSpeak}>
          <MdVolumeUp /> Speak
        </button>
        <button className="btn-think" onClick={handleThink}>
          <MdPsychology /> Think
        </button>
        <button className="btn-exit" onClick={onClose}>
          <MdClose /> Exit
        </button>
      </div>

      {/* Agent Info */}
      <div className="ar-agent-info">
        <strong>{agent?.name}</strong>
        <div>{agent?.persona?.personality}</div>
        <div>Status: {agent?.status}</div>
      </div>

      {/* AR Status */}
      <div className="ar-status">
        <MdFiberManualRecord style={{ color: animationState !== 'idle' ? '#39ff14' : '#00f0ff', marginRight: 4 }} />
        HOLOGRAPHIC LINK ACTIVE
      </div>
    </div>
  );
};

export default ARHologramViewer;
