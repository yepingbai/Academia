const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ============ 资源统一 API（新） ============
  resource: {
    // 获取资源类型配置
    getTypes: () => ipcRenderer.invoke('resource:get-types'),
    getFileTypeConfig: () => ipcRenderer.invoke('resource:get-file-type-config'),
    
    // CRUD 操作
    getAll: (type) => ipcRenderer.invoke('resource:get-all', type),
    getAllResources: () => ipcRenderer.invoke('resource:get-all-resources'),
    get: (type, id) => ipcRenderer.invoke('resource:get', { type, id }),
    add: (type, data) => ipcRenderer.invoke('resource:add', { type, data }),
    addFromPath: (filePath, subtype) => ipcRenderer.invoke('resource:add-from-path', { filePath, subtype }),
    update: (type, id, data) => ipcRenderer.invoke('resource:update', { type, id, data }),
    updateTags: (type, id, tags) => ipcRenderer.invoke('resource:update-tags', { type, id, tags }),
    delete: (type, id) => ipcRenderer.invoke('resource:delete', { type, id }),
    
    // 操作
    open: (type, id) => ipcRenderer.invoke('resource:open', { type, id }),
    readContent: (type, id) => ipcRenderer.invoke('resource:read-content', { type, id }),
    readFile: (filePath) => ipcRenderer.invoke('resource:read-file', filePath),
    
    // 文件选择
    selectFile: (fileType, multiple) => ipcRenderer.invoke('resource:select-file', { fileType, multiple })
  },
  
  // ============ 旧 API（兼容性保留） ============
  // 文件类型配置
  getFileTypeConfig: () => ipcRenderer.invoke('get-file-type-config'),
  
  // 通用文件操作
  selectFile: (fileType) => ipcRenderer.invoke('select-file', fileType),
  addFile: (data) => ipcRenderer.invoke('add-file', data),
  getFiles: () => ipcRenderer.invoke('get-files'),
  deleteFile: (fileId) => ipcRenderer.invoke('delete-file', fileId),
  updateFileTags: (data) => ipcRenderer.invoke('update-file-tags', data),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  readTextFile: (filePath) => ipcRenderer.invoke('read-text-file', filePath),
  
  // PDF 操作
  selectPdf: () => ipcRenderer.invoke('select-pdf'),
  addPdf: (path) => ipcRenderer.invoke('add-pdf', path),
  getPdfs: () => ipcRenderer.invoke('get-pdfs'),
  deletePdf: (id) => ipcRenderer.invoke('delete-pdf', id),
  updatePdfTags: (data) => ipcRenderer.invoke('update-pdf-tags', data),
  renamePdf: (data) => ipcRenderer.invoke('rename-pdf', data),
  openPdf: (path) => ipcRenderer.invoke('open-pdf', path),
  
  // 标签操作
  getTags: () => ipcRenderer.invoke('get-tags'),
  addTag: (data) => ipcRenderer.invoke('add-tag', data),
  updateTag: (data) => ipcRenderer.invoke('update-tag', data),
  deleteTag: (id) => ipcRenderer.invoke('delete-tag', id),
  
  // 链接操作
  getLinks: () => ipcRenderer.invoke('get-links'),
  addLink: (data) => ipcRenderer.invoke('add-link', data),
  updateLink: (data) => ipcRenderer.invoke('update-link', data),
  deleteLink: (id) => ipcRenderer.invoke('delete-link', id),
  updateLinkTags: (data) => ipcRenderer.invoke('update-link-tags', data),
  openLink: (url) => ipcRenderer.invoke('open-link', url),
  
  // 笔记操作
  getNotes: () => ipcRenderer.invoke('get-notes'),
  addNote: (data) => ipcRenderer.invoke('add-note', data),
  updateNote: (data) => ipcRenderer.invoke('update-note', data),
  deleteNote: (id) => ipcRenderer.invoke('delete-note', id),
  updateNoteTags: (data) => ipcRenderer.invoke('update-note-tags', data)
});
