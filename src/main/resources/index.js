/**
 * 资源模块导出
 */

const BaseResource = require('./BaseResource');
const PDFResource = require('./PDFResource');
const LinkResource = require('./LinkResource');
const NoteResource = require('./NoteResource');
const FileResource = require('./FileResource');
const ResourceManager = require('./ResourceManager');

module.exports = {
  BaseResource,
  PDFResource,
  LinkResource,
  NoteResource,
  FileResource,
  ResourceManager,
  
  // 资源类型映射
  RESOURCE_TYPES: {
    pdf: PDFResource,
    link: LinkResource,
    note: NoteResource,
    file: FileResource
  }
};
