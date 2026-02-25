/**
 * NoteResource 单元测试
 */

const NoteResource = require('../../src/main/resources/NoteResource');

describe('NoteResource', () => {
  describe('静态属性', () => {
    test('应有正确的类型标识', () => {
      expect(NoteResource.type).toBe('note');
    });

    test('应有正确的存储键名', () => {
      expect(NoteResource.storeKey).toBe('notes');
    });

    test('应支持编辑', () => {
      expect(NoteResource.supportsEdit).toBe(true);
    });

    test('不应是基于文件的资源', () => {
      expect(NoteResource.isFileBased).toBe(false);
    });
  });

  describe('构造函数', () => {
    test('应设置默认属性', () => {
      const resource = new NoteResource();
      
      expect(resource.title).toBe('未命名笔记');
      expect(resource.content).toBe('');
      expect(resource.type).toBe('note');
    });

    test('应使用传入的数据', () => {
      const data = {
        title: '测试笔记',
        content: '# 标题\n\n内容'
      };
      
      const resource = new NoteResource(data);
      
      expect(resource.title).toBe('测试笔记');
      expect(resource.content).toBe('# 标题\n\n内容');
    });
  });

  describe('getDisplayName', () => {
    test('应返回标题', () => {
      const resource = new NoteResource({ title: '测试笔记' });
      
      expect(resource.getDisplayName()).toBe('测试笔记');
    });
  });

  describe('getSearchText', () => {
    test('应包含标题和内容', () => {
      const resource = new NoteResource({
        title: 'Test Note',
        content: 'Note content here'
      });
      
      const searchText = resource.getSearchText();
      
      expect(searchText).toContain('test note');
      expect(searchText).toContain('note content here');
    });
  });

  describe('toJSON', () => {
    test('应包含所有笔记属性', () => {
      const resource = new NoteResource({
        id: 'test-id',
        title: '测试笔记',
        content: '内容',
        tags: ['tag1']
      });
      
      const json = resource.toJSON();
      
      expect(json.id).toBe('test-id');
      expect(json.type).toBe('note');
      expect(json.title).toBe('测试笔记');
      expect(json.content).toBe('内容');
      expect(json.tags).toEqual(['tag1']);
    });
  });

  describe('fromJSON', () => {
    test('应正确还原实例', () => {
      const data = {
        id: 'test-id',
        title: '测试笔记',
        content: '内容'
      };
      
      const resource = NoteResource.fromJSON(data);
      
      expect(resource).toBeInstanceOf(NoteResource);
      expect(resource.title).toBe('测试笔记');
      expect(resource.content).toBe('内容');
    });
  });

  describe('validate', () => {
    test('缺少标题时应返回无效', () => {
      const result = NoteResource.validate({});
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('笔记标题不能为空');
    });

    test('空白标题应返回无效', () => {
      const result = NoteResource.validate({ title: '   ' });
      
      expect(result.valid).toBe(false);
    });

    test('有效标题应返回有效', () => {
      const result = NoteResource.validate({ title: '测试笔记' });
      
      expect(result.valid).toBe(true);
    });
  });

  describe('update', () => {
    test('应更新标题', () => {
      const resource = new NoteResource({ title: '旧标题' });
      
      resource.update({ title: '新标题' });
      
      expect(resource.title).toBe('新标题');
    });

    test('应更新内容', () => {
      const resource = new NoteResource({ content: '旧内容' });
      
      resource.update({ content: '新内容' });
      
      expect(resource.content).toBe('新内容');
    });

    test('应更新时间戳', () => {
      jest.useFakeTimers();
      const resource = new NoteResource();
      const originalUpdatedAt = resource.updatedAt;
      
      jest.advanceTimersByTime(1000);
      resource.update({ title: '新标题' });
      
      expect(resource.updatedAt).not.toBe(originalUpdatedAt);
      jest.useRealTimers();
    });
  });

  describe('getMetadata', () => {
    test('应包含字数统计', () => {
      const resource = new NoteResource({ content: 'Hello World' });
      
      const metadata = resource.getMetadata();
      
      expect(metadata.wordCount).toBe(11);
    });
  });

  describe('getPreviewConfig', () => {
    test('应返回 markdown 预览配置', () => {
      const resource = new NoteResource({ content: '# Title' });
      const config = resource.getPreviewConfig();
      
      expect(config.type).toBe('markdown');
      expect(config.content).toBe('# Title');
    });
  });

  describe('getExcerpt', () => {
    test('短内容应原样返回', () => {
      const resource = new NoteResource({ content: 'Short content' });
      
      expect(resource.getExcerpt()).toBe('Short content');
    });

    test('长内容应截断并添加省略号', () => {
      const longContent = 'A'.repeat(200);
      const resource = new NoteResource({ content: longContent });
      
      const excerpt = resource.getExcerpt();
      
      expect(excerpt.length).toBe(153); // 150 + '...'
      expect(excerpt.endsWith('...')).toBe(true);
    });

    test('应移除 Markdown 格式', () => {
      const content = '# Title\n\n**Bold** and *italic* text\n\n```code```';
      const resource = new NoteResource({ content });
      
      const excerpt = resource.getExcerpt();
      
      expect(excerpt).not.toContain('#');
      expect(excerpt).not.toContain('**');
      expect(excerpt).not.toContain('*');
      expect(excerpt).not.toContain('```');
    });

    test('应移除链接但保留文本', () => {
      const content = 'Check [this link](https://example.com) out';
      const resource = new NoteResource({ content });
      
      const excerpt = resource.getExcerpt();
      
      expect(excerpt).toContain('this link');
      expect(excerpt).not.toContain('https://');
    });

    test('应支持自定义长度', () => {
      const content = 'Hello World from Academia';
      const resource = new NoteResource({ content });
      
      const excerpt = resource.getExcerpt(10);
      
      expect(excerpt).toBe('Hello Worl...');
    });
  });
});
