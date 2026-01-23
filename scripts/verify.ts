/**
 * Phase 1 動作確認スクリプト
 * 実行: npx vite-node scripts/verify.ts
 */

import { parseYaml, formatParseErrors, getScreen, getScreenNames } from '../src/parser'

const sampleYaml = `
view:
  user_form:
    title: ユーザー登録
    description: 新規ユーザーを登録します
    fields:
      - id: name
        type: text
        label: 氏名
        required: true
        max_length: 100
      - id: email
        type: text
        label: メールアドレス
        input_type: email
        required: true
      - id: age
        type: number
        label: 年齢
        min: 0
        max: 150
      - id: gender
        type: radio_group
        label: 性別
        options:
          - value: male
            label: 男性
          - value: female
            label: 女性
          - value: other
            label: その他
      - id: hobbies
        type: checkbox_group
        label: 趣味
        options:
          - value: sports
            label: スポーツ
          - value: music
            label: 音楽
          - value: reading
            label: 読書
    actions:
      - id: submit
        type: submit
        label: 登録
        style: primary
      - id: cancel
        type: navigate
        label: キャンセル
        to: /home
`

console.log('=== Phase 1 動作確認 ===\n')

// パース実行
const result = parseYaml(sampleYaml)

if (result.success) {
  console.log('✅ パース成功\n')

  // 画面名一覧
  const screenNames = getScreenNames(result.data)
  console.log('画面一覧:', screenNames)

  // 画面詳細
  const screen = getScreen(result.data, 'user_form')
  if (screen) {
    console.log('\n画面タイトル:', screen.title)
    console.log('説明:', screen.description)
    console.log('フィールド数:', screen.fields?.length)
    console.log('アクション数:', screen.actions?.length)

    console.log('\nフィールド一覧:')
    screen.fields?.forEach(f => {
      console.log(`  - ${f.id} (${f.type}): ${f.label}`)
    })

    console.log('\nアクション一覧:')
    screen.actions?.forEach(a => {
      console.log(`  - ${a.id} (${a.type}): ${a.label}`)
    })
  }
} else {
  console.log('❌ パース失敗\n')
  console.log(formatParseErrors(result.errors))
}

// エラーケースも確認
console.log('\n\n=== エラーケース確認 ===\n')

const invalidYaml = `
view:
  broken:
    title: 壊れたフォーム
    fields:
      - id: test
        type: unknown_type
        label: テスト
`

const errorResult = parseYaml(invalidYaml)
if (!errorResult.success) {
  console.log('✅ 不正なYAMLを検出:')
  console.log(formatParseErrors(errorResult.errors))
}
