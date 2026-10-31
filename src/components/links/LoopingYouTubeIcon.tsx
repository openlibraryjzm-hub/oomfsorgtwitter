'use client';

import React, { useEffect, useRef } from 'react';

interface LoopingYouTubeIconProps {
  className?: string;
  size?: number; // e.g. 48, 56, 64, 72
}

export default function LoopingYouTubeIcon({
  className = '',
  size = 64
}: LoopingYouTubeIconProps) {
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

    // Official YouTube Screen Body (24x24 viewBox, centered at 12, 12)
    const YT_BODY = new Path2D(
      "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
    );

    // Play Triangle (24x24 viewBox)
    const PLAY_TRIANGLE = new Path2D(
      "M9.545 15.568V8.432L15.818 12l-6.273 3.568z"
    );

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;
      const R = size * 0.42;

      // 1. Ambient Background Glow Disc (Subtle Crimson Aura)
      const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.15);
      bgGrad.addColorStop(0, 'rgba(255, 0, 0, 0.16)');
      bgGrad.addColorStop(0.6, 'rgba(255, 0, 0, 0.04)');
      bgGrad.addColorStop(1, 'rgba(255, 0, 0, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Tilt & Rotation Geometry
      const tiltX = 0.22; // ~12.5 degrees forward perspective tilt
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Dimensions & extrusion thickness
      const ytScale = (R * 1.30) / 24;
      const thickness = 7.2; // 3D depth in pixels
      const numSlices = 26; // Dense micro-extrusion

      // 3. Dynamic Floor Contact Shadow (contracts/expands in perspective)
      const shadowBroadness = 0.4 + 0.6 * Math.abs(cosAngle);
      const shadowY = cy + R * 0.72;
      const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, R * 0.58);
      shadowGrad.addColorStop(0, 'rgba(255, 0, 0, 0.32)');
      shadowGrad.addColorStop(0.5, 'rgba(255, 0, 0, 0.1)');
      shadowGrad.addColorStop(1, 'rgba(255, 0, 0, 0.0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, R * 0.55 * shadowBroadness, R * 0.15, 0, 0, Math.PI * 2);
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
        const rawScaleX = cosAngle * ytScale;
        const signX = rawScaleX < 0 ? -1 : 1;
        const safeScaleX = Math.max(0.02, Math.abs(rawScaleX)) * signX;
        const scaleY = ytScale * Math.cos(tiltX);

        ctx.scale(safeScaleX, scaleY);
        ctx.translate(-12, -12);

        if (isTopFace) {
          // --- FRONT CAP FACE ---
          if (isFacingFront) {
            // Radiant YouTube Red with glossy top highlight
            const frontGrad = ctx.createLinearGradient(
              4 + sinAngle * 8, 
              2, 
              20 - sinAngle * 8, 
              22
            );
            frontGrad.addColorStop(0, '#ff3b3b'); // Highlight red
            frontGrad.addColorStop(0.45, '#FF0000'); // Official YouTube Red
            frontGrad.addColorStop(1, '#c40000'); // Shadow crimson
            ctx.fillStyle = frontGrad;
            ctx.fill(YT_BODY);

            // Front edge bevel highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 0.6;
            ctx.stroke(YT_BODY);

            // Embossed White Play Triangle with depth
            // Inset drop shadow
            ctx.fillStyle = 'rgba(120, 0, 0, 0.35)';
            ctx.save();
            ctx.translate(0.3, 0.3);
            ctx.fill(PLAY_TRIANGLE);
            ctx.restore();

            // Crisp White Triangle
            ctx.fillStyle = '#ffffff';
            ctx.fill(PLAY_TRIANGLE);

            // Triangle edge sheen
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 0.4;
            ctx.stroke(PLAY_TRIANGLE);
          } else {
            // Back Face (Mirrored 360° rear view with left-pointing white play triangle)
            const backGrad = ctx.createLinearGradient(4, 2, 20, 22);
            backGrad.addColorStop(0, '#d10000');
            backGrad.addColorStop(0.45, '#b30000');
            backGrad.addColorStop(1, '#800000');
            ctx.fillStyle = backGrad;
            ctx.fill(YT_BODY);

            // Beveled contour lines on back
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 0.6;
            ctx.stroke(YT_BODY);

            // Inset drop shadow for rear triangle
            ctx.fillStyle = 'rgba(60, 0, 0, 0.4)';
            ctx.save();
            ctx.translate(-0.3, 0.3);
            ctx.fill(PLAY_TRIANGLE);
            ctx.restore();

            // Mirrored Crisp White Triangle (points left)
            ctx.fillStyle = '#f8fafc';
            ctx.fill(PLAY_TRIANGLE);

            // Triangle edge sheen
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 0.4;
            ctx.stroke(PLAY_TRIANGLE);
          }
        } else if (isBackFace) {
          // Bottom-most back shadow cap
          ctx.fillStyle = '#550000';
          ctx.fill(YT_BODY);
        } else {
          // --- 3D EXTRUDED SIDE RIM WALLS ---
          // Directionally shaded deep crimson
          const rimShade = Math.max(0.18, Math.min(0.9, 0.35 + sideLightDot * 0.45));
          const r = Math.round(90 + rimShade * 140); // 90 to 230 red
          const g = Math.round(rimShade * 25);
          const b = Math.round(rimShade * 25);

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fill(YT_BODY);

          // Side wall stroke to guarantee seamless surface connectivity
          ctx.strokeStyle = `rgba(${r + 15}, ${g + 5}, ${b + 5}, 0.8)`;
          ctx.lineWidth = 1.1;
          ctx.stroke(YT_BODY);
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
