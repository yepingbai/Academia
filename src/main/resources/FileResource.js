/**
 * 通用文件资源类型
 * 支持多种文件格式：文本、音频、图片等
 */

const BaseResource = require('./BaseResource');
const path = require('path');
const fs = require('fs');

// 文件子类型配置
const FILE_SUBTYPES = {
  txt: {
    name: '文本文件',
    extensions: ['txt', 'md', 'markdown', 'json', 'xml', 'yaml', 'yml', 'ini', 'conf', 'log'],
    icon: 'text',
    color: '#64748b',
    previewType: 'text'
  },
  audio: {
    name: '音频文件',
    extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma'],
    icon: 'audio',
    color: '#f59e0b',
    previewType: 'audio'
  },
  image: {
    name: '图片文件',
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'],
    icon: 'image',
    color: '#ec4899',
    previewType: 'image'
  },
  video: {
    name: '视频文件',
    extensions: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'wmv', 'flv'],
    icon: 'video',
    color: '#ef4444',
    previewType: 'video'
  },
  archive: {
    name: '压缩文件',
    extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
    icon: 'archive',
    color: '#6366f1',
    previewType: 'none'
  },
  code: {
    name: '代码文件',
    extensions: ['js', 'ts', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'go', 'rs', 'rb', 'php', 'swift', 'kt'],
    icon: 'code',
    color: '#06b6d4',
    previewType: 'code'
  },
  document: {
    name: '文档文件',
    extensions: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'],
    icon: 'document',
    color: '#3b82f6',
    previewType: 'none'
  }
};

class FileResource extends BaseResource {
  static type = 'file';
  static displayName = '文件';
  static icon = 'file';
  static color = '#6366f1';
  static storeKey = 'files';
  static supportsPreview = true;
  static supportsEdit = false;
  static isFileBased = true;
  
  // 暴露子类型配置
  static subtypes = FILE_SUBTYPES;
  
  constructor(data = {}) {
    super(data);
    this.name = data.name || '';
    this.path = data.path || '';
    this.extension = data.extension || '';
    this.size = data.size || 0;
    // 兼容旧的 fileType 字段
    this.subtype = data.subtype || data.fileType || this._detectSubtype();
  }
  
  /**
   * 检测文件子类型
   * @returns {string}
   */
  _detectSubtype() {
    const ext = this.extension.toLowerCase();
    for (const [subtype, config] of Object.entries(FILE_SUBTYPES)) {
      if (config.extensions.includes(ext)) {
        return subtype;
      }
    }
    return 'txt'; // 默认作为文本处理
  }
  
  /**
   * 获取子类型配置
   * @returns {Object}
   */
  getSubtypeConfig() {
    return FILE_SUBTYPES[this.subtype] || FILE_SUBTYPES.txt;
  }
  
  getDisplayName() {
    return `${this.name}.${this.extension}`;
  }
  
  getSearchText() {
    return `${this.name} ${this.extension}`.toLowerCase();
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      path: this.path,
      extension: this.extension,
      size: this.size,
      subtype: this.subtype,
      // 兼容旧字段
      fileType: this.subtype
    };
  }
  
  static fromJSON(data) {
    return new FileResource(data);
  }
  
  static validate(data) {
    if (!data.path) {
      return { valid: false, message: '文件路径不能为空' };
    }
    if (!fs.existsSync(data.path)) {
      return { valid: false, message: '文件不存在' };
    }
    return { valid: true };
  }
  
  /**
   * 从文件路径创建文件资源
   * @param {string} filePath 
   * @returns {FileResource}
   */
  static createFromPath(filePath) {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const fileName = path.basename(filePath, path.extname(filePath));
    const stats = fs.statSync(filePath);
    
    return new FileResource({
      name: fileName,
      path: filePath,
      extension: ext,
      size: stats.size
    });
  }
  
  /**
   * 获取支持的所有扩展名
   * @returns {string[]}
   */
  static getAllSupportedExtensions() {
    const extensions = [];
    for (const config of Object.values(FILE_SUBTYPES)) {
      extensions.push(...config.extensions);
    }
    return extensions;
  }
  
  /**
   * 根据扩展名获取子类型
   * @param {string} ext 
   * @returns {string|null}
   */
  static getSubtypeByExtension(ext) {
    ext = ext.toLowerCase().replace('.', '');
    for (const [subtype, config] of Object.entries(FILE_SUBTYPES)) {
      if (config.extensions.includes(ext)) {
        return subtype;
      }
    }
    return null;
  }
  
  getMetadata() {
    const subtypeConfig = this.getSubtypeConfig();
    return {
      ...super.getMetadata(),
      size: this.size,
      path: this.path,
      extension: this.extension,
      subtype: this.subtype,
      subtypeName: subtypeConfig.name
    };
  }
  
  getPreviewConfig() {
    const subtypeConfig = this.getSubtypeConfig();
    
    switch (subtypeConfig.previewType) {
    case 'text':
    case 'code':
      return {
        type: 'text',
        path: this.path
      };
    case 'audio':
      return {
        type: 'audio',
        src: `file://${this.path}`
      };
    case 'image':
      return {
        type: 'image',
        src: `file://${this.path}`
      };
    case 'video':
      return {
        type: 'video',
        src: `file://${this.path}`
      };
    default:
      return {
        type: 'none',
        message: '此文件类型暂不支持预览'
      };
    }
  }
  
  getCardConfig() {
    const subtypeConfig = this.getSubtypeConfig();
    return {
      badge: subtypeConfig.name,
      badgeClass: this.subtype,
      icon: subtypeConfig.icon,
      color: subtypeConfig.color,
      title: this.getDisplayName(),
      subtitle: null,
      meta: [
        { type: 'size', value: this.size },
        { type: 'date', value: this.addedAt }
      ],
      // 图片类型显示缩略图
      thumbnail: this.subtype === 'image' ? `file://${this.path}` : null
    };
  }
  
  /**
   * 在外部应用打开
   */
  async open() {
    const { shell } = require('electron');
    return shell.openPath(this.path);
  }
  
  /**
   * 读取文件内容（仅文本类型）
   * @returns {Promise<{success: boolean, content?: string, message?: string}>}
   */
  async readContent() {
    const subtypeConfig = this.getSubtypeConfig();
    if (subtypeConfig.previewType !== 'text' && subtypeConfig.previewType !== 'code') {
      return { success: false, message: '此文件类型不支持读取内容' };
    }
    
    try {
      const content = fs.readFileSync(this.path, 'utf-8');
      return { success: true, content };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
}

module.exports = FileResource;
