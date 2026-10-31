'use client';

import React, { useEffect, useRef } from 'react';

interface LoopingTikTokIconProps {
  className?: string;
  size?: number; // e.g. 48, 52, 64, 72
}

export default function LoopingTikTokIcon({
  className = '',
  size = 64
}: LoopingTikTokIconProps) {
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

    // Official TikTok Musical Note Vector Path (24x24 viewBox)
    const TIKTOK_NOTE_PATH = new Path2D(
      "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43c.8-.8 1.4-1.8 1.4-3.87V8.75a8.16 8.16 0 0 0 4.33 1.39V6.69z"
    );

    // Helper: Draw Chromatic Musical Note (Cyan + Magenta + White Core)
    const drawTikTokNote = (
      c: CanvasRenderingContext2D,
      isBack = false
    ) => {
      c.save();

      const shadowOffsetX = isBack ? -0.35 : 0.35;
      const cyanShiftX = isBack ? 0.72 : -0.72;
      const magentaShiftX = isBack ? -0.72 : 0.72;

      // 1. Drop shadow beneath note
      c.save();
      c.translate(shadowOffsetX, 0.45);
      c.fillStyle = 'rgba(0, 0, 0, 0.65)';
      c.fill(TIKTOK_NOTE_PATH);
      c.restore();

      // 2. Cyan Glitch Layer (Offset)
      c.save();
      c.translate(cyanShiftX, -0.25);
      c.fillStyle = '#25F4EE';
      c.fill(TIKTOK_NOTE_PATH);
      c.restore();

      // 3. Magenta Glitch Layer (Offset Opposite)
      c.save();
      c.translate(magentaShiftX, 0.25);
      c.fillStyle = '#FE2C55';
      c.fill(TIKTOK_NOTE_PATH);
      c.restore();

      // 4. Solid Crisp White Core Layer (Center)
      c.save();
      c.fillStyle = isBack ? '#f1f5f9' : '#FFFFFF';
      c.fill(TIKTOK_NOTE_PATH);

      // Fine edge highlight stroke
      c.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      c.lineWidth = 0.3;
      c.stroke(TIKTOK_NOTE_PATH);
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

      // 1. Ambient Background Glow Disc (Dual Cyan / Magenta Aura)
      const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.15);
      bgGrad.addColorStop(0, 'rgba(37, 244, 238, 0.12)');
      bgGrad.addColorStop(0.45, 'rgba(254, 44, 85, 0.08)');
      bgGrad.addColorStop(1, 'rgba(1, 1, 1, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Tilt & Rotation Geometry
      const tiltX = 0.22; // ~12.5 degrees forward perspective tilt
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Token dimensions & extrusion thickness
      const ttScale = (R * 1.28) / 24;
      const thickness = 7.2; // 3D depth in pixels
      const numSlices = 26; // Dense micro-extrusion

      // 3. Dynamic Floor Contact Shadow (Expanding with rotation)
      const shadowBroadness = 0.4 + 0.6 * Math.abs(cosAngle);
      const shadowY = cy + R * 0.72;
      const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, R * 0.58);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      shadowGrad.addColorStop(0.45, 'rgba(254, 44, 85, 0.12)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, R * 0.55 * shadowBroadness, R * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. 3D Layer Extrusion Slicing for the TikTok Obsidian Token
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
        const rawScaleX = cosAngle * ttScale;
        const signX = rawScaleX < 0 ? -1 : 1;
        const safeScaleX = Math.max(0.02, Math.abs(rawScaleX)) * signX;
        const scaleY = ttScale * Math.cos(tiltX);

        ctx.scale(safeScaleX, scaleY);
        ctx.translate(-12, -12);

        if (isTopFace) {
          // --- FRONT CAP FACE ---
          if (isFacingFront) {
            // Obsidian Onyx Disc Finish
            const coinGrad = ctx.createLinearGradient(
              2 + sinAngle * 6,
              2,
              22 - sinAngle * 6,
              22
            );
            coinGrad.addColorStop(0, '#242831'); // Titanium rim
            coinGrad.addColorStop(0.45, '#121418'); // Matte obsidian
            coinGrad.addColorStop(1, '#050608'); // Void black
            ctx.fillStyle = coinGrad;
            ctx.beginPath();
            ctx.arc(12, 12, 12, 0, Math.PI * 2);
            ctx.fill();

            // Beveled chromatic edge rim
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 0.55;
            ctx.stroke();

            // Subtle inner concentric groove
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 0.35;
            ctx.beginPath();
            ctx.arc(12, 12, 11, 0, Math.PI * 2);
            ctx.stroke();

            // --- DRAW CHROMATIC MUSICAL NOTE ON TOP ---
            drawTikTokNote(ctx, false);

          } else {
            // --- BACK CAP FACE (When rotated 180°) ---
            const backGrad = ctx.createLinearGradient(2, 2, 22, 22);
            backGrad.addColorStop(0, '#1c1f26');
            backGrad.addColorStop(0.5, '#101216');
            backGrad.addColorStop(1, '#040507');
            ctx.fillStyle = backGrad;
            ctx.beginPath();
            ctx.arc(12, 12, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 0.55;
            ctx.stroke();

            // Matching mirrored chromatic note on rear
            drawTikTokNote(ctx, true);
          }
        } else if (isBackFace) {
          // Bottom-most back cap
          ctx.fillStyle = '#020304';
          ctx.beginPath();
          ctx.arc(12, 12, 12, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // --- 3D EXTRUDED SIDE RIM WALLS (Intermediate Slices) ---
          // Directionally shaded industrial titanium / graphite
          const rimShade = Math.max(0.16, Math.min(0.88, 0.32 + sideLightDot * 0.45));
          const val = Math.round(15 + rimShade * 52); // ~23 to 61

          ctx.fillStyle = `rgb(${val}, ${val + 3}, ${val + 7})`;
          ctx.beginPath();
          ctx.arc(12, 12, 12, 0, Math.PI * 2);
          ctx.fill();

          // Side wall stroke to guarantee seamless surface connectivity
          ctx.strokeStyle = `rgba(${val + 10}, ${val + 14}, ${val + 20}, 0.8)`;
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
