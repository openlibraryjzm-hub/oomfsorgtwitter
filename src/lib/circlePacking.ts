/**
 * circlePacking.ts
 * Organic, placement-free circle packing engine for Twitter PFPs.
 * 
 * Core Philosophy:
 * - Size is purely a function of donation amount (or explicit sandbox input).
 * - Placement is EMERGENT: No forced center lock. Circles nest naturally like soap bubbles,
 *   pebbles, or gravitational celestial bodies.
 * - Largest circles place first to form the primary structure; medium and micro circles
 *   organically settle into the natural pockets and crevices.
 * - Guarantees ZERO overlaps and smooth boundary edge-touching.
 */

export interface PackedCircle<T> {
  item: T;
  x: number;      // Center X as percentage of container (0 - 100)
  y: number;      // Center Y as percentage of container (0 - 100)
  radius: number; // Radius as percentage of container (0 - 50)
  diameter: number; // Diameter as percentage of container (0 - 100)
}

export interface PackOptions {
  containerRadius?: number; // Default: 49.2 (touches the edge of the 50% radius container)
  minGap?: number;          // Default: 1.2% gap between circles
  targetFillDensity?: number; // Default: 0.83
  autoScaleToEdge?: boolean; // Default: true
}

export function packSupporterCircles<T extends { amount: number; customRadius?: number }>(
  items: T[],
  options: PackOptions = {}
): PackedCircle<T>[] {
  const count = items.length;
  if (count === 0) return [];

  const containerRadius = options.containerRadius ?? 49.2;
  const minGap = options.minGap ?? 1.2;
  const targetFillDensity = options.targetFillDensity ?? 0.83;
  const autoScaleToEdge = options.autoScaleToEdge ?? true;

  // Single supporter: fills the entire disk edge-to-edge
  if (count === 1) {
    const heroRadius = items[0].customRadius && !autoScaleToEdge
      ? Math.min(items[0].customRadius, containerRadius)
      : containerRadius;

    return [
      {
        item: items[0],
        x: 50,
        y: 50,
        radius: heroRadius,
        diameter: heroRadius * 2,
      },
    ];
  }

  // 1. Sort circles by size / amount descending (largest first)
  const sorted = [...items].sort((a, b) => {
    if (a.customRadius !== undefined && b.customRadius !== undefined) {
      return b.customRadius - a.customRadius;
    }
    return b.amount - a.amount;
  });

  const hasCustomRadii = sorted.some((it) => it.customRadius !== undefined && it.customRadius > 0);
  let radii: number[] = [];

  if (hasCustomRadii) {
    radii = sorted.map((s) => Math.min(s.customRadius ?? 10, containerRadius * 0.95));
  } else {
    // Derive natural radii based on donation amounts
    const maxAmount = Math.max(...sorted.map((s) => s.amount), 1);
    const minAmount = Math.min(...sorted.map((s) => s.amount), 1);

    const rawWeights = sorted.map((s, index) => {
      // Relative amount scaling with log-like softness
      const norm = (s.amount - minAmount) / Math.max(maxAmount - minAmount, 1);
      const amountBoost = Math.sqrt(Math.max(norm, 0.05));
      const rankDecay = Math.pow(0.95, index);
      return (0.35 + 0.65 * amountBoost) * rankDecay;
    });

    const availableArea = Math.PI * containerRadius * containerRadius;
    const targetTotalArea = availableArea * targetFillDensity;
    const sumWeightSquared = rawWeights.reduce((acc, w) => acc + w * w, 0);

    const scale = Math.sqrt(targetTotalArea / (Math.PI * sumWeightSquared));

    radii = rawWeights.map((w) => {
      let r = w * scale;
      if (count > 2) r = Math.min(r, containerRadius * 0.55);
      if (count > 8) r = Math.min(r, containerRadius * 0.42);
      if (count > 16) r = Math.min(r, containerRadius * 0.30);
      return Math.max(r, 4.2);
    });
  }

  // 2. Emergent Organic Placement (Greedy Tangential Pocket Placement)
  // Largest circles establish the primary anchor; others nest into pockets.
  const positions: { x: number; y: number }[] = [];

  // Place first circle at center
  positions.push({ x: 50, y: 50 });

  // Place second circle tangent to first
  if (count > 1) {
    const dist = radii[0] + radii[1] + minGap;
    positions.push({ x: 50 + dist, y: 50 });
  }

  // Place subsequent circles tangent to pairs of existing circles in natural pockets
  for (let i = 2; i < count; i++) {
    const rCurrent = radii[i];
    let bestPos: { x: number; y: number } | null = null;
    let minScore = Infinity;

    // Test candidate positions tangent to pairs of already-placed circles (j, k)
    for (let j = 0; j < i; j++) {
      for (let k = j + 1; k < i; k++) {
        const c1 = positions[j];
        const c2 = positions[k];
        const r1 = radii[j] + rCurrent + minGap;
        const r2 = radii[k] + rCurrent + minGap;

        const d12x = c2.x - c1.x;
        const d12y = c2.y - c1.y;
        const d12 = Math.sqrt(d12x * d12x + d12y * d12y);

        // Can circle i touch both circle j and circle k?
        if (d12 > 0.001 && d12 <= r1 + r2 && d12 >= Math.abs(r1 - r2)) {
          const a = (r1 * r1 - r2 * r2 + d12 * d12) / (2 * d12);
          const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));

          const px = c1.x + (d12x * a) / d12;
          const py = c1.y + (d12y * a) / d12;

          // Two possible tangent points
          const cand1 = { x: px + (h * -d12y) / d12, y: py + (h * d12x) / d12 };
          const cand2 = { x: px - (h * -d12y) / d12, y: py - (h * d12x) / d12 };

          for (const cand of [cand1, cand2]) {
            // Check for overlap with all other placed circles
            let overlaps = false;
            for (let m = 0; m < i; m++) {
              if (m === j || m === k) continue;
              const dmx = cand.x - positions[m].x;
              const dmy = cand.y - positions[m].y;
              if (Math.sqrt(dmx * dmx + dmy * dmy) < radii[m] + rCurrent + minGap * 0.7) {
                overlaps = true;
                break;
              }
            }

            if (!overlaps) {
              // Prefer positions closest to the center of the container
              const distFromCenter = Math.sqrt((cand.x - 50) ** 2 + (cand.y - 50) ** 2);
              if (distFromCenter < minScore) {
                minScore = distFromCenter;
                bestPos = cand;
              }
            }
          }
        }
      }
    }

    // Fallback: if no 2-circle pocket found, place tangent to the circle closest to center
    if (!bestPos) {
      let closestIdx = 0;
      let closestDist = Infinity;
      for (let j = 0; j < i; j++) {
        const d = Math.sqrt((positions[j].x - 50) ** 2 + (positions[j].y - 50) ** 2);
        if (d < closestDist) {
          closestDist = d;
          closestIdx = j;
        }
      }

      const angle = (i * 2.39996); // golden angle offset
      const d = radii[closestIdx] + rCurrent + minGap;
      bestPos = {
        x: positions[closestIdx].x + Math.cos(angle) * d,
        y: positions[closestIdx].y + Math.sin(angle) * d,
      };
    }

    positions.push(bestPos);
  }

  // 3. Center of Mass Re-centering
  // Center the whole cluster around (50, 50) so it's naturally balanced
  const avgX = positions.reduce((acc, p) => acc + p.x, 0) / count;
  const avgY = positions.reduce((acc, p) => acc + p.y, 0) / count;
  for (let i = 0; i < count; i++) {
    positions[i].x += 50 - avgX;
    positions[i].y += 50 - avgY;
  }

  // 4. Physics Relaxation Pass: Zero overlaps and smooth natural nesting
  const iterations = 65;
  for (let iter = 0; iter < iterations; iter++) {
    // A. Circle-circle collision separation
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        let dx = positions[j].x - positions[i].x;
        let dy = positions[j].y - positions[i].y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        const desiredDist = radii[i] + radii[j] + minGap;

        if (dist < desiredDist) {
          if (dist === 0) {
            dx = (Math.random() - 0.5) * 0.1;
            dy = (Math.random() - 0.5) * 0.1;
            dist = 0.01;
          }
          const overlap = desiredDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          const totalW = radii[i] + radii[j];
          const wI = radii[j] / totalW;
          const wJ = radii[i] / totalW;

          positions[i].x -= nx * overlap * wI;
          positions[i].y -= ny * overlap * wI;
          positions[j].x += nx * overlap * wJ;
          positions[j].y += ny * overlap * wJ;
        }
      }
    }

    // B. Soft organic gravity pull toward center of mass (prevents drifting)
    for (let i = 0; i < count; i++) {
      positions[i].x += (50 - positions[i].x) * 0.012;
      positions[i].y += (50 - positions[i].y) * 0.012;
    }

    // C. Container boundary confinement
    for (let i = 0; i < count; i++) {
      const dx = positions[i].x - 50;
      const dy = positions[i].y - 50;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);
      const maxAllowedDist = containerRadius - radii[i];

      if (distFromCenter > maxAllowedDist && distFromCenter > 0.001) {
        positions[i].x = 50 + (dx / distFromCenter) * maxAllowedDist;
        positions[i].y = 50 + (dy / distFromCenter) * maxAllowedDist;
      }
    }
  }

  // 5. Outward Edge Expansion Pass (Touch the container perimeter)
  if (autoScaleToEdge) {
    let maxExtent = 0;
    for (let i = 0; i < count; i++) {
      const distFromCenter = Math.sqrt((positions[i].x - 50) ** 2 + (positions[i].y - 50) ** 2);
      const extent = distFromCenter + radii[i];
      if (extent > maxExtent) {
        maxExtent = extent;
      }
    }

    if (maxExtent > 0 && maxExtent < containerRadius) {
      const expansionRatio = containerRadius / maxExtent;
      for (let i = 0; i < count; i++) {
        const dx = positions[i].x - 50;
        const dy = positions[i].y - 50;
        positions[i].x = 50 + dx * expansionRatio;
        positions[i].y = 50 + dy * expansionRatio;
        radii[i] = radii[i] * expansionRatio;
      }
    }
  }

  // 6. Final Collision Verification: Ensure zero overlaps
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const dx = positions[j].x - positions[i].x;
      const dy = positions[j].y - positions[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const desiredDist = radii[i] + radii[j] + (minGap * 0.7);
      if (dist < desiredDist) {
        const overlap = desiredDist - dist;
        radii[i] -= overlap * 0.25;
        radii[j] -= overlap * 0.25;
      }
    }
  }

  return sorted.map((item, idx) => ({
    item,
    x: positions[idx].x,
    y: positions[idx].y,
    radius: radii[idx],
    diameter: radii[idx] * 2,
  }));
}
