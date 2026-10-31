'use client';

import React, { useEffect, useRef } from 'react';

interface LoopingSubstackIconProps {
  className?: string;
  size?: number; // e.g. 48, 52, 64, 72
}

export default function LoopingSubstackIcon({
  className = '',
  size = 64
}: LoopingSubstackIconProps) {
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

    // Official Substack Triple-Bar Bookmark Vector Path (24x24 viewBox)
    const SUBSTACK_PATH = new Path2D(
      "M22.5 4.5H1.5V1.5h21v3zm0 7H1.5V8.5h21v3zm-21 7V24l10.5-6 10.5 6V18.5H1.5z"
    );

    // Helper: Draw Substack Enamel Crest (Solid White + Drop Shadow)
    const drawSubstackCrest = (
      c: CanvasRenderingContext2D,
      isBack = false,
      sheenAngle = 0
    ) => {
      c.save();

      // Center and scale crest to fit comfortably within the coin
      c.translate(12, 12.3);
      c.scale(0.68, 0.68);
      c.translate(-12, -12.75);

      const shadowOffsetX = isBack ? -0.4 : 0.4;
      const shadowOffsetY = 0.5;

      // 1. Drop shadow beneath raised enamel crest
      c.save();
      c.translate(shadowOffsetX, shadowOffsetY);
      c.fillStyle = 'rgba(0, 0, 0, 0.55)';
      c.fill(SUBSTACK_PATH);
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
        crestGrad.addColorStop(0.55, '#fff7ed');
        crestGrad.addColorStop(1, '#ffedd5');
      } else {
        crestGrad.addColorStop(0, '#f8fafc');
        crestGrad.addColorStop(0.55, '#f1f5f9');
        crestGrad.addColorStop(1, '#cbd5e1');
      }
      c.fillStyle = crestGrad;
      c.fill(SUBSTACK_PATH);

      // Fine bevel edge highlight
      c.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      c.lineWidth = 0.4;
      c.stroke(SUBSTACK_PATH);
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

      // 1. Ambient Background Glow Disc (Substack Orange Aura)
      const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.15);
      bgGrad.addColorStop(0, 'rgba(255, 103, 25, 0.18)');
      bgGrad.addColorStop(0.5, 'rgba(255, 103, 25, 0.05)');
      bgGrad.addColorStop(1, 'rgba(255, 103, 25, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Tilt & Rotation Geometry
      const tiltX = 0.22; // ~12.5 degrees forward perspective tilt
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Token dimensions & extrusion thickness
      const sbScale = (R * 1.28) / 24;
      const thickness = 7.2; // 3D depth in pixels
      const numSlices = 26; // Dense micro-extrusion

      // 3. Dynamic Floor Contact Shadow
      const shadowBroadness = 0.4 + 0.6 * Math.abs(cosAngle);
      const shadowY = cy + R * 0.72;
      const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, R * 0.58);
      shadowGrad.addColorStop(0, 'rgba(80, 20, 0, 0.40)');
      shadowGrad.addColorStop(0.5, 'rgba(255, 103, 25, 0.12)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, R * 0.55 * shadowBroadness, R * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. 3D Layer Extrusion Slicing for the Substack Token
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

        // Smooth perspective scaling (continuous through edge-on 90°)
        const rawScaleX = cosAngle * sbScale;
        const safeScaleX = Math.abs(rawScaleX) < 0.0005 ? (rawScaleX < 0 ? -0.0005 : 0.0005) : rawScaleX;
        const scaleY = sbScale * Math.cos(tiltX);

        ctx.scale(safeScaleX, scaleY);
        ctx.translate(-12, -12);

        if (isTopFace) {
          // --- FRONT CAP FACE ---
          if (isFacingFront) {
            // Substack Radiant Orange Finish
            const coinGrad = ctx.createLinearGradient(
              2 + sinAngle * 6,
              2,
              22 - sinAngle * 6,
              22
            );
            coinGrad.addColorStop(0, '#ff8738'); // Top highlight
            coinGrad.addColorStop(0.45, '#FF6719'); // Official Substack Orange
            coinGrad.addColorStop(1, '#cc4900'); // Shadow terracotta
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
            drawSubstackCrest(ctx, false, angle);

          } else {
            // --- BACK CAP FACE (When rotated 180°) ---
            const backGrad = ctx.createLinearGradient(2, 2, 22, 22);
            backGrad.addColorStop(0, '#f55d0f');
            backGrad.addColorStop(0.5, '#d94d00');
            backGrad.addColorStop(1, '#993300');
            ctx.fillStyle = backGrad;
            ctx.beginPath();
            ctx.arc(12, 12, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 0.55;
            ctx.stroke();

            // Matching mirrored crest on rear
            drawSubstackCrest(ctx, true, angle);
          }
        } else if (isBackFace) {
          // Bottom-most back cap
          ctx.fillStyle = '#4d1a00';
          ctx.beginPath();
          ctx.arc(12, 12, 12, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // --- 3D EXTRUDED SIDE RIM WALLS (Intermediate Slices) ---
          // Directionally shaded warm terracotta / burnt orange
          const rimShade = Math.max(0.18, Math.min(0.9, 0.35 + sideLightDot * 0.45));
          const r = Math.round(150 * rimShade + 35); // ~62 to 170
          const g = Math.round(45 * rimShade + 10);  // ~18 to 51
          const b = Math.round(5 * rimShade + 2);    // ~3 to 7

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.beginPath();
          ctx.arc(12, 12, 12, 0, Math.PI * 2);
          ctx.fill();

          // Side wall stroke to guarantee seamless surface connectivity
          ctx.strokeStyle = `rgba(${r + 15}, ${g + 8}, ${b + 6}, 0.8)`;
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
