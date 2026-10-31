'use client';

import React, { useEffect, useRef } from 'react';

interface LoopingPatreonIconProps {
  className?: string;
  size?: number; // e.g. 48, 52, 64, 72
}

export default function LoopingPatreonIcon({
  className = '',
  size = 64
}: LoopingPatreonIconProps) {
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

    // Official Patreon Pillar & Orb Monogram Vector Path (24x24 viewBox)
    const PATREON_PATH = new Path2D(
      "M22.957 7.21c-.004-3.064-2.39-5.57-5.188-6.182-3.61-.79-7.587 1.13-8.828 4.67-1.414 4.032.552 8.784 4.418 10.216 3.42 1.267 7.625-.13 9.07-3.58.55-1.313.53-3.69.528-5.124M.5 23.5h4.22V.5H.5v23z"
    );

    // Helper: Draw Patreon Pillar & Orb Crest (Solid Enamel + Drop Shadow)
    const drawPatreonCrest = (
      c: CanvasRenderingContext2D,
      isBack = false,
      sheenAngle = 0
    ) => {
      c.save();

      // Center and scale crest to fit comfortably within the circular medallion
      c.translate(12, 12);
      c.scale(0.70, 0.70);
      c.translate(-12, -12);

      const shadowOffsetX = isBack ? -0.4 : 0.4;
      const shadowOffsetY = 0.5;

      // 1. Drop shadow beneath raised enamel crest
      c.save();
      c.translate(shadowOffsetX, shadowOffsetY);
      c.fillStyle = 'rgba(0, 0, 0, 0.55)';
      c.fill(PATREON_PATH);
      c.restore();

      // 2. Solid White Enamel Finish with specular sheen
      c.save();
      const crestGrad = c.createLinearGradient(
        4 + Math.sin(sheenAngle) * 8,
        2,
        20 - Math.sin(sheenAngle) * 8,
        22
      );
      if (!isBack) {
        crestGrad.addColorStop(0, '#ffffff');
        crestGrad.addColorStop(0.55, '#fff5f5');
        crestGrad.addColorStop(1, '#fed7d7');
      } else {
        crestGrad.addColorStop(0, '#f8fafc');
        crestGrad.addColorStop(0.55, '#f1f5f9');
        crestGrad.addColorStop(1, '#cbd5e1');
      }
      c.fillStyle = crestGrad;
      c.fill(PATREON_PATH);

      // Bevel edge highlight
      c.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      c.lineWidth = 0.4;
      c.stroke(PATREON_PATH);
      c.restore();

      c.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;
      const R = size * 0.42;

      // 1. Ambient Background Glow Disc (Patreon Coral Aura)
      const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.15);
      bgGrad.addColorStop(0, 'rgba(255, 66, 77, 0.18)');
      bgGrad.addColorStop(0.5, 'rgba(255, 66, 77, 0.05)');
      bgGrad.addColorStop(1, 'rgba(255, 66, 77, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Tilt & Rotation Geometry
      const tiltX = 0.22; // ~12.5 degrees forward perspective tilt
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Token dimensions & extrusion thickness
      const patreonScale = (R * 1.28) / 24;
      const thickness = 7.2; // 3D depth in pixels
      const numSlices = 26; // Dense micro-extrusion

      // 3. Dynamic Floor Contact Shadow
      const shadowBroadness = 0.4 + 0.6 * Math.abs(cosAngle);
      const shadowY = cy + R * 0.72;
      const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, R * 0.58);
      shadowGrad.addColorStop(0, 'rgba(80, 10, 15, 0.38)');
      shadowGrad.addColorStop(0.5, 'rgba(255, 66, 77, 0.12)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, R * 0.55 * shadowBroadness, R * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. 3D Layer Extrusion Slicing for the Patreon Token
      const isFacingFront = cosAngle >= 0;

      const sliceIndices: number[] = [];
      for (let i = 0; i < numSlices; i++) {
        sliceIndices.push(i);
      }
      if (!isFacingFront) {
        sliceIndices.reverse();
      }

      // Directional light vector on edges
      const sideLightDot = sinAngle * 0.7 + 0.3;

      for (let idx = 0; idx < sliceIndices.length; idx++) {
        const i = sliceIndices[idx];
        const isBackFace = (idx === 0);
        const isTopFace = (idx === sliceIndices.length - 1);

        const normZ = (i / (numSlices - 1)) - 0.5;
        const localZ = normZ * thickness;

        const offsetX = localZ * sinAngle;
        const offsetY = -localZ * cosAngle * Math.sin(tiltX) - 1.5;

        ctx.save();
        ctx.translate(cx + offsetX, cy + offsetY);

        // Safe perspective X scale (mirrors automatically when cosAngle < 0)
        const rawScaleX = cosAngle * patreonScale;
        const signX = rawScaleX < 0 ? -1 : 1;
        const safeScaleX = Math.max(0.02, Math.abs(rawScaleX)) * signX;
        const scaleY = patreonScale * Math.cos(tiltX);

        ctx.scale(safeScaleX, scaleY);
        ctx.translate(-12, -12);

        if (isTopFace) {
          // --- FRONT CAP FACE ---
          if (isFacingFront) {
            // Patreon Coral Vermillion Finish
            const coinGrad = ctx.createLinearGradient(
              2 + sinAngle * 6,
              2,
              22 - sinAngle * 6,
              22
            );
            coinGrad.addColorStop(0, '#ff6671'); // Highlight coral
            coinGrad.addColorStop(0.45, '#FF424D'); // Official Patreon Coral
            coinGrad.addColorStop(1, '#c91f2a'); // Shadow vermillion
            ctx.fillStyle = coinGrad;
            ctx.beginPath();
            ctx.arc(12, 12, 12, 0, Math.PI * 2);
            ctx.fill();

            // Beveled silver-white outer rim highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 0.55;
            ctx.stroke();

            // Inner subtle concentric groove
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 0.35;
            ctx.beginPath();
            ctx.arc(12, 12, 11, 0, Math.PI * 2);
            ctx.stroke();

            // --- DRAW SOLID CREST ON TOP ---
            drawPatreonCrest(ctx, false, angle);

          } else {
            // --- BACK CAP FACE (When rotated 180°) ---
            const backGrad = ctx.createLinearGradient(2, 2, 22, 22);
            backGrad.addColorStop(0, '#e63540');
            backGrad.addColorStop(0.5, '#cc2b35');
            backGrad.addColorStop(1, '#8f1019');
            ctx.fillStyle = backGrad;
            ctx.beginPath();
            ctx.arc(12, 12, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 0.55;
            ctx.stroke();

            // Matching mirrored crest on rear
            drawPatreonCrest(ctx, true, angle);
          }
        } else if (isBackFace) {
          // Bottom-most back cap
          ctx.fillStyle = '#4a080d';
          ctx.beginPath();
          ctx.arc(12, 12, 12, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // --- 3D EXTRUDED SIDE RIM WALLS (Intermediate Slices) ---
          // Directionally shaded industrial coral / vermillion
          const rimShade = Math.max(0.18, Math.min(0.9, 0.35 + sideLightDot * 0.45));
          const r = Math.round(140 * rimShade + 35); // ~60 to 161
          const g = Math.round(20 * rimShade + 6);   // ~10 to 24
          const b = Math.round(28 * rimShade + 8);   // ~13 to 33

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.beginPath();
          ctx.arc(12, 12, 12, 0, Math.PI * 2);
          ctx.fill();

          // Side wall stroke to guarantee seamless surface connectivity
          ctx.strokeStyle = `rgba(${r + 15}, ${g + 8}, ${b + 10}, 0.8)`;
          ctx.lineWidth = 1.1;
          ctx.stroke();
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
