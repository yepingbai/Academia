#!/usr/bin/env node

/**
 * 本地 CI 脚本
 * 
 * 用法:
 *   node scripts/ci-local.js           # 仅为当前平台构建
 *   node scripts/ci-local.js --all     # 构建所有平台（需要相应环境）
 *   node scripts/ci-local.js --mac     # 仅构建 macOS
 *   node scripts/ci-local.js --win     # 仅构建 Windows
 *   node scripts/ci-local.js --linux   # 仅构建 Linux
 *   node scripts/ci-local.js --test    # 仅运行测试
 *   node scripts/ci-local.js --lint    # 仅运行代码检查
 */

const { execSync, spawn } = require('child_process');
const os = require('os');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}${colors.bright}▶ ${msg}${colors.reset}`),
  divider: () => console.log(`${colors.bright}${'─'.repeat(60)}${colors.reset}`),
  duration: (name, ms) => console.log(`${colors.cyan}⏱${colors.reset}  ${name}: ${colors.bright}${formatDuration(ms)}${colors.reset}`)
};

// 格式化耗时
function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }
}

// 耗时统计
const timing = {
  lint: null,
  test: null,
  builds: {},
  total: null
};

// 解析命令行参数
const args = process.argv.slice(2);
const flags = {
  all: args.includes('--all'),
  mac: args.includes('--mac'),
  win: args.includes('--win'),
  linux: args.includes('--linux'),
  testOnly: args.includes('--test'),
  lintOnly: args.includes('--lint'),
  skipTest: args.includes('--skip-test'),
  skipLint: args.includes('--skip-lint'),
  help: args.includes('--help') || args.includes('-h')
};

// 显示帮助
if (flags.help) {
  console.log(`
${colors.bright}Academia 本地 CI 脚本${colors.reset}

${colors.cyan}用法:${colors.reset}
  node scripts/ci-local.js [选项]

${colors.cyan}选项:${colors.reset}
  --all         构建所有平台 (macOS, Windows, Linux)
  --mac         仅构建 macOS
  --win         仅构建 Windows
  --linux       仅构建 Linux
  --test        仅运行测试
  --lint        仅运行代码检查
  --skip-test   跳过测试
  --skip-lint   跳过代码检查
  -h, --help    显示帮助

${colors.cyan}示例:${colors.reset}
  node scripts/ci-local.js              # 完整 CI 流程（当前平台）
  node scripts/ci-local.js --all        # 完整 CI 流程（所有平台）
  node scripts/ci-local.js --test       # 仅运行测试
  node scripts/ci-local.js --mac --win  # 构建 macOS 和 Windows

${colors.cyan}注意:${colors.reset}
  - macOS 构建需要在 macOS 系统上运行
  - Windows 构建需要在 Windows 系统或使用 Wine
  - Linux 构建可以在 macOS/Linux 上运行
`);
  process.exit(0);
}

// 执行命令
function run(command, options = {}) {
  const { silent = false, ignoreError = false } = options;
  
  try {
    if (!silent) {
      log.info(`执行: ${command}`);
    }
    
    const result = execSync(command, {
      stdio: silent ? 'pipe' : 'inherit',
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf-8'
    });
    
    return { success: true, output: result };
  } catch (error) {
    if (ignoreError) {
      return { success: false, error };
    }
    throw error;
  }
}

// 检查命令是否可用
function commandExists(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// 获取当前平台
function getCurrentPlatform() {
  switch (os.platform()) {
    case 'darwin': return 'mac';
    case 'win32': return 'win';
    case 'linux': return 'linux';
    default: return 'unknown';
  }
}

// 获取要构建的平台列表
function getTargetPlatforms() {
  if (flags.all) {
    return ['mac', 'win', 'linux'];
  }
  
  const platforms = [];
  if (flags.mac) platforms.push('mac');
  if (flags.win) platforms.push('win');
  if (flags.linux) platforms.push('linux');
  
  // 默认构建当前平台
  if (platforms.length === 0) {
    platforms.push(getCurrentPlatform());
  }
  
  return platforms;
}

// CI 步骤
const steps = {
  // 检查环境
  checkEnv: () => {
    log.step('检查环境');
    
    const nodeVersion = process.version;
    log.info(`Node.js 版本: ${nodeVersion}`);
    
    const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
    log.info(`npm 版本: ${npmVersion}`);
    
    log.info(`操作系统: ${os.platform()} ${os.release()}`);
    log.info(`架构: ${os.arch()}`);
    
    log.success('环境检查通过');
  },

  // 安装依赖
  install: () => {
    log.step('安装依赖');
    run('npm ci');
    log.success('依赖安装完成');
  },

  // 代码检查
  lint: () => {
    log.step('代码检查 (ESLint)');
    
    const startTime = Date.now();
    const result = run('npm run lint', { ignoreError: true });
    const duration = Date.now() - startTime;
    timing.lint = duration;
    
    if (result.success) {
      log.success('代码检查通过');
    } else {
      log.warn('代码检查发现问题，请运行 npm run lint:fix 修复');
      // 不中断流程，仅警告
    }
    log.duration('Lint 耗时', duration);
  },

  // 运行测试
  test: () => {
    log.step('运行单元测试');
    
    const startTime = Date.now();
    run('npm run test:coverage');
    const duration = Date.now() - startTime;
    timing.test = duration;
    
    log.success('测试通过');
    log.duration('测试耗时', duration);
  },

  // 构建应用
  build: (platforms) => {
    log.step(`构建应用 (${platforms.join(', ')})`);
    
    const currentPlatform = getCurrentPlatform();
    const results = [];
    
    for (const platform of platforms) {
      log.info(`\n构建 ${platform.toUpperCase()}...`);
      
      // 检查跨平台构建限制
      if (platform === 'mac' && currentPlatform !== 'mac') {
        log.warn('macOS 构建需要在 macOS 系统上运行，跳过');
        results.push({ platform, success: false, skipped: true, duration: 0 });
        timing.builds[platform] = { duration: 0, skipped: true };
        continue;
      }
      
      const startTime = Date.now();
      try {
        run(`npm run build:${platform}`);
        const duration = Date.now() - startTime;
        timing.builds[platform] = { duration, success: true };
        
        log.success(`${platform.toUpperCase()} 构建成功`);
        log.duration(`${platform.toUpperCase()} 构建耗时`, duration);
        results.push({ platform, success: true, duration });
      } catch (error) {
        const duration = Date.now() - startTime;
        timing.builds[platform] = { duration, success: false };
        
        log.error(`${platform.toUpperCase()} 构建失败: ${error.message}`);
        log.duration(`${platform.toUpperCase()} 构建耗时`, duration);
        results.push({ platform, success: false, error, duration });
      }
    }
    
    return results;
  }
};

// 主流程
async function main() {
  const startTime = Date.now();
  
  console.log(`
${colors.bright}╔════════════════════════════════════════════════════════════╗
║                    Academia 本地 CI                         ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
`);
  
  try {
    // 检查环境
    steps.checkEnv();
    
    // 安装依赖
    steps.install();
    
    // 仅代码检查
    if (flags.lintOnly) {
      steps.lint();
      const totalDuration = Date.now() - startTime;
      log.divider();
      console.log(`
${colors.green}${colors.bright}✓ 代码检查完成！${colors.reset}
  Lint 耗时: ${formatDuration(timing.lint)}
  总耗时: ${formatDuration(totalDuration)}
`);
      return;
    }
    
    // 仅测试
    if (flags.testOnly) {
      steps.test();
      const totalDuration = Date.now() - startTime;
      log.divider();
      console.log(`
${colors.green}${colors.bright}✓ 测试完成！${colors.reset}
  测试耗时: ${formatDuration(timing.test)}
  总耗时: ${formatDuration(totalDuration)}
`);
      return;
    }
    
    // 代码检查
    if (!flags.skipLint) {
      steps.lint();
    }
    
    // 运行测试
    if (!flags.skipTest) {
      steps.test();
    }
    
    // 构建
    const platforms = getTargetPlatforms();
    const buildResults = steps.build(platforms);
    
    // 输出结果摘要
    log.divider();
    log.step('构建摘要');
    
    const successCount = buildResults.filter(r => r.success).length;
    const failedCount = buildResults.filter(r => !r.success && !r.skipped).length;
    const skippedCount = buildResults.filter(r => r.skipped).length;
    
    buildResults.forEach(r => {
      if (r.success) {
        log.success(`${r.platform.toUpperCase()}: 成功 (${formatDuration(r.duration)})`);
      } else if (r.skipped) {
        log.warn(`${r.platform.toUpperCase()}: 跳过`);
      } else {
        log.error(`${r.platform.toUpperCase()}: 失败 (${formatDuration(r.duration)})`);
      }
    });
    
    const totalDuration = Date.now() - startTime;
    timing.total = totalDuration;
    
    // 耗时统计详情
    log.divider();
    log.step('耗时统计');
    
    console.log(`
┌─────────────────────────────────────────────────────────────┐
│                        耗时详情                              │
├─────────────────────────────────────────────────────────────┤`);
    
    if (timing.lint !== null) {
      console.log(`│  ${colors.cyan}Lint${colors.reset}      : ${formatDuration(timing.lint).padStart(12)}                              │`);
    }
    if (timing.test !== null) {
      console.log(`│  ${colors.cyan}单元测试${colors.reset}  : ${formatDuration(timing.test).padStart(12)}                              │`);
    }
    
    const buildPlatforms = Object.keys(timing.builds);
    if (buildPlatforms.length > 0) {
      console.log(`├─────────────────────────────────────────────────────────────┤`);
      console.log(`│  ${colors.bright}构建耗时${colors.reset}                                                  │`);
      
      let totalBuildTime = 0;
      buildPlatforms.forEach(platform => {
        const build = timing.builds[platform];
        if (build.skipped) {
          console.log(`│    ${platform.toUpperCase().padEnd(8)}: ${colors.yellow}跳过${colors.reset}                                       │`);
        } else {
          const status = build.success ? colors.green + '✓' + colors.reset : colors.red + '✗' + colors.reset;
          console.log(`│    ${platform.toUpperCase().padEnd(8)}: ${formatDuration(build.duration).padStart(12)} ${status}                          │`);
          totalBuildTime += build.duration;
        }
      });
      
      if (buildPlatforms.length > 1) {
        console.log(`│    ${'─'.repeat(20)}                                  │`);
        console.log(`│    ${colors.bright}合计${colors.reset}    : ${formatDuration(totalBuildTime).padStart(12)}                              │`);
      }
    }
    
    console.log(`├─────────────────────────────────────────────────────────────┤`);
    console.log(`│  ${colors.bright}${colors.green}总耗时${colors.reset}    : ${formatDuration(totalDuration).padStart(12)}                              │`);
    console.log(`└─────────────────────────────────────────────────────────────┘`);
    
    log.divider();
    if (failedCount === 0) {
      console.log(`
${colors.green}${colors.bright}✓ CI 完成！${colors.reset}
  成功: ${successCount}
  跳过: ${skippedCount}
  失败: ${failedCount}
  总耗时: ${formatDuration(totalDuration)}
`);
    } else {
      console.log(`
${colors.red}${colors.bright}✗ CI 失败${colors.reset}
  成功: ${successCount}
  跳过: ${skippedCount}
  失败: ${failedCount}
  总耗时: ${formatDuration(totalDuration)}
`);
      process.exit(1);
    }
    
  } catch (error) {
    log.divider();
    log.error(`CI 失败: ${error.message}`);
    process.exit(1);
  }
}

main();
