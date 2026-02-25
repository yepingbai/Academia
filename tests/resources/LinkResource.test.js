/**
 * LinkResource 单元测试
 */

const LinkResource = require('../../src/main/resources/LinkResource');

describe('LinkResource', () => {
  describe('静态属性', () => {
    test('应有正确的类型标识', () => {
      expect(LinkResource.type).toBe('link');
    });

    test('应有正确的存储键名', () => {
      expect(LinkResource.storeKey).toBe('links');
    });

    test('应支持编辑', () => {
      expect(LinkResource.supportsEdit).toBe(true);
    });

    test('不应是基于文件的资源', () => {
      expect(LinkResource.isFileBased).toBe(false);
    });
  });

  describe('构造函数', () => {
    test('应设置默认属性', () => {
      const resource = new LinkResource();
      
      expect(resource.url).toBe('');
      expect(resource.title).toBe('');
      expect(resource.description).toBe('');
      expect(resource.type).toBe('link');
    });

    test('应使用 URL 作为默认标题', () => {
      const resource = new LinkResource({ url: 'https://example.com' });
      
      expect(resource.title).toBe('https://example.com');
    });

    test('应自动生成 favicon', () => {
      const resource = new LinkResource({ url: 'https://github.com/test' });
      
      expect(resource.favicon).toContain('google.com/s2/favicons');
      expect(resource.favicon).toContain('github.com');
    });

    test('无效 URL 时 favicon 应为空', () => {
      const resource = new LinkResource({ url: 'not-a-url' });
      
      expect(resource.favicon).toBe('');
    });
  });

  describe('getDisplayName', () => {
    test('应返回标题', () => {
      const resource = new LinkResource({ title: '测试链接' });
      
      expect(resource.getDisplayName()).toBe('测试链接');
    });
  });

  describe('getSearchText', () => {
    test('应包含标题、URL 和描述', () => {
      const resource = new LinkResource({
        title: 'Test Link',
        url: 'https://example.com',
        description: 'A description'
      });
      
      const searchText = resource.getSearchText();
      
      expect(searchText).toContain('test link');
      expect(searchText).toContain('https://example.com');
      expect(searchText).toContain('a description');
    });
  });

  describe('toJSON', () => {
    test('应包含所有链接属性', () => {
      const resource = new LinkResource({
        id: 'test-id',
        url: 'https://example.com',
        title: '测试链接',
        description: '测试描述'
      });
      
      const json = resource.toJSON();
      
      expect(json.id).toBe('test-id');
      expect(json.type).toBe('link');
      expect(json.url).toBe('https://example.com');
      expect(json.title).toBe('测试链接');
      expect(json.description).toBe('测试描述');
      expect(json.favicon).toBeDefined();
    });
  });

  describe('fromJSON', () => {
    test('应正确还原实例', () => {
      const data = {
        id: 'test-id',
        url: 'https://example.com',
        title: '测试链接'
      };
      
      const resource = LinkResource.fromJSON(data);
      
      expect(resource).toBeInstanceOf(LinkResource);
      expect(resource.url).toBe('https://example.com');
    });
  });

  describe('validate', () => {
    test('缺少 URL 时应返回无效', () => {
      const result = LinkResource.validate({});
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('链接地址不能为空');
    });

    test('无效 URL 应返回无效', () => {
      const result = LinkResource.validate({ url: 'not-a-valid-url' });
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请输入有效的链接地址');
    });

    test('有效 URL 应返回有效', () => {
      const result = LinkResource.validate({ url: 'https://example.com' });
      
      expect(result.valid).toBe(true);
    });

    test('应支持 http 协议', () => {
      const result = LinkResource.validate({ url: 'http://example.com' });
      
      expect(result.valid).toBe(true);
    });
  });

  describe('update', () => {
    test('应更新 URL 并重新生成 favicon', () => {
      const resource = new LinkResource({ url: 'https://old.com' });
      
      resource.update({ url: 'https://new.com' });
      
      expect(resource.url).toBe('https://new.com');
      expect(resource.favicon).toContain('new.com');
    });

    test('应更新标题', () => {
      const resource = new LinkResource({ title: '旧标题' });
      
      resource.update({ title: '新标题' });
      
      expect(resource.title).toBe('新标题');
    });

    test('应更新描述', () => {
      const resource = new LinkResource({ description: '旧描述' });
      
      resource.update({ description: '新描述' });
      
      expect(resource.description).toBe('新描述');
    });

    test('应更新时间戳', () => {
      jest.useFakeTimers();
      const resource = new LinkResource();
      const originalUpdatedAt = resource.updatedAt;
      
      jest.advanceTimersByTime(1000);
      resource.update({ title: '新标题' });
      
      expect(resource.updatedAt).not.toBe(originalUpdatedAt);
      jest.useRealTimers();
    });
  });

  describe('getPreviewConfig', () => {
    test('应返回 iframe 预览配置', () => {
      const resource = new LinkResource({ url: 'https://example.com' });
      const config = resource.getPreviewConfig();
      
      expect(config.type).toBe('iframe');
      expect(config.src).toBe('https://example.com');
    });
  });

  describe('getDomain', () => {
    test('应返回域名', () => {
      const resource = new LinkResource({ url: 'https://github.com/user/repo' });
      
      expect(resource.getDomain()).toBe('github.com');
    });

    test('无效 URL 应返回原始 URL', () => {
      const resource = new LinkResource({ url: 'not-a-url' });
      
      expect(resource.getDomain()).toBe('not-a-url');
    });
  });
});
