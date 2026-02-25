/**
 * 笔记资源类型 (Markdown)
 */

const BaseResource = require('./BaseResource');

class NoteResource extends BaseResource {
  static type = 'note';
  static displayName = '笔记';
  static icon = 'note';
  static color = '#8b5cf6';
  static storeKey = 'notes';
  static supportsPreview = true;
  static supportsEdit = true;
  static isFileBased = false;
  
  constructor(data = {}) {
    super(data);
    this.title = data.title || '未命名笔记';
    this.content = data.content || '';
  }
  
  getDisplayName() {
    return this.title;
  }
  
  getSearchText() {
    return `${this.title} ${this.content}`.toLowerCase();
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      title: this.title,
      content: this.content
    };
  }
  
  static fromJSON(data) {
    return new NoteResource(data);
  }
  
  static validate(data) {
    if (!data.title || !data.title.trim()) {
      return { valid: false, message: '笔记标题不能为空' };
    }
    return { valid: true };
  }
  
  /**
   * 更新笔记
   * @param {Object} data 
   */
  update(data) {
    if (data.title !== undefined) {
      this.title = data.title;
    }
    if (data.content !== undefined) {
      this.content = data.content;
    }
    this.updatedAt = new Date().toISOString();
  }
  
  getMetadata() {
    return {
      ...super.getMetadata(),
      wordCount: this.content.length
    };
  }
  
  getPreviewConfig() {
    return {
      type: 'markdown',
      content: this.content
    };
  }
  
  getCardConfig() {
    return {
      ...super.getCardConfig(),
      title: this.title,
      subtitle: this.getExcerpt(),
      meta: [
        { type: 'date', value: this.addedAt },
        { type: 'updated', value: this.updatedAt }
      ]
    };
  }
  
  /**
   * 获取内容摘要
   * @param {number} maxLength 
   * @returns {string}
   */
  getExcerpt(maxLength = 150) {
    const plainText = this.content
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
}

module.exports = NoteResource;
