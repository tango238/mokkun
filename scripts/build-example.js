#!/usr/bin/env node
/**
 * Generate example.html for distribution
 * This script creates an example HTML file that demonstrates library usage
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '../dist')

// Ensure dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true })
}

// Read version from package.json
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'))

// Example HTML with inline YAML demonstration
const exampleHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mokkun v${pkg.version} - Example</title>
  <!-- Load Mokkun CSS -->
  <link rel="stylesheet" href="./mokkun.css">
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      background: var(--mokkun-bg-primary, #f5f5f5);
    }
    #mokkun-app {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .demo-header {
      text-align: center;
      padding: 20px 0;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--mokkun-border-color, #ddd);
    }
    .demo-header h1 {
      margin: 0 0 8px 0;
      color: var(--mokkun-text-primary, #333);
    }
    .demo-header p {
      margin: 0;
      color: var(--mokkun-text-secondary, #666);
    }
    .demo-controls {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .demo-controls button {
      padding: 8px 16px;
      border: 1px solid var(--mokkun-border-color, #ddd);
      border-radius: 4px;
      background: var(--mokkun-bg-secondary, #fff);
      color: var(--mokkun-text-primary, #333);
      cursor: pointer;
    }
    .demo-controls button:hover {
      background: var(--mokkun-bg-hover, #f0f0f0);
    }
    .demo-controls button.active {
      background: var(--mokkun-primary, #007bff);
      color: white;
      border-color: var(--mokkun-primary, #007bff);
    }
  </style>
</head>
<body>
  <div id="mokkun-app">
    <div class="demo-header">
      <h1>Mokkun v${pkg.version}</h1>
      <p>YAML-based Presentation & Form Builder</p>
    </div>
    <div class="demo-controls">
      <button onclick="setTheme('light')" id="theme-light">Light</button>
      <button onclick="setTheme('dark')" id="theme-dark">Dark</button>
      <button onclick="setTheme('bootstrap')" id="theme-bootstrap">Bootstrap</button>
    </div>
    <div id="content"></div>
  </div>

  <!-- Load Mokkun JS (UMD bundle) -->
  <script src="./mokkun.js"></script>

  <script>
    // Sample YAML content
    const yamlContent = \`
view:
  demo:
    title: お問い合わせフォーム
    description: 以下のフォームに必要事項をご記入ください
    fields:
      - id: name
        type: text
        label: お名前
        required: true
        placeholder: 山田 太郎
      - id: email
        type: text
        label: メールアドレス
        input_type: email
        required: true
        placeholder: example@email.com
      - id: category
        type: select
        label: お問い合わせ種別
        required: true
        options:
          - label: 選択してください
            value: ""
          - label: 製品について
            value: product
          - label: サービスについて
            value: service
          - label: その他
            value: other
      - id: message
        type: textarea
        label: お問い合わせ内容
        rows: 5
        required: true
        placeholder: お問い合わせ内容をご記入ください
      - id: newsletter
        type: checkbox
        label: メールマガジンを受け取る
    actions:
      - id: submit
        type: submit
        label: 送信する
        style: primary
      - id: reset
        type: reset
        label: クリア
        style: secondary

  wizard_demo:
    title: ウィザードデモ
    description: ステップ形式の入力フォーム
    wizard:
      show_progress: true
      allow_back: true
      steps:
        - id: step1
          title: 基本情報
          fields:
            - id: company
              type: text
              label: 会社名
              required: true
            - id: department
              type: text
              label: 部署名
        - id: step2
          title: 連絡先
          fields:
            - id: phone
              type: text
              label: 電話番号
              placeholder: "03-1234-5678"
            - id: fax
              type: text
              label: FAX番号
        - id: step3
          title: 確認
          description: 入力内容をご確認ください
          fields:
            - id: terms
              type: checkbox
              label: 利用規約に同意する
              required: true
\`;

    let mokkunInstance = null;
    let currentTheme = 'light';

    // Initialize Mokkun
    async function initMokkun() {
      try {
        mokkunInstance = await Mokkun.init({
          container: '#content',
          yamlContent: yamlContent,
          theme: currentTheme,
          onReady: function(instance) {
            console.log('Mokkun initialized!');
            console.log('Available screens:', instance.getScreenNames());
            console.log('Version:', Mokkun.VERSION);
            updateThemeButtons();
          },
          onError: function(error) {
            console.error('Mokkun initialization failed:', error);
            document.getElementById('content').innerHTML =
              '<div style="color: red; padding: 20px;">Error: ' + error.message + '</div>';
          },
          onSubmit: function(screenName, formData) {
            console.log('Form submitted:', { screenName, formData });
            alert('フォームが送信されました！\\nコンソールでデータを確認できます。');
          }
        });
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    }

    // Theme switching
    function setTheme(themeId) {
      currentTheme = themeId;
      if (mokkunInstance) {
        mokkunInstance.setTheme(themeId);
      }
      updateThemeButtons();
    }

    function updateThemeButtons() {
      document.querySelectorAll('.demo-controls button').forEach(btn => {
        btn.classList.remove('active');
      });
      const activeBtn = document.getElementById('theme-' + currentTheme);
      if (activeBtn) {
        activeBtn.classList.add('active');
      }
    }

    // Screen navigation
    window.showScreen = function(screenName) {
      if (mokkunInstance) {
        mokkunInstance.showScreen(screenName);
      }
    };

    // Initialize on page load
    initMokkun();
  </script>
</body>
</html>
`

// Write the example HTML file
writeFileSync(resolve(distDir, 'example.html'), exampleHtml)
console.log(`Generated dist/example.html (Mokkun v${pkg.version})`)

// Also create a simple sample YAML file
const sampleYaml = `# Mokkun Sample YAML
# This file demonstrates the YAML schema format

view:
  sample:
    title: サンプルフォーム
    description: Mokkunで作成したサンプルフォームです
    fields:
      - id: username
        type: text
        label: ユーザー名
        required: true
        placeholder: ユーザー名を入力
      - id: age
        type: number
        label: 年齢
        min: 0
        max: 150
      - id: gender
        type: radio
        label: 性別
        options:
          - label: 男性
            value: male
          - label: 女性
            value: female
          - label: その他
            value: other
      - id: bio
        type: textarea
        label: 自己紹介
        rows: 3
        placeholder: 自己紹介文を入力してください
    actions:
      - id: save
        type: submit
        label: 保存
        style: primary
`

writeFileSync(resolve(distDir, 'sample.yaml'), sampleYaml)
console.log('Generated dist/sample.yaml')
