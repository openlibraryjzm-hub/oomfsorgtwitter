'use client';

import React, { useEffect, useRef } from 'react';

interface LoopingRedditIconProps {
  className?: string;
  size?: number; // e.g. 48, 56, 64, 72
}

export default function LoopingRedditIcon({
  className = '',
  size = 64
}: LoopingRedditIconProps) {
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

    // Snoo Mascot Paths (24x24 viewBox, centered at 12, 12)
    // 1. Snoo Head, Ears & Antenna Solid Silhouette
    const SNOO_BODY = new Path2D(
      "M17.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z"
    );

    // 2. Left Eye
    const LEFT_EYE = new Path2D(
      "M9.25 12C8.56 12 8 12.56 8 13.25c0 .69.56 1.25 1.25 1.25.69 0 1.25-.56 1.25-1.25C10.5 12.56 9.94 12 9.25 12z"
    );

    // 3. Right Eye
    const RIGHT_EYE = new Path2D(
      "M14.75 12c-.69 0-1.25.56-1.25 1.25 0 .69.56 1.25 1.25 1.25.69 0 1.25-.56 1.25-1.25 0-.69-.56-1.25-1.25-1.25z"
    );

    // 4. Cheerful Smile
    const SNOO_SMILE = new Path2D(
      "M9.284 15.99a.327.327 0 0 0-.231.096.327.327 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"
    );

    // Helper: Draw Snoo Mascot Features
    const drawSnoo = (
      c: CanvasRenderingContext2D, 
      isBack = false,
      sheenAngle = 0
    ) => {
      c.save();

      if (!isBack) {
        // --- 1. Drop shadow beneath raised Snoo ---
        c.save();
        c.translate(0.35, 0.45);
        c.fillStyle = 'rgba(100, 20, 0, 0.4)';
        c.fill(SNOO_BODY);
        c.restore();

        // --- 2. Solid White Enamel Snoo Body ---
        const snooGrad = c.createLinearGradient(
          4 + Math.sin(sheenAngle) * 8, 
          4, 
          20 - Math.sin(sheenAngle) * 8, 
          20
        );
        snooGrad.addColorStop(0, '#ffffff');
        snooGrad.addColorStop(0.6, '#f1f5f9');
        snooGrad.addColorStop(1, '#e2e8f0');
        c.fillStyle = snooGrad;
        c.fill(SNOO_BODY);

        // Edge bevel highlight
        c.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        c.lineWidth = 0.4;
        c.stroke(SNOO_BODY);

        // --- 3. Luminous Orange-Red Eyes ---
        const eyeGlow = 0.88 + Math.sin(sheenAngle * 2) * 0.12;
        c.fillStyle = `rgba(255, 69, 0, ${eyeGlow})`;
        c.fill(LEFT_EYE);
        c.fill(RIGHT_EYE);

        // Eye bevel reflection
        c.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        c.lineWidth = 0.25;
        c.stroke(LEFT_EYE);
        c.stroke(RIGHT_EYE);

        // --- 4. Cheerful Smile ---
        c.fillStyle = '#451000';
        c.fill(SNOO_SMILE);

      } else {
        // --- Back Face (Mirrored 360° rear view with solid white Snoo & glowing eyes) ---
        c.save();
        c.translate(-0.35, 0.45);
        c.fillStyle = 'rgba(80, 15, 0, 0.4)';
        c.fill(SNOO_BODY);
        c.restore();

        // Solid White Enamel Snoo Body (Mirrored rear)
        const snooGrad = c.createLinearGradient(4, 4, 20, 20);
        snooGrad.addColorStop(0, '#f8fafc');
        snooGrad.addColorStop(0.6, '#e2e8f0');
        snooGrad.addColorStop(1, '#cbd5e1');
        c.fillStyle = snooGrad;
        c.fill(SNOO_BODY);

        // Edge bevel highlight
        c.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        c.lineWidth = 0.4;
        c.stroke(SNOO_BODY);

        // Mirrored Luminous Orange-Red Eyes
        const eyeGlow = 0.8 + Math.sin(sheenAngle * 2) * 0.12;
        c.fillStyle = `rgba(255, 69, 0, ${eyeGlow})`;
        c.fill(LEFT_EYE);
        c.fill(RIGHT_EYE);

        c.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        c.lineWidth = 0.25;
        c.stroke(LEFT_EYE);
        c.stroke(RIGHT_EYE);

        // Cheerful Smile
        c.fillStyle = '#451000';
        c.fill(SNOO_SMILE);
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

      // 1. Ambient Background Glow Disc (Reddit Orange Aura)
      const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.15);
      bgGrad.addColorStop(0, 'rgba(255, 69, 0, 0.18)');
      bgGrad.addColorStop(0.6, 'rgba(255, 69, 0, 0.05)');
      bgGrad.addColorStop(1, 'rgba(255, 69, 0, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Tilt & Rotation Geometry
      const tiltX = 0.22; // ~12.5 degrees forward perspective tilt
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Token dimensions & extrusion thickness
      const redditScale = (R * 1.28) / 24;
      const thickness = 7.2; // 3D depth in pixels
      const numSlices = 26; // Dense micro-extrusion

      // 3. Dynamic Floor Contact Shadow
      const shadowBroadness = 0.4 + 0.6 * Math.abs(cosAngle);
      const shadowY = cy + R * 0.72;
      const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, R * 0.58);
      shadowGrad.addColorStop(0, 'rgba(100, 25, 0, 0.35)');
      shadowGrad.addColorStop(0.5, 'rgba(255, 69, 0, 0.1)');
      shadowGrad.addColorStop(1, 'rgba(255, 69, 0, 0.0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, R * 0.55 * shadowBroadness, R * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. 3D Layer Extrusion Slicing for the Reddit Token
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
        const rawScaleX = cosAngle * redditScale;
        const signX = rawScaleX < 0 ? -1 : 1;
        const safeScaleX = Math.max(0.02, Math.abs(rawScaleX)) * signX;
        const scaleY = redditScale * Math.cos(tiltX);

        ctx.scale(safeScaleX, scaleY);
        ctx.translate(-12, -12);

        if (isTopFace) {
          // --- FRONT CAP FACE ---
          if (isFacingFront) {
            // Radiant Reddit Orange-Red with directional highlight
            const coinGrad = ctx.createLinearGradient(
              2 + sinAngle * 8, 
              2, 
              22 - sinAngle * 8, 
              22
            );
            coinGrad.addColorStop(0, '#ff6a2b'); // Highlight orange
            coinGrad.addColorStop(0.45, '#FF4500'); // Official Reddit Orange-Red
            coinGrad.addColorStop(1, '#c72e00'); // Deep burnt orange shade
            ctx.fillStyle = coinGrad;
            ctx.beginPath();
            ctx.arc(12, 12, 12, 0, Math.PI * 2);
            ctx.fill();

            // Beveled silver-orange outer rim highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 0.6;
            ctx.stroke();

            // Inner groove circle
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 0.35;
            ctx.beginPath();
            ctx.arc(12, 12, 11, 0, Math.PI * 2);
            ctx.stroke();

            // --- DRAW SOLID SNOO MASCOT ON TOP ---
            drawSnoo(ctx, false, angle);

          } else {
            // --- BACK CAP FACE (When rotated 180°) ---
            const backGrad = ctx.createLinearGradient(2, 2, 22, 22);
            backGrad.addColorStop(0, '#c72e00');
            backGrad.addColorStop(0.5, '#992200');
            backGrad.addColorStop(1, '#661500');
            ctx.fillStyle = backGrad;
            ctx.beginPath();
            ctx.arc(12, 12, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 69, 0, 0.45)';
            ctx.lineWidth = 0.7;
            ctx.stroke();

            // Matching embossed Snoo relief on back
            drawSnoo(ctx, true, angle);
          }
        } else if (isBackFace) {
          // Bottom-most back cap
          ctx.fillStyle = '#400c00';
          ctx.beginPath();
          ctx.arc(12, 12, 12, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // --- 3D EXTRUDED SIDE RIM WALLS (Intermediate Slices) ---
          // Directionally shaded deep burnt orange
          const rimShade = Math.max(0.18, Math.min(0.9, 0.35 + sideLightDot * 0.45));
          const r = Math.round(110 + rimShade * 145); // 110 to 255
          const g = Math.round(25 + rimShade * 75);  // 25 to 100
          const b = Math.round(rimShade * 15);

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.beginPath();
          ctx.arc(12, 12, 12, 0, Math.PI * 2);
          ctx.fill();

          // Side wall stroke to guarantee seamless surface connectivity
          ctx.strokeStyle = `rgba(${r + 15}, ${g + 10}, ${b + 10}, 0.8)`;
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
