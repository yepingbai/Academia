/**
 * ESLint 配置文件
 */
module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  extends: ['eslint:recommended'],
  rules: {
    // 错误级别
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    'no-debugger': 'warn',
    
    // 代码风格
    'indent': ['warn', 2],
    'quotes': ['warn', 'single', { avoidEscape: true }],
    'semi': ['warn', 'always'],
    'comma-dangle': ['warn', 'never'],
    
    // 最佳实践
    'eqeqeq': ['warn', 'always'],
    'no-var': 'error',
    'prefer-const': 'warn'
  },
  overrides: [
    {
      // 测试文件的特殊规则
      files: ['tests/**/*.js'],
      rules: {
        'no-unused-expressions': 'off'
      }
    },
    {
      // 渲染进程（浏览器环境）
      files: ['src/renderer/**/*.js'],
      env: {
        browser: true,
        node: false
      },
      globals: {
        academiaAPI: 'readonly'
      }
    }
  ]
};
