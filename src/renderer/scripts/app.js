// ============ 状态管理 ============
const state = {
  pdfs: [],
  links: [],
  notes: [],
  files: [], // 新增：通用文件
  tags: [],
  fileTypeConfig: {}, // 文件类型配置
  selectedTag: null,
  searchQuery: '',
  filterType: 'all', // 'all', 'pdf', 'file', 'link', 'note'
  editingTag: null,
  editingResource: null, // { type: 'pdf'|'link'|'note'|'file', id: string }
  editingLink: null,
  editingNote: null,
  currentView: 'files',
  previewingResource: null, // { type: 'pdf'|'link'|'note'|'file', id: string }
  expandedTags: new Set()
};

// ============ DOM 元素 ============
const elements = {
  // 视图
  filesView: document.getElementById('filesView'),
  tagsView: document.getElementById('tagsView'),
  tagsSidebar: document.getElementById('tagsSidebar'),
  
  // 导航
  navItems: document.querySelectorAll('.nav-item'),
  
  // 文件视图
  tagTree: document.getElementById('tagTree'),
  resourceGrid: document.getElementById('resourceGrid'),
  emptyState: document.getElementById('emptyState'),
  searchInput: document.getElementById('searchInput'),
  uploadBtn: document.getElementById('uploadBtn'),
  addLinkBtn: document.getElementById('addLinkBtn'),
  addNoteBtn: document.getElementById('addNoteBtn'),
  addRootTagBtn: document.getElementById('addRootTagBtn'),
  filterTabs: document.querySelectorAll('.filter-tab'),
  
  // 标签管理视图
  tagHierarchyTree: document.getElementById('tagHierarchyTree'),
  tagGraph: document.getElementById('tagGraph'),
  tagGraphCanvas: document.getElementById('tagGraphCanvas'),
  totalTagsCount: document.getElementById('totalTagsCount'),
  rootTagsCount: document.getElementById('rootTagsCount'),
  maxDepth: document.getElementById('maxDepth'),
  addTagMainBtn: document.getElementById('addTagMainBtn'),
  expandAllBtn: document.getElementById('expandAllBtn'),
  viewToggleBtns: document.querySelectorAll('.toggle-btn'),
  
  // 预览面板
  previewPanel: document.getElementById('previewPanel'),
  previewIcon: document.getElementById('previewIcon'),
  previewFileName: document.getElementById('previewFileName'),
  previewFileSize: document.getElementById('previewFileSize'),
  previewSizeItem: document.getElementById('previewSizeItem'),
  previewUrl: document.getElementById('previewUrl'),
  previewUrlItem: document.getElementById('previewUrlItem'),
  previewUpdatedAt: document.getElementById('previewUpdatedAt'),
  previewUpdatedItem: document.getElementById('previewUpdatedItem'),
  previewAddedAt: document.getElementById('previewAddedAt'),
  previewTags: document.getElementById('previewTags'),
  previewFrame: document.getElementById('previewFrame'),
  markdownPreview: document.getElementById('markdownPreview'),
  previewContent: document.querySelector('.preview-content'),
  closePreviewBtn: document.getElementById('closePreviewBtn'),
  openExternalBtn: document.getElementById('openExternalBtn'),
  editNoteBtn: document.getElementById('editNoteBtn'),
  
  // 标签弹窗
  tagModal: document.getElementById('tagModal'),
  tagModalTitle: document.getElementById('tagModalTitle'),
  tagNameInput: document.getElementById('tagNameInput'),
  tagParentSelect: document.getElementById('tagParentSelect'),
  tagColorInput: document.getElementById('tagColorInput'),
  tagColorValue: document.getElementById('tagColorValue'),
  colorPresets: document.querySelectorAll('.color-preset'),
  closeTagModal: document.getElementById('closeTagModal'),
  cancelTagBtn: document.getElementById('cancelTagBtn'),
  saveTagBtn: document.getElementById('saveTagBtn'),
  
  // 资源标签弹窗
  resourceTagModal: document.getElementById('resourceTagModal'),
  tagSelectList: document.getElementById('tagSelectList'),
  closeResourceTagModal: document.getElementById('closeResourceTagModal'),
  saveResourceTagsBtn: document.getElementById('saveResourceTagsBtn'),
  
  // 链接弹窗
  linkModal: document.getElementById('linkModal'),
  linkModalTitle: document.getElementById('linkModalTitle'),
  linkUrlInput: document.getElementById('linkUrlInput'),
  linkTitleInput: document.getElementById('linkTitleInput'),
  linkDescInput: document.getElementById('linkDescInput'),
  closeLinkModal: document.getElementById('closeLinkModal'),
  cancelLinkBtn: document.getElementById('cancelLinkBtn'),
  saveLinkBtn: document.getElementById('saveLinkBtn'),
  
  // 笔记弹窗
  noteModal: document.getElementById('noteModal'),
  noteModalTitle: document.getElementById('noteModalTitle'),
  noteTitleInput: document.getElementById('noteTitleInput'),
  noteContentInput: document.getElementById('noteContentInput'),
  notePreviewPanel: document.getElementById('notePreviewPanel'),
  editorTabs: document.querySelectorAll('.editor-tab'),
  closeNoteModal: document.getElementById('closeNoteModal'),
  cancelNoteBtn: document.getElementById('cancelNoteBtn'),
  saveNoteBtn: document.getElementById('saveNoteBtn'),
  
  // 文件类型选择弹窗
  fileTypeModal: document.getElementById('fileTypeModal'),
  fileTypeGrid: document.getElementById('fileTypeGrid'),
  closeFileTypeModal: document.getElementById('closeFileTypeModal')
};

// ============ 工具函数 ============
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function buildTagTree(tags, parentId = null) {
  return tags
    .filter(tag => tag.parentId === parentId)
    .map(tag => ({
      ...tag,
      children: buildTagTree(tags, tag.id)
    }));
}

function getTagPath(tagId, tags) {
  const paths = [];
  let current = tags.find(t => t.id === tagId);
  while (current) {
    paths.unshift(current.name);
    current = tags.find(t => t.id === current.parentId);
  }
  return paths.join(' / ');
}

function getTagById(tagId) {
  return state.tags.find(t => t.id === tagId);
}

function getTagDepth(tagId, tags) {
  let depth = 0;
  let current = tags.find(t => t.id === tagId);
  while (current && current.parentId) {
    depth++;
    current = tags.find(t => t.id === current.parentId);
  }
  return depth;
}

function getMaxDepth(tags) {
  if (tags.length === 0) return 0;
  return Math.max(...tags.map(t => getTagDepth(t.id, tags))) + 1;
}

function getAllResources() {
  const pdfs = state.pdfs.map(p => ({ ...p, type: 'pdf' }));
  const links = state.links.map(l => ({ ...l, type: 'link' }));
  const notes = state.notes.map(n => ({ ...n, type: 'note' }));
  const files = state.files.map(f => ({ ...f, type: 'file' }));
  return [...pdfs, ...links, ...notes, ...files].sort((a, b) => 
    new Date(b.addedAt) - new Date(a.addedAt)
  );
}

function getResourceCountForTag(tagId) {
  const getChildTagIds = (parentId) => {
    const children = state.tags.filter(t => t.parentId === parentId);
    let ids = children.map(c => c.id);
    children.forEach(c => {
      ids = ids.concat(getChildTagIds(c.id));
    });
    return ids;
  };
  
  const tagIds = [tagId, ...getChildTagIds(tagId)];
  const pdfCount = state.pdfs.filter(pdf => 
    pdf.tags.some(t => tagIds.includes(t))
  ).length;
  const linkCount = state.links.filter(link => 
    link.tags.some(t => tagIds.includes(t))
  ).length;
  const noteCount = state.notes.filter(note => 
    note.tags.some(t => tagIds.includes(t))
  ).length;
  const fileCount = state.files.filter(file => 
    file.tags.some(t => tagIds.includes(t))
  ).length;
  
  return pdfCount + linkCount + noteCount + fileCount;
}

function getAllTagOptions(excludeId = null, parentId = null, level = 0) {
  const tags = state.tags.filter(t => t.parentId === parentId);
  let options = [];
  
  tags.forEach(tag => {
    if (tag.id !== excludeId) {
      options.push({
        id: tag.id,
        name: tag.name,
        level,
        path: getTagPath(tag.id, state.tags)
      });
      options = options.concat(getAllTagOptions(excludeId, tag.id, level + 1));
    }
  });
  
  return options;
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function parseMarkdown(text) {
  // eslint-disable-next-line no-undef
  if (typeof marked !== 'undefined' && marked.parse) {
    // eslint-disable-next-line no-undef
    return marked.parse(text);
  }
  // 简单的备用解析
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^\s*[-*+] (.*)$/gim, '<li>$1</li>')
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\n/g, '<br>');
}

function getExcerpt(content, maxLength = 150) {
  // 移除 Markdown 语法获取纯文本
  const plainText = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s/gm, '')
    .replace(/^>\s/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength) + '...';
}

// ============ 视图切换 ============
function switchView(view) {
  state.currentView = view;
  
  elements.navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.view === view);
  });
  
  elements.filesView.classList.toggle('hidden', view !== 'files');
  elements.tagsView.classList.toggle('hidden', view !== 'tags');
  elements.tagsSidebar.classList.toggle('hidden', view !== 'files');
  
  if (view === 'tags') {
    renderTagsManagement();
  }
}

// ============ 渲染函数 ============
function renderTagTree() {
  const tree = buildTagTree(state.tags);
  const totalResources = state.pdfs.length + state.links.length + state.notes.length + state.files.length;
  
  let html = `
    <div class="all-files-item ${state.selectedTag === null ? 'active' : ''}" data-tag="all">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
      全部资源
      <span class="tag-count" style="margin-left: auto;">${totalResources}</span>
    </div>
  `;
  
  function renderTagNode(tag, level = 0) {
    const count = getResourceCountForTag(tag.id);
    const isActive = state.selectedTag === tag.id;
    
    let nodeHtml = `
      <div class="tag-item ${isActive ? 'active' : ''}" data-tag="${tag.id}" style="padding-left: ${12 + level * 16}px;">
        <span class="tag-color" style="background: ${tag.color}"></span>
        <span class="tag-name">${tag.name}</span>
        <span class="tag-count">${count}</span>
        <div class="tag-actions">
          <button class="btn-icon" data-action="add-child" data-tag="${tag.id}" title="添加子标签">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button class="btn-icon" data-action="edit" data-tag="${tag.id}" title="编辑">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-icon btn-danger" data-action="delete" data-tag="${tag.id}" title="删除">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    if (tag.children && tag.children.length > 0) {
      nodeHtml += '<div class="tag-children">';
      tag.children.forEach(child => {
        nodeHtml += renderTagNode(child, level + 1);
      });
      nodeHtml += '</div>';
    }
    
    return nodeHtml;
  }
  
  tree.forEach(tag => {
    html += renderTagNode(tag);
  });
  
  elements.tagTree.innerHTML = html;
}

function renderResourceGrid() {
  let resources = getAllResources();
  
  // 按类型筛选
  if (state.filterType === 'pdf') {
    resources = resources.filter(r => r.type === 'pdf');
  } else if (state.filterType === 'link') {
    resources = resources.filter(r => r.type === 'link');
  } else if (state.filterType === 'note') {
    resources = resources.filter(r => r.type === 'note');
  } else if (state.filterType === 'file') {
    resources = resources.filter(r => r.type === 'file');
  }
  
  // 按标签筛选
  if (state.selectedTag !== null) {
    const getChildTagIds = (parentId) => {
      const children = state.tags.filter(t => t.parentId === parentId);
      let ids = children.map(c => c.id);
      children.forEach(c => {
        ids = ids.concat(getChildTagIds(c.id));
      });
      return ids;
    };
    
    const tagIds = [state.selectedTag, ...getChildTagIds(state.selectedTag)];
    resources = resources.filter(r => 
      r.tags.some(t => tagIds.includes(t))
    );
  }
  
  // 搜索筛选
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    resources = resources.filter(r => {
      const nameMatch = (r.name || r.title || '').toLowerCase().includes(query);
      const urlMatch = r.url ? r.url.toLowerCase().includes(query) : false;
      const descMatch = r.description ? r.description.toLowerCase().includes(query) : false;
      const contentMatch = r.content ? r.content.toLowerCase().includes(query) : false;
      const tagMatch = r.tags.some(tagId => {
        const tag = getTagById(tagId);
        return tag && tag.name.toLowerCase().includes(query);
      });
      return nameMatch || urlMatch || descMatch || contentMatch || tagMatch;
    });
  }
  
  // 显示/隐藏空状态
  if (resources.length === 0) {
    elements.resourceGrid.style.display = 'none';
    elements.emptyState.classList.add('show');
  } else {
    elements.resourceGrid.style.display = 'grid';
    elements.emptyState.classList.remove('show');
    
    elements.resourceGrid.innerHTML = resources.map(resource => {
      const isActive = state.previewingResource && 
        state.previewingResource.type === resource.type && 
        state.previewingResource.id === resource.id;
      
      if (resource.type === 'pdf') {
        return renderPdfCard(resource, isActive);
      } else if (resource.type === 'link') {
        return renderLinkCard(resource, isActive);
      } else if (resource.type === 'note') {
        return renderNoteCard(resource, isActive);
      } else if (resource.type === 'file') {
        return renderFileCard(resource, isActive);
      }
    }).join('');
  }
}

function renderPdfCard(pdf, isActive) {
  return `
    <div class="resource-card ${isActive ? 'active' : ''}" data-type="pdf" data-id="${pdf.id}">
      <div class="resource-preview pdf-type">
        <span class="resource-type-badge pdf">PDF</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
      </div>
      <div class="resource-info">
        <div class="resource-name" title="${pdf.name}">${pdf.name}</div>
        <div class="resource-meta">
          <span>${formatFileSize(pdf.size)}</span>
          <span>${formatDate(pdf.addedAt)}</span>
        </div>
        <div class="resource-tags">
          ${pdf.tags.map(tagId => {
    const tag = getTagById(tagId);
    if (!tag) return '';
    return `
              <span class="resource-tag">
                <span class="resource-tag-color" style="background: ${tag.color}"></span>
                ${tag.name}
              </span>
            `;
  }).join('')}
        </div>
        <div class="resource-actions">
          <button class="btn-icon" data-action="preview" data-type="pdf" data-id="${pdf.id}" title="预览">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button class="btn-icon" data-action="tags" data-type="pdf" data-id="${pdf.id}" title="管理标签">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
          </button>
          <button class="btn-icon" data-action="open" data-type="pdf" data-id="${pdf.id}" title="在外部打开">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </button>
          <button class="btn-icon btn-danger" data-action="delete" data-type="pdf" data-id="${pdf.id}" title="删除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderLinkCard(link, isActive) {
  return `
    <div class="resource-card ${isActive ? 'active' : ''}" data-type="link" data-id="${link.id}">
      <div class="resource-preview link-type">
        <span class="resource-type-badge link">链接</span>
        <div class="favicon">
          <img src="${link.favicon}" alt="" onerror="this.style.display='none'">
        </div>
      </div>
      <div class="resource-info">
        <div class="resource-name" title="${link.title}">${link.title}</div>
        ${link.description ? `<div class="resource-description">${link.description}</div>` : ''}
        <div class="resource-url" title="${link.url}">${getDomain(link.url)}</div>
        <div class="resource-meta">
          <span>${formatDate(link.addedAt)}</span>
        </div>
        <div class="resource-tags">
          ${link.tags.map(tagId => {
    const tag = getTagById(tagId);
    if (!tag) return '';
    return `
              <span class="resource-tag">
                <span class="resource-tag-color" style="background: ${tag.color}"></span>
                ${tag.name}
              </span>
            `;
  }).join('')}
        </div>
        <div class="resource-actions">
          <button class="btn-icon" data-action="preview" data-type="link" data-id="${link.id}" title="预览">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button class="btn-icon" data-action="tags" data-type="link" data-id="${link.id}" title="管理标签">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
          </button>
          <button class="btn-icon" data-action="edit" data-type="link" data-id="${link.id}" title="编辑">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-icon" data-action="open" data-type="link" data-id="${link.id}" title="在浏览器打开">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </button>
          <button class="btn-icon btn-danger" data-action="delete" data-type="link" data-id="${link.id}" title="删除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderNoteCard(note, isActive) {
  const excerpt = getExcerpt(note.content || '');
  return `
    <div class="resource-card ${isActive ? 'active' : ''}" data-type="note" data-id="${note.id}">
      <div class="resource-preview note-type">
        <span class="resource-type-badge note">笔记</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      </div>
      <div class="resource-info">
        <div class="resource-name" title="${note.title}">${note.title}</div>
        ${excerpt ? `<div class="note-excerpt">${excerpt}</div>` : ''}
        <div class="resource-meta">
          <span>${formatDate(note.addedAt)}</span>
          ${note.updatedAt !== note.addedAt ? `<span>更新于 ${formatDate(note.updatedAt)}</span>` : ''}
        </div>
        <div class="resource-tags">
          ${note.tags.map(tagId => {
    const tag = getTagById(tagId);
    if (!tag) return '';
    return `
              <span class="resource-tag">
                <span class="resource-tag-color" style="background: ${tag.color}"></span>
                ${tag.name}
              </span>
            `;
  }).join('')}
        </div>
        <div class="resource-actions">
          <button class="btn-icon" data-action="preview" data-type="note" data-id="${note.id}" title="预览">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button class="btn-icon" data-action="tags" data-type="note" data-id="${note.id}" title="管理标签">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
          </button>
          <button class="btn-icon" data-action="edit" data-type="note" data-id="${note.id}" title="编辑">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-icon btn-danger" data-action="delete" data-type="note" data-id="${note.id}" title="删除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

// 获取文件类型图标
function getFileTypeIcon(fileType) {
  const icons = {
    pdf: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>`,
    txt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <line x1="10" y1="9" x2="8" y2="9"></line>
    </svg>`,
    mp3: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M9 18V5l12-2v13"></path>
      <circle cx="6" cy="18" r="3"></circle>
      <circle cx="18" cy="16" r="3"></circle>
    </svg>`,
    audio: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M9 18V5l12-2v13"></path>
      <circle cx="6" cy="18" r="3"></circle>
      <circle cx="18" cy="16" r="3"></circle>
    </svg>`,
    image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>`,
    video: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
      <line x1="7" y1="2" x2="7" y2="22"></line>
      <line x1="17" y1="2" x2="17" y2="22"></line>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <line x1="2" y1="7" x2="7" y2="7"></line>
      <line x1="2" y1="17" x2="7" y2="17"></line>
      <line x1="17" y1="17" x2="22" y2="17"></line>
      <line x1="17" y1="7" x2="22" y2="7"></line>
    </svg>`,
    archive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M21 8v13H3V8"></path>
      <path d="M1 3h22v5H1z"></path>
      <path d="M10 12h4"></path>
    </svg>`,
    code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>`,
    document: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>`
  };
  return icons[fileType] || icons.txt;
}

// 获取文件类型显示名称
function getFileTypeDisplayName(fileType, extension) {
  const names = {
    pdf: 'PDF',
    txt: extension ? extension.toUpperCase() : 'TXT',
    mp3: '音频',
    audio: '音频',
    image: '图片',
    video: '视频',
    archive: '压缩包',
    code: '代码',
    document: '文档'
  };
  return names[fileType] || extension?.toUpperCase() || '文件';
}

function renderFileCard(file, isActive) {
  // 兼容新旧字段：subtype 或 fileType
  const fileSubtype = file.subtype || file.fileType || 'txt';
  const isImage = fileSubtype === 'image';
  const thumbnailHtml = isImage ? `<img class="file-thumbnail" src="file://${file.path}" alt="">` : '';
  
  return `
    <div class="resource-card ${isActive ? 'active' : ''}" data-type="file" data-id="${file.id}">
      <div class="resource-preview file-type ${fileSubtype}">
        ${thumbnailHtml}
        <span class="resource-type-badge ${fileSubtype}">${getFileTypeDisplayName(fileSubtype, file.extension)}</span>
        ${getFileTypeIcon(fileSubtype)}
      </div>
      <div class="resource-info">
        <div class="resource-name" title="${file.name}">${file.name}.${file.extension}</div>
        <div class="resource-meta">
          <span>${formatFileSize(file.size)}</span>
          <span>${formatDate(file.addedAt)}</span>
        </div>
        <div class="resource-tags">
          ${file.tags.map(tagId => {
    const tag = getTagById(tagId);
    if (!tag) return '';
    return `
              <span class="resource-tag">
                <span class="resource-tag-color" style="background: ${tag.color}"></span>
                ${tag.name}
              </span>
            `;
  }).join('')}
        </div>
        <div class="resource-actions">
          <button class="btn-icon" data-action="preview" data-type="file" data-id="${file.id}" title="预览">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button class="btn-icon" data-action="tags" data-type="file" data-id="${file.id}" title="管理标签">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
          </button>
          <button class="btn-icon" data-action="open" data-type="file" data-id="${file.id}" title="在外部打开">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </button>
          <button class="btn-icon btn-danger" data-action="delete" data-type="file" data-id="${file.id}" title="删除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderTagSelectList() {
  if (!state.editingResource) return;
  
  let resource;
  if (state.editingResource.type === 'pdf') {
    resource = state.pdfs.find(p => p.id === state.editingResource.id);
  } else if (state.editingResource.type === 'link') {
    resource = state.links.find(l => l.id === state.editingResource.id);
  } else if (state.editingResource.type === 'note') {
    resource = state.notes.find(n => n.id === state.editingResource.id);
  } else if (state.editingResource.type === 'file') {
    resource = state.files.find(f => f.id === state.editingResource.id);
  }
  
  if (!resource) return;
  
  const tagTree = buildTagTree(state.tags);
  
  function renderSelectItem(tag, level = 0) {
    const isSelected = resource.tags.includes(tag.id);
    const indent = level * 20;
    
    let html = `
      <label class="tag-select-item ${isSelected ? 'selected' : ''}" data-tag="${tag.id}" style="padding-left: ${16 + indent}px;">
        <input type="checkbox" ${isSelected ? 'checked' : ''} data-tag="${tag.id}">
        <span class="tag-select-color" style="background: ${tag.color}"></span>
        <span class="tag-select-name">${tag.name}</span>
      </label>
    `;
    
    if (tag.children && tag.children.length > 0) {
      tag.children.forEach(child => {
        html += renderSelectItem(child, level + 1);
      });
    }
    
    return html;
  }
  
  elements.tagSelectList.innerHTML = tagTree.length > 0 
    ? tagTree.map(tag => renderSelectItem(tag)).join('')
    : '<p style="text-align:center;color:var(--text-secondary);padding:20px;">暂无标签，请先创建标签</p>';
}

// ============ 标签管理视图 ============
function renderTagsManagement() {
  const rootTags = state.tags.filter(t => !t.parentId).length;
  elements.totalTagsCount.textContent = state.tags.length;
  elements.rootTagsCount.textContent = rootTags;
  elements.maxDepth.textContent = getMaxDepth(state.tags);
  
  renderTagHierarchyTree();
}

function renderTagHierarchyTree() {
  const tree = buildTagTree(state.tags);
  
  if (tree.length === 0) {
    elements.tagHierarchyTree.innerHTML = `
      <div class="empty-tags">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
        <h4>暂无标签</h4>
        <p>创建标签来组织你的资源</p>
        <button class="btn btn-primary" id="emptyAddTagBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          创建标签
        </button>
      </div>
    `;
    
    const emptyBtn = document.getElementById('emptyAddTagBtn');
    if (emptyBtn) {
      emptyBtn.addEventListener('click', () => showTagModal());
    }
    return;
  }
  
  function renderHierarchyNode(tag, level = 0) {
    const count = getResourceCountForTag(tag.id);
    const hasChildren = tag.children && tag.children.length > 0;
    const isExpanded = state.expandedTags.has(tag.id);
    
    let html = `
      <div class="hierarchy-item" data-tag="${tag.id}">
        <div class="hierarchy-node">
          <span class="hierarchy-toggle ${hasChildren ? (isExpanded ? 'expanded' : '') : 'empty'}" data-tag="${tag.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </span>
          <span class="hierarchy-color" style="background: ${tag.color}"></span>
          <span class="hierarchy-name">${tag.name}</span>
          <div class="hierarchy-badge">
            <span class="hierarchy-count">${count} 资源</span>
            <span class="hierarchy-depth">层级 ${level + 1}</span>
          </div>
          <div class="hierarchy-actions">
            <button class="btn-icon" data-action="add-child" data-tag="${tag.id}" title="添加子标签">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <button class="btn-icon" data-action="edit" data-tag="${tag.id}" title="编辑">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-icon btn-danger" data-action="delete" data-tag="${tag.id}" title="删除">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
    `;
    
    if (hasChildren) {
      html += `<div class="hierarchy-children ${isExpanded ? '' : 'collapsed'}">`;
      tag.children.forEach(child => {
        html += renderHierarchyNode(child, level + 1);
      });
      html += '</div>';
    }
    
    html += '</div>';
    return html;
  }
  
  elements.tagHierarchyTree.innerHTML = tree.map(tag => renderHierarchyNode(tag)).join('');
}

function renderTagGraph() {
  const canvas = elements.tagGraphCanvas;
  const ctx = canvas.getContext('2d');
  const rect = canvas.parentElement.getBoundingClientRect();
  
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const tree = buildTagTree(state.tags);
  if (tree.length === 0) return;
  
  const nodeRadius = 30;
  const levelHeight = 100;
  const nodes = [];
  const edges = [];
  
  function calcPositions(tagList, level = 0, startX = 0, width = canvas.width) {
    const count = tagList.length;
    const gap = width / (count + 1);
    
    tagList.forEach((tag, i) => {
      const x = startX + gap * (i + 1);
      const y = 60 + level * levelHeight;
      
      nodes.push({ tag, x, y });
      
      if (tag.parentId) {
        const parent = nodes.find(n => n.tag.id === tag.parentId);
        if (parent) {
          edges.push({ from: parent, to: { x, y } });
        }
      }
      
      if (tag.children && tag.children.length > 0) {
        const childWidth = width / count;
        calcPositions(tag.children, level + 1, startX + gap * i, childWidth);
      }
    });
  }
  
  calcPositions(tree);
  
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  edges.forEach(edge => {
    ctx.beginPath();
    ctx.moveTo(edge.from.x, edge.from.y + nodeRadius);
    ctx.lineTo(edge.to.x, edge.to.y - nodeRadius);
    ctx.stroke();
  });
  
  nodes.forEach(node => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    ctx.fillStyle = node.tag.color;
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const name = node.tag.name.length > 4 ? node.tag.name.substring(0, 4) + '...' : node.tag.name;
    ctx.fillText(name, node.x, node.y);
  });
}

// ============ 预览面板 ============
async function showPreview(type, id) {
  let resource;
  
  if (type === 'pdf') {
    resource = state.pdfs.find(p => p.id === id);
    if (!resource) return;
    
    elements.previewIcon.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
    `;
    elements.previewIcon.classList.remove('link-icon', 'note-icon', 'file-icon', 'audio-icon', 'image-icon');
    elements.previewFileName.textContent = resource.name;
    elements.previewSizeItem.style.display = 'flex';
    elements.previewFileSize.textContent = formatFileSize(resource.size);
    elements.previewUrlItem.style.display = 'none';
    elements.previewUpdatedItem.style.display = 'none';
    elements.previewFrame.src = `file://${resource.path}`;
    elements.previewFrame.style.display = 'block';
    elements.markdownPreview.classList.add('hidden');
    elements.previewContent.classList.remove('link-mode', 'note-mode', 'file-mode');
    elements.editNoteBtn.classList.add('hidden');
    elements.openExternalBtn.classList.remove('hidden');
  } else if (type === 'link') {
    resource = state.links.find(l => l.id === id);
    if (!resource) return;
    
    elements.previewIcon.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
      </svg>
    `;
    elements.previewIcon.classList.add('link-icon');
    elements.previewIcon.classList.remove('note-icon', 'file-icon', 'audio-icon', 'image-icon');
    elements.previewFileName.textContent = resource.title;
    elements.previewSizeItem.style.display = 'none';
    elements.previewUrlItem.style.display = 'flex';
    elements.previewUrl.textContent = resource.url;
    elements.previewUpdatedItem.style.display = 'none';
    elements.previewFrame.src = resource.url;
    elements.previewFrame.style.display = 'block';
    elements.markdownPreview.classList.add('hidden');
    elements.previewContent.classList.add('link-mode');
    elements.previewContent.classList.remove('note-mode', 'file-mode');
    elements.editNoteBtn.classList.add('hidden');
    elements.openExternalBtn.classList.remove('hidden');
  } else if (type === 'note') {
    // 笔记
    resource = state.notes.find(n => n.id === id);
    if (!resource) return;
    
    elements.previewIcon.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    `;
    elements.previewIcon.classList.add('note-icon');
    elements.previewIcon.classList.remove('link-icon', 'file-icon', 'audio-icon', 'image-icon');
    elements.previewFileName.textContent = resource.title;
    elements.previewSizeItem.style.display = 'none';
    elements.previewUrlItem.style.display = 'none';
    elements.previewUpdatedItem.style.display = 'flex';
    elements.previewUpdatedAt.textContent = formatDateTime(resource.updatedAt);
    elements.previewFrame.style.display = 'none';
    
    // 渲染 Markdown
    if (resource.content) {
      elements.markdownPreview.innerHTML = parseMarkdown(resource.content);
    } else {
      elements.markdownPreview.innerHTML = `
        <div class="empty-note-preview">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <p>此笔记暂无内容</p>
        </div>
      `;
    }
    elements.markdownPreview.classList.remove('hidden');
    elements.previewContent.classList.add('note-mode');
    elements.previewContent.classList.remove('link-mode', 'file-mode');
    elements.editNoteBtn.classList.remove('hidden');
    elements.openExternalBtn.classList.add('hidden');
  } else if (type === 'file') {
    // 通用文件
    resource = state.files.find(f => f.id === id);
    if (!resource) return;
    
    // 兼容新旧字段
    const fileSubtype = resource.subtype || resource.fileType || 'txt';
    
    elements.previewIcon.innerHTML = getFileTypeIcon(fileSubtype);
    elements.previewIcon.classList.remove('link-icon', 'note-icon');
    elements.previewIcon.classList.add('file-icon');
    
    // 根据文件类型设置图标颜色类
    if (fileSubtype === 'mp3' || fileSubtype === 'audio') {
      elements.previewIcon.classList.add('audio-icon');
      elements.previewIcon.classList.remove('image-icon', 'video-icon', 'code-icon');
    } else if (fileSubtype === 'image') {
      elements.previewIcon.classList.add('image-icon');
      elements.previewIcon.classList.remove('audio-icon', 'video-icon', 'code-icon');
    } else if (fileSubtype === 'video') {
      elements.previewIcon.classList.add('video-icon');
      elements.previewIcon.classList.remove('audio-icon', 'image-icon', 'code-icon');
    } else if (fileSubtype === 'code') {
      elements.previewIcon.classList.add('code-icon');
      elements.previewIcon.classList.remove('audio-icon', 'image-icon', 'video-icon');
    } else {
      elements.previewIcon.classList.remove('audio-icon', 'image-icon', 'video-icon', 'code-icon');
    }
    
    elements.previewFileName.textContent = `${resource.name}.${resource.extension}`;
    elements.previewSizeItem.style.display = 'flex';
    elements.previewFileSize.textContent = formatFileSize(resource.size);
    elements.previewUrlItem.style.display = 'none';
    elements.previewUpdatedItem.style.display = 'none';
    elements.editNoteBtn.classList.add('hidden');
    elements.openExternalBtn.classList.remove('hidden');
    
    // 根据文件类型渲染不同预览
    elements.previewFrame.style.display = 'none';
    elements.previewContent.classList.add('file-mode');
    elements.previewContent.classList.remove('link-mode', 'note-mode');
    
    if (fileSubtype === 'txt' || fileSubtype === 'code') {
      // 文本/代码文件预览
      const result = await window.electronAPI.readTextFile(resource.path);
      if (result.success) {
        const codeClass = fileSubtype === 'code' ? `language-${resource.extension}` : '';
        elements.markdownPreview.innerHTML = `<div class="text-preview ${codeClass}">${escapeHtml(result.content)}</div>`;
      } else {
        elements.markdownPreview.innerHTML = '<div class="empty-note-preview"><p>无法读取文件内容</p></div>';
      }
      elements.markdownPreview.classList.remove('hidden');
    } else if (fileSubtype === 'mp3' || fileSubtype === 'audio') {
      // 音频预览
      elements.markdownPreview.innerHTML = `
        <div class="audio-preview">
          <div class="audio-preview-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <audio controls src="file://${resource.path}"></audio>
        </div>
      `;
      elements.markdownPreview.classList.remove('hidden');
    } else if (fileSubtype === 'image') {
      // 图片预览
      elements.markdownPreview.innerHTML = `
        <div class="image-preview">
          <img src="file://${resource.path}" alt="${resource.name}">
        </div>
      `;
      elements.markdownPreview.classList.remove('hidden');
    } else if (fileSubtype === 'video') {
      // 视频预览
      elements.markdownPreview.innerHTML = `
        <div class="video-preview">
          <video controls src="file://${resource.path}"></video>
        </div>
      `;
      elements.markdownPreview.classList.remove('hidden');
    } else if (fileSubtype === 'pdf') {
      // PDF 文件
      elements.previewFrame.src = `file://${resource.path}`;
      elements.previewFrame.style.display = 'block';
      elements.markdownPreview.classList.add('hidden');
    } else {
      elements.markdownPreview.innerHTML = `
        <div class="empty-note-preview">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <p>此文件类型暂不支持预览</p>
        </div>
      `;
      elements.markdownPreview.classList.remove('hidden');
    }
  }
  
  state.previewingResource = { type, id };
  
  elements.previewAddedAt.textContent = formatDate(resource.addedAt);
  elements.previewTags.innerHTML = resource.tags.map(tagId => {
    const tag = getTagById(tagId);
    if (!tag) return '';
    return `
      <span class="resource-tag">
        <span class="resource-tag-color" style="background: ${tag.color}"></span>
        ${tag.name}
      </span>
    `;
  }).join('') || '<span style="color: var(--text-secondary); font-size: 12px;">无标签</span>';
  
  elements.previewPanel.classList.remove('hidden');
  renderResourceGrid();
}

// HTML 转义函数
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function hidePreview() {
  state.previewingResource = null;
  elements.previewPanel.classList.add('hidden');
  elements.previewFrame.src = '';
  renderResourceGrid();
}

// ============ 弹窗控制 ============
function showTagModal(tag = null, parentId = null) {
  state.editingTag = tag ? { ...tag } : { parentId };
  
  elements.tagModalTitle.textContent = tag ? '编辑标签' : '添加标签';
  elements.tagNameInput.value = tag ? tag.name : '';
  elements.tagColorInput.value = tag ? tag.color : '#6366f1';
  elements.tagColorValue.textContent = tag ? tag.color : '#6366f1';
  
  elements.colorPresets.forEach(preset => {
    preset.classList.toggle('active', preset.dataset.color === (tag ? tag.color : '#6366f1'));
  });
  
  const options = getAllTagOptions(tag ? tag.id : null);
  const currentParentId = tag ? tag.parentId : parentId;
  
  elements.tagParentSelect.innerHTML = `
    <option value="">无（顶级标签）</option>
    ${options.map(opt => `
      <option value="${opt.id}" ${opt.id === currentParentId ? 'selected' : ''}>
        ${'　'.repeat(opt.level)}${opt.name}
      </option>
    `).join('')}
  `;
  
  elements.tagModal.classList.add('show');
  elements.tagNameInput.focus();
}

function hideTagModal() {
  elements.tagModal.classList.remove('show');
  state.editingTag = null;
}

function showResourceTagModal(type, id) {
  state.editingResource = { type, id };
  renderTagSelectList();
  elements.resourceTagModal.classList.add('show');
}

function hideResourceTagModal() {
  elements.resourceTagModal.classList.remove('show');
  state.editingResource = null;
}

function showLinkModal(link = null) {
  state.editingLink = link;
  
  elements.linkModalTitle.textContent = link ? '编辑链接' : '添加链接';
  elements.linkUrlInput.value = link ? link.url : '';
  elements.linkTitleInput.value = link ? link.title : '';
  elements.linkDescInput.value = link ? link.description || '' : '';
  
  elements.linkModal.classList.add('show');
  elements.linkUrlInput.focus();
}

function hideLinkModal() {
  elements.linkModal.classList.remove('show');
  state.editingLink = null;
}

function showNoteModal(note = null) {
  state.editingNote = note;
  
  elements.noteModalTitle.textContent = note ? '编辑笔记' : '新建笔记';
  elements.noteTitleInput.value = note ? note.title : '';
  elements.noteContentInput.value = note ? note.content || '' : '';
  
  // 重置编辑器状态
  elements.editorTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === 'write');
  });
  elements.noteContentInput.classList.remove('hidden');
  elements.notePreviewPanel.classList.add('hidden');
  
  elements.noteModal.classList.add('show');
  elements.noteTitleInput.focus();
}

function hideNoteModal() {
  elements.noteModal.classList.remove('show');
  state.editingNote = null;
}

// ============ 事件处理 ============
// 显示文件类型选择弹窗
function showFileTypeModal() {
  renderFileTypeGrid();
  elements.fileTypeModal.classList.add('show');
}

function hideFileTypeModal() {
  elements.fileTypeModal.classList.remove('show');
}

// 渲染文件类型选项
function renderFileTypeGrid() {
  const fileTypeIcons = {
    pdf: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>`,
    txt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>`,
    mp3: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 18V5l12-2v13"></path>
      <circle cx="6" cy="18" r="3"></circle>
      <circle cx="18" cy="16" r="3"></circle>
    </svg>`,
    image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>`
  };
  
  const fileTypeColors = {
    pdf: '#667eea',
    txt: '#64748b',
    mp3: '#f59e0b',
    image: '#ec4899'
  };
  
  const config = state.fileTypeConfig;
  let html = '';
  
  for (const [type, typeConfig] of Object.entries(config)) {
    html += `
      <div class="file-type-option" data-file-type="${type}">
        <div class="file-type-icon" style="background: ${fileTypeColors[type] || '#6366f1'}">
          ${fileTypeIcons[type] || fileTypeIcons.txt}
        </div>
        <div class="file-type-name">${typeConfig.name}</div>
        <div class="file-type-ext">.${typeConfig.extensions.join(', .')}</div>
      </div>
    `;
  }
  
  elements.fileTypeGrid.innerHTML = html;
}

// 处理文件上传
async function handleUploadFile(fileType) {
  hideFileTypeModal();
  
  const result = await window.electronAPI.selectFile(fileType);
  if (!result.canceled && result.filePaths.length > 0) {
    for (const filePath of result.filePaths) {
      const addResult = await window.electronAPI.addFile({ filePath, fileType });
      if (addResult.success) {
        state.files.push(addResult.file);
      } else if (addResult.message) {
        console.log(addResult.message);
      }
    }
    renderResourceGrid();
    renderTagTree();
  }
}

// eslint-disable-next-line no-unused-vars
async function handleUpload() {
  const result = await window.electronAPI.selectPdf();
  if (!result.canceled && result.filePaths.length > 0) {
    for (const filePath of result.filePaths) {
      const addResult = await window.electronAPI.addPdf(filePath);
      if (addResult.success) {
        state.pdfs.push(addResult.pdf);
      }
    }
    renderResourceGrid();
    renderTagTree();
  }
}

async function handleSaveLink() {
  const url = elements.linkUrlInput.value.trim();
  const title = elements.linkTitleInput.value.trim();
  const description = elements.linkDescInput.value.trim();
  
  if (!url) {
    elements.linkUrlInput.focus();
    return;
  }
  
  // 验证URL格式
  try {
    new URL(url);
  } catch {
    alert('请输入有效的链接地址');
    elements.linkUrlInput.focus();
    return;
  }
  
  if (state.editingLink) {
    // 更新链接
    const result = await window.electronAPI.updateLink({
      linkId: state.editingLink.id,
      url,
      title: title || url,
      description
    });
    if (result.success) {
      const index = state.links.findIndex(l => l.id === state.editingLink.id);
      if (index !== -1) {
        state.links[index] = result.link;
      }
    }
  } else {
    // 添加链接
    const result = await window.electronAPI.addLink({
      url,
      title: title || url,
      description
    });
    if (result.success) {
      state.links.push(result.link);
    } else {
      alert(result.message || '添加失败');
      return;
    }
  }
  
  hideLinkModal();
  renderResourceGrid();
  renderTagTree();
}

async function handleSaveNote() {
  const title = elements.noteTitleInput.value.trim();
  const content = elements.noteContentInput.value;
  
  if (!title) {
    elements.noteTitleInput.focus();
    return;
  }
  
  if (state.editingNote) {
    // 更新笔记
    const result = await window.electronAPI.updateNote({
      noteId: state.editingNote.id,
      title,
      content
    });
    if (result.success) {
      const index = state.notes.findIndex(n => n.id === state.editingNote.id);
      if (index !== -1) {
        state.notes[index] = result.note;
      }
      
      // 如果当前正在预览这个笔记，更新预览
      if (state.previewingResource && 
          state.previewingResource.type === 'note' && 
          state.previewingResource.id === state.editingNote.id) {
        showPreview('note', state.editingNote.id);
      }
    }
  } else {
    // 添加笔记
    const result = await window.electronAPI.addNote({
      title,
      content
    });
    if (result.success) {
      state.notes.push(result.note);
    }
  }
  
  hideNoteModal();
  renderResourceGrid();
  renderTagTree();
}

async function handleSaveTag() {
  const name = elements.tagNameInput.value.trim();
  const color = elements.tagColorInput.value;
  const parentId = elements.tagParentSelect.value || null;
  
  if (!name) {
    elements.tagNameInput.focus();
    return;
  }
  
  if (state.editingTag.id) {
    const result = await window.electronAPI.updateTag({
      tagId: state.editingTag.id,
      name,
      color,
      parentId
    });
    if (result.success) {
      const index = state.tags.findIndex(t => t.id === state.editingTag.id);
      if (index !== -1) {
        state.tags[index] = result.tag;
      }
    }
  } else {
    const result = await window.electronAPI.addTag({
      name,
      color,
      parentId
    });
    if (result.success) {
      state.tags.push(result.tag);
      if (parentId) {
        state.expandedTags.add(parentId);
      }
    }
  }
  
  hideTagModal();
  renderTagTree();
  renderResourceGrid();
  
  if (state.currentView === 'tags') {
    renderTagsManagement();
  }
}

async function handleDeleteTag(tagId) {
  if (confirm('确定要删除这个标签吗？子标签也会被删除。')) {
    const result = await window.electronAPI.deleteTag(tagId);
    if (result.success) {
      state.tags = state.tags.filter(t => !result.deletedIds.includes(t.id));
      state.pdfs.forEach(pdf => {
        pdf.tags = pdf.tags.filter(t => !result.deletedIds.includes(t));
      });
      state.links.forEach(link => {
        link.tags = link.tags.filter(t => !result.deletedIds.includes(t));
      });
      state.notes.forEach(note => {
        note.tags = note.tags.filter(t => !result.deletedIds.includes(t));
      });
      state.files.forEach(file => {
        file.tags = file.tags.filter(t => !result.deletedIds.includes(t));
      });
      
      if (result.deletedIds.includes(state.selectedTag)) {
        state.selectedTag = null;
      }
      
      result.deletedIds.forEach(id => state.expandedTags.delete(id));
      
      renderTagTree();
      renderResourceGrid();
      
      if (state.currentView === 'tags') {
        renderTagsManagement();
      }
    }
  }
}

async function handleSaveResourceTags() {
  if (!state.editingResource) return;
  
  const checkboxes = elements.tagSelectList.querySelectorAll('input[type="checkbox"]');
  const selectedTags = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.dataset.tag);
  
  let result;
  if (state.editingResource.type === 'pdf') {
    result = await window.electronAPI.updatePdfTags({
      pdfId: state.editingResource.id,
      tags: selectedTags
    });
    if (result.success) {
      const index = state.pdfs.findIndex(p => p.id === state.editingResource.id);
      if (index !== -1) {
        state.pdfs[index] = result.pdf;
      }
    }
  } else if (state.editingResource.type === 'link') {
    result = await window.electronAPI.updateLinkTags({
      linkId: state.editingResource.id,
      tags: selectedTags
    });
    if (result.success) {
      const index = state.links.findIndex(l => l.id === state.editingResource.id);
      if (index !== -1) {
        state.links[index] = result.link;
      }
    }
  } else if (state.editingResource.type === 'note') {
    result = await window.electronAPI.updateNoteTags({
      noteId: state.editingResource.id,
      tags: selectedTags
    });
    if (result.success) {
      const index = state.notes.findIndex(n => n.id === state.editingResource.id);
      if (index !== -1) {
        state.notes[index] = result.note;
      }
    }
  } else if (state.editingResource.type === 'file') {
    result = await window.electronAPI.updateFileTags({
      fileId: state.editingResource.id,
      tags: selectedTags
    });
    if (result.success) {
      const index = state.files.findIndex(f => f.id === state.editingResource.id);
      if (index !== -1) {
        state.files[index] = result.file;
      }
    }
  }
  
  hideResourceTagModal();
  renderResourceGrid();
  renderTagTree();
  
  if (state.previewingResource && 
      state.previewingResource.type === state.editingResource.type && 
      state.previewingResource.id === state.editingResource.id) {
    showPreview(state.previewingResource.type, state.previewingResource.id);
  }
}

async function handleDeleteResource(type, id) {
  const messages = {
    pdf: '确定要从库中移除这个PDF吗？',
    link: '确定要删除这个链接吗？',
    note: '确定要删除这个笔记吗？',
    file: '确定要从库中移除这个文件吗？'
  };
  
  if (confirm(messages[type])) {
    let result;
    if (type === 'pdf') {
      result = await window.electronAPI.deletePdf(id);
      if (result.success) {
        state.pdfs = state.pdfs.filter(p => p.id !== id);
      }
    } else if (type === 'link') {
      result = await window.electronAPI.deleteLink(id);
      if (result.success) {
        state.links = state.links.filter(l => l.id !== id);
      }
    } else if (type === 'note') {
      result = await window.electronAPI.deleteNote(id);
      if (result.success) {
        state.notes = state.notes.filter(n => n.id !== id);
      }
    } else if (type === 'file') {
      result = await window.electronAPI.deleteFile(id);
      if (result.success) {
        state.files = state.files.filter(f => f.id !== id);
      }
    }
    
    if (state.previewingResource && 
        state.previewingResource.type === type && 
        state.previewingResource.id === id) {
      hidePreview();
    }
    
    renderResourceGrid();
    renderTagTree();
  }
}

async function handleOpenResource(type, id) {
  if (type === 'pdf') {
    const pdf = state.pdfs.find(p => p.id === id);
    if (pdf) {
      await window.electronAPI.openPdf(pdf.path);
    }
  } else if (type === 'link') {
    const link = state.links.find(l => l.id === id);
    if (link) {
      await window.electronAPI.openLink(link.url);
    }
  } else if (type === 'file') {
    const file = state.files.find(f => f.id === id);
    if (file) {
      await window.electronAPI.openFile(file.path);
    }
  }
}

function toggleTagExpand(tagId) {
  if (state.expandedTags.has(tagId)) {
    state.expandedTags.delete(tagId);
  } else {
    state.expandedTags.add(tagId);
  }
  renderTagHierarchyTree();
}

function expandAllTags() {
  state.tags.forEach(tag => {
    const hasChildren = state.tags.some(t => t.parentId === tag.id);
    if (hasChildren) {
      state.expandedTags.add(tag.id);
    }
  });
  renderTagHierarchyTree();
}

// ============ 事件绑定 ============
function bindEvents() {
  // 导航切换
  elements.navItems.forEach(item => {
    item.addEventListener('click', () => {
      switchView(item.dataset.view);
    });
  });
  
  // 筛选标签
  elements.filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      elements.filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.filterType = tab.dataset.filter;
      renderResourceGrid();
    });
  });
  
  // 上传按钮 - 显示文件类型选择弹窗
  elements.uploadBtn.addEventListener('click', showFileTypeModal);
  
  // 文件类型选择弹窗事件
  elements.closeFileTypeModal.addEventListener('click', hideFileTypeModal);
  elements.fileTypeModal.addEventListener('click', (e) => {
    if (e.target === elements.fileTypeModal) hideFileTypeModal();
  });
  
  // 文件类型选项点击
  elements.fileTypeGrid.addEventListener('click', (e) => {
    const option = e.target.closest('.file-type-option');
    if (option) {
      const fileType = option.dataset.fileType;
      handleUploadFile(fileType);
    }
  });
  
  // 添加链接按钮
  elements.addLinkBtn.addEventListener('click', () => showLinkModal());
  
  // 添加笔记按钮
  elements.addNoteBtn.addEventListener('click', () => showNoteModal());
  
  // 添加根标签
  elements.addRootTagBtn.addEventListener('click', () => showTagModal());
  elements.addTagMainBtn.addEventListener('click', () => showTagModal());
  
  // 展开全部
  elements.expandAllBtn.addEventListener('click', expandAllTags);
  
  // 视图切换（树形/关系图）
  elements.viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.viewToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const view = btn.dataset.view;
      elements.tagHierarchyTree.classList.toggle('hidden', view !== 'tree');
      elements.tagGraph.classList.toggle('hidden', view !== 'graph');
      
      if (view === 'graph') {
        renderTagGraph();
      }
    });
  });
  
  // 搜索
  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderResourceGrid();
  });
  
  // 标签树点击事件（侧边栏）
  elements.tagTree.addEventListener('click', (e) => {
    const tagItem = e.target.closest('.tag-item, .all-files-item');
    const actionBtn = e.target.closest('[data-action]');
    
    if (actionBtn) {
      e.stopPropagation();
      const action = actionBtn.dataset.action;
      const tagId = actionBtn.dataset.tag;
      
      switch (action) {
      case 'add-child':
        showTagModal(null, tagId);
        break;
      case 'edit': {
        const tag = getTagById(tagId);
        if (tag) showTagModal(tag);
        break;
      }
      case 'delete':
        handleDeleteTag(tagId);
        break;
      }
    } else if (tagItem) {
      const tagId = tagItem.dataset.tag;
      state.selectedTag = tagId === 'all' ? null : tagId;
      renderTagTree();
      renderResourceGrid();
    }
  });
  
  // 标签层级树点击事件
  elements.tagHierarchyTree.addEventListener('click', (e) => {
    const toggle = e.target.closest('.hierarchy-toggle');
    const actionBtn = e.target.closest('[data-action]');
    
    if (toggle && !toggle.classList.contains('empty')) {
      e.stopPropagation();
      toggleTagExpand(toggle.dataset.tag);
    } else if (actionBtn) {
      e.stopPropagation();
      const action = actionBtn.dataset.action;
      const tagId = actionBtn.dataset.tag;
      
      switch (action) {
      case 'add-child':
        showTagModal(null, tagId);
        break;
      case 'edit': {
        const tag = getTagById(tagId);
        if (tag) showTagModal(tag);
        break;
      }
      case 'delete':
        handleDeleteTag(tagId);
        break;
      }
    }
  });
  
  // 资源卡片点击事件
  elements.resourceGrid.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-action]');
    
    if (actionBtn) {
      e.stopPropagation();
      const action = actionBtn.dataset.action;
      const type = actionBtn.dataset.type;
      const id = actionBtn.dataset.id;
      
      switch (action) {
      case 'preview':
        showPreview(type, id);
        break;
      case 'tags':
        showResourceTagModal(type, id);
        break;
      case 'edit':
        if (type === 'link') {
          const link = state.links.find(l => l.id === id);
          if (link) showLinkModal(link);
        } else if (type === 'note') {
          const note = state.notes.find(n => n.id === id);
          if (note) showNoteModal(note);
        }
        break;
      case 'open':
        handleOpenResource(type, id);
        break;
      case 'delete':
        handleDeleteResource(type, id);
        break;
      }
    } else {
      const card = e.target.closest('.resource-card');
      if (card) {
        const type = card.dataset.type;
        const id = card.dataset.id;
        showPreview(type, id);
      }
    }
  });
  
  // 预览面板事件
  elements.closePreviewBtn.addEventListener('click', hidePreview);
  elements.openExternalBtn.addEventListener('click', () => {
    if (state.previewingResource) {
      handleOpenResource(state.previewingResource.type, state.previewingResource.id);
    }
  });
  elements.editNoteBtn.addEventListener('click', () => {
    if (state.previewingResource && state.previewingResource.type === 'note') {
      const note = state.notes.find(n => n.id === state.previewingResource.id);
      if (note) showNoteModal(note);
    }
  });
  
  // 标签弹窗事件
  elements.closeTagModal.addEventListener('click', hideTagModal);
  elements.cancelTagBtn.addEventListener('click', hideTagModal);
  elements.saveTagBtn.addEventListener('click', handleSaveTag);
  
  elements.tagColorInput.addEventListener('input', (e) => {
    elements.tagColorValue.textContent = e.target.value;
    elements.colorPresets.forEach(preset => {
      preset.classList.remove('active');
    });
  });
  
  elements.colorPresets.forEach(preset => {
    preset.addEventListener('click', () => {
      const color = preset.dataset.color;
      elements.tagColorInput.value = color;
      elements.tagColorValue.textContent = color;
      elements.colorPresets.forEach(p => p.classList.remove('active'));
      preset.classList.add('active');
    });
  });
  
  elements.tagNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSaveTag();
  });
  
  // 资源标签弹窗事件
  elements.closeResourceTagModal.addEventListener('click', hideResourceTagModal);
  elements.saveResourceTagsBtn.addEventListener('click', handleSaveResourceTags);
  
  elements.tagSelectList.addEventListener('change', (e) => {
    const item = e.target.closest('.tag-select-item');
    if (item) {
      item.classList.toggle('selected', e.target.checked);
    }
  });
  
  // 链接弹窗事件
  elements.closeLinkModal.addEventListener('click', hideLinkModal);
  elements.cancelLinkBtn.addEventListener('click', hideLinkModal);
  elements.saveLinkBtn.addEventListener('click', handleSaveLink);
  
  elements.linkUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSaveLink();
  });
  
  // 笔记弹窗事件
  elements.closeNoteModal.addEventListener('click', hideNoteModal);
  elements.cancelNoteBtn.addEventListener('click', hideNoteModal);
  elements.saveNoteBtn.addEventListener('click', handleSaveNote);
  
  // 笔记编辑器标签切换
  elements.editorTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      elements.editorTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const view = tab.dataset.tab;
      if (view === 'write') {
        elements.noteContentInput.classList.remove('hidden');
        elements.notePreviewPanel.classList.add('hidden');
      } else {
        elements.noteContentInput.classList.add('hidden');
        elements.notePreviewPanel.classList.remove('hidden');
        // 渲染预览
        const content = elements.noteContentInput.value;
        if (content) {
          elements.notePreviewPanel.innerHTML = parseMarkdown(content);
        } else {
          elements.notePreviewPanel.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">暂无内容</p>';
        }
      }
    });
  });
  
  // 点击弹窗外部关闭
  elements.tagModal.addEventListener('click', (e) => {
    if (e.target === elements.tagModal) hideTagModal();
  });
  
  elements.resourceTagModal.addEventListener('click', (e) => {
    if (e.target === elements.resourceTagModal) hideResourceTagModal();
  });
  
  elements.linkModal.addEventListener('click', (e) => {
    if (e.target === elements.linkModal) hideLinkModal();
  });
  
  elements.noteModal.addEventListener('click', (e) => {
    if (e.target === elements.noteModal) hideNoteModal();
  });
  
  // ESC 关闭弹窗和预览
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideTagModal();
      hideResourceTagModal();
      hideLinkModal();
      hideNoteModal();
      hideFileTypeModal();
      hidePreview();
    }
  });
  
  // 窗口大小改变时重绘关系图
  window.addEventListener('resize', () => {
    if (state.currentView === 'tags' && !elements.tagGraph.classList.contains('hidden')) {
      renderTagGraph();
    }
  });
}

// ============ 初始化 ============
async function init() {
  // 加载文件类型配置
  state.fileTypeConfig = await window.electronAPI.getFileTypeConfig();
  
  // 加载数据
  state.pdfs = await window.electronAPI.getPdfs();
  state.links = await window.electronAPI.getLinks();
  state.notes = await window.electronAPI.getNotes();
  state.files = await window.electronAPI.getFiles();
  state.tags = await window.electronAPI.getTags();
  
  // 默认展开所有标签
  state.tags.forEach(tag => {
    if (state.tags.some(t => t.parentId === tag.id)) {
      state.expandedTags.add(tag.id);
    }
  });
  
  // 渲染UI
  renderTagTree();
  renderResourceGrid();
  
  // 绑定事件
  bindEvents();
}

// 启动应用
init();
