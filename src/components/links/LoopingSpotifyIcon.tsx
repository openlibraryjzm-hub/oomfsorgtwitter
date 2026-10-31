'use client';

import React, { useEffect, useRef } from 'react';

interface LoopingSpotifyIconProps {
  className?: string;
  size?: number; // e.g. 48, 56, 64, 72
}

export default function LoopingSpotifyIcon({
  className = '',
  size = 64
}: LoopingSpotifyIconProps) {
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

    // Spotify Soundwave Arc Paths (24x24 viewBox, centered at 12, 12)
    // Bottom Arc (Small)
    const ARC_BOTTOM = new Path2D(
      "M17.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02z"
    );

    // Middle Arc (Medium)
    const ARC_MIDDLE = new Path2D(
      "M18.961 14.04c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2z"
    );

    // Top Arc (Large)
    const ARC_TOP = new Path2D(
      "M19.081 10.68C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
    );

    // Helper: Draw the 3 Soundwave Arcs with Depth & Specular Gloss
    const drawSoundwaves = (
      c: CanvasRenderingContext2D, 
      isBack = false,
      sheenAngle = 0
    ) => {
      c.save();

      if (!isBack) {
        // 1. Subtle drop shadow beneath the embossed arcs
        c.save();
        c.translate(0.35, 0.45);
        c.fillStyle = 'rgba(10, 40, 20, 0.45)';
        c.fill(ARC_TOP);
        c.fill(ARC_MIDDLE);
        c.fill(ARC_BOTTOM);
        c.restore();

        // 2. Obsidian Black Arcs with subtle glossy sheen
        c.fillStyle = '#121212';
        c.fill(ARC_TOP);
        c.fill(ARC_MIDDLE);
        c.fill(ARC_BOTTOM);

        // 3. Specular gloss glint along the top curvature of each arc
        const glintGrad = c.createLinearGradient(
          4 + Math.sin(sheenAngle) * 8, 
          4, 
          20 - Math.sin(sheenAngle) * 8, 
          20
        );
        glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        glintGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
        glintGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        c.strokeStyle = glintGrad;
        c.lineWidth = 0.4;
        c.stroke(ARC_TOP);
        c.stroke(ARC_MIDDLE);
        c.stroke(ARC_BOTTOM);

        // 4. Subtle pulsating audio core
        const pulse = 0.5 + Math.sin(sheenAngle * 3) * 0.5;
        c.fillStyle = `rgba(30, 215, 96, ${0.15 + pulse * 0.15})`;
        c.fill(ARC_TOP);
        c.fill(ARC_MIDDLE);
        c.fill(ARC_BOTTOM);

      } else {
        // --- Back Face (Mirrored 360° rear view with embossed soundwave arcs) ---
        c.save();
        c.translate(-0.35, 0.45);
        c.fillStyle = 'rgba(10, 40, 20, 0.45)';
        c.fill(ARC_TOP);
        c.fill(ARC_MIDDLE);
        c.fill(ARC_BOTTOM);
        c.restore();

        // Obsidian Black Arcs
        c.fillStyle = '#121212';
        c.fill(ARC_TOP);
        c.fill(ARC_MIDDLE);
        c.fill(ARC_BOTTOM);

        // Specular gloss on rear arcs
        c.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        c.lineWidth = 0.4;
        c.stroke(ARC_TOP);
        c.stroke(ARC_MIDDLE);
        c.stroke(ARC_BOTTOM);

        // Pulsating audio core
        const pulse = 0.5 + Math.sin(sheenAngle * 3) * 0.5;
        c.fillStyle = `rgba(30, 215, 96, ${0.15 + pulse * 0.15})`;
        c.fill(ARC_TOP);
        c.fill(ARC_MIDDLE);
        c.fill(ARC_BOTTOM);
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

      // 1. Ambient Background Glow Disc (Spotify Green Aura)
      const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.15);
      bgGrad.addColorStop(0, 'rgba(29, 185, 84, 0.18)');
      bgGrad.addColorStop(0.6, 'rgba(29, 185, 84, 0.05)');
      bgGrad.addColorStop(1, 'rgba(29, 185, 84, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Tilt & Rotation Geometry
      const tiltX = 0.22; // ~12.5 degrees forward perspective tilt
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Dimensions & extrusion thickness
      const spotifyScale = (R * 1.28) / 24;
      const thickness = 7.2; // 3D depth in pixels
      const numSlices = 26; // Dense micro-extrusion

      // 3. Dynamic Floor Contact Shadow
      const shadowBroadness = 0.4 + 0.6 * Math.abs(cosAngle);
      const shadowY = cy + R * 0.72;
      const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, R * 0.58);
      shadowGrad.addColorStop(0, 'rgba(20, 60, 30, 0.35)');
      shadowGrad.addColorStop(0.5, 'rgba(29, 185, 84, 0.1)');
      shadowGrad.addColorStop(1, 'rgba(29, 185, 84, 0.0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, R * 0.55 * shadowBroadness, R * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. 3D Layer Extrusion Slicing for the Vinyl Token
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
        const rawScaleX = cosAngle * spotifyScale;
        const signX = rawScaleX < 0 ? -1 : 1;
        const safeScaleX = Math.max(0.02, Math.abs(rawScaleX)) * signX;
        const scaleY = spotifyScale * Math.cos(tiltX);

        ctx.scale(safeScaleX, scaleY);
        ctx.translate(-12, -12);

        if (isTopFace) {
          // --- FRONT CAP FACE ---
          if (isFacingFront) {
            // Radiant Spotify Green with Glossy Directional Sheen
            const discGrad = ctx.createLinearGradient(
              2 + sinAngle * 8, 
              2, 
              22 - sinAngle * 8, 
              22
            );
            discGrad.addColorStop(0, '#1ed760'); // Vibrant Green Highlight
            discGrad.addColorStop(0.45, '#1DB954'); // Official Spotify Green
            discGrad.addColorStop(1, '#15883e'); // Forest Shade
            ctx.fillStyle = discGrad;
            ctx.beginPath();
            ctx.arc(12, 12, 12, 0, Math.PI * 2);
            ctx.fill();

            // Beveled silver-green outer rim highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 0.6;
            ctx.stroke();

            // Subtle concentric vinyl groove ring
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 0.35;
            ctx.beginPath();
            ctx.arc(12, 12, 11, 0, Math.PI * 2);
            ctx.stroke();

            // --- DRAW THE 3 SOUNDWAVE ARCS ON TOP ---
            drawSoundwaves(ctx, false, angle);

          } else {
            // --- BACK CAP FACE (When rotated 180°) ---
            const backGrad = ctx.createLinearGradient(2, 2, 22, 22);
            backGrad.addColorStop(0, '#15883e');
            backGrad.addColorStop(0.5, '#0f612c');
            backGrad.addColorStop(1, '#0a3d1c');
            ctx.fillStyle = backGrad;
            ctx.beginPath();
            ctx.arc(12, 12, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(29, 185, 84, 0.5)';
            ctx.lineWidth = 0.7;
            ctx.stroke();

            // Matching embossed soundwaves on back
            drawSoundwaves(ctx, true, angle);
          }
        } else if (isBackFace) {
          // Bottom-most back cap
          ctx.fillStyle = '#062612';
          ctx.beginPath();
          ctx.arc(12, 12, 12, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // --- 3D EXTRUDED SIDE RIM WALLS (Intermediate Slices) ---
          // Directionally shaded deep emerald green
          const rimShade = Math.max(0.18, Math.min(0.9, 0.35 + sideLightDot * 0.45));
          const r = Math.round(10 + rimShade * 20); // 10 to 30
          const g = Math.round(55 + rimShade * 140); // 55 to 195
          const b = Math.round(25 + rimShade * 65); // 25 to 90

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.beginPath();
          ctx.arc(12, 12, 12, 0, Math.PI * 2);
          ctx.fill();

          // Side wall stroke to guarantee seamless surface connectivity
          ctx.strokeStyle = `rgba(${r + 10}, ${g + 15}, ${b + 10}, 0.8)`;
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
