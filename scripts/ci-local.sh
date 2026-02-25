#!/bin/bash

#
# Academia 本地 CI 脚本 (Shell 版)
#
# 用法:
#   ./scripts/ci-local.sh           # 仅为当前平台构建
#   ./scripts/ci-local.sh --all     # 构建所有平台
#   ./scripts/ci-local.sh --mac     # 仅构建 macOS
#   ./scripts/ci-local.sh --win     # 仅构建 Windows
#   ./scripts/ci-local.sh --linux   # 仅构建 Linux
#   ./scripts/ci-local.sh --test    # 仅运行测试
#   ./scripts/ci-local.sh --lint    # 仅运行代码检查
#

set -e

# ==================== 颜色定义 ====================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ==================== 日志函数 ====================
log_info()    { echo -e "${BLUE}ℹ${RESET} $1"; }
log_success() { echo -e "${GREEN}✓${RESET} $1"; }
log_error()   { echo -e "${RED}✗${RESET} $1"; }
log_warn()    { echo -e "${YELLOW}⚠${RESET} $1"; }
log_step()    { echo -e "\n${CYAN}${BOLD}▶ $1${RESET}"; }
log_duration(){ echo -e "${CYAN}⏱${RESET}  $1: ${BOLD}$2${RESET}"; }
log_divider() { echo -e "${BOLD}────────────────────────────────────────────────────────────${RESET}"; }

# ==================== 工具函数 ====================

# 格式化耗时 (毫秒 -> 可读格式)
format_duration() {
    local ms=$1
    if [ "$ms" -lt 1000 ]; then
        echo "${ms}ms"
    elif [ "$ms" -lt 60000 ]; then
        echo "$(echo "scale=2; $ms/1000" | bc)s"
    else
        local minutes=$((ms / 60000))
        local seconds=$(echo "scale=1; ($ms % 60000) / 1000" | bc)
        echo "${minutes}m ${seconds}s"
    fi
}

# 获取当前时间戳 (毫秒)
get_timestamp_ms() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS: 使用 perl 获取毫秒
        perl -MTime::HiRes=time -e 'printf "%.0f\n", time * 1000'
    else
        # Linux: 使用 date 的纳秒
        echo $(($(date +%s%N) / 1000000))
    fi
}

# 计算耗时
calc_duration() {
    local start=$1
    local end=$2
    echo $((end - start))
}

# 获取当前平台
get_platform() {
    case "$(uname -s)" in
        Darwin) echo "mac" ;;
        Linux)  echo "linux" ;;
        MINGW*|CYGWIN*|MSYS*) echo "win" ;;
        *) echo "unknown" ;;
    esac
}

# ==================== 解析参数 ====================
FLAG_ALL=false
FLAG_MAC=false
FLAG_WIN=false
FLAG_LINUX=false
FLAG_TEST_ONLY=false
FLAG_LINT_ONLY=false
FLAG_SKIP_TEST=false
FLAG_SKIP_LINT=false
FLAG_HELP=false

for arg in "$@"; do
    case $arg in
        --all)       FLAG_ALL=true ;;
        --mac)       FLAG_MAC=true ;;
        --win)       FLAG_WIN=true ;;
        --linux)     FLAG_LINUX=true ;;
        --test)      FLAG_TEST_ONLY=true ;;
        --lint)      FLAG_LINT_ONLY=true ;;
        --skip-test) FLAG_SKIP_TEST=true ;;
        --skip-lint) FLAG_SKIP_LINT=true ;;
        -h|--help)   FLAG_HELP=true ;;
    esac
done

# ==================== 显示帮助 ====================
if [ "$FLAG_HELP" = true ]; then
    cat << EOF
${BOLD}Academia 本地 CI 脚本 (Shell 版)${RESET}

${CYAN}用法:${RESET}
  ./scripts/ci-local.sh [选项]

${CYAN}选项:${RESET}
  --all         构建所有平台 (macOS, Windows, Linux)
  --mac         仅构建 macOS
  --win         仅构建 Windows
  --linux       仅构建 Linux
  --test        仅运行测试
  --lint        仅运行代码检查
  --skip-test   跳过测试
  --skip-lint   跳过代码检查
  -h, --help    显示帮助

${CYAN}示例:${RESET}
  ./scripts/ci-local.sh              # 完整 CI 流程（当前平台）
  ./scripts/ci-local.sh --all        # 完整 CI 流程（所有平台）
  ./scripts/ci-local.sh --test       # 仅运行测试
  ./scripts/ci-local.sh --mac --win  # 构建 macOS 和 Windows

${CYAN}注意:${RESET}
  - macOS 构建需要在 macOS 系统上运行
  - Windows 构建需要在 Windows 系统或使用 Wine
  - Linux 构建可以在 macOS/Linux 上运行
EOF
    exit 0
fi

# ==================== 切换到项目根目录 ====================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# ==================== 耗时统计变量 ====================
TIMING_LINT=0
TIMING_TEST=0
declare -A TIMING_BUILDS
BUILD_RESULTS=()

# ==================== CI 步骤函数 ====================

# 检查环境
step_check_env() {
    log_step "检查环境"
    
    log_info "Node.js 版本: $(node --version)"
    log_info "npm 版本: $(npm --version)"
    log_info "操作系统: $(uname -s) $(uname -r)"
    log_info "架构: $(uname -m)"
    
    log_success "环境检查通过"
}

# 安装依赖
step_install() {
    log_step "安装依赖"
    npm ci
    log_success "依赖安装完成"
}

# 代码检查
step_lint() {
    log_step "代码检查 (ESLint)"
    
    local start_time=$(get_timestamp_ms)
    
    if npm run lint; then
        log_success "代码检查通过"
    else
        log_warn "代码检查发现问题，请运行 npm run lint:fix 修复"
    fi
    
    local end_time=$(get_timestamp_ms)
    TIMING_LINT=$(calc_duration $start_time $end_time)
    log_duration "Lint 耗时" "$(format_duration $TIMING_LINT)"
}

# 运行测试
step_test() {
    log_step "运行单元测试"
    
    local start_time=$(get_timestamp_ms)
    npm run test:coverage
    local end_time=$(get_timestamp_ms)
    
    TIMING_TEST=$(calc_duration $start_time $end_time)
    log_success "测试通过"
    log_duration "测试耗时" "$(format_duration $TIMING_TEST)"
}

# 构建单个平台
build_platform() {
    local platform=$1
    local current_platform=$(get_platform)
    
    log_info ""
    log_info "构建 ${platform^^}..."
    
    # 检查跨平台构建限制
    if [ "$platform" = "mac" ] && [ "$current_platform" != "mac" ]; then
        log_warn "macOS 构建需要在 macOS 系统上运行，跳过"
        TIMING_BUILDS[$platform]="0:skipped"
        BUILD_RESULTS+=("$platform:skipped")
        return 0
    fi
    
    local start_time=$(get_timestamp_ms)
    local build_success=true
    
    if npm run "build:$platform"; then
        local end_time=$(get_timestamp_ms)
        local duration=$(calc_duration $start_time $end_time)
        TIMING_BUILDS[$platform]="$duration:success"
        BUILD_RESULTS+=("$platform:success:$duration")
        log_success "${platform^^} 构建成功"
        log_duration "${platform^^} 构建耗时" "$(format_duration $duration)"
    else
        local end_time=$(get_timestamp_ms)
        local duration=$(calc_duration $start_time $end_time)
        TIMING_BUILDS[$platform]="$duration:failed"
        BUILD_RESULTS+=("$platform:failed:$duration")
        log_error "${platform^^} 构建失败"
        log_duration "${platform^^} 构建耗时" "$(format_duration $duration)"
        build_success=false
    fi
    
    return 0
}

# 构建应用
step_build() {
    local platforms=("$@")
    log_step "构建应用 (${platforms[*]})"
    
    for platform in "${platforms[@]}"; do
        build_platform "$platform"
    done
}

# 获取目标平台列表
get_target_platforms() {
    local platforms=()
    
    if [ "$FLAG_ALL" = true ]; then
        platforms=("mac" "win" "linux")
    else
        [ "$FLAG_MAC" = true ] && platforms+=("mac")
        [ "$FLAG_WIN" = true ] && platforms+=("win")
        [ "$FLAG_LINUX" = true ] && platforms+=("linux")
        
        # 默认构建当前平台
        if [ ${#platforms[@]} -eq 0 ]; then
            platforms+=("$(get_platform)")
        fi
    fi
    
    echo "${platforms[@]}"
}

# 打印耗时统计表格
print_timing_summary() {
    local total_duration=$1
    
    log_divider
    log_step "耗时统计"
    
    echo ""
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│                        耗时详情                              │"
    echo "├─────────────────────────────────────────────────────────────┤"
    
    if [ "$TIMING_LINT" -gt 0 ]; then
        printf "│  ${CYAN}Lint${RESET}      : %12s                              │\n" "$(format_duration $TIMING_LINT)"
    fi
    
    if [ "$TIMING_TEST" -gt 0 ]; then
        printf "│  ${CYAN}单元测试${RESET}  : %12s                              │\n" "$(format_duration $TIMING_TEST)"
    fi
    
    if [ ${#BUILD_RESULTS[@]} -gt 0 ]; then
        echo "├─────────────────────────────────────────────────────────────┤"
        echo -e "│  ${BOLD}构建耗时${RESET}                                                  │"
        
        local total_build_time=0
        for result in "${BUILD_RESULTS[@]}"; do
            IFS=':' read -r platform status duration <<< "$result"
            
            if [ "$status" = "skipped" ]; then
                printf "│    %-8s: ${YELLOW}跳过${RESET}                                       │\n" "${platform^^}"
            elif [ "$status" = "success" ]; then
                printf "│    %-8s: %12s ${GREEN}✓${RESET}                          │\n" "${platform^^}" "$(format_duration $duration)"
                total_build_time=$((total_build_time + duration))
            else
                printf "│    %-8s: %12s ${RED}✗${RESET}                          │\n" "${platform^^}" "$(format_duration $duration)"
                total_build_time=$((total_build_time + duration))
            fi
        done
        
        if [ ${#BUILD_RESULTS[@]} -gt 1 ]; then
            echo "│    ────────────────────                                  │"
            printf "│    ${BOLD}合计${RESET}    : %12s                              │\n" "$(format_duration $total_build_time)"
        fi
    fi
    
    echo "├─────────────────────────────────────────────────────────────┤"
    printf "│  ${BOLD}${GREEN}总耗时${RESET}    : %12s                              │\n" "$(format_duration $total_duration)"
    echo "└─────────────────────────────────────────────────────────────┘"
}

# 打印最终结果
print_final_result() {
    local total_duration=$1
    local success_count=0
    local failed_count=0
    local skipped_count=0
    
    for result in "${BUILD_RESULTS[@]}"; do
        IFS=':' read -r platform status duration <<< "$result"
        case $status in
            success) ((success_count++)) ;;
            failed)  ((failed_count++)) ;;
            skipped) ((skipped_count++)) ;;
        esac
    done
    
    log_divider
    
    if [ "$failed_count" -eq 0 ]; then
        echo ""
        echo -e "${GREEN}${BOLD}✓ CI 完成！${RESET}"
        echo "  成功: $success_count"
        echo "  跳过: $skipped_count"
        echo "  失败: $failed_count"
        echo "  总耗时: $(format_duration $total_duration)"
        echo ""
        return 0
    else
        echo ""
        echo -e "${RED}${BOLD}✗ CI 失败${RESET}"
        echo "  成功: $success_count"
        echo "  跳过: $skipped_count"
        echo "  失败: $failed_count"
        echo "  总耗时: $(format_duration $total_duration)"
        echo ""
        return 1
    fi
}

# ==================== 主流程 ====================
main() {
    local start_time=$(get_timestamp_ms)
    
    echo ""
    echo -e "${BOLD}╔════════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${BOLD}║              Academia 本地 CI (Shell)                      ║${RESET}"
    echo -e "${BOLD}╚════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
    
    # 检查环境
    step_check_env
    
    # 安装依赖
    step_install
    
    # 仅代码检查
    if [ "$FLAG_LINT_ONLY" = true ]; then
        step_lint
        local end_time=$(get_timestamp_ms)
        local total_duration=$(calc_duration $start_time $end_time)
        log_divider
        echo ""
        echo -e "${GREEN}${BOLD}✓ 代码检查完成！${RESET}"
        echo "  Lint 耗时: $(format_duration $TIMING_LINT)"
        echo "  总耗时: $(format_duration $total_duration)"
        echo ""
        exit 0
    fi
    
    # 仅测试
    if [ "$FLAG_TEST_ONLY" = true ]; then
        step_test
        local end_time=$(get_timestamp_ms)
        local total_duration=$(calc_duration $start_time $end_time)
        log_divider
        echo ""
        echo -e "${GREEN}${BOLD}✓ 测试完成！${RESET}"
        echo "  测试耗时: $(format_duration $TIMING_TEST)"
        echo "  总耗时: $(format_duration $total_duration)"
        echo ""
        exit 0
    fi
    
    # 代码检查
    if [ "$FLAG_SKIP_LINT" = false ]; then
        step_lint
    fi
    
    # 运行测试
    if [ "$FLAG_SKIP_TEST" = false ]; then
        step_test
    fi
    
    # 构建
    local platforms
    read -ra platforms <<< "$(get_target_platforms)"
    step_build "${platforms[@]}"
    
    # 构建摘要
    log_divider
    log_step "构建摘要"
    
    for result in "${BUILD_RESULTS[@]}"; do
        IFS=':' read -r platform status duration <<< "$result"
        case $status in
            success) log_success "${platform^^}: 成功 ($(format_duration $duration))" ;;
            skipped) log_warn "${platform^^}: 跳过" ;;
            failed)  log_error "${platform^^}: 失败 ($(format_duration $duration))" ;;
        esac
    done
    
    # 耗时统计
    local end_time=$(get_timestamp_ms)
    local total_duration=$(calc_duration $start_time $end_time)
    
    print_timing_summary "$total_duration"
    
    # 最终结果
    if ! print_final_result "$total_duration"; then
        exit 1
    fi
}

# 运行主流程
main
