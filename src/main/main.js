const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 导入资源管理模块
const { ResourceManager } = require('./resources');

// 初始化数据存储
const store = new Store({
  name: 'academia-data',
  defaults: {
    pdfs: [],
    tags: [],
    links: [],
    notes: [],
    files: []
  }
});

// 初始化资源管理器
const resourceManager = new ResourceManager(store);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#f5f5f7'
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // 开发模式下打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ============ 资源统一 API ============

// 获取所有资源类型配置
ipcMain.handle('resource:get-types', () => {
  return resourceManager.getAllTypes();
});

// 获取文件类型配置（用于上传）
ipcMain.handle('resource:get-file-type-config', () => {
  return resourceManager.getFileTypeConfig();
});

// 获取指定类型的所有资源
ipcMain.handle('resource:get-all', (event, type) => {
  const resources = resourceManager.getAll(type);
  return resources.map(r => r.toJSON());
});

// 获取所有资源
ipcMain.handle('resource:get-all-resources', () => {
  const resources = resourceManager.getAllResources();
  return resources.map(r => r.toJSON());
});

// 获取单个资源
ipcMain.handle('resource:get', (event, { type, id }) => {
  const resource = resourceManager.get(type, id);
  return resource ? resource.toJSON() : null;
});

// 添加资源
ipcMain.handle('resource:add', (event, { type, data }) => {
  const result = resourceManager.add(type, data);
  if (result.success) {
    return { success: true, resource: result.resource.toJSON() };
  }
  return result;
});

// 从文件路径添加资源
ipcMain.handle('resource:add-from-path', (event, { filePath, subtype }) => {
  const result = resourceManager.addFromPath(filePath, subtype);
  if (result.success) {
    return { success: true, resource: result.resource.toJSON() };
  }
  return result;
});

// 更新资源
ipcMain.handle('resource:update', (event, { type, id, data }) => {
  const result = resourceManager.update(type, id, data);
  if (result.success) {
    return { success: true, resource: result.resource.toJSON() };
  }
  return result;
});

// 更新资源标签
ipcMain.handle('resource:update-tags', (event, { type, id, tags }) => {
  const result = resourceManager.updateTags(type, id, tags);
  if (result.success) {
    return { success: true, resource: result.resource.toJSON() };
  }
  return result;
});

// 删除资源
ipcMain.handle('resource:delete', (event, { type, id }) => {
  return resourceManager.delete(type, id);
});

// 打开资源
ipcMain.handle('resource:open', (event, { type, id }) => {
  return resourceManager.open(type, id);
});

// 读取资源内容
ipcMain.handle('resource:read-content', async (event, { type, id }) => {
  return resourceManager.readContent(type, id);
});

// 读取文件内容（通过路径）
ipcMain.handle('resource:read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// 选择文件对话框
ipcMain.handle('resource:select-file', async (event, { fileType, multiple = true }) => {
  const config = resourceManager.getFileTypeConfig();
  let filters = [];
  
  if (fileType === 'all') {
    // 所有支持的类型
    const allExtensions = [];
    for (const conf of Object.values(config)) {
      allExtensions.push(...conf.extensions);
    }
    filters = [{ name: '所有支持的文件', extensions: allExtensions }];
  } else if (config[fileType]) {
    filters = [{ name: config[fileType].name, extensions: config[fileType].extensions }];
  } else {
    // 默认所有文件
    filters = [{ name: '所有文件', extensions: ['*'] }];
  }
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: multiple ? ['openFile', 'multiSelections'] : ['openFile'],
    filters: filters
  });
  
  return result;
});

// ============ 兼容旧 API（逐步迁移后可删除）============

// 获取文件类型配置（旧 API）
ipcMain.handle('get-file-type-config', () => {
  return resourceManager.getFileTypeConfig();
});

// 选择文件（旧 API）
ipcMain.handle('select-file', async (event, fileType) => {
  const config = resourceManager.getFileTypeConfig();
  let filters = [];
  
  if (fileType === 'all') {
    const allExtensions = [];
    for (const conf of Object.values(config)) {
      allExtensions.push(...conf.extensions);
    }
    filters = [{ name: '所有支持的文件', extensions: allExtensions }];
  } else if (config[fileType]) {
    filters = [{ name: config[fileType].name, extensions: config[fileType].extensions }];
  } else {
    filters = [{ name: 'PDF Files', extensions: ['pdf'] }];
  }
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: filters
  });
  return result;
});

// 选择 PDF（旧 API）
ipcMain.handle('select-pdf', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
  });
  return result;
});

// 添加文件（旧 API）
ipcMain.handle('add-file', async (event, { filePath, fileType }) => {
  const result = resourceManager.addFromPath(filePath, fileType);
  if (result.success) {
    return { success: true, file: result.resource.toJSON() };
  }
  return result;
});

// 获取所有文件（旧 API）
ipcMain.handle('get-files', () => {
  return store.get('files');
});

// 删除文件（旧 API）
ipcMain.handle('delete-file', (event, fileId) => {
  return resourceManager.delete('file', fileId);
});

// 更新文件标签（旧 API）
ipcMain.handle('update-file-tags', (event, { fileId, tags }) => {
  const result = resourceManager.updateTags('file', fileId, tags);
  if (result.success) {
    return { success: true, file: result.resource.toJSON() };
  }
  return result;
});

// 打开文件（旧 API）
ipcMain.handle('open-file', (event, filePath) => {
  shell.openPath(filePath);
});

// 读取文本文件（旧 API）
ipcMain.handle('read-text-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// 添加 PDF（旧 API）
ipcMain.handle('add-pdf', async (event, pdfPath) => {
  const result = resourceManager.addFromPath(pdfPath);
  if (result.success) {
    return { success: true, pdf: result.resource.toJSON() };
  }
  return result;
});

// 获取所有 PDF（旧 API）
ipcMain.handle('get-pdfs', () => {
  return store.get('pdfs');
});

// 删除 PDF（旧 API）
ipcMain.handle('delete-pdf', (event, pdfId) => {
  return resourceManager.delete('pdf', pdfId);
});

// 更新 PDF 标签（旧 API）
ipcMain.handle('update-pdf-tags', (event, { pdfId, tags }) => {
  const result = resourceManager.updateTags('pdf', pdfId, tags);
  if (result.success) {
    return { success: true, pdf: result.resource.toJSON() };
  }
  return result;
});

// 重命名 PDF（旧 API）
ipcMain.handle('rename-pdf', (event, { pdfId, newName }) => {
  const result = resourceManager.update('pdf', pdfId, { name: newName });
  if (result.success) {
    return { success: true, pdf: result.resource.toJSON() };
  }
  return result;
});

// 打开 PDF（旧 API）
ipcMain.handle('open-pdf', (event, pdfPath) => {
  shell.openPath(pdfPath);
});

// ============ 标签管理 ============

// 获取所有标签
ipcMain.handle('get-tags', () => {
  return store.get('tags');
});

// 添加标签
ipcMain.handle('add-tag', (event, { name, parentId = null, color = '#6366f1' }) => {
  const tags = store.get('tags');
  
  const newTag = {
    id: uuidv4(),
    name,
    parentId,
    color,
    createdAt: new Date().toISOString()
  };

  tags.push(newTag);
  store.set('tags', tags);
  
  return { success: true, tag: newTag };
});

// 更新标签
ipcMain.handle('update-tag', (event, { tagId, name, color, parentId }) => {
  const tags = store.get('tags');
  const index = tags.findIndex(t => t.id === tagId);
  if (index !== -1) {
    if (name !== undefined) tags[index].name = name;
    if (color !== undefined) tags[index].color = color;
    if (parentId !== undefined) tags[index].parentId = parentId;
    store.set('tags', tags);
    return { success: true, tag: tags[index] };
  }
  return { success: false };
});

// 删除标签
ipcMain.handle('delete-tag', (event, tagId) => {
  let tags = store.get('tags');
  
  // 递归获取所有子标签ID
  const getChildIds = (parentId) => {
    const children = tags.filter(t => t.parentId === parentId);
    let ids = children.map(c => c.id);
    children.forEach(c => {
      ids = ids.concat(getChildIds(c.id));
    });
    return ids;
  };

  const idsToDelete = [tagId, ...getChildIds(tagId)];
  tags = tags.filter(t => !idsToDelete.includes(t.id));
  store.set('tags', tags);

  // 使用资源管理器移除标签
  resourceManager.removeTagsFromAll(idsToDelete);

  return { success: true, deletedIds: idsToDelete };
});

// ============ 链接管理（旧 API）============

// 获取所有链接
ipcMain.handle('get-links', () => {
  return store.get('links');
});

// 添加链接
ipcMain.handle('add-link', (event, { url, title, description = '' }) => {
  const result = resourceManager.add('link', { url, title, description });
  if (result.success) {
    return { success: true, link: result.resource.toJSON() };
  }
  return result;
});

// 更新链接
ipcMain.handle('update-link', (event, { linkId, title, url, description }) => {
  const result = resourceManager.update('link', linkId, { title, url, description });
  if (result.success) {
    return { success: true, link: result.resource.toJSON() };
  }
  return result;
});

// 删除链接
ipcMain.handle('delete-link', (event, linkId) => {
  return resourceManager.delete('link', linkId);
});

// 更新链接标签
ipcMain.handle('update-link-tags', (event, { linkId, tags }) => {
  const result = resourceManager.updateTags('link', linkId, tags);
  if (result.success) {
    return { success: true, link: result.resource.toJSON() };
  }
  return result;
});

// 打开链接
ipcMain.handle('open-link', (event, url) => {
  shell.openExternal(url);
});

// ============ 笔记管理（旧 API）============

// 获取所有笔记
ipcMain.handle('get-notes', () => {
  return store.get('notes');
});

// 添加笔记
ipcMain.handle('add-note', (event, { title, content = '' }) => {
  const result = resourceManager.add('note', { title, content });
  if (result.success) {
    return { success: true, note: result.resource.toJSON() };
  }
  return result;
});

// 更新笔记
ipcMain.handle('update-note', (event, { noteId, title, content }) => {
  const result = resourceManager.update('note', noteId, { title, content });
  if (result.success) {
    return { success: true, note: result.resource.toJSON() };
  }
  return result;
});

// 删除笔记
ipcMain.handle('delete-note', (event, noteId) => {
  return resourceManager.delete('note', noteId);
});

// 更新笔记标签
ipcMain.handle('update-note-tags', (event, { noteId, tags }) => {
  const result = resourceManager.updateTags('note', noteId, tags);
  if (result.success) {
    return { success: true, note: result.resource.toJSON() };
  }
  return result;
});
