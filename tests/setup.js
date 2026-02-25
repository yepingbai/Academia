/**
 * Jest 测试环境设置
 */

// Mock electron 模块
jest.mock('electron', () => ({
  shell: {
    openPath: jest.fn().mockResolvedValue(''),
    openExternal: jest.fn().mockResolvedValue(true)
  }
}), { virtual: true });

// Mock fs 模块
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  
  return {
    ...originalFs,
    existsSync: jest.fn((path) => {
      // 测试中的虚拟路径返回 true
      if (typeof path === 'string' && (path.includes('/test/') || path.includes('\\test\\'))) {
        return true;
      }
      return originalFs.existsSync(path);
    }),
    statSync: jest.fn((path) => {
      if (typeof path === 'string' && (path.includes('/test/') || path.includes('\\test\\'))) {
        return {
          size: 1024000,
          isFile: () => true,
          isDirectory: () => false,
          mtime: new Date(),
          ctime: new Date()
        };
      }
      return originalFs.statSync(path);
    }),
    readFileSync: jest.fn((path, encoding) => {
      if (typeof path === 'string' && (path.includes('/test/') || path.includes('\\test\\'))) {
        return '# Test Content\n\nThis is test file content.';
      }
      return originalFs.readFileSync(path, encoding);
    })
  };
});

// 全局测试工具
global.testUtils = {
  /**
   * 创建测试用的 mock store
   */
  createMockStore: (initialData = {}) => {
    const data = {
      pdfs: [],
      links: [],
      notes: [],
      files: [],
      tags: [],
      ...initialData
    };
    
    return {
      get: jest.fn((key) => data[key]),
      set: jest.fn((key, value) => { data[key] = value; }),
      delete: jest.fn((key) => { delete data[key]; }),
      clear: jest.fn(() => Object.keys(data).forEach(k => data[k] = [])),
      _data: data
    };
  },
  
  /**
   * 生成测试用的 UUID
   */
  generateTestId: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  /**
   * 等待异步操作
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// 控制台输出设置
if (process.env.CI) {
  // CI 环境下减少输出
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn()
  };
}
