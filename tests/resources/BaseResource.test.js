/**
 * BaseResource 单元测试
 */

const BaseResource = require('../../src/main/resources/BaseResource');

describe('BaseResource', () => {
  describe('静态属性', () => {
    test('应有正确的类型标识', () => {
      expect(BaseResource.type).toBe('base');
    });

    test('应有正确的显示名称', () => {
      expect(BaseResource.displayName).toBe('基础资源');
    });

    test('应有正确的默认配置', () => {
      expect(BaseResource.supportsPreview).toBe(true);
      expect(BaseResource.supportsEdit).toBe(false);
      expect(BaseResource.isFileBased).toBe(false);
    });
  });

  describe('构造函数', () => {
    test('应生成唯一 ID', () => {
      const resource1 = new BaseResource();
      const resource2 = new BaseResource();
      
      expect(resource1.id).toBeDefined();
      expect(resource2.id).toBeDefined();
      expect(resource1.id).not.toBe(resource2.id);
    });

    test('应使用传入的 ID', () => {
      const customId = 'custom-id-123';
      const resource = new BaseResource({ id: customId });
      
      expect(resource.id).toBe(customId);
    });

    test('应设置默认空标签数组', () => {
      const resource = new BaseResource();
      
      expect(resource.tags).toEqual([]);
    });

    test('应使用传入的标签', () => {
      const tags = ['tag1', 'tag2'];
      const resource = new BaseResource({ tags });
      
      expect(resource.tags).toEqual(tags);
    });

    test('应设置时间戳', () => {
      const resource = new BaseResource();
      
      expect(resource.addedAt).toBeDefined();
      expect(resource.updatedAt).toBeDefined();
      expect(new Date(resource.addedAt)).toBeInstanceOf(Date);
    });

    test('应使用传入的时间戳', () => {
      const timestamp = '2024-01-15T10:30:00.000Z';
      const resource = new BaseResource({ addedAt: timestamp });
      
      expect(resource.addedAt).toBe(timestamp);
    });
  });

  describe('getDisplayName', () => {
    test('应返回默认显示名称', () => {
      const resource = new BaseResource();
      
      expect(resource.getDisplayName()).toBe('未命名资源');
    });
  });

  describe('getSearchText', () => {
    test('应返回小写的搜索文本', () => {
      const resource = new BaseResource();
      
      expect(resource.getSearchText()).toBe('未命名资源');
    });
  });

  describe('toJSON', () => {
    test('应正确序列化', () => {
      const resource = new BaseResource({
        id: 'test-id',
        tags: ['tag1'],
        addedAt: '2024-01-15T10:30:00.000Z'
      });
      
      const json = resource.toJSON();
      
      expect(json).toEqual({
        id: 'test-id',
        type: 'base',
        tags: ['tag1'],
        addedAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z'
      });
    });
  });

  describe('fromJSON', () => {
    test('应从 JSON 创建实例', () => {
      const data = {
        id: 'test-id',
        tags: ['tag1'],
        addedAt: '2024-01-15T10:30:00.000Z'
      };
      
      const resource = BaseResource.fromJSON(data);
      
      expect(resource).toBeInstanceOf(BaseResource);
      expect(resource.id).toBe('test-id');
    });
  });

  describe('validate', () => {
    test('默认应返回有效', () => {
      const result = BaseResource.validate({});
      
      expect(result.valid).toBe(true);
    });
  });

  describe('updateTags', () => {
    test('应更新标签并更新时间戳', () => {
      jest.useFakeTimers();
      const resource = new BaseResource();
      const originalUpdatedAt = resource.updatedAt;
      
      // 推进时间
      jest.advanceTimersByTime(1000);
      
      const newTags = ['new-tag-1', 'new-tag-2'];
      resource.updateTags(newTags);
      
      expect(resource.tags).toEqual(newTags);
      expect(resource.updatedAt).not.toBe(originalUpdatedAt);
      
      jest.useRealTimers();
    });
  });

  describe('getMetadata', () => {
    test('应返回元数据', () => {
      const resource = new BaseResource({
        addedAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-16T10:30:00.000Z'
      });
      
      const metadata = resource.getMetadata();
      
      expect(metadata.addedAt).toBe('2024-01-15T10:30:00.000Z');
      expect(metadata.updatedAt).toBe('2024-01-16T10:30:00.000Z');
    });
  });

  describe('getPreviewConfig', () => {
    test('应返回默认预览配置', () => {
      const resource = new BaseResource();
      const config = resource.getPreviewConfig();
      
      expect(config.type).toBe('none');
      expect(config.content).toBeNull();
    });
  });

  describe('getCardConfig', () => {
    test('应返回卡片渲染配置', () => {
      const resource = new BaseResource();
      const config = resource.getCardConfig();
      
      expect(config.badge).toBe('基础资源');
      expect(config.badgeClass).toBe('base');
      expect(config.icon).toBe('file');
      expect(config.color).toBe('#6366f1');
      expect(config.title).toBe('未命名资源');
    });
  });
});
