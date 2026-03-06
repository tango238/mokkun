/**
 * Pie Chart Component
 * SVGで円グラフを描画するコンポーネント
 */

import type { InputField, PieChartField, PieChartSegment } from '../../types/schema'
import { createFieldWrapper, escapeHtml } from '../utils/field-helpers'

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_SIZE = 200
const DEFAULT_COLORS = ['#14b8a6', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899']

// =============================================================================
// SVG Helpers
// =============================================================================

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  }
}


function buildSlicePath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  // Full circle (360 degrees) needs special handling
  if (endAngle - startAngle >= 359.99) {
    const outerStart = polarToCartesian(cx, cy, outerRadius, 0)
    const outerMid = polarToCartesian(cx, cy, outerRadius, 180)

    if (innerRadius > 0) {
      const innerStart = polarToCartesian(cx, cy, innerRadius, 0)
      const innerMid = polarToCartesian(cx, cy, innerRadius, 180)
      return [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${outerRadius} ${outerRadius} 0 1 0 ${outerMid.x} ${outerMid.y}`,
        `A ${outerRadius} ${outerRadius} 0 1 0 ${outerStart.x} ${outerStart.y}`,
        `M ${innerStart.x} ${innerStart.y}`,
        `A ${innerRadius} ${innerRadius} 0 1 1 ${innerMid.x} ${innerMid.y}`,
        `A ${innerRadius} ${innerRadius} 0 1 1 ${innerStart.x} ${innerStart.y}`,
        'Z',
      ].join(' ')
    }

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerRadius} ${outerRadius} 0 1 0 ${outerMid.x} ${outerMid.y}`,
      `A ${outerRadius} ${outerRadius} 0 1 0 ${outerStart.x} ${outerStart.y}`,
      'Z',
    ].join(' ')
  }

  const outerStart = polarToCartesian(cx, cy, outerRadius, endAngle)
  const outerEnd = polarToCartesian(cx, cy, outerRadius, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0

  if (innerRadius > 0) {
    const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle)
    const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle)
    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
      'Z',
    ].join(' ')
  }

  return [
    `M ${cx} ${cy}`,
    `L ${outerEnd.x} ${outerEnd.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerStart.x} ${outerStart.y}`,
    'Z',
  ].join(' ')
}

function buildSegments(
  segments: PieChartSegment[],
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  colors: string[]
): string {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  if (total === 0) return ''

  let currentAngle = 0
  return segments.map((segment, i) => {
    const sliceAngle = (segment.value / total) * 360
    const color = segment.color ?? colors[i % colors.length]
    const startAngle = currentAngle
    const endAngle = currentAngle + sliceAngle
    currentAngle = endAngle

    const path = buildSlicePath(cx, cy, outerRadius, innerRadius, startAngle, endAngle)
    const percentage = ((segment.value / total) * 100).toFixed(1)

    return `<path d="${path}" fill="${color}" class="pie-chart-segment" stroke="var(--surface-color, #fff)" stroke-width="2">` +
      `<title>${escapeHtml(segment.name)}: ${segment.value} (${percentage}%)</title></path>`
  }).join('\n')
}

function buildLegend(segments: PieChartSegment[], colors: string[]): string {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const items = segments.map((s, i) => {
    const color = s.color ?? colors[i % colors.length]
    const percentage = total > 0 ? ((s.value / total) * 100).toFixed(1) : '0'
    return `<span class="pie-chart-legend-item">` +
      `<span class="pie-chart-legend-color" style="background:${color}"></span>` +
      `${escapeHtml(s.name)} (${percentage}%)</span>`
  }).join('')

  return `<div class="pie-chart-legend">${items}</div>`
}

// =============================================================================
// PieChart Class
// =============================================================================

export class PieChart {
  static renderField(field: InputField): string {
    const chartField = field as PieChartField
    const {
      segments = [],
      size = DEFAULT_SIZE,
      show_legend: showLegend = true,
      donut,
    } = chartField

    if (segments.length === 0) {
      const emptyHtml = '<div class="pie-chart-empty">データがありません</div>'
      return createFieldWrapper(field, emptyHtml)
    }

    const cx = size / 2
    const cy = size / 2
    const outerRadius = (size / 2) - 4
    const innerRadius = donut != null ? outerRadius * Math.min(Math.max(donut, 0), 0.9) : 0

    const segmentsHtml = buildSegments(segments, cx, cy, outerRadius, innerRadius, DEFAULT_COLORS)

    const svgHtml = `
      <div class="pie-chart-container">
        <svg class="pie-chart-svg" viewBox="0 0 ${size} ${size}" preserveAspectRatio="xMidYMid meet">
          ${segmentsHtml}
        </svg>
        ${showLegend ? buildLegend(segments, DEFAULT_COLORS) : ''}
      </div>
    `

    return createFieldWrapper(field, svgHtml)
  }
}
