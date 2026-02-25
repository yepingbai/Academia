/**
 * ResourceManager 单元测试
 */

const ResourceManager = require('../../src/main/resources/ResourceManager');
const PDFResource = require('../../src/main/resources/PDFResource');
const LinkResource = require('../../src/main/resources/LinkResource');
const NoteResource = require('../../src/main/resources/NoteResource');
const FileResource = require('../../src/main/resources/FileResource');

describe('ResourceManager', () => {
  let manager;
  let mockStore;

  beforeEach(() => {
    mockStore = global.testUtils.createMockStore();
    manager = new ResourceManager(mockStore);
  });

  describe('构造函数', () => {
    test('应初始化所有资源类型', () => {
      expect(manager.types.pdf).toBe(PDFResource);
      expect(manager.types.link).toBe(LinkResource);
      expect(manager.types.note).toBe(NoteResource);
      expect(manager.types.file).toBe(FileResource);
    });
  });

  describe('registerType', () => {
    test('应注册新的资源类型', () => {
      class CustomResource {
        static type = 'custom';
      }
      
      manager.registerType(CustomResource);
      
      expect(manager.types.custom).toBe(CustomResource);
    });
  });

  describe('getTypeClass', () => {
    test('应返回正确的资源类', () => {
      expect(manager.getTypeClass('pdf')).toBe(PDFResource);
      expect(manager.getTypeClass('link')).toBe(LinkResource);
    });

    test('不存在的类型应返回 null', () => {
      expect(manager.getTypeClass('unknown')).toBeNull();
    });
  });

  describe('getAllTypes', () => {
    test('应返回所有类型配置', () => {
      const types = manager.getAllTypes();
      
      expect(types.pdf).toBeDefined();
      expect(types.pdf.type).toBe('pdf');
      expect(types.pdf.displayName).toBe('PDF 文档');
      
      expect(types.link).toBeDefined();
      expect(types.note).toBeDefined();
      expect(types.file).toBeDefined();
    });
  });

  describe('getFileTypeConfig', () => {
    test('应返回文件类型配置', () => {
      const config = manager.getFileTypeConfig();
      
      expect(config.pdf).toBeDefined();
      expect(config.pdf.extensions).toContain('pdf');
      
      expect(config.txt).toBeDefined();
      expect(config.audio).toBeDefined();
      expect(config.image).toBeDefined();
    });
  });

  describe('add', () => {
    test('应成功添加笔记资源', () => {
      const result = manager.add('note', {
        title: '测试笔记',
        content: '内容'
      });
      
      expect(result.success).toBe(true);
      expect(result.resource).toBeInstanceOf(NoteResource);
      expect(result.resource.title).toBe('测试笔记');
    });

    test('应成功添加链接资源', () => {
      const result = manager.add('link', {
        url: 'https://example.com',
        title: '测试链接'
      });
      
      expect(result.success).toBe(true);
      expect(result.resource).toBeInstanceOf(LinkResource);
    });

    test('不支持的类型应返回失败', () => {
      const result = manager.add('unknown', {});
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('不支持的资源类型');
    });

    test('验证失败应返回错误', () => {
      const result = manager.add('note', { title: '' });
      
      expect(result.success).toBe(false);
    });

    test('重复链接应返回错误', () => {
      // 先添加一个链接
      mockStore._data.links = [{ url: 'https://example.com', id: '123' }];
      
      const result = manager.add('link', {
        url: 'https://example.com',
        title: '重复链接'
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('链接已存在');
    });
  });

  describe('addFromPath', () => {
    test('应正确添加 PDF 文件', () => {
      const result = manager.addFromPath('/test/document.pdf');
      
      expect(result.success).toBe(true);
      expect(result.resource).toBeInstanceOf(PDFResource);
    });

    test('应正确添加其他文件', () => {
      const result = manager.addFromPath('/test/audio.mp3');
      
      expect(result.success).toBe(true);
      expect(result.resource).toBeInstanceOf(FileResource);
      expect(result.resource.subtype).toBe('audio');
    });

    test('应支持强制指定子类型', () => {
      const result = manager.addFromPath('/test/file.txt', 'code');
      
      expect(result.success).toBe(true);
      expect(result.resource.subtype).toBe('code');
    });
  });

  describe('getAll', () => {
    test('应返回指定类型的所有资源', () => {
      mockStore._data.notes = [
        { id: '1', title: '笔记1', content: '' },
        { id: '2', title: '笔记2', content: '' }
      ];
      
      const notes = manager.getAll('note');
      
      expect(notes).toHaveLength(2);
      expect(notes[0]).toBeInstanceOf(NoteResource);
    });

    test('不存在的类型应返回空数组', () => {
      const result = manager.getAll('unknown');
      
      expect(result).toEqual([]);
    });
  });

  describe('getAllResources', () => {
    test('应返回所有资源并按时间排序', () => {
      mockStore._data.notes = [
        { id: '1', title: '笔记1', addedAt: '2024-01-01T00:00:00.000Z' }
      ];
      mockStore._data.links = [
        { id: '2', url: 'https://example.com', title: '链接', addedAt: '2024-01-02T00:00:00.000Z' }
      ];
      
      const resources = manager.getAllResources();
      
      expect(resources).toHaveLength(2);
      // 较新的应该在前面
      expect(resources[0].id).toBe('2');
    });
  });

  describe('get', () => {
    test('应返回指定资源', () => {
      mockStore._data.notes = [
        { id: 'note-1', title: '测试笔记', content: '' }
      ];
      
      const resource = manager.get('note', 'note-1');
      
      expect(resource).toBeInstanceOf(NoteResource);
      expect(resource.id).toBe('note-1');
    });

    test('不存在的资源应返回 null', () => {
      const resource = manager.get('note', 'not-exist');
      
      expect(resource).toBeNull();
    });
  });

  describe('update', () => {
    test('应成功更新资源', () => {
      mockStore._data.notes = [
        { id: 'note-1', title: '旧标题', content: '' }
      ];
      
      const result = manager.update('note', 'note-1', { title: '新标题' });
      
      expect(result.success).toBe(true);
      expect(result.resource.title).toBe('新标题');
    });

    test('不存在的资源应返回错误', () => {
      const result = manager.update('note', 'not-exist', { title: '新标题' });
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('资源不存在');
    });
  });

  describe('updateTags', () => {
    test('应成功更新标签', () => {
      mockStore._data.notes = [
        { id: 'note-1', title: '笔记', content: '', tags: [] }
      ];
      
      const result = manager.updateTags('note', 'note-1', ['tag1', 'tag2']);
      
      expect(result.success).toBe(true);
      expect(result.resource.tags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('delete', () => {
    test('应成功删除资源', () => {
      mockStore._data.notes = [
        { id: 'note-1', title: '笔记1' },
        { id: 'note-2', title: '笔记2' }
      ];
      
      const result = manager.delete('note', 'note-1');
      
      expect(result.success).toBe(true);
      expect(mockStore._data.notes).toHaveLength(1);
      expect(mockStore._data.notes[0].id).toBe('note-2');
    });
  });

  describe('removeTagsFromAll', () => {
    test('应从所有资源中移除指定标签', () => {
      mockStore._data.notes = [
        { id: '1', tags: ['tag1', 'tag2'] }
      ];
      mockStore._data.links = [
        { id: '2', tags: ['tag1', 'tag3'] }
      ];
      
      manager.removeTagsFromAll(['tag1']);
      
      expect(mockStore._data.notes[0].tags).toEqual(['tag2']);
      expect(mockStore._data.links[0].tags).toEqual(['tag3']);
    });
  });

  describe('count', () => {
    test('应返回指定类型的数量', () => {
      mockStore._data.notes = [
        { id: '1' }, { id: '2' }, { id: '3' }
      ];
      
      expect(manager.count('note')).toBe(3);
    });

    test('应返回所有资源的总数', () => {
      mockStore._data.notes = [{ id: '1' }];
      mockStore._data.links = [{ id: '2' }, { id: '3' }];
      
      // 总数应该是 notes(1) + links(2) = 3
      expect(manager.count()).toBe(3);
    });
  });

  describe('countByTag', () => {
    test('应返回指定标签的资源数量', () => {
      mockStore._data.notes = [
        { id: '1', tags: ['tag1'] },
        { id: '2', tags: ['tag1', 'tag2'] },
        { id: '3', tags: ['tag2'] }
      ];
      
      expect(manager.countByTag('tag1')).toBe(2);
    });

    test('应支持多个标签 ID', () => {
      mockStore._data.notes = [
        { id: '1', tags: ['tag1'] },
        { id: '2', tags: ['tag2'] }
      ];
      
      expect(manager.countByTag('tag1', ['tag1', 'tag2'])).toBe(2);
    });
  });
});
