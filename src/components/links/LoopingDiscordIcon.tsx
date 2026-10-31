'use client';

import React, { useEffect, useRef } from 'react';

interface LoopingDiscordIconProps {
  className?: string;
  size?: number; // e.g. 48, 56, 64, 72
}

export default function LoopingDiscordIcon({
  className = '',
  size = 64
}: LoopingDiscordIconProps) {
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

    // Official Discord Clyde Mascot SVG Path (in 24x24 viewBox, centered at 12, 12)
    const CLYDE_OUTLINE = new Path2D(
      "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z"
    );

    // Left and Right eye paths in 24x24 coordinates
    const LEFT_EYE = new Path2D(
      "M8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418z"
    );
    const RIGHT_EYE = new Path2D(
      "M15.995 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
    );

    // Combined full path with cutouts
    const FULL_CLYDE = new Path2D(
      "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
    );

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;
      const R = size * 0.42;

      // 1. Ambient Background Glow Disc
      const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.15);
      bgGrad.addColorStop(0, 'rgba(88, 101, 242, 0.16)');
      bgGrad.addColorStop(0.6, 'rgba(88, 101, 242, 0.05)');
      bgGrad.addColorStop(1, 'rgba(88, 101, 242, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Tilt & Rotation Geometry
      // Fixed forward perspective tilt so top/edge rim is always visible
      const tiltX = 0.22; // ~12.5 degrees forward tilt
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Clyde mascot dimensions
      const clydeScale = (R * 1.28) / 24;
      const thickness = 7.5; // Depth thickness of the 3D figurine in pixels
      const numSlices = 26; // High density for seamless solid 3D mass

      // 3. Dynamic Floor Contact Shadow
      // Shadow responds to rotation angle (wider when broadside, narrower when edge-on)
      const shadowBroadness = 0.4 + 0.6 * Math.abs(cosAngle);
      const shadowY = cy + R * 0.72;
      const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, R * 0.58);
      shadowGrad.addColorStop(0, 'rgba(88, 101, 242, 0.32)');
      shadowGrad.addColorStop(0.5, 'rgba(88, 101, 242, 0.12)');
      shadowGrad.addColorStop(1, 'rgba(88, 101, 242, 0.0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, R * 0.55 * shadowBroadness, R * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. 3D Layer Extrusion Slicing
      // We slice from back to front along the local Z axis [-thickness/2, +thickness/2]
      // Depth sorting: if cosAngle >= 0, back layer is -T/2 and front is +T/2.
      // If cosAngle < 0, back layer is +T/2 and front is -T/2.
      const isFacingFront = cosAngle >= 0;
      
      // Determine array of Z positions sorted back-to-front in camera space
      const sliceIndices: number[] = [];
      for (let i = 0; i < numSlices; i++) {
        sliceIndices.push(i);
      }
      if (!isFacingFront) {
        sliceIndices.reverse();
      }

      // Lighting directional vector: Top-Right-Front (dx=0.5, dy=-0.6, dz=0.6)
      // When Clyde turns, the side facing the light gets a metallic/gloss highlight
      const sideLightDot = sinAngle * 0.7 + 0.3; // Light intensity on edges

      // Draw each extruded slice
      for (let idx = 0; idx < sliceIndices.length; idx++) {
        const i = sliceIndices[idx];
        const isBackFace = (idx === 0);
        const isTopFace = (idx === sliceIndices.length - 1);

        // Normalized depth from -0.5 to +0.5
        const normZ = (i / (numSlices - 1)) - 0.5;
        const localZ = normZ * thickness;

        // Project local (0, 0, localZ) to screen coordinates under (tiltX, angle)
        const offsetX = localZ * sinAngle;
        const offsetY = -localZ * cosAngle * Math.sin(tiltX) - 1.5; // slight vertical elevation

        ctx.save();
        ctx.translate(cx + offsetX, cy + offsetY);

        // Horizontal perspective scaling for 360° spin
        // To prevent degenerate zero scale at exact 90°/270°, clamp absolute scale to 0.02
        const rawScaleX = cosAngle * clydeScale;
        const signX = rawScaleX < 0 ? -1 : 1;
        const safeScaleX = Math.max(0.02, Math.abs(rawScaleX)) * signX;
        const scaleY = clydeScale * Math.cos(tiltX);

        ctx.scale(safeScaleX, scaleY);
        ctx.translate(-12, -12);

        if (isTopFace) {
          // --- FRONT / ACTIVE VISIBLE CAP FACE ---
          if (isFacingFront) {
            // Front Face (Blurple with directional specular glint)
            const frontGrad = ctx.createLinearGradient(
              4 + sinAngle * 8, 
              2, 
              20 - sinAngle * 8, 
              22
            );
            frontGrad.addColorStop(0, '#7583f7'); // Light sheen
            frontGrad.addColorStop(0.45, '#5865F2'); // Official Blurple
            frontGrad.addColorStop(1, '#4752c4'); // Shadow rim
            ctx.fillStyle = frontGrad;
            ctx.fill(FULL_CLYDE);

            // Front edge bevel highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 0.6;
            ctx.stroke(CLYDE_OUTLINE);

            // Glowing White Eyes
            const eyeGlow = 0.85 + Math.sin(angle * 2) * 0.15;
            ctx.fillStyle = `rgba(255, 255, 255, ${eyeGlow})`;
            ctx.fill(LEFT_EYE);
            ctx.fill(RIGHT_EYE);

            // Subtle lens reflex inside eyes
            ctx.fillStyle = '#5865F2';
            ctx.beginPath();
            ctx.arc(8.02, 13.3, 0.6, 0, Math.PI * 2);
            ctx.arc(15.995, 13.3, 0.6, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Back Face (Mirrored 360° rear view with illuminated eyes)
            const backGrad = ctx.createLinearGradient(4, 2, 20, 22);
            backGrad.addColorStop(0, '#5360df');
            backGrad.addColorStop(0.5, '#4552c8');
            backGrad.addColorStop(1, '#3540a8');
            ctx.fillStyle = backGrad;
            ctx.fill(FULL_CLYDE);

            // Rear edge bevel
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 0.6;
            ctx.stroke(CLYDE_OUTLINE);

            // Mirrored Glowing Eyes
            const eyeGlow = 0.75 + Math.sin(angle * 2) * 0.15;
            ctx.fillStyle = `rgba(255, 255, 255, ${eyeGlow})`;
            ctx.fill(LEFT_EYE);
            ctx.fill(RIGHT_EYE);

            // Lens reflex
            ctx.fillStyle = '#4552c8';
            ctx.beginPath();
            ctx.arc(8.02, 13.3, 0.6, 0, Math.PI * 2);
            ctx.arc(15.995, 13.3, 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (isBackFace) {
          // Bottom-most back shadow cap
          ctx.fillStyle = '#23275c';
          ctx.fill(CLYDE_OUTLINE);
        } else {
          // --- 3D EXTRUDED SIDE RIM WALLS (Intermediate Slices) ---
          // Dynamically lit based on the side angle and light source
          const depthRatio = idx / numSlices;
          const rimShade = Math.max(0.15, Math.min(0.9, 0.35 + sideLightDot * 0.45));
          
          // Interpolate between dark indigo shadow and lit blurple
          const r = Math.round(35 + rimShade * 45);
          const g = Math.round(41 + rimShade * 55);
          const b = Math.round(100 + rimShade * 135);
          
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fill(CLYDE_OUTLINE);

          // Subtle side edge stroke to guarantee seamless surface connectivity
          ctx.strokeStyle = `rgba(${r + 15}, ${g + 15}, ${b + 20}, 0.8)`;
          ctx.lineWidth = 1.1;
          ctx.stroke(CLYDE_OUTLINE);
        }

        ctx.restore();
      }

      ctx.restore();

      // Constant smooth endless 360 rotation speed (~4.8s per full 360° turn)
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
