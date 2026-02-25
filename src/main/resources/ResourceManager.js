/**
 * 资源管理器 - 统一管理所有资源类型
 */

const PDFResource = require('./PDFResource');
const LinkResource = require('./LinkResource');
const NoteResource = require('./NoteResource');
const FileResource = require('./FileResource');

// 注册的资源类型
const RESOURCE_TYPES = {
  pdf: PDFResource,
  link: LinkResource,
  note: NoteResource,
  file: FileResource
};

class ResourceManager {
  /**
   * @param {import('electron-store')} store - electron-store 实例
   */
  constructor(store) {
    this.store = store;
    this.types = RESOURCE_TYPES;
  }
  
  /**
   * 注册新的资源类型
   * @param {typeof import('./BaseResource')} ResourceClass 
   */
  registerType(ResourceClass) {
    this.types[ResourceClass.type] = ResourceClass;
  }
  
  /**
   * 获取资源类型类
   * @param {string} type 
   * @returns {typeof import('./BaseResource')|null}
   */
  getTypeClass(type) {
    return this.types[type] || null;
  }
  
  /**
   * 获取所有已注册的资源类型
   * @returns {Object}
   */
  getAllTypes() {
    const result = {};
    for (const [type, TypeClass] of Object.entries(this.types)) {
      result[type] = {
        type: TypeClass.type,
        displayName: TypeClass.displayName,
        icon: TypeClass.icon,
        color: TypeClass.color,
        supportsPreview: TypeClass.supportsPreview,
        supportsEdit: TypeClass.supportsEdit,
        isFileBased: TypeClass.isFileBased
      };
    }
    return result;
  }
  
  /**
   * 获取文件类型配置（用于文件选择）
   * @returns {Object}
   */
  getFileTypeConfig() {
    // 合并 PDF 和通用文件类型
    const config = {
      pdf: {
        name: PDFResource.displayName,
        extensions: PDFResource.extensions,
        icon: PDFResource.icon,
        color: PDFResource.color
      }
    };
    
    // 添加 FileResource 的子类型
    for (const [subtype, subtypeConfig] of Object.entries(FileResource.subtypes)) {
      config[subtype] = {
        name: subtypeConfig.name,
        extensions: subtypeConfig.extensions,
        icon: subtypeConfig.icon,
        color: subtypeConfig.color
      };
    }
    
    return config;
  }
  
  // ============ 通用 CRUD 操作 ============
  
  /**
   * 获取指定类型的所有资源
   * @param {string} type 
   * @returns {import('./BaseResource')[]}
   */
  getAll(type) {
    const TypeClass = this.getTypeClass(type);
    if (!TypeClass) return [];
    
    const data = this.store.get(TypeClass.storeKey) || [];
    return data.map(item => TypeClass.fromJSON(item));
  }
  
  /**
   * 获取所有资源
   * @returns {import('./BaseResource')[]}
   */
  getAllResources() {
    const resources = [];
    for (const TypeClass of Object.values(this.types)) {
      const data = this.store.get(TypeClass.storeKey) || [];
      resources.push(...data.map(item => TypeClass.fromJSON(item)));
    }
    return resources.sort((a, b) => 
      new Date(b.addedAt) - new Date(a.addedAt)
    );
  }
  
  /**
   * 获取单个资源
   * @param {string} type 
   * @param {string} id 
   * @returns {import('./BaseResource')|null}
   */
  get(type, id) {
    const resources = this.getAll(type);
    return resources.find(r => r.id === id) || null;
  }
  
  /**
   * 添加资源
   * @param {string} type 
   * @param {Object} data 
   * @returns {{ success: boolean, resource?: import('./BaseResource'), message?: string }}
   */
  add(type, data) {
    const TypeClass = this.getTypeClass(type);
    if (!TypeClass) {
      return { success: false, message: '不支持的资源类型' };
    }
    
    // 验证数据
    const validation = TypeClass.validate(data);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }
    
    // 检查重复
    const existing = this.store.get(TypeClass.storeKey) || [];
    if (TypeClass.isFileBased && data.path) {
      const exists = existing.find(item => item.path === data.path);
      if (exists) {
        return { success: false, message: '资源已存在' };
      }
    } else if (type === 'link' && data.url) {
      const exists = existing.find(item => item.url === data.url);
      if (exists) {
        return { success: false, message: '链接已存在' };
      }
    }
    
    // 创建资源实例
    const resource = TypeClass.fromJSON(data);
    
    // 保存
    existing.push(resource.toJSON());
    this.store.set(TypeClass.storeKey, existing);
    
    return { success: true, resource };
  }
  
  /**
   * 从文件路径添加资源
   * @param {string} filePath 
   * @param {string} [forceSubtype] - 强制指定子类型
   * @returns {{ success: boolean, resource?: import('./BaseResource'), message?: string }}
   */
  addFromPath(filePath, forceSubtype = null) {
    const path = require('path');
    const ext = path.extname(filePath).toLowerCase().slice(1);
    
    // 判断是 PDF 还是通用文件
    if (ext === 'pdf') {
      return this.add('pdf', PDFResource.createFromPath(filePath).toJSON());
    }
    
    // 通用文件
    const fileData = FileResource.createFromPath(filePath);
    if (forceSubtype) {
      fileData.subtype = forceSubtype;
    }
    return this.add('file', fileData.toJSON());
  }
  
  /**
   * 更新资源
   * @param {string} type 
   * @param {string} id 
   * @param {Object} data 
   * @returns {{ success: boolean, resource?: import('./BaseResource'), message?: string }}
   */
  update(type, id, data) {
    const TypeClass = this.getTypeClass(type);
    if (!TypeClass) {
      return { success: false, message: '不支持的资源类型' };
    }
    
    const existing = this.store.get(TypeClass.storeKey) || [];
    const index = existing.findIndex(item => item.id === id);
    
    if (index === -1) {
      return { success: false, message: '资源不存在' };
    }
    
    // 加载资源并更新
    const resource = TypeClass.fromJSON(existing[index]);
    if (typeof resource.update === 'function') {
      resource.update(data);
    } else {
      // 通用更新
      Object.assign(resource, data);
      resource.updatedAt = new Date().toISOString();
    }
    
    // 保存
    existing[index] = resource.toJSON();
    this.store.set(TypeClass.storeKey, existing);
    
    return { success: true, resource };
  }
  
  /**
   * 更新资源标签
   * @param {string} type 
   * @param {string} id 
   * @param {string[]} tags 
   * @returns {{ success: boolean, resource?: import('./BaseResource'), message?: string }}
   */
  updateTags(type, id, tags) {
    const TypeClass = this.getTypeClass(type);
    if (!TypeClass) {
      return { success: false, message: '不支持的资源类型' };
    }
    
    const existing = this.store.get(TypeClass.storeKey) || [];
    const index = existing.findIndex(item => item.id === id);
    
    if (index === -1) {
      return { success: false, message: '资源不存在' };
    }
    
    const resource = TypeClass.fromJSON(existing[index]);
    resource.updateTags(tags);
    
    existing[index] = resource.toJSON();
    this.store.set(TypeClass.storeKey, existing);
    
    return { success: true, resource };
  }
  
  /**
   * 删除资源
   * @param {string} type 
   * @param {string} id 
   * @returns {{ success: boolean }}
   */
  delete(type, id) {
    const TypeClass = this.getTypeClass(type);
    if (!TypeClass) {
      return { success: false, message: '不支持的资源类型' };
    }
    
    const existing = this.store.get(TypeClass.storeKey) || [];
    const filtered = existing.filter(item => item.id !== id);
    this.store.set(TypeClass.storeKey, filtered);
    
    return { success: true };
  }
  
  /**
   * 从所有资源中移除指定标签
   * @param {string[]} tagIds 
   */
  removeTagsFromAll(tagIds) {
    for (const TypeClass of Object.values(this.types)) {
      const existing = this.store.get(TypeClass.storeKey) || [];
      existing.forEach(item => {
        item.tags = item.tags.filter(t => !tagIds.includes(t));
      });
      this.store.set(TypeClass.storeKey, existing);
    }
  }
  
  /**
   * 统计资源数量
   * @param {string} [type] - 可选，指定类型
   * @returns {number}
   */
  count(type = null) {
    if (type) {
      return this.getAll(type).length;
    }
    
    let total = 0;
    for (const TypeClass of Object.values(this.types)) {
      total += (this.store.get(TypeClass.storeKey) || []).length;
    }
    return total;
  }
  
  /**
   * 获取带有指定标签的资源数量
   * @param {string} tagId 
   * @param {string[]} [allTagIds] - 包含子标签的所有标签 ID
   * @returns {number}
   */
  countByTag(tagId, allTagIds = null) {
    const tagIds = allTagIds || [tagId];
    let count = 0;
    
    for (const TypeClass of Object.values(this.types)) {
      const existing = this.store.get(TypeClass.storeKey) || [];
      count += existing.filter(item => 
        item.tags.some(t => tagIds.includes(t))
      ).length;
    }
    
    return count;
  }
  
  /**
   * 打开资源
   * @param {string} type 
   * @param {string} id 
   */
  async open(type, id) {
    const resource = this.get(type, id);
    if (resource && typeof resource.open === 'function') {
      return resource.open();
    }
    return null;
  }
  
  /**
   * 读取文件内容
   * @param {string} type 
   * @param {string} id 
   * @returns {Promise<{success: boolean, content?: string, message?: string}>}
   */
  async readContent(type, id) {
    const resource = this.get(type, id);
    if (!resource) {
      return { success: false, message: '资源不存在' };
    }
    
    if (typeof resource.readContent === 'function') {
      return resource.readContent();
    }
    
    return { success: false, message: '此资源类型不支持读取内容' };
  }
}

module.exports = ResourceManager;
