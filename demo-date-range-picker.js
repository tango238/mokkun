import { createDateRangePicker, getDefaultPresets } from './src/renderer/components/date-range-picker.ts'

// Helper function to format date range for display
function formatRangeForDisplay(range) {
  const formatDate = (date) => {
    if (!date) return 'null'
    return `new Date("${date.toISOString()}")`
  }

  return `{
  from: ${formatDate(range.from)},
  to: ${formatDate(range.to)}
}`
}

// Demo 1: 基本的な使い方
const container1 = document.getElementById('date-range-picker-1')
const output1 = document.getElementById('output-1')

createDateRangePicker(
  container1,
  {},
  {
    onChange: (range, presetId, state) => {
      output1.textContent = formatRangeForDisplay(range)
      if (presetId) {
        output1.textContent += `\n\nプリセット: ${presetId}`
      }
    },
    onApply: (range) => {
      console.log('適用:', range)
    },
    onCancel: () => {
      console.log('キャンセル')
    },
  }
)

// Demo 2: プリセットなし
const container2 = document.getElementById('date-range-picker-2')
const output2 = document.getElementById('output-2')

createDateRangePicker(
  container2,
  {
    showPresets: false,
    placeholder: 'カレンダーから選択',
  },
  {
    onChange: (range) => {
      output2.textContent = formatRangeForDisplay(range)
    },
  }
)

// Demo 3: 日付範囲制限付き（過去30日間のみ選択可能）
const container3 = document.getElementById('date-range-picker-3')
const output3 = document.getElementById('output-3')

const today = new Date()
today.setHours(0, 0, 0, 0)

const thirtyDaysAgo = new Date(today)
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

createDateRangePicker(
  container3,
  {
    minDate: thirtyDaysAgo,
    maxDate: today,
  },
  {
    onChange: (range) => {
      output3.textContent = formatRangeForDisplay(range)
    },
  }
)

// Demo 4: 初期値設定済み（過去7日間）
const container4 = document.getElementById('date-range-picker-4')
const output4 = document.getElementById('output-4')

const sevenDaysAgo = new Date(today)
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

const initialRange = { from: sevenDaysAgo, to: today }

output4.textContent = formatRangeForDisplay(initialRange)

createDateRangePicker(
  container4,
  {
    value: initialRange,
  },
  {
    onChange: (range) => {
      output4.textContent = formatRangeForDisplay(range)
    },
  }
)

// Demo 5: カスタムプリセット
const container5 = document.getElementById('date-range-picker-5')
const output5 = document.getElementById('output-5')

const customPresets = [
  {
    id: 'last3days',
    label: '過去3日間',
    getRange: () => {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const from = new Date(now)
      from.setDate(from.getDate() - 2)
      return { from, to: now }
    },
  },
  {
    id: 'last14days',
    label: '過去2週間',
    getRange: () => {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const from = new Date(now)
      from.setDate(from.getDate() - 13)
      return { from, to: now }
    },
  },
  {
    id: 'last90days',
    label: '過去3ヶ月',
    getRange: () => {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const from = new Date(now)
      from.setDate(from.getDate() - 89)
      return { from, to: now }
    },
  },
  {
    id: 'thisWeek',
    label: '今週',
    getRange: () => {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const dayOfWeek = now.getDay()
      const from = new Date(now)
      from.setDate(from.getDate() - dayOfWeek)
      return { from, to: now }
    },
  },
  {
    id: 'thisYear',
    label: '今年',
    getRange: () => {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const from = new Date(now.getFullYear(), 0, 1)
      return { from, to: now }
    },
  },
]

createDateRangePicker(
  container5,
  {
    presets: customPresets,
  },
  {
    onChange: (range, presetId) => {
      output5.textContent = formatRangeForDisplay(range)
      if (presetId) {
        output5.textContent += `\n\nプリセット: ${presetId}`
      }
    },
  }
)

// Demo 6: 適用/キャンセルボタンなし（即時反映）
const container6 = document.getElementById('date-range-picker-6')
const output6 = document.getElementById('output-6')

createDateRangePicker(
  container6,
  {
    showApplyButton: false,
    showCancelButton: false,
  },
  {
    onChange: (range, presetId) => {
      output6.textContent = formatRangeForDisplay(range)
      if (presetId) {
        output6.textContent += `\n\nプリセット: ${presetId}`
      }
      // 即座にAPIコールなどを実行可能
      console.log('即時反映:', range)
    },
  }
)
