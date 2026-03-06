/**
 * Line Chart Component
 * SVGで線グラフを描画するコンポーネント
 */

import type { InputField, LineChartField, LineChartSeries } from '../../types/schema'
import { createFieldWrapper, escapeHtml } from '../utils/field-helpers'

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_HEIGHT = 200
const DEFAULT_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899']
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 }
const GRID_LINE_COUNT = 5

// =============================================================================
// SVG Helpers
// =============================================================================

function computeYRange(
  series: LineChartSeries[],
  yMin?: number,
  yMax?: number
): { min: number; max: number } {
  const allValues = series.flatMap(s => s.data)
  const dataMin = Math.min(...allValues)
  const dataMax = Math.max(...allValues)

  const min = yMin ?? Math.floor(dataMin * 0.9)
  const max = yMax ?? Math.ceil(dataMax * 1.1)

  return { min, max: max === min ? max + 1 : max }
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
  yRange: { min: number; max: number }
): string {
  const lines: string[] = []

  for (let i = 0; i <= GRID_LINE_COUNT; i++) {
    const y = chartHeight - (i / GRID_LINE_COUNT) * chartHeight
    const value = yRange.min + (i / GRID_LINE_COUNT) * (yRange.max - yRange.min)

    lines.push(
      `<line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}" class="line-chart-grid-line" />`
    )
    lines.push(
      `<text x="-8" y="${y + 4}" class="line-chart-y-label" text-anchor="end">${escapeHtml(formatYLabel(value))}</text>`
    )
  }

  return lines.join('\n')
}

function buildXLabels(
  labels: string[],
  chartWidth: number,
  chartHeight: number
): string {
  if (labels.length === 0) return ''

  return labels.map((label, i) => {
    const x = labels.length === 1
      ? chartWidth / 2
      : (i / (labels.length - 1)) * chartWidth
    return `<text x="${x}" y="${chartHeight + 24}" class="line-chart-x-label" text-anchor="middle">${escapeHtml(label)}</text>`
  }).join('\n')
}

function buildSeriesPath(
  series: LineChartSeries,
  chartWidth: number,
  chartHeight: number,
  yRange: { min: number; max: number },
  color: string
): string {
  const { data } = series
  if (data.length === 0) return ''

  const points = data.map((value, i) => {
    const x = data.length === 1
      ? chartWidth / 2
      : (i / (data.length - 1)) * chartWidth
    const y = chartHeight - ((value - yRange.min) / (yRange.max - yRange.min)) * chartHeight
    return { x, y, value }
  })

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')

  const dots = points.map(p =>
    `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="${color}" class="line-chart-dot">` +
    `<title>${escapeHtml(series.name)}: ${p.value}</title></circle>`
  ).join('\n')

  return `
    <path d="${pathData}" fill="none" stroke="${color}" stroke-width="2" class="line-chart-line" />
    ${dots}
  `
}

function buildLegend(series: LineChartSeries[], colors: string[]): string {
  const items = series.map((s, i) => {
    const color = s.color ?? colors[i % colors.length]
    return `<span class="line-chart-legend-item">` +
      `<span class="line-chart-legend-color" style="background:${color}"></span>` +
      `${escapeHtml(s.name)}</span>`
  }).join('')

  return `<div class="line-chart-legend">${items}</div>`
}

// =============================================================================
// LineChart Class
// =============================================================================

export class LineChart {
  /**
   * LineChartフィールドをHTMLとしてレンダリング（静的メソッド）
   * SSR/初期レンダリング用
   */
  static renderField(field: InputField): string {
    const chartField = field as LineChartField
    const {
      series = [],
      x_labels: xLabels = [],
      y_min: yMin,
      y_max: yMax,
      height = DEFAULT_HEIGHT,
      show_grid: showGrid = true,
      show_legend: showLegend = true,
    } = chartField

    if (series.length === 0) {
      const emptyHtml = '<div class="line-chart-empty">データがありません</div>'
      return createFieldWrapper(field, emptyHtml)
    }

    const yRange = computeYRange(series, yMin, yMax)
    const svgWidth = 600
    const chartWidth = svgWidth - PADDING.left - PADDING.right
    const chartHeight = height - PADDING.top - PADDING.bottom

    const gridHtml = showGrid ? buildGridLines(chartWidth, chartHeight, yRange) : ''
    const xLabelHtml = buildXLabels(xLabels, chartWidth, chartHeight)

    const seriesHtml = series.map((s, i) => {
      const color = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
      return buildSeriesPath(s, chartWidth, chartHeight, yRange, color)
    }).join('\n')

    const svgHtml = `
      <div class="line-chart-container">
        <svg class="line-chart-svg" viewBox="0 0 ${svgWidth} ${height}" preserveAspectRatio="xMidYMid meet">
          <g transform="translate(${PADDING.left}, ${PADDING.top})">
            ${gridHtml}
            ${xLabelHtml}
            ${seriesHtml}
          </g>
        </svg>
        ${showLegend ? buildLegend(series, DEFAULT_COLORS) : ''}
      </div>
    `

    return createFieldWrapper(field, svgHtml)
  }
}
