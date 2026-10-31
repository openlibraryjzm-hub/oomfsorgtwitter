'use client';

import React, { useEffect, useRef } from 'react';

interface LoopingGlobeIconProps {
  className?: string;
  size?: number; // e.g. 56, 64, 72
}

export default function LoopingGlobeIcon({
  className = '',
  size = 64
}: LoopingGlobeIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    // Retina / HiDPI setup
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    // Fixed network node coordinates on the sphere (lat, lon in radians)
    const NODES = [
      { lat: 0, lon: 0 },
      { lat: 0, lon: Math.PI / 3 },
      { lat: 0, lon: (2 * Math.PI) / 3 },
      { lat: 0, lon: Math.PI },
      { lat: 0, lon: (4 * Math.PI) / 3 },
      { lat: 0, lon: (5 * Math.PI) / 3 },
      // Northern hemisphere
      { lat: 0.55, lon: Math.PI / 4 },
      { lat: 0.55, lon: (3 * Math.PI) / 4 },
      { lat: 0.55, lon: (5 * Math.PI) / 4 },
      { lat: 0.55, lon: (7 * Math.PI) / 4 },
      // Southern hemisphere
      { lat: -0.55, lon: 0 },
      { lat: -0.55, lon: Math.PI / 2 },
      { lat: -0.55, lon: Math.PI },
      { lat: -0.55, lon: (3 * Math.PI) / 2 },
      // Poles
      { lat: 1.2, lon: 0 },
      { lat: -1.2, lon: Math.PI }
    ];

    const tilt = 0.28; // ~16 degree axial tilt

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;
      const R = size * 0.36;

      // 1. Atmospheric Ambient Sphere Glow
      const bgGrad = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
      bgGrad.addColorStop(0, 'rgba(29, 155, 240, 0.22)');
      bgGrad.addColorStop(0.65, 'rgba(29, 155, 240, 0.06)');
      bgGrad.addColorStop(1, 'rgba(29, 155, 240, 0.01)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Outer rim circle
      ctx.strokeStyle = 'rgba(29, 155, 240, 0.45)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Clip inside sphere for longitude & latitude lines
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R - 0.5, 0, Math.PI * 2);
      ctx.clip();

      // 2. Latitude lines (Equator + Tropics)
      const latitudes = [0, 0.52, -0.52];
      latitudes.forEach((lat) => {
        const yOffset = -Math.sin(lat) * R * Math.cos(tilt);
        const latR = R * Math.cos(lat);
        const yRadius = latR * Math.sin(tilt);

        ctx.strokeStyle = lat === 0 ? 'rgba(29, 155, 240, 0.45)' : 'rgba(29, 155, 240, 0.22)';
        ctx.lineWidth = lat === 0 ? 1.2 : 0.9;
        ctx.beginPath();
        ctx.ellipse(cx, cy + yOffset, latR, Math.max(0.5, yRadius), 0, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 3. Rotating 3D Meridians (Longitude lines moving continuously across)
      // 8 meridians spaced at 45 degrees (PI / 4)
      const numMeridians = 8;
      for (let i = 0; i < numMeridians; i++) {
        const phi = (i * (Math.PI / (numMeridians / 2))) + angle;
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);

        // Orthographic projection of meridian
        // x-radius corresponds to sinPhi
        const xRadius = Math.abs(R * sinPhi);
        const isFront = cosPhi >= 0;

        ctx.strokeStyle = isFront ? 'rgba(29, 155, 240, 0.38)' : 'rgba(29, 155, 240, 0.12)';
        ctx.lineWidth = isFront ? 1.1 : 0.7;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-tilt);
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(0.2, xRadius), R, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Rotating 3D Network Nodes
      NODES.forEach((node) => {
        const curLon = node.lon + angle;
        // 3D coordinate calculation on unit sphere
        const x3d = Math.cos(node.lat) * Math.sin(curLon);
        const y3d = Math.sin(node.lat);
        const z3d = Math.cos(node.lat) * Math.cos(curLon);

        // Apply axial tilt rotation around X-axis
        const yTilted = y3d * Math.cos(tilt) - z3d * Math.sin(tilt);
        const zTilted = y3d * Math.sin(tilt) + z3d * Math.cos(tilt);
        const xTilted = x3d;

        const screenX = cx + xTilted * R;
        const screenY = cy - yTilted * R;

        const isFront = zTilted > -0.15;
        const alpha = Math.max(0.1, (zTilted + 1) / 2);

        if (isFront) {
          // Front glowing node
          ctx.fillStyle = `rgba(29, 155, 240, ${Math.min(1, alpha * 1.3)})`;
          ctx.beginPath();
          ctx.arc(screenX, screenY, Math.max(1.2, 1.8 * alpha), 0, Math.PI * 2);
          ctx.fill();

          // Soft node halo
          ctx.fillStyle = `rgba(29, 155, 240, ${alpha * 0.3})`;
          ctx.beginPath();
          ctx.arc(screenX, screenY, 3.2 * alpha, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Dim rear node
          ctx.fillStyle = 'rgba(29, 155, 240, 0.15)';
          ctx.beginPath();
          ctx.arc(screenX, screenY, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.restore(); // Restore sphere clip

      ctx.restore();

      // Smooth endless loop progression
      angle += 0.022; // ~60fps globe rotation speed

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [size]);

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative select-none flex items-center justify-center shrink-0 ${className}`}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block"
      />
    </div>
  );
}
