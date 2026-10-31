'use client';

import React, { useEffect, useRef } from 'react';

interface LoopingGitHubIconProps {
  className?: string;
  size?: number; // e.g. 48, 52, 64, 72
}

export default function LoopingGitHubIcon({
  className = '',
  size = 64
}: LoopingGitHubIconProps) {
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

    // Official GitHub Invertocat / Octocat Silhouette Path (24x24 viewBox, centered at 12, 12)
    const OCTOCAT_PATH = new Path2D(
      "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    );

    // Helper: Draw Octocat Mascot Emblem (Front & Mirrored Back)
    const drawOctocat = (
      c: CanvasRenderingContext2D, 
      isBack = false,
      sheenAngle = 0
    ) => {
      c.save();

      if (!isBack) {
        // --- 1. Drop shadow beneath raised Octocat ---
        c.save();
        c.translate(0.35, 0.45);
        c.fillStyle = 'rgba(0, 0, 0, 0.55)';
        c.fill(OCTOCAT_PATH);
        c.restore();

        // --- 2. Solid White/Silver Octocat Finish ---
        const octoGrad = c.createLinearGradient(
          4 + Math.sin(sheenAngle) * 8, 
          4, 
          20 - Math.sin(sheenAngle) * 8, 
          20
        );
        octoGrad.addColorStop(0, '#ffffff'); // Crisp White
        octoGrad.addColorStop(0.5, '#f0f6fc'); // GitHub White
        octoGrad.addColorStop(1, '#cbd5e1'); // Metallic Steel Shade
        c.fillStyle = octoGrad;
        c.fill(OCTOCAT_PATH);

        // Edge bevel highlight
        c.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        c.lineWidth = 0.4;
        c.stroke(OCTOCAT_PATH);

      } else {
        // --- Back Face (Mirrored 360° rear view with full Octocat silhouette) ---
        c.save();
        c.translate(-0.35, 0.45);
        c.fillStyle = 'rgba(0, 0, 0, 0.45)';
        c.fill(OCTOCAT_PATH);
        c.restore();

        // Rear face finish (slightly deeper silver/white)
        const backOctoGrad = c.createLinearGradient(4, 4, 20, 20);
        backOctoGrad.addColorStop(0, '#f8fafc');
        backOctoGrad.addColorStop(0.5, '#e2e8f0');
        backOctoGrad.addColorStop(1, '#94a3b8');
        c.fillStyle = backOctoGrad;
        c.fill(OCTOCAT_PATH);

        c.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        c.lineWidth = 0.4;
        c.stroke(OCTOCAT_PATH);
      }

      c.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;
      const R = size * 0.42;

      // 1. Ambient Background Glow Disc (GitHub Slate Aura)
      const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.15);
      bgGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      bgGrad.addColorStop(0.5, 'rgba(22, 27, 34, 0.06)');
      bgGrad.addColorStop(1, 'rgba(13, 17, 23, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Tilt & Rotation Geometry
      const tiltX = 0.22; // ~12.5 degrees forward perspective tilt
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Token dimensions & extrusion thickness
      const ghScale = (R * 1.28) / 24;
      const thickness = 7.2; // 3D depth in pixels
      const numSlices = 26; // Dense micro-extrusion

      // 3. Dynamic Floor Contact Shadow
      const shadowBroadness = 0.4 + 0.6 * Math.abs(cosAngle);
      const shadowY = cy + R * 0.72;
      const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, R * 0.58);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      shadowGrad.addColorStop(0.5, 'rgba(22, 27, 34, 0.15)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, R * 0.55 * shadowBroadness, R * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. 3D Layer Extrusion Slicing for the GitHub Token
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

        // Safe perspective X scale
        const rawScaleX = cosAngle * ghScale;
        const signX = rawScaleX < 0 ? -1 : 1;
        const safeScaleX = Math.max(0.02, Math.abs(rawScaleX)) * signX;
        const scaleY = ghScale * Math.cos(tiltX);

        ctx.scale(safeScaleX, scaleY);
        ctx.translate(-12, -12);

        if (isTopFace) {
          // --- FRONT CAP FACE ---
          if (isFacingFront) {
            // GitHub Dark Mode Slate/Obsidian Disc
            const coinGrad = ctx.createLinearGradient(
              2 + sinAngle * 8, 
              2, 
              22 - sinAngle * 8, 
              22
            );
            coinGrad.addColorStop(0, '#30363d'); // Gunmetal rim
            coinGrad.addColorStop(0.45, '#161b22'); // Official GitHub Dark
            coinGrad.addColorStop(1, '#0d1117'); // Void Charcoal
            ctx.fillStyle = coinGrad;
            ctx.beginPath();
            ctx.arc(12, 12, 12, 0, Math.PI * 2);
            ctx.fill();

            // Beveled silver outer rim highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 0.6;
            ctx.stroke();

            // Inner groove circle
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 0.35;
            ctx.beginPath();
            ctx.arc(12, 12, 11, 0, Math.PI * 2);
            ctx.stroke();

            // --- DRAW SOLID OCTOCAT ON TOP ---
            drawOctocat(ctx, false, angle);

          } else {
            // --- BACK CAP FACE (When rotated 180°) ---
            const backGrad = ctx.createLinearGradient(2, 2, 22, 22);
            backGrad.addColorStop(0, '#21262d');
            backGrad.addColorStop(0.5, '#161b22');
            backGrad.addColorStop(1, '#090d12');
            ctx.fillStyle = backGrad;
            ctx.beginPath();
            ctx.arc(12, 12, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 0.7;
            ctx.stroke();

            // Matching mirrored Octocat on back
            drawOctocat(ctx, true, angle);
          }
        } else if (isBackFace) {
          // Bottom-most back cap
          ctx.fillStyle = '#05070a';
          ctx.beginPath();
          ctx.arc(12, 12, 12, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // --- 3D EXTRUDED SIDE RIM WALLS (Intermediate Slices) ---
          // Directionally shaded industrial gunmetal
          const rimShade = Math.max(0.18, Math.min(0.9, 0.35 + sideLightDot * 0.45));
          const val = Math.round(20 + rimShade * 55); // 20 to 75

          ctx.fillStyle = `rgb(${val}, ${val + 4}, ${val + 8})`;
          ctx.beginPath();
          ctx.arc(12, 12, 12, 0, Math.PI * 2);
          ctx.fill();

          // Side wall stroke to guarantee seamless surface connectivity
          ctx.strokeStyle = `rgba(${val + 12}, ${val + 16}, ${val + 22}, 0.8)`;
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
