'use client';

import React, { useEffect, useRef } from 'react';

interface LoopingXIconProps {
  className?: string;
  size?: number; // e.g. 48, 56, 64, 72
}

export default function LoopingXIcon({
  className = '',
  size = 64
}: LoopingXIconProps) {
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

    // Official 𝕏 Monogram Path (24x24 viewBox, centered at 12, 12)
    const X_PATH = new Path2D(
      "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
    );

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;
      const R = size * 0.42;

      // 1. Ambient Background Glow Disc (Sleek Slate/Dark Aura)
      const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.15);
      bgGrad.addColorStop(0, 'rgba(15, 20, 25, 0.14)');
      bgGrad.addColorStop(0.6, 'rgba(15, 20, 25, 0.04)');
      bgGrad.addColorStop(1, 'rgba(15, 20, 25, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Tilt & Rotation Trigonometry
      const tiltX = 0.23; // ~13 degrees forward perspective tilt
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Icon scale & extrusion thickness
      const xScale = (R * 1.25) / 24;
      const thickness = 7.0; // 3D depth in pixels
      const numSlices = 26; // Dense micro-extrusion

      // 3. Dynamic Floor Contact Shadow
      const shadowBroadness = 0.4 + 0.6 * Math.abs(cosAngle);
      const shadowY = cy + R * 0.72;
      const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, R * 0.58);
      shadowGrad.addColorStop(0, 'rgba(15, 20, 25, 0.35)');
      shadowGrad.addColorStop(0.5, 'rgba(15, 20, 25, 0.12)');
      shadowGrad.addColorStop(1, 'rgba(15, 20, 25, 0.0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, R * 0.54 * shadowBroadness, R * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. 3D Layer Extrusion Slicing
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
        const rawScaleX = cosAngle * xScale;
        const signX = rawScaleX < 0 ? -1 : 1;
        const safeScaleX = Math.max(0.02, Math.abs(rawScaleX)) * signX;
        const scaleY = xScale * Math.cos(tiltX);

        ctx.scale(safeScaleX, scaleY);
        ctx.translate(-12, -12);

        if (isTopFace) {
          // --- FRONT CAP FACE ---
          if (isFacingFront) {
            // Obsidian / Glossy Black Front Face with Chrome Specular Gleam
            const frontGrad = ctx.createLinearGradient(
              4 + sinAngle * 8, 
              2, 
              20 - sinAngle * 8, 
              22
            );
            frontGrad.addColorStop(0, '#2c3035'); // Specular rim
            frontGrad.addColorStop(0.35, '#0f1419'); // Obsidian black
            frontGrad.addColorStop(0.85, '#050709'); // Deep void black
            ctx.fillStyle = frontGrad;
            ctx.fill(X_PATH);

            // Chrome edge highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
            ctx.lineWidth = 0.6;
            ctx.stroke(X_PATH);

            // Specular Glint Streak on the diagonal stroke
            const glintX = 12 + Math.sin(angle * 1.5) * 6;
            const glintGrad = ctx.createLinearGradient(glintX - 3, 4, glintX + 3, 20);
            glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            glintGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.45)');
            glintGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.strokeStyle = glintGrad;
            ctx.lineWidth = 1.0;
            ctx.stroke(X_PATH);
          } else {
            // Back Face (Mirrored 360° rear view with metallic chrome sheen)
            const backGrad = ctx.createLinearGradient(4, 2, 20, 22);
            backGrad.addColorStop(0, '#262a2e');
            backGrad.addColorStop(0.4, '#14171a');
            backGrad.addColorStop(1, '#080a0c');
            ctx.fillStyle = backGrad;
            ctx.fill(X_PATH);

            // Mirrored chrome edge highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.lineWidth = 0.6;
            ctx.stroke(X_PATH);

            // Specular Glint Streak on rear diagonal stroke
            const glintX = 12 - Math.sin(angle * 1.5) * 6;
            const glintGrad = ctx.createLinearGradient(glintX - 3, 4, glintX + 3, 20);
            glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            glintGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
            glintGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.strokeStyle = glintGrad;
            ctx.lineWidth = 0.9;
            ctx.stroke(X_PATH);
          }
        } else if (isBackFace) {
          // Bottom-most back cap
          ctx.fillStyle = '#050709';
          ctx.fill(X_PATH);
        } else {
          // --- 3D EXTRUDED SIDE RIM WALLS ---
          // Gunmetal metallic gradient based on light normal
          const rimShade = Math.max(0.18, Math.min(0.88, 0.3 + sideLightDot * 0.5));
          const val = Math.round(25 + rimShade * 70); // 25 to 95 gunmetal grey
          
          ctx.fillStyle = `rgb(${val}, ${val + 4}, ${val + 8})`;
          ctx.fill(X_PATH);

          // Side wall stroke to ensure seamless connectivity
          ctx.strokeStyle = `rgba(${val + 15}, ${val + 18}, ${val + 25}, 0.8)`;
          ctx.lineWidth = 1.1;
          ctx.stroke(X_PATH);
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
