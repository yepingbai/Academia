/**
 * PDFResource 单元测试
 */

const PDFResource = require('../../src/main/resources/PDFResource');

describe('PDFResource', () => {
  describe('静态属性', () => {
    test('应有正确的类型标识', () => {
      expect(PDFResource.type).toBe('pdf');
    });

    test('应有正确的显示名称', () => {
      expect(PDFResource.displayName).toBe('PDF 文档');
    });

    test('应有正确的存储键名', () => {
      expect(PDFResource.storeKey).toBe('pdfs');
    });

    test('应该是基于文件的资源', () => {
      expect(PDFResource.isFileBased).toBe(true);
    });

    test('应支持 pdf 扩展名', () => {
      expect(PDFResource.extensions).toContain('pdf');
    });
  });

  describe('构造函数', () => {
    test('应设置默认属性', () => {
      const resource = new PDFResource();
      
      expect(resource.name).toBe('');
      expect(resource.path).toBe('');
      expect(resource.size).toBe(0);
      expect(resource.type).toBe('pdf');
    });

    test('应使用传入的数据', () => {
      const data = {
        name: '测试文档',
        path: '/test/document.pdf',
        size: 1024000
      };
      
      const resource = new PDFResource(data);
      
      expect(resource.name).toBe('测试文档');
      expect(resource.path).toBe('/test/document.pdf');
      expect(resource.size).toBe(1024000);
    });
  });

  describe('getDisplayName', () => {
    test('应返回文件名', () => {
      const resource = new PDFResource({ name: '测试文档' });
      
      expect(resource.getDisplayName()).toBe('测试文档');
    });
  });

  describe('getSearchText', () => {
    test('应返回小写文件名', () => {
      const resource = new PDFResource({ name: 'Test Document' });
      
      expect(resource.getSearchText()).toBe('test document');
    });
  });

  describe('toJSON', () => {
    test('应包含所有 PDF 属性', () => {
      const resource = new PDFResource({
        id: 'test-id',
        name: '测试文档',
        path: '/test/document.pdf',
        size: 1024000,
        tags: ['tag1']
      });
      
      const json = resource.toJSON();
      
      expect(json.id).toBe('test-id');
      expect(json.type).toBe('pdf');
      expect(json.name).toBe('测试文档');
      expect(json.path).toBe('/test/document.pdf');
      expect(json.size).toBe(1024000);
      expect(json.tags).toEqual(['tag1']);
    });
  });

  describe('fromJSON', () => {
    test('应正确还原实例', () => {
      const data = {
        id: 'test-id',
        name: '测试文档',
        path: '/test/document.pdf',
        size: 1024000
      };
      
      const resource = PDFResource.fromJSON(data);
      
      expect(resource).toBeInstanceOf(PDFResource);
      expect(resource.id).toBe('test-id');
      expect(resource.name).toBe('测试文档');
    });
  });

  describe('validate', () => {
    test('缺少路径时应返回无效', () => {
      const result = PDFResource.validate({});
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('文件路径不能为空');
    });

    test('有效路径应返回有效', () => {
      // 使用 mock 的测试路径
      const result = PDFResource.validate({ path: '/test/document.pdf' });
      
      expect(result.valid).toBe(true);
    });
  });

  describe('createFromPath', () => {
    test('应从文件路径创建资源', () => {
      const resource = PDFResource.createFromPath('/test/my-document.pdf');
      
      expect(resource).toBeInstanceOf(PDFResource);
      expect(resource.name).toBe('my-document');
      expect(resource.path).toBe('/test/my-document.pdf');
      expect(resource.size).toBe(1024000); // mock 返回的大小
    });
  });

  describe('getMetadata', () => {
    test('应包含文件元数据', () => {
      const resource = new PDFResource({
        size: 2048000,
        path: '/test/document.pdf'
      });
      
      const metadata = resource.getMetadata();
      
      expect(metadata.size).toBe(2048000);
      expect(metadata.path).toBe('/test/document.pdf');
    });
  });

  describe('getPreviewConfig', () => {
    test('应返回 iframe 预览配置', () => {
      const resource = new PDFResource({ path: '/test/document.pdf' });
      const config = resource.getPreviewConfig();
      
      expect(config.type).toBe('iframe');
      expect(config.src).toBe('file:///test/document.pdf');
    });
  });

  describe('getCardConfig', () => {
    test('应返回正确的卡片配置', () => {
      const resource = new PDFResource({
        name: '测试文档',
        size: 1024000
      });
      
      const config = resource.getCardConfig();
      
      expect(config.title).toBe('测试文档');
      expect(config.meta).toHaveLength(2);
      expect(config.meta[0].type).toBe('size');
    });
  });

  describe('rename', () => {
    test('应更新名称和时间戳', () => {
      jest.useFakeTimers();
      const resource = new PDFResource({ name: '旧名称' });
      const originalUpdatedAt = resource.updatedAt;
      
      jest.advanceTimersByTime(1000);
      resource.rename('新名称');
      
      expect(resource.name).toBe('新名称');
      expect(resource.updatedAt).not.toBe(originalUpdatedAt);
      jest.useRealTimers();
    });
  });
});
