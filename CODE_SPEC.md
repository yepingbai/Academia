# Academia 开发规范

本文档定义了 Academia 项目的架构设计、代码规范和开发指南。

## 目录

- [项目结构](#项目结构)
- [架构设计](#架构设计)
- [资源类型系统](#资源类型系统)
- [IPC 通信规范](#ipc-通信规范)
- [数据存储规范](#数据存储规范)
- [前端架构](#前端架构)
- [开发规范](#开发规范)
- [扩展指南](#扩展指南)

---

## 项目结构

```
Academia/
├── package.json              # 项目配置
├── jest.config.js            # Jest 测试配置
├── .eslintrc.js              # ESLint 配置
├── README.md                 # 项目说明
├── CODE_SPEC.md              # 开发规范（本文档）
├── RELEASE_LOG.md            # 发版记录
├── node_modules/             # 依赖包
├── dist/                     # 构建产物
├── coverage/                 # 测试覆盖率报告
├── .github/
│   └── workflows/
│       ├── ci.yml            # CI 工作流
│       └── release.yml       # 发布工作流
├── scripts/
│   └── ci-local.js           # 本地 CI 脚本
├── tests/                    # 单元测试
│   ├── setup.js              # 测试环境设置
│   └── resources/            # 资源类型测试
│       ├── BaseResource.test.js
│       ├── PDFResource.test.js
│       ├── LinkResource.test.js
│       ├── NoteResource.test.js
│       ├── FileResource.test.js
│       └── ResourceManager.test.js
└── src/
    ├── main/                 # 主进程代码
    │   ├── main.js           # 主进程入口，IPC 处理
    │   ├── preload.js        # 预加载脚本，桥接 API
    │   └── resources/        # 资源类型模块
    │       ├── index.js      # 模块导出
    │       ├── BaseResource.js      # 资源抽象基类
    │       ├── ResourceManager.js   # 资源管理器
    │       ├── PDFResource.js       # PDF 资源
    │       ├── LinkResource.js      # 链接资源
    │       ├── NoteResource.js      # 笔记资源
    │       └── FileResource.js      # 通用文件资源
    └── renderer/             # 渲染进程代码
        ├── index.html        # 主页面
        ├── scripts/
        │   └── app.js        # 前端应用逻辑
        └── styles/
            └── main.css      # 样式文件
```

---

## 架构设计

### 整体架构

Academia 采用 Electron 架构，分为主进程和渲染进程：

```
┌─────────────────────────────────────────────────────────────────┐
│                       Electron Application                      │
├─────────────────────────────┬───────────────────────────────────┤
│        Main Process         │        Renderer Process           │
│                             │                                   │
│  ┌───────────────────────┐  │  ┌─────────────────────────────┐  │
│  │      main.js          │  │  │        index.html           │  │
│  │  ┌─────────────────┐  │  │  │  ┌───────────────────────┐  │  │
│  │  │ IPC Handlers    │◄─┼──┼──┼─►│      app.js           │  │  │
│  │  │ ├─ resource:*   │  │  │  │  │  ├─ State Management  │  │  │
│  │  │ ├─ tag:*        │  │  │  │  │  ├─ UI Rendering      │  │  │
│  │  │ └─ legacy:*     │  │  │  │  │  └─ Event Handling    │  │  │
│  │  └─────────────────┘  │  │  │  └───────────────────────┘  │  │
│  │                       │  │  │  ┌───────────────────────┐  │  │
│  │  ┌─────────────────┐  │  │  │  │     main.css          │  │  │
│  │  │ResourceManager  │  │  │  │  │  └─ Component Styles  │  │  │
│  │  │ ├─ PDF          │  │  │  │  └───────────────────────┘  │  │
│  │  │ ├─ Link         │  │  │  └─────────────────────────────┘  │
│  │  │ ├─ Note         │  │  │                                   │
│  │  │ └─ File         │  │  │                                   │
│  │  └─────────────────┘  │  │                                   │
│  │                       │  │                                   │
│  │  ┌─────────────────┐  │  │         preload.js                │
│  │  │ electron-store  │  │  │  ┌─────────────────────────────┐  │
│  │  │ (Persistence)   │  │  │  │  contextBridge API          │  │
│  │  └─────────────────┘  │  │  │  └─ window.electronAPI      │  │
│  └───────────────────────┘  │  └─────────────────────────────┘  │
└─────────────────────────────┴───────────────────────────────────┘
```

### 进程职责

| 进程 | 职责 |
|------|------|
| **Main Process** | 系统 API 调用、文件操作、数据存储、原生对话框 |
| **Renderer Process** | UI 渲染、用户交互、状态管理 |
| **Preload Script** | 安全桥接，暴露受限 API 给渲染进程 |

### 数据流

```
┌──────────────┐      IPC invoke       ┌──────────────┐
│   Renderer   │ ─────────────────────► │    Main      │
│   (app.js)   │                        │  (main.js)   │
│              │ ◄───────────────────── │              │
│  state.pdfs  │      IPC response      │  store.get   │
│  state.tags  │                        │  store.set   │
└──────────────┘                        └──────────────┘
```

---

## 资源类型系统

### 类层次结构

```
BaseResource (抽象基类)
│
├── PDFResource
│   └── type: 'pdf'
│   └── storeKey: 'pdfs'
│
├── LinkResource
│   └── type: 'link'
│   └── storeKey: 'links'
│
├── NoteResource
│   └── type: 'note'
│   └── storeKey: 'notes'
│
└── FileResource
    └── type: 'file'
    └── storeKey: 'files'
    └── subtypes:
        ├── txt      (文本文件)
        ├── audio    (音频文件)
        ├── image    (图片文件)
        ├── video    (视频文件)
        ├── code     (代码文件)
        ├── archive  (压缩文件)
        └── document (办公文档)
```

### BaseResource 基类

所有资源类型必须继承 `BaseResource` 并实现必要的静态属性和方法。

```javascript
class BaseResource {
  // ========== 静态属性（子类必须覆写）==========
  static type = 'base';           // 资源类型标识
  static displayName = '基础资源'; // 显示名称
  static icon = 'file';           // 图标标识
  static color = '#6366f1';       // 主题色
  static storeKey = 'resources';  // 存储键名
  static supportsPreview = true;  // 是否支持预览
  static supportsEdit = false;    // 是否支持编辑
  static isFileBased = false;     // 是否基于文件路径
  
  // ========== 实例属性 ==========
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.type = this.constructor.type;
    this.tags = data.tags || [];
    this.addedAt = data.addedAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || this.addedAt;
  }
  
  // ========== 必须实现的方法 ==========
  getDisplayName() { }     // 获取显示名称
  getSearchText() { }      // 获取搜索文本
  toJSON() { }             // 序列化为存储对象
  static fromJSON(data) { } // 从存储对象创建实例
  static validate(data) { } // 验证数据
}
```

### 资源数据结构

#### PDFResource
```javascript
{
  id: "uuid",
  type: "pdf",
  name: "论文标题",
  path: "/path/to/file.pdf",
  size: 1024000,
  tags: ["tag-id-1", "tag-id-2"],
  addedAt: "2024-01-15T10:30:00.000Z",
  updatedAt: "2024-01-15T10:30:00.000Z"
}
```

#### LinkResource
```javascript
{
  id: "uuid",
  type: "link",
  title: "网页标题",
  url: "https://example.com",
  description: "网页描述",
  favicon: "https://example.com/favicon.ico",
  tags: ["tag-id-1"],
  addedAt: "2024-01-15T10:30:00.000Z",
  updatedAt: "2024-01-15T10:30:00.000Z"
}
```

#### NoteResource
```javascript
{
  id: "uuid",
  type: "note",
  title: "笔记标题",
  content: "# Markdown 内容\n\n正文...",
  tags: ["tag-id-1"],
  addedAt: "2024-01-15T10:30:00.000Z",
  updatedAt: "2024-01-16T14:20:00.000Z"
}
```

#### FileResource
```javascript
{
  id: "uuid",
  type: "file",
  name: "文件名",
  path: "/path/to/file.mp3",
  extension: "mp3",
  size: 5120000,
  subtype: "audio",      // txt | audio | image | video | code | archive | document
  fileType: "audio",     // 兼容旧字段
  tags: ["tag-id-1"],
  addedAt: "2024-01-15T10:30:00.000Z",
  updatedAt: "2024-01-15T10:30:00.000Z"
}
```

#### Tag
```javascript
{
  id: "uuid",
  name: "标签名称",
  parentId: "parent-tag-id",  // null 表示顶级标签
  color: "#6366f1",
  createdAt: "2024-01-15T10:30:00.000Z"
}
```

---

## IPC 通信规范

### 新版统一 API（推荐）

所有资源操作通过 `resource:*` 系列接口进行：

| 接口 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `resource:get-types` | - | `{ [type]: TypeConfig }` | 获取所有资源类型配置 |
| `resource:get-all` | `type` | `Resource[]` | 获取指定类型的所有资源 |
| `resource:get-all-resources` | - | `Resource[]` | 获取所有资源 |
| `resource:get` | `{ type, id }` | `Resource \| null` | 获取单个资源 |
| `resource:add` | `{ type, data }` | `{ success, resource?, message? }` | 添加资源 |
| `resource:add-from-path` | `{ filePath, subtype? }` | `{ success, resource?, message? }` | 从文件路径添加 |
| `resource:update` | `{ type, id, data }` | `{ success, resource?, message? }` | 更新资源 |
| `resource:update-tags` | `{ type, id, tags }` | `{ success, resource?, message? }` | 更新资源标签 |
| `resource:delete` | `{ type, id }` | `{ success }` | 删除资源 |
| `resource:open` | `{ type, id }` | - | 打开资源 |
| `resource:select-file` | `{ fileType, multiple? }` | `DialogResult` | 打开文件选择对话框 |

### 前端调用示例

```javascript
// 获取所有 PDF
const pdfs = await window.electronAPI.resource.getAll('pdf');

// 添加笔记
const result = await window.electronAPI.resource.add('note', {
  title: '新笔记',
  content: '# 内容'
});

// 更新标签
await window.electronAPI.resource.updateTags('pdf', pdfId, ['tag-1', 'tag-2']);

// 删除资源
await window.electronAPI.resource.delete('link', linkId);
```

### 旧版 API（兼容，逐步迁移）

旧版 API 仍然可用，但新代码应使用统一 API：

```javascript
// 旧版 - 不推荐
await window.electronAPI.getPdfs();
await window.electronAPI.addPdf(path);

// 新版 - 推荐
await window.electronAPI.resource.getAll('pdf');
await window.electronAPI.resource.addFromPath(path);
```

---

## 数据存储规范

### 存储位置

使用 `electron-store` 存储，位置由操作系统决定：

| 平台 | 路径 |
|------|------|
| macOS | `~/Library/Application Support/academia/academia-data.json` |
| Windows | `%APPDATA%/academia/academia-data.json` |
| Linux | `~/.config/academia/academia-data.json` |

### 存储结构

```javascript
{
  "pdfs": [...],      // PDF 资源数组
  "links": [...],     // 链接资源数组
  "notes": [...],     // 笔记资源数组
  "files": [...],     // 文件资源数组
  "tags": [...]       // 标签数组
}
```

### 存储注意事项

1. **文件路径存储**: PDF 和文件资源仅存储路径，不存储文件内容
2. **ID 唯一性**: 所有资源使用 UUID v4 作为唯一标识
3. **时间戳**: 使用 ISO 8601 格式存储时间
4. **标签引用**: 资源通过标签 ID 数组引用标签

---

## 前端架构

### 状态管理

前端使用简单的状态对象管理数据：

```javascript
const state = {
  pdfs: [],           // PDF 列表
  files: [],          // 文件列表
  links: [],          // 链接列表
  notes: [],          // 笔记列表
  tags: [],           // 标签列表
  currentTag: null,   // 当前选中的标签
  currentResource: null,  // 当前选中的资源
  searchQuery: '',    // 搜索关键词
  viewMode: 'grid'    // 视图模式
};
```

### UI 组件结构

```
┌─────────────────────────────────────────────────────────────┐
│  Header (标题栏 + 搜索 + 操作按钮)                            │
├─────────┬────────────────────────────┬──────────────────────┤
│         │                            │                      │
│ Sidebar │      Resource List         │   Preview Panel      │
│         │                            │                      │
│ ├─ All  │  ┌──────┐ ┌──────┐        │  ┌────────────────┐  │
│ ├─ PDF  │  │ Card │ │ Card │        │  │                │  │
│ ├─ Link │  └──────┘ └──────┘        │  │   Preview      │  │
│ ├─ Note │  ┌──────┐ ┌──────┐        │  │   Content      │  │
│ └─ File │  │ Card │ │ Card │        │  │                │  │
│         │  └──────┘ └──────┘        │  └────────────────┘  │
│ Tags:   │                            │                      │
│ ├─ Tag1 │                            │  Metadata            │
│ └─ Tag2 │                            │  ├─ 文件名           │
│         │                            │  ├─ 大小             │
│         │                            │  └─ 添加时间         │
└─────────┴────────────────────────────┴──────────────────────┘
```

### 核心函数

| 函数 | 职责 |
|------|------|
| `loadAllData()` | 加载所有数据 |
| `renderResources()` | 渲染资源列表 |
| `renderTags()` | 渲染标签树 |
| `showPreview()` | 显示预览面板 |
| `handleSearch()` | 处理搜索 |
| `handleCardAction()` | 处理卡片操作 |

---

## 开发规范

### 代码风格

1. **命名规范**
   - 类名：PascalCase（`PDFResource`）
   - 函数名：camelCase（`getDisplayName`）
   - 常量：UPPER_SNAKE_CASE（`RESOURCE_TYPES`）
   - 文件名：PascalCase 或 camelCase

2. **注释规范**
   - 类和方法使用 JSDoc 注释
   - 复杂逻辑添加行内注释
   - 文件头部添加模块说明

3. **错误处理**
   - API 返回统一格式：`{ success: boolean, data?, message? }`
   - 使用 try-catch 包装异步操作

### Git 规范

```
<type>(<scope>): <subject>

feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构
perf: 性能优化
test: 测试
chore: 构建/工具
```

示例：
```
feat(resource): 添加视频文件预览支持
fix(tag): 修复子标签删除时未更新资源的问题
docs: 更新 README 文档
```

---

## 扩展指南

### 添加新资源类型

1. **创建资源类**

```javascript
// src/main/resources/BookResource.js
const BaseResource = require('./BaseResource');

class BookResource extends BaseResource {
  static type = 'book';
  static displayName = '电子书';
  static icon = 'book';
  static color = '#10b981';
  static storeKey = 'books';
  static supportsPreview = true;
  static supportsEdit = false;
  static isFileBased = true;
  static extensions = ['epub', 'mobi', 'azw3'];
  
  constructor(data = {}) {
    super(data);
    this.name = data.name || '';
    this.path = data.path || '';
    this.author = data.author || '';
    this.pages = data.pages || 0;
  }
  
  getDisplayName() {
    return this.name;
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      path: this.path,
      author: this.author,
      pages: this.pages
    };
  }
  
  static validate(data) {
    if (!data.path) {
      return { valid: false, message: '文件路径不能为空' };
    }
    return { valid: true };
  }
}

module.exports = BookResource;
```

2. **注册资源类型**

```javascript
// src/main/resources/index.js
const BookResource = require('./BookResource');

const RESOURCE_TYPES = {
  // ... existing types
  book: BookResource
};
```

3. **更新存储默认值**

```javascript
// src/main/main.js
const store = new Store({
  defaults: {
    // ... existing
    books: []  // 新增
  }
});
```

4. **添加前端支持**

```javascript
// src/renderer/scripts/app.js
// 添加渲染函数
function renderBookCard(book, isActive) { ... }

// 添加预览支持
if (type === 'book') { ... }

// 添加图标
function getBookIcon() { ... }
```

5. **添加样式**

```css
/* src/renderer/styles/main.css */
.resource-preview.file-type.book {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.resource-type-badge.book {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
```

### 添加文件子类型

在 `FileResource.js` 中扩展 `FILE_SUBTYPES`：

```javascript
const FILE_SUBTYPES = {
  // ... existing subtypes
  ebook: {
    name: '电子书',
    extensions: ['epub', 'mobi', 'azw3'],
    icon: 'book',
    color: '#10b981'
  }
};
```

---

## 测试

### 单元测试

项目使用 Jest 作为测试框架，测试文件位于 `tests/` 目录。

#### 运行测试

```bash
# 运行所有测试
npm test

# 监视模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

#### 测试结构

```
tests/
├── setup.js                    # 测试环境配置
└── resources/                  # 资源类型测试
    ├── BaseResource.test.js    # 基类测试
    ├── PDFResource.test.js     # PDF 资源测试
    ├── LinkResource.test.js    # 链接资源测试
    ├── NoteResource.test.js    # 笔记资源测试
    ├── FileResource.test.js    # 文件资源测试
    └── ResourceManager.test.js # 资源管理器测试
```

#### 编写测试

```javascript
// 示例：测试新资源类型
describe('CustomResource', () => {
  test('应正确创建实例', () => {
    const resource = new CustomResource({ name: 'test' });
    expect(resource.name).toBe('test');
  });
});
```

#### 覆盖率要求

| 指标 | 最低要求 |
|------|---------|
| Branches | 60% |
| Functions | 70% |
| Lines | 70% |
| Statements | 70% |

### 手动测试清单

- [ ] 添加各类型资源
- [ ] 删除资源
- [ ] 更新资源标签
- [ ] 创建/删除层级标签
- [ ] 搜索功能
- [ ] 预览各类型文件
- [ ] 外部打开文件
- [ ] 窗口缩放适配

### 测试数据重置

删除存储文件即可重置所有数据：

```bash
# macOS
rm ~/Library/Application\ Support/academia/academia-data.json

# Windows
del %APPDATA%\academia\academia-data.json

# Linux
rm ~/.config/academia/academia-data.json
```

---

## CI/CD

### GitHub Actions

项目配置了两个 GitHub Actions 工作流：

#### CI 工作流 (`.github/workflows/ci.yml`)

在 `push` 和 `pull_request` 时自动触发：

```
Lint → Test → Build (macOS/Windows/Linux)
```

| 步骤 | 说明 |
|------|------|
| **Lint** | ESLint 代码检查 |
| **Test** | Jest 单元测试 + 覆盖率 |
| **Build** | 三平台并行构建 |

#### Release 工作流 (`.github/workflows/release.yml`)

在推送 `v*` 标签时触发，自动构建并发布到 GitHub Releases。

```bash
# 发布新版本
git tag v1.0.1
git push origin v1.0.1
```

### 本地 CI

项目提供两个版本的本地 CI 脚本：

| 版本 | 文件 | 说明 |
|------|------|------|
| **Node.js** | `scripts/ci-local.js` | 功能完整，需要 Node.js 环境 |
| **Shell** | `scripts/ci-local.sh` | 更轻量，适合 CI 环境和自动化 |

#### Node.js 版本

```bash
# 完整 CI 流程（当前平台）
npm run ci:local

# 构建所有平台
npm run ci:local:all

# 仅运行测试
node scripts/ci-local.js --test

# 仅代码检查
node scripts/ci-local.js --lint

# 指定平台构建
node scripts/ci-local.js --mac --win
```

#### Shell 版本

```bash
# 完整 CI 流程（当前平台）
npm run ci:sh
# 或直接执行
./scripts/ci-local.sh

# 构建所有平台
npm run ci:sh:all
# 或
./scripts/ci-local.sh --all

# 仅运行测试
./scripts/ci-local.sh --test

# 仅代码检查
./scripts/ci-local.sh --lint

# 指定平台构建
./scripts/ci-local.sh --mac --win
```

#### 命令参数（两版本通用）

| 参数 | 说明 |
|------|------|
| `--all` | 构建所有平台 |
| `--mac` | 仅构建 macOS |
| `--win` | 仅构建 Windows |
| `--linux` | 仅构建 Linux |
| `--test` | 仅运行测试 |
| `--lint` | 仅运行代码检查 |
| `--skip-test` | 跳过测试 |
| `--skip-lint` | 跳过代码检查 |

#### 跨平台构建注意事项

| 目标平台 | 构建环境要求 |
|---------|-------------|
| macOS | 需要在 macOS 系统上 |
| Windows | Windows 或 Wine |
| Linux | macOS 或 Linux |

### NPM 脚本

```bash
# 开发
npm run dev          # 开发模式运行
npm start            # 生产模式运行

# 测试
npm test             # 运行测试
npm run test:watch   # 监视模式
npm run test:coverage # 生成覆盖率

# 代码检查
npm run lint         # 运行 ESLint
npm run lint:fix     # 自动修复

# 构建
npm run build        # 构建当前平台
npm run build:mac    # 构建 macOS
npm run build:win    # 构建 Windows
npm run build:linux  # 构建 Linux

# CI
npm run ci           # lint + test
npm run ci:local     # 本地完整 CI (Node.js)
npm run ci:local:all # 本地 CI 全平台 (Node.js)
npm run ci:sh        # 本地完整 CI (Shell)
npm run ci:sh:all    # 本地 CI 全平台 (Shell)
```

#### 耗时统计

两个版本的 CI 脚本都支持详细的耗时统计，输出示例：

```
┌─────────────────────────────────────────────────────────────┐
│                        耗时详情                              │
├─────────────────────────────────────────────────────────────┤
│  Lint      :        2.34s                              │
│  单元测试  :        8.56s                              │
├─────────────────────────────────────────────────────────────┤
│  构建耗时                                                  │
│    MAC     :       45.21s ✓                          │
│    WIN     :       52.18s ✓                          │
│    LINUX   :       38.90s ✓                          │
│    ────────────────────                                  │
│    合计    :      136.29s                              │
├─────────────────────────────────────────────────────────────┤
│  总耗时    :      147.19s                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 常见问题

### Q: 文件无法打开？
A: 检查文件是否被移动或删除。应用只存储文件路径，不存储文件内容。

### Q: 标签删除后资源标签未更新？
A: 删除标签时会自动调用 `ResourceManager.removeTagsFromAll()` 清理所有资源中的标签引用。

### Q: 如何迁移旧版 API？
A: 旧版 API 内部已重定向到新版 `ResourceManager`，可逐步将前端代码迁移到新版统一 API。

---

*最后更新: 2026-02-26*
