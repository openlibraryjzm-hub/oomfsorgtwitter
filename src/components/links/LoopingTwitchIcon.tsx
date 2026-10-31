'use client';

import React, { useEffect, useRef } from 'react';

interface LoopingTwitchIconProps {
  className?: string;
  size?: number; // e.g. 48, 56, 64, 72
}

export default function LoopingTwitchIcon({
  className = '',
  size = 64
}: LoopingTwitchIconProps) {
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

    // Official Twitch Glitch Body Outline (24x24 viewBox, centered at 12, 12)
    const GLITCH_BODY = new Path2D(
      "M6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0H6z"
    );

    // Left and Right Eye Slits
    const LEFT_EYE = new Path2D(
      "M11.571 4.714h1.715v5.143H11.571z"
    );
    const RIGHT_EYE = new Path2D(
      "M16.286 4.714H18v5.143h-1.714z"
    );

    // Full Glitch path with eye cutouts
    const FULL_GLITCH = new Path2D();
    FULL_GLITCH.addPath(GLITCH_BODY);
    FULL_GLITCH.addPath(LEFT_EYE);
    FULL_GLITCH.addPath(RIGHT_EYE);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;
      const R = size * 0.42;

      // 1. Ambient Background Glow Disc (Twitch Purple Aura)
      const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.15);
      bgGrad.addColorStop(0, 'rgba(145, 70, 255, 0.18)');
      bgGrad.addColorStop(0.6, 'rgba(145, 70, 255, 0.05)');
      bgGrad.addColorStop(1, 'rgba(145, 70, 255, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Tilt & Rotation Trigonometry
      const tiltX = 0.22; // ~12.5 degrees forward perspective tilt
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Icon scale & extrusion thickness
      const glitchScale = (R * 1.28) / 24;
      const thickness = 7.2; // 3D depth in pixels
      const numSlices = 26; // Dense micro-extrusion

      // 3. Dynamic Floor Contact Shadow
      const shadowBroadness = 0.4 + 0.6 * Math.abs(cosAngle);
      const shadowY = cy + R * 0.72;
      const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, R * 0.58);
      shadowGrad.addColorStop(0, 'rgba(145, 70, 255, 0.32)');
      shadowGrad.addColorStop(0.5, 'rgba(145, 70, 255, 0.1)');
      shadowGrad.addColorStop(1, 'rgba(145, 70, 255, 0.0)');
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
        const rawScaleX = cosAngle * glitchScale;
        const signX = rawScaleX < 0 ? -1 : 1;
        const safeScaleX = Math.max(0.02, Math.abs(rawScaleX)) * signX;
        const scaleY = glitchScale * Math.cos(tiltX);

        ctx.scale(safeScaleX, scaleY);
        ctx.translate(-12, -12);

        if (isTopFace) {
          // --- FRONT CAP FACE ---
          if (isFacingFront) {
            // Radiant Twitch Purple with directional highlight
            const frontGrad = ctx.createLinearGradient(
              4 + sinAngle * 8, 
              2, 
              20 - sinAngle * 8, 
              22
            );
            frontGrad.addColorStop(0, '#a970ff'); // Highlight purple
            frontGrad.addColorStop(0.45, '#9146FF'); // Official Twitch Purple
            frontGrad.addColorStop(1, '#6b21a8'); // Shadow purple
            ctx.fillStyle = frontGrad;
            ctx.fill(FULL_GLITCH);

            // Front edge bevel highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 0.6;
            ctx.stroke(GLITCH_BODY);

            // Glowing White Vertical Eyes
            const eyeGlow = 0.88 + Math.sin(angle * 2) * 0.12;
            ctx.fillStyle = `rgba(255, 255, 255, ${eyeGlow})`;
            ctx.fill(LEFT_EYE);
            ctx.fill(RIGHT_EYE);

            // Subtle interior eye bevel
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 0.35;
            ctx.stroke(LEFT_EYE);
            ctx.stroke(RIGHT_EYE);
          } else {
            // Back Face (Mirrored 360° rear view with luminous eyes & mirrored tail)
            const backGrad = ctx.createLinearGradient(4, 2, 20, 22);
            backGrad.addColorStop(0, '#8534f5');
            backGrad.addColorStop(0.45, '#7022e0');
            backGrad.addColorStop(1, '#4c0f99');
            ctx.fillStyle = backGrad;
            ctx.fill(FULL_GLITCH);

            // Beveled contour line on rear plate
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 0.6;
            ctx.stroke(GLITCH_BODY);

            // Mirrored Glowing White Vertical Eyes
            const eyeGlow = 0.8 + Math.sin(angle * 2) * 0.12;
            ctx.fillStyle = `rgba(255, 255, 255, ${eyeGlow})`;
            ctx.fill(LEFT_EYE);
            ctx.fill(RIGHT_EYE);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 0.35;
            ctx.stroke(LEFT_EYE);
            ctx.stroke(RIGHT_EYE);
          }
        } else if (isBackFace) {
          // Bottom-most back shadow cap
          ctx.fillStyle = '#260543';
          ctx.fill(GLITCH_BODY);
        } else {
          // --- 3D EXTRUDED SIDE RIM WALLS ---
          // Directionally shaded deep purple
          const rimShade = Math.max(0.18, Math.min(0.9, 0.35 + sideLightDot * 0.45));
          const r = Math.round(55 + rimShade * 90);  // 55 to 145
          const g = Math.round(15 + rimShade * 55);  // 15 to 70
          const b = Math.round(100 + rimShade * 155); // 100 to 255

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fill(GLITCH_BODY);

          // Side wall stroke to guarantee seamless surface connectivity
          ctx.strokeStyle = `rgba(${r + 15}, ${g + 10}, ${b + 15}, 0.8)`;
          ctx.lineWidth = 1.1;
          ctx.stroke(GLITCH_BODY);
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
