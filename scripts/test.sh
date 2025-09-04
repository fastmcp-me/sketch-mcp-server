#!/bin/bash

# 测试运行脚本
# 用法: ./scripts/test.sh [unit|integration|all|coverage]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    print_message "检查依赖..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装"
        exit 1
    fi
    
    print_success "依赖检查通过"
}

# 安装依赖
install_dependencies() {
    print_message "安装依赖..."
    npm install
    print_success "依赖安装完成"
}

# 运行单元测试
run_unit_tests() {
    print_message "运行单元测试..."
    npm run test:unit
    print_success "单元测试完成"
}

# 运行集成测试
run_integration_tests() {
    print_message "运行集成测试..."
    npm run test:integration
    print_success "集成测试完成"
}

# 运行所有测试
run_all_tests() {
    print_message "运行所有测试..."
    npm test
    print_success "所有测试完成"
}

# 运行覆盖率测试
run_coverage_tests() {
    print_message "运行覆盖率测试..."
    npm run test:coverage
    print_success "覆盖率测试完成"
    
    # 打开覆盖率报告
    if command -v open &> /dev/null; then
        print_message "打开覆盖率报告..."
        open coverage/lcov-report/index.html
    elif command -v xdg-open &> /dev/null; then
        print_message "打开覆盖率报告..."
        xdg-open coverage/lcov-report/index.html
    else
        print_warning "无法自动打开覆盖率报告，请手动打开: coverage/lcov-report/index.html"
    fi
}

# 清理测试文件
cleanup() {
    print_message "清理测试文件..."
    rm -rf coverage/
    print_success "清理完成"
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  unit        运行单元测试"
    echo "  integration 运行集成测试"
    echo "  all         运行所有测试"
    echo "  coverage    运行覆盖率测试"
    echo "  clean       清理测试文件"
    echo "  help        显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 unit"
    echo "  $0 coverage"
    echo "  $0 all"
}

# 主函数
main() {
    case "${1:-all}" in
        "unit")
            check_dependencies
            install_dependencies
            run_unit_tests
            ;;
        "integration")
            check_dependencies
            install_dependencies
            run_integration_tests
            ;;
        "all")
            check_dependencies
            install_dependencies
            run_all_tests
            ;;
        "coverage")
            check_dependencies
            install_dependencies
            run_coverage_tests
            ;;
        "clean")
            cleanup
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
