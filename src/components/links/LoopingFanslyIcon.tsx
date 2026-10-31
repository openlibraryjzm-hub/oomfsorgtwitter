'use client';

import React, { useEffect, useRef } from 'react';

interface LoopingFanslyIconProps {
  className?: string;
  size?: number; // e.g. 48, 52, 64, 72
}

export default function LoopingFanslyIcon({
  className = '',
  size = 64
}: LoopingFanslyIconProps) {
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

    // Official Fansly Interlocking Ribbon Heart Compound Vector Path (Ribbon + Inner Loop Pip)
    const FANSLY_HEART_PATH = new Path2D(
      "M 8.2770048,0.51046747 C 6.3763832,0.59110038 4.4456276,1.1923508 3.0195873,2.4893809 1.3700768,3.9292457 0.59149251,6.1133932 0.3518984,8.237478 v 0.6749374 c 0.0898491,1.8245976 0.8754034,3.5754546 2.1516971,4.8770926 3.84732,3.902608 7.7338435,7.766052 11.6180245,11.629495 0.730299,0.718785 1.405248,1.515867 2.296811,2.045738 h 0.663461 c 0.981413,-0.338663 1.584969,-1.236971 2.324482,-1.90737 2.858992,-2.916594 5.842555,-5.71108 8.632442,-8.692174 L 19.666898,8.4632434 c 0.944551,-0.9468526 1.879793,-1.9052943 2.840473,-2.8337201 0.780983,-0.774071 1.870655,-1.2210395 2.97647,-1.1311923 2.24619,0.029938 4.105293,2.3268613 3.692917,4.5338867 -0.241907,1.9167473 -2.045649,2.9578513 -3.172201,4.3378183 l 2.828659,2.696034 c 0.942246,-0.774072 1.824797,-1.723843 2.626515,-2.643053 2.236974,-2.635528 2.350156,-6.7797506 0.304396,-9.5581132 C 30.425625,1.9135982 28.160883,0.70168181 25.817935,0.51046747 H 24.656707 C 22.921957,0.70629013 21.212819,1.3629574 19.922699,2.5609248 16.040824,6.3460409 12.241781,10.216206 8.3552983,13.996714 7.4545202,13.109757 6.5604975,12.218229 5.6643261,11.326665 4.7151674,10.382112 4.2108408,8.9815916 4.4895971,7.652308 4.8697221,5.6779668 6.9037232,4.1942595 8.9057086,4.5260037 10.83628,4.731041 11.872964,6.5831143 13.26445,7.6958424 L 16.061387,5.0396301 C 14.32203,2.8187827 11.974503,0.67634058 9.0049254,0.51046747 Z " +
      "M 16.867261,12.92347 c 1.890578,0.02026 3.705264,1.518764 3.9008,3.443866 0.375533,2.391327 -1.905394,4.743586 -4.312846,4.416448 -2.349861,-0.08294 -4.066093,-2.65422 -3.478626,-4.875067 0.338652,-1.462905 1.598741,-2.649093 3.080076,-2.900205 0.268677,-0.06047 0.540513,-0.08796 0.810596,-0.08505 z m -0.04216,1.37451 a 2.5384864,2.5384864 0 0 0 -2.538431,2.538437 2.5384864,2.5384864 0 0 0 2.538432,2.538436 2.5384864,2.5384864 0 0 0 2.538435,-2.538436 2.5384864,2.5384864 0 0 0 -0.247688,-1.093734 1.0835003,1.0835003 0 0 1 -0.622967,0.199782 1.0835003,1.0835003 0 0 1 -1.083608,-1.083613 1.0835003,1.0835003 0 0 1 0.109348,-0.464355 2.5384864,2.5384864 0 0 0 -0.693502,-0.09653 z"
    );

    // Visual center of mass of the Fansly heart emblem
    const SVG_CENTER_X = 16.275;
    const SVG_CENTER_Y = 13.505;
    const SVG_MAX_DIM = 31.85;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;
      const R = size * 0.42;

      // 1. Ambient Background Glow Aura (Fansly Azure Blue)
      const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.15);
      bgGrad.addColorStop(0, 'rgba(39, 153, 246, 0.22)');
      bgGrad.addColorStop(0.5, 'rgba(39, 153, 246, 0.07)');
      bgGrad.addColorStop(1, 'rgba(39, 153, 246, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Tilt & Rotation Trigonometry
      const tiltX = 0.22; // ~12.5 degrees forward perspective tilt
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Figurine scale & extrusion depth
      const fanslyScale = (R * 1.55) / SVG_MAX_DIM;
      const thickness = 5.0; // 3D depth in pixels (sleek, physical figurine)
      const numSlices = 24; // Dense micro-extrusion

      // 3. Dynamic Floor Contact Shadow
      const shadowBroadness = 0.45 + 0.55 * Math.abs(cosAngle);
      const shadowY = cy + R * 0.72;
      const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, R * 0.60);
      shadowGrad.addColorStop(0, 'rgba(0, 30, 60, 0.42)');
      shadowGrad.addColorStop(0.45, 'rgba(39, 153, 246, 0.15)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, R * 0.55 * shadowBroadness, R * 0.14, 0, 0, Math.PI * 2);
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
      const rimShade = Math.max(0.4, Math.min(1.15, 0.65 + sideLightDot * 0.45));

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

        // Continuous smooth perspective scaling (continuous down to 0.0005 to avoid singular matrix or teleport jump)
        const rawScaleX = cosAngle * fanslyScale;
        const safeScaleX = Math.abs(rawScaleX) < 0.0005 ? (rawScaleX < 0 ? -0.0005 : 0.0005) : rawScaleX;
        const scaleY = fanslyScale * Math.cos(tiltX);

        ctx.scale(safeScaleX, scaleY);
        ctx.translate(-SVG_CENTER_X, -SVG_CENTER_Y);

        if (isTopFace) {
          // --- TOPMOST VISIBLE CAP FACE ---
          if (isFacingFront) {
            // FRONT FACE: Fansly Electric Azure Blue with top-left specular highlight
            const frontGrad = ctx.createLinearGradient(
              0 + sinAngle * 5,
              0,
              32 - sinAngle * 5,
              28
            );
            frontGrad.addColorStop(0, '#59b5ff');
            frontGrad.addColorStop(0.35, '#2799f6');
            frontGrad.addColorStop(1, '#157dd6');
            ctx.fillStyle = frontGrad;
            ctx.fill(FANSLY_HEART_PATH);

            // Bevel edge highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.lineWidth = 0.55;
            ctx.stroke(FANSLY_HEART_PATH);
          } else {
            // BACK FACE: Satin Deep Azure Blue with mirrored specular gleam
            const backGrad = ctx.createLinearGradient(
              0 - sinAngle * 5,
              0,
              32 + sinAngle * 5,
              28
            );
            backGrad.addColorStop(0, '#3aa6ff');
            backGrad.addColorStop(0.5, '#1e88e2');
            backGrad.addColorStop(1, '#1168b5');
            ctx.fillStyle = backGrad;
            ctx.fill(FANSLY_HEART_PATH);

            // Back bevel edge highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.40)';
            ctx.lineWidth = 0.55;
            ctx.stroke(FANSLY_HEART_PATH);
          }
        } else {
          // --- 3D EXTRUDED RIM WALL SLICES ---
          // Dynamically lit electric oceanic blue with directional lighting
          const r = Math.round(24 * rimShade);
          const g = Math.round(130 * rimShade);
          const b = Math.round(225 * rimShade);
          ctx.fillStyle = `rgb(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.min(255, b)})`;
          ctx.fill(FANSLY_HEART_PATH);

          // Subtle rim stroke to maintain solid silhouette
          ctx.strokeStyle = `rgba(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.min(255, b)}, 0.4)`;
          ctx.lineWidth = 0.35;
          ctx.stroke(FANSLY_HEART_PATH);
        }

        ctx.restore();
      }

      ctx.restore();

      // Continuous 360-degree rotation ~1.85 rad/s (~3.4s full revolution)
      angle = (angle + 0.024) % (Math.PI * 2);
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      className={`inline-block select-none pointer-events-none drop-shadow-[0_4px_14px_rgba(39,153,246,0.28)] ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`
      }}
    />
  );
}
