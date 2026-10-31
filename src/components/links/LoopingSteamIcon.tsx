'use client';

import React, { useEffect, useRef } from 'react';

interface LoopingSteamIconProps {
  className?: string;
  size?: number; // e.g. 48, 56, 64, 72
}

export default function LoopingSteamIcon({
  className = '',
  size = 64
}: LoopingSteamIconProps) {
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

    // Helper: Draw the SOLID 3D Machine Mechanism (Crank Wheel, Arm, Piston Joint, and Hubs)
    const drawSolidMachine = (
      c: CanvasRenderingContext2D, 
      isBack = false,
      sheenAngle = 0
    ) => {
      c.save();

      if (!isBack) {
        // --- 1. Drop shadow beneath the raised 3D mechanical linkage ---
        c.save();
        c.translate(0.35, 0.45);
        c.fillStyle = 'rgba(10, 15, 20, 0.55)';

        // Large Wheel Shadow
        c.beginPath();
        c.arc(15.94, 9.98, 4.6, 0, Math.PI * 2);
        c.fill();

        // Small Pivot Shadow
        c.beginPath();
        c.arc(7.54, 17.45, 2.8, 0, Math.PI * 2);
        c.fill();

        // Connecting Arm Shadow
        c.beginPath();
        c.moveTo(7.54 - 1.15, 17.45 - 1.3);
        c.lineTo(15.94 - 1.15, 9.98 - 1.3);
        c.lineTo(15.94 + 1.15, 9.98 + 1.3);
        c.lineTo(7.54 + 1.15, 17.45 + 1.3);
        c.closePath();
        c.fill();

        // Piston Shaft Shadow
        c.beginPath();
        c.moveTo(7.54 + 0.45, 17.45 - 1.25);
        c.lineTo(0.5 + 0.45, 14.8 - 1.25);
        c.lineTo(0.5 - 0.45, 14.8 + 1.25);
        c.lineTo(7.54 - 0.45, 17.45 + 1.25);
        c.closePath();
        c.fill();
        c.restore();

        // --- 2. Solid Brushed Metallic Finish for Front Face ---
        const metalGrad = c.createLinearGradient(
          4 + Math.sin(sheenAngle) * 8, 
          4, 
          20 - Math.sin(sheenAngle) * 8, 
          20
        );
        metalGrad.addColorStop(0, '#ffffff'); // Polished silver highlight
        metalGrad.addColorStop(0.35, '#e2e8f0'); // Crisp titanium
        metalGrad.addColorStop(0.7, '#cbd5e1'); // Industrial steel
        metalGrad.addColorStop(1, '#94a3b8'); // Deep metallic shade
        c.fillStyle = metalGrad;

        // Large Wheel Solid Body
        c.beginPath();
        c.arc(15.94, 9.98, 4.6, 0, Math.PI * 2);
        c.fill();

        // Small Pivot Solid Body
        c.beginPath();
        c.arc(7.54, 17.45, 2.8, 0, Math.PI * 2);
        c.fill();

        // Connecting Arm Solid Body
        c.beginPath();
        c.moveTo(7.54 - 1.15, 17.45 - 1.3);
        c.lineTo(15.94 - 1.15, 9.98 - 1.3);
        c.lineTo(15.94 + 1.15, 9.98 + 1.3);
        c.lineTo(7.54 + 1.15, 17.45 + 1.3);
        c.closePath();
        c.fill();

        // Piston Shaft Solid Body
        c.beginPath();
        c.moveTo(7.54 + 0.45, 17.45 - 1.25);
        c.lineTo(0.5 + 0.45, 14.8 - 1.25);
        c.lineTo(0.5 - 0.45, 14.8 + 1.25);
        c.lineTo(7.54 - 0.45, 17.45 + 1.25);
        c.closePath();
        c.fill();

        // Beveled metallic edges
        c.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        c.lineWidth = 0.45;

        c.beginPath();
        c.arc(15.94, 9.98, 4.6, 0, Math.PI * 2);
        c.stroke();

        c.beginPath();
        c.arc(7.54, 17.45, 2.8, 0, Math.PI * 2);
        c.stroke();

        c.beginPath();
        c.moveTo(7.54 - 1.15, 17.45 - 1.3);
        c.lineTo(15.94 - 1.15, 9.98 - 1.3);
        c.moveTo(15.94 + 1.15, 9.98 + 1.3);
        c.lineTo(7.54 + 1.15, 17.45 + 1.3);
        c.stroke();

        // --- 3. Recessed Socket Hubs & Glowing Cyan Pivot Pins ---
        // Dark recessed bearing sockets
        c.fillStyle = '#0f1419';
        c.beginPath();
        c.arc(15.94, 9.98, 1.6, 0, Math.PI * 2);
        c.arc(7.54, 17.45, 0.85, 0, Math.PI * 2);
        c.fill();

        // Sockets inner stroke
        c.strokeStyle = 'rgba(102, 192, 244, 0.6)';
        c.lineWidth = 0.35;
        c.stroke();

        // Luminous Cyan Center Pins
        const pinGlow = 0.85 + Math.sin(sheenAngle * 2) * 0.15;
        c.fillStyle = `rgba(102, 192, 244, ${pinGlow})`;
        c.beginPath();
        c.arc(15.94, 9.98, 0.8, 0, Math.PI * 2);
        c.arc(7.54, 17.45, 0.42, 0, Math.PI * 2);
        c.fill();
      } else {
        // --- Back Face (Mirrored 360° rear view with solid silver linkage & cyan pins) ---
        c.save();
        c.translate(-0.35, 0.45);
        c.fillStyle = 'rgba(10, 15, 20, 0.45)';

        c.beginPath();
        c.arc(15.94, 9.98, 4.6, 0, Math.PI * 2);
        c.fill();

        c.beginPath();
        c.arc(7.54, 17.45, 2.8, 0, Math.PI * 2);
        c.fill();

        c.beginPath();
        c.moveTo(7.54 - 1.15, 17.45 - 1.3);
        c.lineTo(15.94 - 1.15, 9.98 - 1.3);
        c.lineTo(15.94 + 1.15, 9.98 + 1.3);
        c.lineTo(7.54 + 1.15, 17.45 + 1.3);
        c.closePath();
        c.fill();
        c.restore();

        // Solid Silver/Titanium Rear Finish
        const backMetalGrad = c.createLinearGradient(4, 4, 20, 20);
        backMetalGrad.addColorStop(0, '#f1f5f9');
        backMetalGrad.addColorStop(0.5, '#cbd5e1');
        backMetalGrad.addColorStop(1, '#64748b');
        c.fillStyle = backMetalGrad;

        c.beginPath();
        c.arc(15.94, 9.98, 4.6, 0, Math.PI * 2);
        c.fill();

        c.beginPath();
        c.arc(7.54, 17.45, 2.8, 0, Math.PI * 2);
        c.fill();

        c.beginPath();
        c.moveTo(7.54 - 1.15, 17.45 - 1.3);
        c.lineTo(15.94 - 1.15, 9.98 - 1.3);
        c.lineTo(15.94 + 1.15, 9.98 + 1.3);
        c.lineTo(7.54 + 1.15, 17.45 + 1.3);
        c.closePath();
        c.fill();

        // Piston Shaft
        c.beginPath();
        c.moveTo(7.54 + 0.45, 17.45 - 1.25);
        c.lineTo(0.5 + 0.45, 14.8 - 1.25);
        c.lineTo(0.5 - 0.45, 14.8 + 1.25);
        c.lineTo(7.54 - 0.45, 17.45 + 1.25);
        c.closePath();
        c.fill();

        c.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        c.lineWidth = 0.45;
        c.stroke();

        // Bearing socket hubs on back
        c.fillStyle = '#0f1419';
        c.beginPath();
        c.arc(15.94, 9.98, 1.6, 0, Math.PI * 2);
        c.arc(7.54, 17.45, 0.85, 0, Math.PI * 2);
        c.fill();

        // Glowing Cyan Pins
        const pinGlow = 0.8 + Math.sin(sheenAngle * 2) * 0.15;
        c.fillStyle = `rgba(102, 192, 244, ${pinGlow})`;
        c.beginPath();
        c.arc(15.94, 9.98, 0.8, 0, Math.PI * 2);
        c.arc(7.54, 17.45, 0.42, 0, Math.PI * 2);
        c.fill();
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

      // 1. Ambient Background Glow Disc (Steam Cyan Glow)
      const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.15);
      bgGrad.addColorStop(0, 'rgba(102, 192, 244, 0.16)');
      bgGrad.addColorStop(0.6, 'rgba(27, 40, 56, 0.05)');
      bgGrad.addColorStop(1, 'rgba(27, 40, 56, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Tilt & Rotation Geometry
      const tiltX = 0.22; // ~12.5 degrees forward perspective tilt
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Medallion dimensions & extrusion thickness
      const steamScale = (R * 1.28) / 24;
      const thickness = 7.2; // 3D depth in pixels
      const numSlices = 26; // Dense micro-extrusion

      // 3. Dynamic Floor Contact Shadow
      const shadowBroadness = 0.4 + 0.6 * Math.abs(cosAngle);
      const shadowY = cy + R * 0.72;
      const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, R * 0.58);
      shadowGrad.addColorStop(0, 'rgba(23, 26, 33, 0.35)');
      shadowGrad.addColorStop(0.5, 'rgba(102, 192, 244, 0.1)');
      shadowGrad.addColorStop(1, 'rgba(23, 26, 33, 0.0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, R * 0.55 * shadowBroadness, R * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. 3D Layer Extrusion Slicing for the Medallion Token
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
        const rawScaleX = cosAngle * steamScale;
        const signX = rawScaleX < 0 ? -1 : 1;
        const safeScaleX = Math.max(0.02, Math.abs(rawScaleX)) * signX;
        const scaleY = steamScale * Math.cos(tiltX);

        ctx.scale(safeScaleX, scaleY);
        ctx.translate(-12, -12);

        if (isTopFace) {
          // --- FRONT CAP FACE ---
          if (isFacingFront) {
            // Steam Industrial Midnight Blue Disc
            const coinGrad = ctx.createLinearGradient(
              2, 
              2, 
              22, 
              22
            );
            coinGrad.addColorStop(0, '#2a475e'); // Steam Slate Blue
            coinGrad.addColorStop(0.4, '#1b2838'); // Deep Navy
            coinGrad.addColorStop(1, '#171a21'); // Void Black
            ctx.fillStyle = coinGrad;
            ctx.beginPath();
            ctx.arc(12, 12, 12, 0, Math.PI * 2);
            ctx.fill();

            // Beveled silver-cyan outer edge ring
            ctx.strokeStyle = 'rgba(102, 192, 244, 0.45)';
            ctx.lineWidth = 0.6;
            ctx.stroke();

            // Inner groove ring
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.arc(12, 12, 11, 0, Math.PI * 2);
            ctx.stroke();

            // --- DRAW THE SOLID 3D MECHANICAL LINKAGE ON TOP ---
            drawSolidMachine(ctx, false, angle);

          } else {
            // --- BACK CAP FACE (When rotated 180°) ---
            const backGrad = ctx.createLinearGradient(2, 2, 22, 22);
            backGrad.addColorStop(0, '#1f3547');
            backGrad.addColorStop(0.5, '#15202d');
            backGrad.addColorStop(1, '#0e1217');
            ctx.fillStyle = backGrad;
            ctx.beginPath();
            ctx.arc(12, 12, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(102, 192, 244, 0.35)';
            ctx.lineWidth = 0.7;
            ctx.stroke();

            // Matching embossed machine relief on back
            drawSolidMachine(ctx, true, angle);
          }
        } else if (isBackFace) {
          // Bottom-most back cap
          ctx.fillStyle = '#0a0d10';
          ctx.beginPath();
          ctx.arc(12, 12, 12, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // --- 3D EXTRUDED SIDE RIM WALLS (Intermediate Slices) ---
          // Directionally shaded industrial gunmetal/slate blue
          const rimShade = Math.max(0.18, Math.min(0.9, 0.35 + sideLightDot * 0.45));
          const r = Math.round(20 + rimShade * 35); // 20 to 55
          const g = Math.round(30 + rimShade * 55); // 30 to 85
          const b = Math.round(45 + rimShade * 85); // 45 to 130

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.beginPath();
          ctx.arc(12, 12, 12, 0, Math.PI * 2);
          ctx.fill();

          // Side wall stroke to guarantee seamless surface connectivity
          ctx.strokeStyle = `rgba(${r + 15}, ${g + 18}, ${b + 25}, 0.8)`;
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
