/**
 * 资源基类 - 所有资源类型的抽象基类
 * 定义了资源的通用属性和方法
 */

const { v4: uuidv4 } = require('uuid');

class BaseResource {
  // 资源类型标识 - 子类必须覆写
  static type = 'base';
  
  // 资源显示名称
  static displayName = '基础资源';
  
  // 资源图标标识
  static icon = 'file';
  
  // 资源主题色
  static color = '#6366f1';
  
  // 存储键名
  static storeKey = 'resources';
  
  // 是否支持预览
  static supportsPreview = true;
  
  // 是否支持编辑
  static supportsEdit = false;
  
  // 是否基于文件路径
  static isFileBased = false;
  
  /**
   * 构造函数
   * @param {Object} data - 资源数据
   */
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.type = this.constructor.type;
    this.tags = data.tags || [];
    this.addedAt = data.addedAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || this.addedAt;
  }
  
  /**
   * 获取资源的显示名称 - 子类应覆写
   * @returns {string}
   */
  getDisplayName() {
    return '未命名资源';
  }
  
  /**
   * 获取资源的搜索文本 - 用于全文搜索
   * @returns {string}
   */
  getSearchText() {
    return this.getDisplayName().toLowerCase();
  }
  
  /**
   * 转换为存储对象
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      tags: this.tags,
      addedAt: this.addedAt,
      updatedAt: this.updatedAt
    };
  }
  
  /**
   * 从存储对象创建实例 - 子类应覆写
   * @param {Object} data 
   * @returns {BaseResource}
   */
  static fromJSON(data) {
    return new this(data);
  }
  
  /**
   * 验证资源数据 - 子类可覆写
   * @param {Object} data 
   * @returns {{ valid: boolean, message?: string }}
   */
  static validate(_data) {
    return { valid: true };
  }
  
  /**
   * 更新标签
   * @param {string[]} tags 
   */
  updateTags(tags) {
    this.tags = tags;
    this.updatedAt = new Date().toISOString();
  }
  
  /**
   * 获取资源的元数据 - 用于预览面板显示
   * @returns {Object}
   */
  getMetadata() {
    return {
      addedAt: this.addedAt,
      updatedAt: this.updatedAt
    };
  }
  
  /**
   * 获取预览配置 - 子类应覆写
   * @returns {Object}
   */
  getPreviewConfig() {
    return {
      type: 'none',
      content: null
    };
  }
  
  /**
   * 获取卡片渲染配置 - 子类可覆写
   * @returns {Object}
   */
  getCardConfig() {
    return {
      badge: this.constructor.displayName,
      badgeClass: this.constructor.type,
      icon: this.constructor.icon,
      color: this.constructor.color,
      title: this.getDisplayName(),
      subtitle: null,
      meta: []
    };
  }
}

module.exports = BaseResource;
