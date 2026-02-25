# Academia

<p align="center">
  <img src="https://img.shields.io/badge/Electron-28.0.0-47848F?logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-blue" alt="Platform">
  <img src="https://img.shields.io/github/stars/yepingbai/Academia?style=social" alt="GitHub Stars">
</p>

<p align="center">
  <img src="https://github.com/MACHINE/Academia/actions/workflows/ci.yml/badge.svg" alt="CI">
  <img src="https://img.shields.io/codecov/c/github/yepingbai/Academia" alt="Coverage">
</p>

<!-- 
  📌 使用前请替换:
  - yepingbai → 你的 GitHub 用户名
  - Academia → 你的仓库名（如果不同）
-->

一款优雅的学术资源管理工具，帮助研究人员、学生和知识工作者高效管理 PDF 文献、笔记、链接和各类文件资源。

## ✨ 功能特性

### 📚 多类型资源管理
- **PDF 文档** - 导入、预览、管理学术论文和电子书
- **Markdown 笔记** - 内置编辑器，支持实时预览
- **网页链接** - 快速保存网页，自动获取标题
- **通用文件** - 支持文本、图片、音频、视频、代码等多种格式

### 🏷️ 灵活的标签系统
- **层级标签** - 支持无限层级的父子标签结构
- **多彩标签** - 自定义标签颜色，视觉分类
- **批量管理** - 快速为资源添加或移除标签

### 🔍 高效的检索能力
- **实时搜索** - 即时过滤资源，快速定位
- **标签过滤** - 按标签层级筛选资源
- **类型过滤** - 支持按资源类型分类查看

### 👁️ 丰富的预览支持
- **PDF 预览** - 内嵌 PDF 阅读器
- **图片预览** - 支持 JPG、PNG、GIF、WebP
- **音频播放** - 内置音频播放器
- **视频播放** - 内置视频播放器
- **文本/代码预览** - 语法高亮显示
- **Markdown 渲染** - 实时渲染 Markdown 笔记

### 🎨 现代化界面
- **macOS 风格** - 原生标题栏，融入系统设计
- **卡片视图** - 清晰的资源卡片展示
- **三栏布局** - 标签导航、资源列表、预览面板
- **响应式设计** - 自适应窗口大小

## 📷 界面预览

```
┌──────────────────────────────────────────────────────────────┐
│  Academia                                              ─ □ ✕  │
├──────────┬───────────────────────────┬───────────────────────┤
│ 标签导航  │     资源列表              │      预览面板          │
│          │                          │                       │
│ ▼ 全部    │  ┌─────┐ ┌─────┐        │  ┌─────────────────┐  │
│   📄 PDF  │  │ PDF │ │ Note│        │  │                 │  │
│   🔗 链接  │  └─────┘ └─────┘        │  │   PDF 预览      │  │
│   📝 笔记  │  ┌─────┐ ┌─────┐        │  │                 │  │
│   📁 文件  │  │ Link│ │ File│        │  │                 │  │
│          │  └─────┘ └─────┘        │  └─────────────────┘  │
│ ▼ 工作    │                          │                       │
│   项目A   │                          │  文件名: paper.pdf    │
│   项目B   │                          │  大小: 2.5 MB         │
│ ▼ 学习    │                          │  添加: 2024-01-15     │
│   机器学习 │                          │                       │
└──────────┴───────────────────────────┴───────────────────────┘
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发运行
```bash
npm run dev
```

### 生产运行
```bash
npm start
```

### 运行测试
```bash
# 运行所有测试
npm test

# 生成覆盖率报告
npm run test:coverage

# 监视模式
npm run test:watch
```

### 构建应用
```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

### 本地 CI
```bash
# 完整 CI 流程
npm run ci:local

# 构建所有平台
npm run ci:local:all
```

## 📁 支持的文件类型

| 类型 | 扩展名 | 预览支持 |
|------|--------|---------|
| PDF | `.pdf` | ✅ 内嵌阅读器 |
| 图片 | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`, `.bmp`, `.ico` | ✅ 图片预览 |
| 音频 | `.mp3`, `.wav`, `.ogg`, `.m4a`, `.flac`, `.aac` | ✅ 音频播放 |
| 视频 | `.mp4`, `.webm`, `.mkv`, `.avi`, `.mov`, `.wmv` | ✅ 视频播放 |
| 文本 | `.txt`, `.md`, `.json`, `.xml`, `.csv`, `.log` | ✅ 文本预览 |
| 代码 | `.js`, `.ts`, `.py`, `.java`, `.c`, `.cpp`, `.go`, `.rs`, `.html`, `.css` | ✅ 代码预览 |
| 压缩包 | `.zip`, `.rar`, `.7z`, `.tar`, `.gz` | ❌ 外部打开 |
| 文档 | `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx` | ❌ 外部打开 |

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Electron App                         │
├─────────────────────────────┬───────────────────────────────┤
│        Main Process         │       Renderer Process        │
│   ┌───────────────────┐     │     ┌───────────────────┐     │
│   │  ResourceManager  │     │     │      app.js       │     │
│   │   ├── PDF         │◄────┼────►│   (Frontend UI)   │     │
│   │   ├── Link        │ IPC │     └───────────────────┘     │
│   │   ├── Note        │     │     ┌───────────────────┐     │
│   │   └── File        │     │     │    main.css       │     │
│   └───────────────────┘     │     │   (Styling)       │     │
│   ┌───────────────────┐     │     └───────────────────┘     │
│   │  electron-store   │     │     ┌───────────────────┐     │
│   │  (Persistence)    │     │     │   index.html      │     │
│   └───────────────────┘     │     │   (Structure)     │     │
│                             │     └───────────────────┘     │
└─────────────────────────────┴───────────────────────────────┘
```

### 核心模块

| 模块 | 职责 |
|------|------|
| `ResourceManager` | 统一资源管理，CRUD 操作 |
| `BaseResource` | 资源抽象基类 |
| `PDFResource` | PDF 资源实现 |
| `LinkResource` | 链接资源实现 |
| `NoteResource` | 笔记资源实现 |
| `FileResource` | 通用文件资源实现 |

## 📖 相关文档

- [开发规范 (CODE_SPEC.md)](./CODE_SPEC.md) - 详细的架构设计和开发规范
- [更新日志 (RELEASE_LOG.md)](./RELEASE_LOG.md) - 版本发布历史

## 📄 数据存储

应用数据存储在用户目录下：

| 平台 | 路径 |
|------|------|
| macOS | `~/Library/Application Support/academia/academia-data.json` |
| Windows | `%APPDATA%/academia/academia-data.json` |
| Linux | `~/.config/academia/academia-data.json` |

> ⚠️ **注意**: 文件资源仅存储路径引用，不会复制原始文件。移动或删除原始文件会导致无法打开。

## 🛣️ 路线图

- [ ] 全文搜索 - PDF 内容搜索
- [ ] 云同步 - 跨设备数据同步
- [ ] 文献引用 - BibTeX 导入导出
- [ ] 插件系统 - 扩展功能支持
- [ ] 暗色主题 - Dark Mode 支持
- [ ] 快捷键 - 键盘操作支持

## ⭐ Star 历史

<!-- 
  📌 使用前请替换:
  - yepingbai → 你的 GitHub 用户名
  - Academia → 你的仓库名（如果不同）
-->

<a href="https://star-history.com/#yepingbai/Academia&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=yepingbai/Academia&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=yepingbai/Academia&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=yepingbai/Academia&type=Date" />
 </picture>
</a>

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！

## 📜 许可证

[MIT License](./LICENSE)

---

<p align="center">Made with ❤️ for researchers and knowledge workers</p>
