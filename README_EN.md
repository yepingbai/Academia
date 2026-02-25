# Academia

<p align="center">
  <img src="https://img.shields.io/badge/Electron-28.0.0-47848F?logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-blue" alt="Platform">
</p>

<p align="center">
  <a href="./README.md">中文</a> | <a href="./README_EN.md">English</a>
</p>

An elegant academic resource management tool for researchers, students, and knowledge workers to efficiently manage PDFs, notes, links, and various file resources.

## ✨ Features

### 📚 Multi-Type Resource Management
- **PDF Documents** - Import, preview, and manage academic papers and e-books
- **Markdown Notes** - Built-in editor with real-time preview
- **Web Links** - Quick save web pages with auto-fetched titles
- **General Files** - Support for text, images, audio, video, code, and more

### 🏷️ Flexible Tag System
- **Hierarchical Tags** - Unlimited parent-child tag structure
- **Colorful Tags** - Custom tag colors for visual categorization
- **Batch Management** - Quick add/remove tags from resources

### 🔍 Efficient Search
- **Real-time Search** - Instant resource filtering
- **Tag Filtering** - Filter by tag hierarchy
- **Type Filtering** - Filter by resource type

### 👁️ Rich Preview Support
- **PDF Preview** - Embedded PDF reader
- **Image Preview** - JPG, PNG, GIF, WebP support
- **Audio Player** - Built-in audio playback
- **Video Player** - Built-in video playback
- **Text/Code Preview** - Syntax highlighting
- **Markdown Rendering** - Live Markdown preview

### 🎨 Modern Interface
- **macOS Style** - Native title bar, system integration
- **Card View** - Clean resource card display
- **Three-Column Layout** - Tag nav, resource list, preview panel
- **Responsive Design** - Adapts to window size

## 📷 Interface Preview

```
┌──────────────────────────────────────────────────────────────┐
│  Academia                                              ─ □ ✕  │
├──────────┬───────────────────────────┬───────────────────────┤
│  Tags    │     Resource List         │    Preview Panel      │
│          │                           │                       │
│ ▼ All    │  ┌─────┐ ┌─────┐         │  ┌─────────────────┐  │
│   📄 PDF │  │ PDF │ │ Note│         │  │                 │  │
│   🔗 Link│  └─────┘ └─────┘         │  │   PDF Preview   │  │
│   📝 Note│  ┌─────┐ ┌─────┐         │  │                 │  │
│   📁 File│  │ Link│ │ File│         │  │                 │  │
│          │  └─────┘ └─────┘         │  └─────────────────┘  │
│ ▼ Work   │                           │                       │
│   Proj A │                           │  File: paper.pdf      │
│   Proj B │                           │  Size: 2.5 MB         │
│ ▼ Study  │                           │  Added: 2024-01-15    │
│   ML     │                           │                       │
└──────────┴───────────────────────────┴───────────────────────┘
```

## 🚀 Quick Start

### Requirements
- Node.js 18+
- npm or yarn

### Install Dependencies
```bash
npm install
```

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Run Tests
```bash
# Run all tests
npm test

# Generate coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

### Build Application
```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

### Local CI
```bash
# Full CI pipeline
npm run ci:local

# Build all platforms
npm run ci:local:all
```

## 📁 Supported File Types

| Type | Extensions | Preview |
|------|------------|---------|
| PDF | `.pdf` | ✅ Embedded reader |
| Image | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`, `.bmp`, `.ico` | ✅ Image preview |
| Audio | `.mp3`, `.wav`, `.ogg`, `.m4a`, `.flac`, `.aac` | ✅ Audio player |
| Video | `.mp4`, `.webm`, `.mkv`, `.avi`, `.mov`, `.wmv` | ✅ Video player |
| Text | `.txt`, `.md`, `.json`, `.xml`, `.csv`, `.log` | ✅ Text preview |
| Code | `.js`, `.ts`, `.py`, `.java`, `.c`, `.cpp`, `.go`, `.rs`, `.html`, `.css` | ✅ Code preview |
| Archive | `.zip`, `.rar`, `.7z`, `.tar`, `.gz` | ❌ External open |
| Document | `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx` | ❌ External open |

## 🏗️ Architecture

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

### Core Modules

| Module | Responsibility |
|--------|----------------|
| `ResourceManager` | Unified resource management, CRUD operations |
| `BaseResource` | Abstract base class for resources |
| `PDFResource` | PDF resource implementation |
| `LinkResource` | Link resource implementation |
| `NoteResource` | Note resource implementation |
| `FileResource` | General file resource implementation |

## 📖 Documentation

- [Development Spec (CODE_SPEC.md)](./CODE_SPEC.md) - Architecture and development guidelines
- [Release Log (RELEASE_LOG.md)](./RELEASE_LOG.md) - Version history

## 📄 Data Storage

Application data is stored in the user directory:

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/academia/academia-data.json` |
| Windows | `%APPDATA%/academia/academia-data.json` |
| Linux | `~/.config/academia/academia-data.json` |

> ⚠️ **Note**: File resources only store path references, original files are not copied. Moving or deleting original files will make them inaccessible.

## 🛣️ Roadmap

- [ ] Full-text Search - PDF content search
- [ ] Cloud Sync - Cross-device data synchronization
- [ ] Citation Management - BibTeX import/export
- [ ] Plugin System - Extension support
- [ ] Dark Theme - Dark Mode support
- [ ] Keyboard Shortcuts - Keyboard navigation

## 🤝 Contributing

Issues and Pull Requests are welcome!

If this project helps you, please give it a ⭐ Star!

## 📜 License

[MIT License](./LICENSE)

---

<p align="center">Made with ❤️ for researchers and knowledge workers</p>
