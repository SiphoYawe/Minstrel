'use client';

import { useState, useMemo } from 'react';
import { SkillDimension, type SkillProfile } from '@/features/difficulty/difficulty-types';

const DIMENSIONS: { key: SkillDimension; label: string }[] = [
  { key: SkillDimension.TimingAccuracy, label: 'Timing' },
  { key: SkillDimension.HarmonicComplexity, label: 'Harmony' },
  { key: SkillDimension.TechniqueRange, label: 'Technique' },
  { key: SkillDimension.Speed, label: 'Speed' },
  { key: SkillDimension.GenreFamiliarity, label: 'Genre' },
];

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 100;
const GRID_LEVELS = 4;
const LABEL_OFFSET = 20;

/** Calculate a point on the radar at a given angle and distance from center. */
function polarToCartesian(angle: number, distance: number): { x: number; y: number } {
  // Start from top (270 degrees / -90 degrees), go clockwise
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: CENTER + distance * Math.cos(radians),
    y: CENTER + distance * Math.sin(radians),
  };
}

/** Build SVG polygon points string from dimension values. */
function buildPolygon(values: number[]): string {
  const step = 360 / values.length;
  return values
    .map((val, i) => {
      const distance = (val / 100) * RADIUS;
      const { x, y } = polarToCartesian(i * step, distance);
      return `${x},${y}`;
    })
    .join(' ');
}

/** Build the grid polygon for a given level. */
function buildGridPolygon(level: number): string {
  const step = 360 / DIMENSIONS.length;
  const distance = (level / GRID_LEVELS) * RADIUS;
  return DIMENSIONS.map((_, i) => {
    const { x, y } = polarToCartesian(i * step, distance);
    return `${x},${y}`;
  }).join(' ');
}

interface SkillRadarChartProps {
  skillProfile: SkillProfile;
  comparisonProfile?: SkillProfile | null;
}

export function SkillRadarChart({ skillProfile, comparisonProfile }: SkillRadarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const currentValues = useMemo(
    () => DIMENSIONS.map((d) => Math.round(skillProfile.dimensions[d.key].value)),
    [skillProfile]
  );

  const comparisonValues = useMemo(
    () =>
      comparisonProfile
        ? DIMENSIONS.map((d) => Math.round(comparisonProfile.dimensions[d.key].value))
        : null,
    [comparisonProfile]
  );

  const step = 360 / DIMENSIONS.length;

  return (
    <div className="border border-surface-light bg-card px-5 py-4">
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
        Skill Profile
      </p>

      <div className="flex justify-center">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full max-w-[280px]"
          role="img"
          aria-label={`Skill radar chart: ${DIMENSIONS.map((d, i) => `${d.label}: ${currentValues[i]}`).join(', ')}`}
        >
          {/* Grid polygons */}
          {Array.from({ length: GRID_LEVELS }, (_, level) => (
            <polygon
              key={`grid-${level}`}
              points={buildGridPolygon(level + 1)}
              fill="none"
              stroke="#2A2A2A"
              strokeWidth="1"
            />
          ))}

          {/* Axis lines */}
          {DIMENSIONS.map((_, i) => {
            const { x, y } = polarToCartesian(i * step, RADIUS);
            return (
              <line
                key={`axis-${i}`}
                x1={CENTER}
                y1={CENTER}
                x2={x}
                y2={y}
                stroke="#2A2A2A"
                strokeWidth="1"
              />
            );
          })}

          {/* Comparison polygon (ghosted) */}
          {comparisonValues && (
            <polygon
              points={buildPolygon(comparisonValues)}
              fill="hsl(206 70% 70% / 0.08)"
              stroke="hsl(206 70% 70% / 0.4)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
          )}

          {/* Current skill polygon */}
          <polygon
            points={buildPolygon(currentValues)}
            fill="hsl(206 70% 70% / 0.2)"
            stroke="hsl(206 70% 70%)"
            strokeWidth="1.5"
          />

          {/* Data point dots */}
          {currentValues.map((val, i) => {
            const distance = (val / 100) * RADIUS;
            const { x, y } = polarToCartesian(i * step, distance);
            const isHovered = hoveredIndex === i;

            return (
              <circle
                key={`dot-${i}`}
                cx={x}
                cy={y}
                r={isHovered ? 4 : 3}
                fill={isHovered ? 'hsl(206 70% 70%)' : 'hsl(var(--background))'}
                stroke="hsl(206 70% 70%)"
                strokeWidth="1.5"
                className="transition-all duration-150"
              />
            );
          })}

          {/* Axis labels */}
          {DIMENSIONS.map((dim, i) => {
            const { x, y } = polarToCartesian(i * step, RADIUS + LABEL_OFFSET);

            // Adjust text anchor based on position
            let textAnchor: 'start' | 'middle' | 'end' = 'middle';
            const angle = i * step;
            if (angle > 20 && angle < 160) textAnchor = 'start';
            if (angle > 200 && angle < 340) textAnchor = 'end';

            // Adjust vertical alignment
            let dy = '0.35em';
            if (angle === 0 || angle === 360) dy = '0em'; // top
            if (angle === 180) dy = '0.7em'; // bottom

            return (
              <text
                key={`label-${i}`}
                x={x}
                y={y}
                textAnchor={textAnchor}
                dy={dy}
                fill={hoveredIndex === i ? 'hsl(206 70% 70%)' : 'hsl(var(--muted-foreground))'}
                fontSize="11"
                fontFamily="'JetBrains Mono', monospace"
                className="transition-colors duration-150 select-none"
              >
                {dim.label}
              </text>
            );
          })}

          {/* Invisible hit areas for hover interaction */}
          {DIMENSIONS.map((_, i) => {
            const distance = (currentValues[i] / 100) * RADIUS;
            const { x, y } = polarToCartesian(i * step, distance);
            return (
              <circle
                key={`hit-${i}`}
                cx={x}
                cy={y}
                r={12}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              />
            );
          })}
        </svg>
      </div>

      {/* Tooltip display below chart */}
      {hoveredIndex !== null && (
        <div className="mt-3 flex items-center justify-center gap-2 transition-opacity duration-150">
          <span className="font-mono text-xs text-primary">{DIMENSIONS[hoveredIndex].label}</span>
          <span className="font-mono text-sm text-white font-semibold">
            {currentValues[hoveredIndex]}
          </span>
          {comparisonValues && (
            <span className="font-mono text-[10px] text-muted-foreground">
              (prev: {comparisonValues[hoveredIndex]})
            </span>
          )}
        </div>
      )}

      {/* Comparison legend */}
      {comparisonValues && (
        <div className="mt-3 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-px w-4 bg-primary" />
            <span className="text-[10px] text-muted-foreground">Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-px w-4 border-t border-dashed border-primary/40" />
            <span className="text-[10px] text-muted-foreground">Previous</span>
          </div>
        </div>
      )}
    </div>
  );
}
