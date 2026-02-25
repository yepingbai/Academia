/**
 * Jest 配置文件
 */
module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // 忽略的目录
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  
  // 覆盖率收集
  collectCoverageFrom: [
    'src/main/resources/**/*.js',
    '!src/main/resources/index.js'
  ],
  
  // 覆盖率目录
  coverageDirectory: 'coverage',
  
  // 覆盖率报告格式
  coverageReporters: ['text', 'lcov', 'html'],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // 模块路径映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // 详细输出
  verbose: true,
  
  // 强制退出
  forceExit: true,
  
  // 清除模拟
  clearMocks: true,
  
  // 超时时间
  testTimeout: 10000
};
