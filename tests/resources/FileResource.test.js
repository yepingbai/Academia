/**
 * FileResource 单元测试
 */

const FileResource = require('../../src/main/resources/FileResource');

describe('FileResource', () => {
  describe('静态属性', () => {
    test('应有正确的类型标识', () => {
      expect(FileResource.type).toBe('file');
    });

    test('应有正确的存储键名', () => {
      expect(FileResource.storeKey).toBe('files');
    });

    test('应该是基于文件的资源', () => {
      expect(FileResource.isFileBased).toBe(true);
    });

    test('应有子类型配置', () => {
      expect(FileResource.subtypes).toBeDefined();
      expect(Object.keys(FileResource.subtypes)).toContain('txt');
      expect(Object.keys(FileResource.subtypes)).toContain('audio');
      expect(Object.keys(FileResource.subtypes)).toContain('image');
      expect(Object.keys(FileResource.subtypes)).toContain('video');
    });
  });

  describe('子类型配置', () => {
    test('txt 子类型应包含正确的扩展名', () => {
      const txtConfig = FileResource.subtypes.txt;
      
      expect(txtConfig.extensions).toContain('txt');
      expect(txtConfig.extensions).toContain('md');
      expect(txtConfig.extensions).toContain('json');
    });

    test('audio 子类型应包含正确的扩展名', () => {
      const audioConfig = FileResource.subtypes.audio;
      
      expect(audioConfig.extensions).toContain('mp3');
      expect(audioConfig.extensions).toContain('wav');
      expect(audioConfig.extensions).toContain('ogg');
    });

    test('image 子类型应包含正确的扩展名', () => {
      const imageConfig = FileResource.subtypes.image;
      
      expect(imageConfig.extensions).toContain('jpg');
      expect(imageConfig.extensions).toContain('png');
      expect(imageConfig.extensions).toContain('gif');
    });

    test('video 子类型应包含正确的扩展名', () => {
      const videoConfig = FileResource.subtypes.video;
      
      expect(videoConfig.extensions).toContain('mp4');
      expect(videoConfig.extensions).toContain('webm');
      expect(videoConfig.extensions).toContain('mkv');
    });
  });

  describe('构造函数', () => {
    test('应设置默认属性', () => {
      const resource = new FileResource();
      
      expect(resource.name).toBe('');
      expect(resource.path).toBe('');
      expect(resource.extension).toBe('');
      expect(resource.size).toBe(0);
      expect(resource.type).toBe('file');
    });

    test('应自动检测子类型', () => {
      const resource = new FileResource({ extension: 'mp3' });
      
      expect(resource.subtype).toBe('audio');
    });

    test('应兼容旧的 fileType 字段', () => {
      const resource = new FileResource({ fileType: 'image' });
      
      expect(resource.subtype).toBe('image');
    });

    test('未知扩展名应默认为 txt', () => {
      const resource = new FileResource({ extension: 'xyz' });
      
      expect(resource.subtype).toBe('txt');
    });
  });

  describe('_detectSubtype', () => {
    const testCases = [
      { extension: 'txt', expected: 'txt' },
      { extension: 'md', expected: 'txt' },
      { extension: 'json', expected: 'txt' },
      { extension: 'mp3', expected: 'audio' },
      { extension: 'wav', expected: 'audio' },
      { extension: 'jpg', expected: 'image' },
      { extension: 'png', expected: 'image' },
      { extension: 'gif', expected: 'image' },
      { extension: 'mp4', expected: 'video' },
      { extension: 'webm', expected: 'video' },
      { extension: 'zip', expected: 'archive' },
      { extension: 'js', expected: 'code' },
      { extension: 'py', expected: 'code' },
      { extension: 'doc', expected: 'document' }
    ];

    testCases.forEach(({ extension, expected }) => {
      test(`应将 .${extension} 识别为 ${expected}`, () => {
        const resource = new FileResource({ extension });
        
        expect(resource.subtype).toBe(expected);
      });
    });
  });

  describe('getSubtypeConfig', () => {
    test('应返回正确的子类型配置', () => {
      const resource = new FileResource({ extension: 'mp3' });
      const config = resource.getSubtypeConfig();
      
      expect(config.name).toBe('音频文件');
      expect(config.previewType).toBe('audio');
    });

    test('未知子类型应返回 txt 配置', () => {
      const resource = new FileResource();
      resource.subtype = 'unknown';
      const config = resource.getSubtypeConfig();
      
      expect(config).toBe(FileResource.subtypes.txt);
    });
  });

  describe('getDisplayName', () => {
    test('应返回带扩展名的文件名', () => {
      const resource = new FileResource({
        name: 'document',
        extension: 'txt'
      });
      
      expect(resource.getDisplayName()).toBe('document.txt');
    });
  });

  describe('getSearchText', () => {
    test('应包含文件名和扩展名', () => {
      const resource = new FileResource({
        name: 'Document',
        extension: 'PDF'
      });
      
      const searchText = resource.getSearchText();
      
      expect(searchText).toContain('document');
      expect(searchText).toContain('pdf');
    });
  });

  describe('toJSON', () => {
    test('应包含所有文件属性', () => {
      const resource = new FileResource({
        id: 'test-id',
        name: 'test',
        path: '/test/test.txt',
        extension: 'txt',
        size: 1024
      });
      
      const json = resource.toJSON();
      
      expect(json.id).toBe('test-id');
      expect(json.type).toBe('file');
      expect(json.name).toBe('test');
      expect(json.path).toBe('/test/test.txt');
      expect(json.extension).toBe('txt');
      expect(json.size).toBe(1024);
      expect(json.subtype).toBe('txt');
      expect(json.fileType).toBe('txt'); // 兼容字段
    });
  });

  describe('fromJSON', () => {
    test('应正确还原实例', () => {
      const data = {
        id: 'test-id',
        name: 'test',
        path: '/test/test.mp3',
        extension: 'mp3',
        size: 5120000
      };
      
      const resource = FileResource.fromJSON(data);
      
      expect(resource).toBeInstanceOf(FileResource);
      expect(resource.name).toBe('test');
      expect(resource.subtype).toBe('audio');
    });
  });

  describe('validate', () => {
    test('缺少路径时应返回无效', () => {
      const result = FileResource.validate({});
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('文件路径不能为空');
    });

    test('有效路径应返回有效', () => {
      const result = FileResource.validate({ path: '/test/file.txt' });
      
      expect(result.valid).toBe(true);
    });
  });

  describe('createFromPath', () => {
    test('应从文件路径创建资源', () => {
      const resource = FileResource.createFromPath('/test/audio.mp3');
      
      expect(resource).toBeInstanceOf(FileResource);
      expect(resource.name).toBe('audio');
      expect(resource.extension).toBe('mp3');
      expect(resource.path).toBe('/test/audio.mp3');
      expect(resource.subtype).toBe('audio');
    });
  });

  describe('getAllSupportedExtensions', () => {
    test('应返回所有支持的扩展名', () => {
      const extensions = FileResource.getAllSupportedExtensions();
      
      expect(extensions).toContain('txt');
      expect(extensions).toContain('mp3');
      expect(extensions).toContain('jpg');
      expect(extensions).toContain('mp4');
      expect(extensions).toContain('zip');
      expect(extensions).toContain('js');
      expect(extensions).toContain('doc');
    });
  });

  describe('getSubtypeByExtension', () => {
    test('应返回正确的子类型', () => {
      expect(FileResource.getSubtypeByExtension('mp3')).toBe('audio');
      expect(FileResource.getSubtypeByExtension('jpg')).toBe('image');
      expect(FileResource.getSubtypeByExtension('.mp4')).toBe('video');
    });

    test('未知扩展名应返回 null', () => {
      expect(FileResource.getSubtypeByExtension('xyz')).toBeNull();
    });
  });

  describe('getMetadata', () => {
    test('应包含文件元数据', () => {
      const resource = new FileResource({
        size: 2048,
        path: '/test/file.txt',
        extension: 'txt'
      });
      
      const metadata = resource.getMetadata();
      
      expect(metadata.size).toBe(2048);
      expect(metadata.path).toBe('/test/file.txt');
      expect(metadata.extension).toBe('txt');
      expect(metadata.subtype).toBe('txt');
      expect(metadata.subtypeName).toBe('文本文件');
    });
  });

  describe('getPreviewConfig', () => {
    test('文本文件应返回 text 预览', () => {
      const resource = new FileResource({ extension: 'txt', path: '/test/file.txt' });
      const config = resource.getPreviewConfig();
      
      expect(config.type).toBe('text');
      expect(config.path).toBe('/test/file.txt');
    });

    test('音频文件应返回 audio 预览', () => {
      const resource = new FileResource({ extension: 'mp3', path: '/test/audio.mp3' });
      const config = resource.getPreviewConfig();
      
      expect(config.type).toBe('audio');
      expect(config.src).toBe('file:///test/audio.mp3');
    });

    test('图片文件应返回 image 预览', () => {
      const resource = new FileResource({ extension: 'jpg', path: '/test/image.jpg' });
      const config = resource.getPreviewConfig();
      
      expect(config.type).toBe('image');
      expect(config.src).toBe('file:///test/image.jpg');
    });

    test('视频文件应返回 video 预览', () => {
      const resource = new FileResource({ extension: 'mp4', path: '/test/video.mp4' });
      const config = resource.getPreviewConfig();
      
      expect(config.type).toBe('video');
      expect(config.src).toBe('file:///test/video.mp4');
    });

    test('压缩文件应返回 none 预览', () => {
      const resource = new FileResource({ extension: 'zip', path: '/test/archive.zip' });
      const config = resource.getPreviewConfig();
      
      expect(config.type).toBe('none');
    });
  });

  describe('getCardConfig', () => {
    test('应返回正确的卡片配置', () => {
      const resource = new FileResource({
        name: 'test',
        extension: 'mp3',
        size: 1024
      });
      
      const config = resource.getCardConfig();
      
      expect(config.badge).toBe('音频文件');
      expect(config.badgeClass).toBe('audio');
      expect(config.title).toBe('test.mp3');
    });

    test('图片应包含缩略图', () => {
      const resource = new FileResource({
        name: 'image',
        extension: 'jpg',
        path: '/test/image.jpg'
      });
      
      const config = resource.getCardConfig();
      
      expect(config.thumbnail).toBe('file:///test/image.jpg');
    });

    test('非图片不应有缩略图', () => {
      const resource = new FileResource({
        name: 'audio',
        extension: 'mp3',
        path: '/test/audio.mp3'
      });
      
      const config = resource.getCardConfig();
      
      expect(config.thumbnail).toBeNull();
    });
  });

  describe('readContent', () => {
    test('文本文件应能读取内容', async () => {
      const resource = new FileResource({
        extension: 'txt',
        path: '/test/file.txt'
      });
      
      const result = await resource.readContent();
      
      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
    });

    test('非文本文件应返回错误', async () => {
      const resource = new FileResource({
        extension: 'mp3',
        path: '/test/audio.mp3'
      });
      
      const result = await resource.readContent();
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('此文件类型不支持读取内容');
    });
  });
});
