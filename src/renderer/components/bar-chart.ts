/**
 * Bar Chart Component
 * SVGで棒グラフを描画するコンポーネント
 */

import type { InputField, BarChartField, BarChartBar } from '../../types/schema'
import { createFieldWrapper, escapeHtml } from '../utils/field-helpers'

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_HEIGHT = 200
const DEFAULT_COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
const PADDING = { top: 10, right: 20, bottom: 30, left: 50 }
const GRID_LINE_COUNT = 5
const BAR_GAP_RATIO = 0.3

// =============================================================================
// SVG Helpers
// =============================================================================

function computeYMax(bars: BarChartBar[], yMax?: number): number {
  if (yMax != null) return yMax
  const dataMax = Math.max(...bars.map(b => b.value))
  return Math.ceil(dataMax * 1.15)
}

function formatYLabel(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`
  }
  return String(Math.round(value))
}

function buildGridLines(
  chartWidth: number,
  chartHeight: number,
  maxValue: number
): string {
  const lines: string[] = []

  for (let i = 0; i <= GRID_LINE_COUNT; i++) {
    const y = chartHeight - (i / GRID_LINE_COUNT) * chartHeight
    const value = (i / GRID_LINE_COUNT) * maxValue

    lines.push(
      `<line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}" class="bar-chart-grid-line" />`
    )
    lines.push(
      `<text x="-8" y="${y + 4}" class="bar-chart-y-label" text-anchor="end">${escapeHtml(formatYLabel(value))}</text>`
    )
  }

  return lines.join('\n')
}

function buildBars(
  bars: BarChartBar[],
  chartWidth: number,
  chartHeight: number,
  maxValue: number,
  colors: string[]
): string {
  if (bars.length === 0) return ''

  const totalBarWidth = chartWidth / bars.length
  const gap = totalBarWidth * BAR_GAP_RATIO
  const barWidth = totalBarWidth - gap

  return bars.map((bar, i) => {
    const color = bar.color ?? colors[i % colors.length]
    const barHeight = maxValue > 0 ? (bar.value / maxValue) * chartHeight : 0
    const x = i * totalBarWidth + gap / 2
    const y = chartHeight - barHeight

    const label = `<text x="${x + barWidth / 2}" y="${chartHeight + 18}" class="bar-chart-x-label" text-anchor="middle">${escapeHtml(bar.name)}</text>`

    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" class="bar-chart-bar" rx="2">` +
      `<title>${escapeHtml(bar.name)}: ${bar.value}</title></rect>\n${label}`
  }).join('\n')
}

function buildLegend(bars: BarChartBar[], colors: string[]): string {
  const items = bars.map((b, i) => {
    const color = b.color ?? colors[i % colors.length]
    return `<span class="bar-chart-legend-item">` +
      `<span class="bar-chart-legend-color" style="background:${color}"></span>` +
      `${escapeHtml(b.name)}</span>`
  }).join('')

  return `<div class="bar-chart-legend">${items}</div>`
}

// =============================================================================
// BarChart Class
// =============================================================================

export class BarChart {
  static renderField(field: InputField): string {
    const chartField = field as BarChartField
    const {
      bars = [],
      height = DEFAULT_HEIGHT,
      y_max: yMax,
      show_grid: showGrid = true,
      show_legend: showLegend = true,
    } = chartField

    if (bars.length === 0) {
      const emptyHtml = '<div class="bar-chart-empty">データがありません</div>'
      return createFieldWrapper(field, emptyHtml)
    }

    const maxValue = computeYMax(bars, yMax)
    const svgWidth = 600
    const chartWidth = svgWidth - PADDING.left - PADDING.right
    const chartHeight = height - PADDING.top - PADDING.bottom

    const gridHtml = showGrid ? buildGridLines(chartWidth, chartHeight, maxValue) : ''
    const barsHtml = buildBars(bars, chartWidth, chartHeight, maxValue, DEFAULT_COLORS)

    const svgHtml = `
      <div class="bar-chart-container">
        <svg class="bar-chart-svg" viewBox="0 0 ${svgWidth} ${height}" preserveAspectRatio="xMidYMid meet">
          <g transform="translate(${PADDING.left}, ${PADDING.top})">
            ${gridHtml}
            ${barsHtml}
          </g>
        </svg>
        ${showLegend ? buildLegend(bars, DEFAULT_COLORS) : ''}
      </div>
    `

    return createFieldWrapper(field, svgHtml)
  }
}
