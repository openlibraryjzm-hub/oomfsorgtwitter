'use client';

import React, { useEffect, useRef } from 'react';

interface LoopingInstagramIconProps {
  className?: string;
  size?: number; // e.g. 48, 52, 64, 72
}

export default function LoopingInstagramIcon({
  className = '',
  size = 64
}: LoopingInstagramIconProps) {
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

    // Helper: Draw Instagram Camera Glyph (Outer Squircle + Center Lens + Flash Dot)
    const drawCameraGlyph = (
      c: CanvasRenderingContext2D,
      isBack = false
    ) => {
      c.save();

      const shadowOffsetX = isBack ? -0.35 : 0.35;
      const shadowOffsetY = 0.45;

      // --- 1. Drop shadow beneath the raised white enamel glyph ---
      c.save();
      c.translate(shadowOffsetX, shadowOffsetY);
      c.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      c.fillStyle = 'rgba(0, 0, 0, 0.45)';
      c.lineWidth = 1.35;

      // Shadow: Camera outer squircle
      drawSquircle(c, 5.5, 5.5, 13, 13, 3.6);
      c.stroke();

      // Shadow: Center lens circle
      c.beginPath();
      c.arc(12, 12, 3.3, 0, Math.PI * 2);
      c.stroke();

      // Shadow: Flash sensor dot
      c.beginPath();
      c.arc(15.5, 8.5, 0.85, 0, Math.PI * 2);
      c.fill();
      c.restore();

      // --- 2. Foreground Crisp White Enamel Camera Glyph ---
      c.strokeStyle = isBack ? '#f1f5f9' : '#ffffff';
      c.fillStyle = isBack ? '#f1f5f9' : '#ffffff';
      c.lineWidth = 1.35;

      // Camera outer squircle
      drawSquircle(c, 5.5, 5.5, 13, 13, 3.6);
      c.stroke();

      // Center lens ring
      c.beginPath();
      c.arc(12, 12, 3.3, 0, Math.PI * 2);
      c.stroke();

      // Flash sensor dot
      c.beginPath();
      c.arc(15.5, 8.5, 0.85, 0, Math.PI * 2);
      c.fill();

      c.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;
      const R = size * 0.42;

      // 1. Ambient Background Glow Disc (Instagram Sunset Aura)
      const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.15);
      bgGrad.addColorStop(0, 'rgba(225, 48, 108, 0.18)');
      bgGrad.addColorStop(0.5, 'rgba(253, 29, 29, 0.06)');
      bgGrad.addColorStop(1, 'rgba(131, 58, 180, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Tilt & Rotation Geometry
      const tiltX = 0.22; // ~12.5 degrees forward perspective tilt
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Token dimensions & extrusion thickness
      const igScale = (R * 1.28) / 24;
      const thickness = 7.2; // 3D depth in pixels
      const numSlices = 26; // Dense micro-extrusion

      // 3. Dynamic Floor Contact Shadow
      const shadowBroadness = 0.4 + 0.6 * Math.abs(cosAngle);
      const shadowY = cy + R * 0.72;
      const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, R * 0.58);
      shadowGrad.addColorStop(0, 'rgba(70, 10, 40, 0.38)');
      shadowGrad.addColorStop(0.5, 'rgba(225, 48, 108, 0.12)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, R * 0.55 * shadowBroadness, R * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. 3D Layer Extrusion Slicing for the Instagram Squircle Token
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
        const rawScaleX = cosAngle * igScale;
        const signX = rawScaleX < 0 ? -1 : 1;
        const safeScaleX = Math.max(0.02, Math.abs(rawScaleX)) * signX;
        const scaleY = igScale * Math.cos(tiltX);

        ctx.scale(safeScaleX, scaleY);
        ctx.translate(-12, -12);

        if (isTopFace) {
          // --- FRONT CAP FACE ---
          if (isFacingFront) {
            // Instagram Iconic Sunset Diagonal Gradient
            const sunsetGrad = ctx.createLinearGradient(
              2 + sinAngle * 4, 
              22, 
              22 - sinAngle * 4, 
              2
            );
            sunsetGrad.addColorStop(0.0, '#feda75'); // Sunrise gold
            sunsetGrad.addColorStop(0.2, '#fa7e1e'); // Tangerine orange
            sunsetGrad.addColorStop(0.48, '#d62976'); // Magenta red
            sunsetGrad.addColorStop(0.78, '#962fbf'); // Royal purple
            sunsetGrad.addColorStop(1.0, '#4f5bd5'); // Deep blue
            ctx.fillStyle = sunsetGrad;

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

            // --- DRAW SOLID CAMERA GLYPH ON TOP ---
            drawCameraGlyph(ctx, false);

          } else {
            // --- BACK CAP FACE (When rotated 180°) ---
            const backSunsetGrad = ctx.createLinearGradient(2, 22, 22, 2);
            backSunsetGrad.addColorStop(0.0, '#e8c665');
            backSunsetGrad.addColorStop(0.2, '#e06e12');
            backSunsetGrad.addColorStop(0.48, '#bf1e64');
            backSunsetGrad.addColorStop(0.78, '#8224a8');
            backSunsetGrad.addColorStop(1.0, '#404bb8');
            ctx.fillStyle = backSunsetGrad;

            drawSquircle(ctx, 2, 2, 20, 20, 5.2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 0.55;
            ctx.stroke();

            // Matching mirrored camera glyph on rear
            drawCameraGlyph(ctx, true);
          }
        } else if (isBackFace) {
          // Bottom-most back cap
          ctx.fillStyle = '#2b0933';
          drawSquircle(ctx, 2, 2, 20, 20, 5.2);
          ctx.fill();
        } else {
          // --- 3D EXTRUDED SIDE RIM WALLS (Intermediate Slices) ---
          // Directionally shaded sunset berry metallic
          const rimShade = Math.max(0.18, Math.min(0.9, 0.35 + sideLightDot * 0.45));
          const r = Math.round(110 * rimShade + 25); // ~45 to 124
          const g = Math.round(22 * rimShade + 8);   // ~12 to 28
          const b = Math.round(75 * rimShade + 20);  // ~33 to 87

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          drawSquircle(ctx, 2, 2, 20, 20, 5.2);
          ctx.fill();

          // Side wall stroke to guarantee seamless surface connectivity
          ctx.strokeStyle = `rgba(${r + 15}, ${g + 8}, ${b + 12}, 0.8)`;
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
