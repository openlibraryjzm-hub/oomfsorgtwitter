'use client';

import React, { useEffect, useRef } from 'react';

interface LoopingPixivIconProps {
  className?: string;
  size?: number; // e.g. 48, 52, 64, 72
}

export default function LoopingPixivIcon({
  className = '',
  size = 64
}: LoopingPixivIconProps) {
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

    // Official Pixiv "p" Monogram Vector Path (stem + curved loop + inner cutout)
    const PIXIV_P_PATH = new Path2D(
      "M 6.723 5.465 h 0.904 a 0.37 0.37 0 0 1 0.31 0.17 l 0.752 1.17 a 6.172 6.172 0 0 1 10.01 4.834 a 6.172 6.172 0 0 1 -9.394 5.265 v 2.016 a 0.37 0.37 0 0 1 -0.37 0.367 H 6.724 a 0.37 0.37 0 0 1 -0.37 -0.367 V 5.834 a 0.37 0.37 0 0 1 0.37 -0.37 Z M 12.527 8.416 a 3.222 3.222 0 1 0 -0.002 6.443 a 3.222 3.222 0 0 0 0.002 -6.443 Z"
    );

    // Helper: Draw standard squircle (rounded rectangle) with smooth corners
    const drawSquircle = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      c.beginPath();
      c.moveTo(x + r, y);
      c.lineTo(x + w - r, y);
      c.arcTo(x + w, y, x + w, y + r, r);
      c.lineTo(x + w, y + h - r);
      c.arcTo(x + w, y + h, x + w - r, y + h, r);
      c.lineTo(x + r, y + h);
      c.arcTo(x, y + h, x, y + h - r, r);
      c.lineTo(x, y + r);
      c.arcTo(x, y, x + r, y, r);
      c.closePath();
    };

    // Helper: Draw crisp raised white enamel "p" monogram
    const drawPixivPGlyph = (
      c: CanvasRenderingContext2D,
      isBack = false
    ) => {
      c.save();

      const shadowOffsetX = isBack ? -0.35 : 0.35;
      const shadowOffsetY = 0.45;

      // 1. Drop shadow beneath the raised enamel "p"
      c.save();
      c.translate(shadowOffsetX, shadowOffsetY);
      c.fillStyle = 'rgba(0, 28, 70, 0.45)';
      c.fill(PIXIV_P_PATH, 'evenodd');
      c.restore();

      // 2. Foreground crisp solid white enamel "p"
      c.fillStyle = isBack ? '#e2e8f0' : '#ffffff';
      c.fill(PIXIV_P_PATH, 'evenodd');

      // 3. Specular edge bevel stroke
      c.strokeStyle = isBack ? 'rgba(255, 255, 255, 0.40)' : 'rgba(255, 255, 255, 0.75)';
      c.lineWidth = 0.35;
      c.stroke(PIXIV_P_PATH);

      c.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;
      const R = size * 0.42;

      // 1. Ambient Background Glow Disc (Pixiv Sky Azure Aura)
      const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.15);
      bgGrad.addColorStop(0, 'rgba(0, 150, 250, 0.22)');
      bgGrad.addColorStop(0.5, 'rgba(0, 150, 250, 0.07)');
      bgGrad.addColorStop(1, 'rgba(0, 150, 250, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Tilt & Rotation Geometry
      const tiltX = 0.22; // ~12.5 degrees forward perspective tilt
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Token dimensions & extrusion thickness
      const pixivScale = (R * 1.32) / 24;
      const thickness = 6.4; // 3D depth in pixels
      const numSlices = 26; // Dense micro-extrusion

      // 3. Dynamic Floor Contact Shadow
      const shadowBroadness = 0.4 + 0.6 * Math.abs(cosAngle);
      const shadowY = cy + R * 0.72;
      const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, R * 0.58);
      shadowGrad.addColorStop(0, 'rgba(0, 35, 75, 0.40)');
      shadowGrad.addColorStop(0.5, 'rgba(0, 150, 250, 0.14)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, R * 0.56 * shadowBroadness, R * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. 3D Extrusion Slicing
      const isFacingFront = cosAngle >= 0;

      // Slices sorted back-to-front in camera space
      const sliceIndices: number[] = [];
      for (let i = 0; i < numSlices; i++) {
        sliceIndices.push(i);
      }
      if (!isFacingFront) {
        sliceIndices.reverse();
      }

      // Directional lighting factor for edge rims
      const sideLightDot = sinAngle * 0.7 + 0.3;
      const rimShade = Math.max(0.4, Math.min(1.15, 0.65 + sideLightDot * 0.45));

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

        // Continuous smooth perspective X scale (clamp only near 0.0005 to prevent singular matrix or teleport jump)
        const rawScaleX = cosAngle * pixivScale;
        const safeScaleX = Math.abs(rawScaleX) < 0.0005 ? (rawScaleX < 0 ? -0.0005 : 0.0005) : rawScaleX;
        const scaleY = pixivScale * Math.cos(tiltX);

        ctx.scale(safeScaleX, scaleY);
        ctx.translate(-12, -12);

        if (isTopFace) {
          // --- FRONT CAP FACE ---
          if (isFacingFront) {
            // Pixiv Radiant Electric Blue Diagonal Gradient
            const blueGrad = ctx.createLinearGradient(
              2 + sinAngle * 4, 
              2, 
              22 - sinAngle * 4, 
              22
            );
            blueGrad.addColorStop(0.0, '#38afff'); // Bright azure highlight
            blueGrad.addColorStop(0.45, '#0096fa'); // Official Pixiv brand blue
            blueGrad.addColorStop(1.0, '#0072cb'); // Deep oceanic blue
            ctx.fillStyle = blueGrad;

            drawSquircle(ctx, 2, 2, 20, 20, 5.2);
            ctx.fill();

            // Beveled silver-white outer rim highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 0.55;
            ctx.stroke();

            // Inner subtle concentric border sheen
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 0.35;
            drawSquircle(ctx, 2.7, 2.7, 18.6, 18.6, 4.6);
            ctx.stroke();

            // --- DRAW CRISP WHITE "P" MONOGRAM ON TOP ---
            drawPixivPGlyph(ctx, false);

          } else {
            // --- BACK CAP FACE (When rotated 180°) ---
            const backBlueGrad = ctx.createLinearGradient(2, 2, 22, 22);
            backBlueGrad.addColorStop(0.0, '#1a8fed');
            backBlueGrad.addColorStop(0.5, '#007ecf');
            backBlueGrad.addColorStop(1.0, '#005ea8');
            ctx.fillStyle = backBlueGrad;

            drawSquircle(ctx, 2, 2, 20, 20, 5.2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 0.55;
            ctx.stroke();

            // Mirrored "p" on rear
            drawPixivPGlyph(ctx, true);
          }
        } else if (isBackFace) {
          // Bottom-most back cap
          ctx.fillStyle = '#004780';
          drawSquircle(ctx, 2, 2, 20, 20, 5.2);
          ctx.fill();
        } else {
          // Intermediate extrusion slices (physical 3D rim wall)
          const rimR = Math.round(0 * rimShade);
          const rimG = Math.round(120 * rimShade);
          const rimB = Math.round(210 * rimShade);
          ctx.fillStyle = `rgb(${rimR}, ${rimG}, ${rimB})`;

          drawSquircle(ctx, 2, 2, 20, 20, 5.2);
          ctx.fill();
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
      className={`inline-block select-none pointer-events-none drop-shadow-[0_4px_14px_rgba(0,150,250,0.28)] ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`
      }}
    />
  );
}
