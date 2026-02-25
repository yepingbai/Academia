/**
 * PDF 资源类型
 */

const BaseResource = require('./BaseResource');
const path = require('path');
const fs = require('fs');

class PDFResource extends BaseResource {
  static type = 'pdf';
  static displayName = 'PDF 文档';
  static icon = 'document';
  static color = '#667eea';
  static storeKey = 'pdfs';
  static supportsPreview = true;
  static supportsEdit = false;
  static isFileBased = true;
  
  // 支持的文件扩展名
  static extensions = ['pdf'];
  
  constructor(data = {}) {
    super(data);
    this.name = data.name || '';
    this.path = data.path || '';
    this.size = data.size || 0;
  }
  
  getDisplayName() {
    return this.name;
  }
  
  getSearchText() {
    return this.name.toLowerCase();
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      path: this.path,
      size: this.size
    };
  }
  
  static fromJSON(data) {
    return new PDFResource(data);
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
   * 从文件路径创建 PDF 资源
   * @param {string} filePath 
   * @returns {PDFResource}
   */
  static createFromPath(filePath) {
    const fileName = path.basename(filePath, '.pdf');
    const stats = fs.statSync(filePath);
    
    return new PDFResource({
      name: fileName,
      path: filePath,
      size: stats.size
    });
  }
  
  getMetadata() {
    return {
      ...super.getMetadata(),
      size: this.size,
      path: this.path
    };
  }
  
  getPreviewConfig() {
    return {
      type: 'iframe',
      src: `file://${this.path}`
    };
  }
  
  getCardConfig() {
    return {
      ...super.getCardConfig(),
      title: this.name,
      meta: [
        { type: 'size', value: this.size },
        { type: 'date', value: this.addedAt }
      ]
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
   * 重命名
   * @param {string} newName 
   */
  rename(newName) {
    this.name = newName;
    this.updatedAt = new Date().toISOString();
  }
}

module.exports = PDFResource;
