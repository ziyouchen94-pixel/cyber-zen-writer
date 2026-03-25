# Cyber Zen Writer 🌧️✍️

一个赛博禅意风格的沉浸式写作工具，基于 WebGL 雨滴特效和毛玻璃编辑器。

## ✨ 功能

- 🎨 全屏 WebGL 动态雨滴背景（可调节雨量、模糊度）
- 🖋️ 极简毛玻璃输入框，实时自动保存
- 🎛️ 隐藏式氛围控制台（VibeMixer）
- 💾 纯前端运行，数据本地存储，支持导出 .txt
- 🌐 可直接部署到 Vercel / GitHub Pages

## 🚀 本地运行

### 方法 1: VS Code Live Server（推荐）
1. 安装 Live Server 插件
2. 右键 `index.html` → "Open with Live Server"
3. 浏览器打开 `http://localhost:5500`

### 方法 2: Python 快速服务器
```bash
cd cyber-zen-writer
python -m http.server 8000
# 打开 http://localhost:8000
```

### 方法 3: npm serve
```bash
npm install -g serve
serve -s cyber-zen-writer
```

## ☁️ 部署到 Vercel

1. 将项目上传到 GitHub：
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/cyber-zen-writer.git
git push -u origin main
```

2. 去 [Vercel](https://vercel.com/new) → Import Project → 选你的仓库
3. Framework Preset: **Other**（不选 Next.js）
4. Build Command: 留空
5. Output Directory: 留空
6. 点 Deploy ✅

几分钟后得到一个 `*.vercel.app` 链接，即可访问。

## 🛠️ 自定义

### 更换背景图
在 `app.js` 第 5 行修改 `BACKGROUND` 为任意图片 URL：
```js
const BACKGROUND = 'your-image-url.jpg';
```

### 调节雨滴参数
在 `shader.js` 中修改 `FRAGMENT_SHADER` 里的 `rainAmount`、`blurAmount` 等 uniform 的使用逻辑。

### 字体切换（计划中）
预留了字体切换接口，欢迎自行扩展。

## 📝 数据存储
- 内容自动保存到浏览器 `localStorage`
- 点击 "Export .txt" 可下载当天文档
- 文件名格式：`zen-writing-YYYY-MM-DD.txt`

## 🤔 常见问题

**Q: 为什么背景黑了？**
A: WebGL2 需要背景图跨域支持。背景图 URL 必须是允许 CORS 的（如 Unsplash）。如使用本地图，需要本地服务器运行（非 file:// 协议）。

**Q: 如何控制雨量？**
A: 拖动右侧面板的 Rain 滑块，或直接修改代码中的初始值。

**Q: 可以离线使用吗？**
A: 可以，所有资源都在本地，但首次加载需要网络（CDN Tailwind）。可将 Tailwind 改成本地构建。

---

Made with 💧 by Cyber Zen Writer
