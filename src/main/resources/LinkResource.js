/**
 * 链接资源类型
 */

const BaseResource = require('./BaseResource');

class LinkResource extends BaseResource {
  static type = 'link';
  static displayName = '链接';
  static icon = 'link';
  static color = '#10b981';
  static storeKey = 'links';
  static supportsPreview = true;
  static supportsEdit = true;
  static isFileBased = false;
  
  constructor(data = {}) {
    super(data);
    this.url = data.url || '';
    this.title = data.title || data.url || '';
    this.description = data.description || '';
    this.favicon = data.favicon || this._generateFavicon();
  }
  
  _generateFavicon() {
    try {
      const hostname = new URL(this.url).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    } catch {
      return '';
    }
  }
  
  getDisplayName() {
    return this.title;
  }
  
  getSearchText() {
    return `${this.title} ${this.url} ${this.description}`.toLowerCase();
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      url: this.url,
      title: this.title,
      description: this.description,
      favicon: this.favicon
    };
  }
  
  static fromJSON(data) {
    return new LinkResource(data);
  }
  
  static validate(data) {
    if (!data.url) {
      return { valid: false, message: '链接地址不能为空' };
    }
    try {
      new URL(data.url);
    } catch {
      return { valid: false, message: '请输入有效的链接地址' };
    }
    return { valid: true };
  }
  
  /**
   * 更新链接信息
   * @param {Object} data 
   */
  update(data) {
    if (data.url !== undefined) {
      this.url = data.url;
      this.favicon = this._generateFavicon();
    }
    if (data.title !== undefined) {
      this.title = data.title;
    }
    if (data.description !== undefined) {
      this.description = data.description;
    }
    this.updatedAt = new Date().toISOString();
  }
  
  getMetadata() {
    return {
      ...super.getMetadata(),
      url: this.url,
      description: this.description
    };
  }
  
  getPreviewConfig() {
    return {
      type: 'iframe',
      src: this.url
    };
  }
  
  getCardConfig() {
    return {
      ...super.getCardConfig(),
      title: this.title,
      subtitle: this.description,
      meta: [
        { type: 'url', value: this.url },
        { type: 'date', value: this.addedAt }
      ],
      favicon: this.favicon
    };
  }
  
  /**
   * 在浏览器打开链接
   */
  async open() {
    const { shell } = require('electron');
    return shell.openExternal(this.url);
  }
  
  /**
   * 获取域名
   * @returns {string}
   */
  getDomain() {
    try {
      return new URL(this.url).hostname;
    } catch {
      return this.url;
    }
  }
}

module.exports = LinkResource;
