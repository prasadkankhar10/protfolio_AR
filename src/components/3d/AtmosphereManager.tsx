import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useControls } from 'leva';
import { Sky, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

type AtmospherePreset = {
  ambientColor: string;
  ambientIntensity: number;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  bgColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  skyMieCoefficient?: number;
  skyRayleigh?: number;
  skyTurbidity?: number;
  showStars?: boolean;
  hasSky?: boolean;
  showCosmicDust?: boolean;
  showNebula?: boolean;
};

const presets: Record<string, AtmospherePreset> = {
  'Cosmic Nebula': {
    ambientColor: '#8a4ca8', // Slightly darker, richer purple
    ambientIntensity: 0.8, // Increased ambient to lighten the ground naturally
    sunColor: '#4dc8ff', // Softer cyan moonlight
    sunIntensity: 0.4, // Drastically reduced to stop massive cyan specular blowouts
    sunPosition: [100, 150, 100], // Softer angle
    bgColor: '#080812',
    fogColor: '#080812', // Match bgColor so objects fade smoothly into dark space
    fogNear: 30,
    fogFar: 200, // Push fog out slightly so you can see more
    hasSky: false,
    showStars: true,
    showCosmicDust: true,
    showNebula: true
  }
};

export const AtmosphereManager = () => {
  const currentAtmosphere = useGameStore((state) => state.currentAtmosphere);
  const setAtmosphere = useGameStore((state) => state.setAtmosphere);

  const [{ Atmosphere, brightness }, set] = useControls('Environment', () => ({
    Atmosphere: {
      options: Object.keys(presets),
      value: currentAtmosphere,
      onChange: (v) => {
        if (v && v !== useGameStore.getState().currentAtmosphere) {
          setAtmosphere(v);
        }
      }
    },
    brightness: {
      value: 2.5,
      min: 0.0,
      max: 5.0,
      step: 0.1,
      label: 'Brightness'
    }
  })) as any;

  // Ensure Leva stays synced if state changes elsewhere
  useEffect(() => {
    set({ Atmosphere: currentAtmosphere });
  }, [currentAtmosphere, set]);

  const preset = presets[currentAtmosphere] || presets['Cosmic Nebula'];

  return (
    <>
      {/* Background Color */}
      <color attach="background" args={[preset.bgColor]} />
      
      {/* Fog */}
      <fog attach="fog" args={[preset.fogColor, preset.fogNear, preset.fogFar]} />

      {/* Ambient Light */}
      <ambientLight intensity={preset.ambientIntensity * brightness} color={preset.ambientColor} />

      {/* Hemisphere Light to specifically tint the sky vs ground differently and fill shadows */}
      <hemisphereLight 
        args={[preset.ambientColor, preset.bgColor, preset.ambientIntensity * 0.8 * brightness]} 
      />

      {/* Main Directional Light (Sun/Moon) */}
      <directionalLight 
        position={preset.sunPosition} 
        intensity={preset.sunIntensity * brightness} 
        color={preset.sunColor}
        castShadow 
        shadow-mapSize-width={512} 
        shadow-mapSize-height={512} 
        shadow-camera-far={1000}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        shadow-bias={-0.0001}
        shadow-normalBias={0.05}
      />

      {/* Secondary Fill Light (opposite side, no shadows) to illuminate dark faces */}
      <directionalLight 
        position={[-preset.sunPosition[0], preset.sunPosition[1] * 0.5, -preset.sunPosition[2]]} 
        intensity={preset.sunIntensity * 0.6 * brightness} 
        color={preset.ambientColor} 
      />

      {/* Conditional Sky */}
      {preset.hasSky && (
        <Sky 
          distance={45000} 
          sunPosition={preset.sunPosition} 
          inclination={0} 
          azimuth={0.25} 
          mieCoefficient={preset.skyMieCoefficient}
          rayleigh={preset.skyRayleigh}
          turbidity={preset.skyTurbidity}
        />
      )}

      {/* Conditional Stars */}
      {preset.showStars && (
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      )}

      {/* Cosmic Dust (Magical floating particles) */}
      {preset.showCosmicDust && (
        <Sparkles count={800} scale={100} size={8} speed={0.4} opacity={1.0} color="#D58BE8" />
      )}

      {/* Nebula (Large glowing colorful spots in the sky/background) */}
      {preset.showNebula && (
        <>
          <Sparkles count={150} scale={400} size={250} speed={0.1} opacity={0.6} color="#7A4BA8" position={[0, 200, 0]} />
          <Sparkles count={150} scale={400} size={200} speed={0.15} opacity={0.8} color="#6EC9E8" position={[0, 250, 0]} />
          <Sparkles count={100} scale={300} size={300} speed={0.05} opacity={0.5} color="#F6D48F" position={[100, 300, -100]} />
        </>
      )}
    </>
  );
};
