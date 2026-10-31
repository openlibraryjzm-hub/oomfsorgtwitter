'use client';

import React, { useEffect, useRef } from 'react';

interface LoopingOnlyFansIconProps {
  className?: string;
  size?: number; // e.g. 48, 52, 64, 72
}

export default function LoopingOnlyFansIcon({
  className = '',
  size = 64
}: LoopingOnlyFansIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0; // Rotation angle in radians

    // Retina / HiDPI setup
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    // Official OnlyFans Donut ("O") Vector Path (from 20250726202534!OnlyFans_logo.svg)
    const OF_DONUT_PATH = new Path2D(
      "M266.82.53c35 0 69.65 6.91 101.98 20.34s61.71 33.11 86.45 57.93c24.75 24.81 44.37 54.27 57.77 86.7a267.919 267.919 0 0 1 20.29 102.27c0 108.09-64.93 205.53-164.51 246.89s-214.2 18.5-290.41-57.93C2.18 380.3-20.62 265.36 20.62 165.5 61.87 65.64 159.04.53 266.82.53zm0 347.4c10.5.01 20.9-2.05 30.61-6.07s18.52-9.93 25.95-17.38 13.31-16.29 17.33-26.02a80.365 80.365 0 0 0 6.06-30.7c0-32.43-19.48-61.66-49.35-74.07s-64.26-5.55-87.12 17.38-29.7 57.41-17.33 87.37 41.53 49.49 73.86 49.49z"
    );

    // Official OnlyFans Wing ("F") Vector Path (from 20250726202534!OnlyFans_logo.svg)
    const OF_WING_PATH = new Path2D(
      "M566.35 200.96c67.71 19.54 147.63 0 147.63 0-23.19 101.55-96.75 165.15-202.81 172.89a266.766 266.766 0 0 1-40.48 65.86 266.208 266.208 0 0 1-57.62 51.43c-21.6 14.24-45.15 25.25-69.92 32.68s-50.48 11.19-76.33 11.18l79.95-254.81C428.95 18.28 471.08.54 665.98.54H799.8c-22.38 98.88-99.54 174.41-233.44 200.42z"
    );

    // Visual center of mass of the combined emblem
    const SVG_CENTER_X = 350.0;
    const SVG_CENTER_Y = 278.0;
    const SVG_MAX_DIM = 820.42;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;
      const R = size * 0.42;

      // 1. Ambient Background Glow Aura (OnlyFans Sky Cyan)
      const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.15);
      bgGrad.addColorStop(0, 'rgba(0, 174, 239, 0.20)');
      bgGrad.addColorStop(0.5, 'rgba(0, 140, 207, 0.06)');
      bgGrad.addColorStop(1, 'rgba(0, 174, 239, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Tilt & Rotation Trigonometry
      const tiltX = 0.22; // ~12.5 degrees forward perspective tilt
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Figurine scale & extrusion depth
      const ofScale = (R * 1.55) / SVG_MAX_DIM;
      const thickness = 5.2; // 3D depth in pixels (proportional and sleek)
      const numSlices = 24; // Dense micro-extrusion

      // 3. Dynamic Floor Contact Shadow
      const shadowBroadness = 0.45 + 0.55 * Math.abs(cosAngle);
      const shadowY = cy + R * 0.72;
      const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, R * 0.60);
      shadowGrad.addColorStop(0, 'rgba(0, 30, 60, 0.42)');
      shadowGrad.addColorStop(0.45, 'rgba(0, 174, 239, 0.14)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, R * 0.58 * shadowBroadness, R * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. 3D Layer Extrusion Slicing
      const isFacingFront = cosAngle >= 0;

      // Slices sorted back-to-front in camera space
      const sliceIndices: number[] = [];
      for (let i = 0; i < numSlices; i++) {
        sliceIndices.push(i);
      }
      if (!isFacingFront) {
        sliceIndices.reverse();
      }

      // Directional lighting factor for edges
      const sideLightDot = sinAngle * 0.7 + 0.3;
      const rimShade = Math.max(0.4, Math.min(1.1, 0.6 + sideLightDot * 0.45));

      for (let idx = 0; idx < sliceIndices.length; idx++) {
        const i = sliceIndices[idx];
        const isTopFace = (idx === sliceIndices.length - 1);

        const normZ = (i / (numSlices - 1)) - 0.5;
        const localZ = normZ * thickness;

        // World projection
        const offsetX = localZ * sinAngle;
        const offsetY = -localZ * cosAngle * Math.sin(tiltX) - 1.5;

        ctx.save();
        ctx.translate(cx + offsetX, cy + offsetY);

        // Continuous smooth perspective scaling (clamp only near absolute 0 to avoid singular matrix)
        const rawScaleX = cosAngle * ofScale;
        const safeScaleX = Math.abs(rawScaleX) < 0.0005 ? (rawScaleX < 0 ? -0.0005 : 0.0005) : rawScaleX;
        const scaleY = ofScale * Math.cos(tiltX);

        ctx.scale(safeScaleX, scaleY);
        ctx.translate(-SVG_CENTER_X, -SVG_CENTER_Y);

        if (isTopFace) {
          // --- TOPMOST VISIBLE CAP FACE ---
          if (isFacingFront) {
            // FRONT FACE:
            // 1. Right Wing ("F"): Darker Blue (#008ccf) with specular gradient
            const wingGrad = ctx.createLinearGradient(
              350 + sinAngle * 100,
              50,
              750 - sinAngle * 100,
              450
            );
            wingGrad.addColorStop(0, '#00a3ed');
            wingGrad.addColorStop(0.5, '#008ccf');
            wingGrad.addColorStop(1, '#0072aa');
            ctx.fillStyle = wingGrad;
            ctx.fill(OF_WING_PATH);

            // Wing edge bevel highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 14;
            ctx.stroke(OF_WING_PATH);

            // 2. Left Donut ("O"): Vibrant Electric Cyan (#00aeef)
            const donutGrad = ctx.createLinearGradient(
              100 + sinAngle * 100,
              50,
              450 - sinAngle * 100,
              450
            );
            donutGrad.addColorStop(0, '#38c5ff');
            donutGrad.addColorStop(0.48, '#00aeef');
            donutGrad.addColorStop(1, '#0097d4');
            ctx.fillStyle = donutGrad;
            ctx.fill(OF_DONUT_PATH);

            // Donut edge bevel highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.lineWidth = 14;
            ctx.stroke(OF_DONUT_PATH);

          } else {
            // BACK FACE (Mirrored 360° rear view):
            // 1. Right Wing ("F") on rear
            const backWingGrad = ctx.createLinearGradient(350, 50, 750, 450);
            backWingGrad.addColorStop(0, '#0090d4');
            backWingGrad.addColorStop(0.5, '#007ebc');
            backWingGrad.addColorStop(1, '#00669a');
            ctx.fillStyle = backWingGrad;
            ctx.fill(OF_WING_PATH);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 14;
            ctx.stroke(OF_WING_PATH);

            // 2. Left Donut ("O") on rear
            const backDonutGrad = ctx.createLinearGradient(100, 50, 450, 450);
            backDonutGrad.addColorStop(0, '#1ebcf7');
            backDonutGrad.addColorStop(0.5, '#009ddb');
            backDonutGrad.addColorStop(1, '#0084ba');
            ctx.fillStyle = backDonutGrad;
            ctx.fill(OF_DONUT_PATH);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 14;
            ctx.stroke(OF_DONUT_PATH);
          }
        } else {
          // --- 3D SOLID EXTRUDED BODY (Intermediate Slices) ---
          // Wing slice: Solid darker blue shaded by edge lighting
          const wR = Math.round(0);
          const wG = Math.round(140 * rimShade);
          const wB = Math.round(207 * rimShade);
          ctx.fillStyle = `rgb(${wR}, ${Math.min(255, wG)}, ${Math.min(255, wB)})`;
          ctx.fill(OF_WING_PATH);

          // Donut slice: Solid electric cyan shaded by edge lighting
          const dR = Math.round(0);
          const dG = Math.round(174 * rimShade);
          const dB = Math.round(239 * rimShade);
          ctx.fillStyle = `rgb(${dR}, ${Math.min(255, dG)}, ${Math.min(255, dB)})`;
          ctx.fill(OF_DONUT_PATH);

          // Sub-pixel slice stroke to guarantee seamless surface connectivity
          ctx.strokeStyle = `rgba(${dR}, ${Math.min(255, dG)}, ${Math.min(255, dB)}, 0.8)`;
          ctx.lineWidth = 18;
          ctx.stroke(OF_WING_PATH);
          ctx.stroke(OF_DONUT_PATH);
        }

        ctx.restore();
      }

      ctx.restore();

      // Constant smooth endless 360° spin (~4.8s per revolution)
      angle += 0.022;
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
