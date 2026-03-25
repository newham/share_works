#!/bin/bash
#===============================================================================
# Share Works 部署脚本
# 用法: ./deploy.sh [命令]
# 命令: build | start | stop | restart | logs | status | clean
#===============================================================================

set -e

# 配置
IMAGE_NAME="share-works"
CONTAINER_NAME="share-works"
EXTERNAL_PORT="8888"
INTERNAL_PORT="3000"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查 Docker 是否运行
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker 未运行，请先启动 Docker Desktop"
        exit 1
    fi
}

# 显示帮助
show_help() {
    echo "Share Works 部署脚本"
    echo ""
    echo "用法: ./deploy.sh [命令]"
    echo ""
    echo "命令:"
    echo "  build      构建 Docker 镜像"
    echo "  start      启动容器 (会先构建如果镜像不存在)"
    echo "  stop       停止并删除容器"
    echo "  restart    重启容器"
    echo "  logs       查看容器日志"
    echo "  status     查看容器状态"
    echo "  clean      清理镜像和未使用的 Docker 资源"
    echo "  shell      进入容器 shell (调试用)"
    echo ""
    echo "示例:"
    echo "  ./deploy.sh build    # 构建镜像"
    echo "  ./deploy.sh start    # 启动服务"
    echo "  ./deploy.sh logs     # 查看日志"
}

# 构建镜像
do_build() {
    check_docker
    log_info "正在构建 Docker 镜像..."
    docker build -t ${IMAGE_NAME} .
    log_success "镜像构建完成: ${IMAGE_NAME}"
}

# 启动容器
do_start() {
    check_docker

    # 如果容器已存在，先删除
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_warn "容器已存在，正在删除旧容器..."
        docker rm -f ${CONTAINER_NAME} > /dev/null 2>&1
    fi

    # 如果镜像不存在，先构建
    if ! docker image inspect ${IMAGE_NAME} > /dev/null 2>&1; then
        log_warn "镜像不存在，正在构建..."
        do_build
    fi

    log_info "正在启动容器..."
    docker run -d \
        --name ${CONTAINER_NAME} \
        --restart unless-stopped \
        -p ${EXTERNAL_PORT}:${INTERNAL_PORT} \
        -v $(pwd)/data:/app/data \
        ${IMAGE_NAME}

    sleep 2

    # 检查容器状态
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_success "服务已启动!"
        log_success "访问地址: http://localhost:${EXTERNAL_PORT}"
        log_success "Admin 后台: http://localhost:${EXTERNAL_PORT}/admin"
    else
        log_error "容器启动失败，请检查日志: ./deploy.sh logs"
        exit 1
    fi
}

# 停止容器
do_stop() {
    check_docker
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_info "正在停止容器..."
        docker rm -f ${CONTAINER_NAME} > /dev/null 2>&1
        log_success "容器已停止"
    else
        log_warn "容器不存在"
    fi
}

# 重启容器
do_restart() {
    do_stop
    sleep 1
    do_start
}

# 查看日志
do_logs() {
    check_docker
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker logs -f --tail 100 ${CONTAINER_NAME}
    else
        log_warn "容器不存在，请先运行 ./deploy.sh start"
    fi
}

# 查看状态
do_status() {
    check_docker
    echo ""
    echo "=== 镜像信息 ==="
    if docker image inspect ${IMAGE_NAME} > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} 镜像存在: ${IMAGE_NAME}"
        docker image inspect ${IMAGE_NAME} --format='  大小: {{.Size}}'
        docker image inspect ${IMAGE_NAME} --format='  创建: {{.Created}}'
    else
        echo -e "${RED}✗${NC} 镜像不存在: ${IMAGE_NAME}"
    fi

    echo ""
    echo "=== 容器状态 ==="
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        local status=$(docker ps --format '{{.Status}}' -f name=${CONTAINER_NAME})
        local port=$(docker port ${CONTAINER_NAME} 2>/dev/null || echo "N/A")
        echo -e "${GREEN}✓${NC} 容器运行中: ${CONTAINER_NAME}"
        echo "  状态: ${status}"
        echo "  端口映射: ${port}"
        echo "  访问地址: http://localhost:${EXTERNAL_PORT}"
    else
        echo -e "${RED}✗${NC} 容器不存在"
    fi
    echo ""
}

# 清理 Docker 资源
do_clean() {
    check_docker
    log_warn "即将清理未使用的 Docker 资源..."
    read -p "确认清理? (y/N): " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        docker image prune -f
        docker container prune -f
        log_success "清理完成"
    else
        log_info "已取消"
    fi
}

# 进入容器 shell (调试用)
do_shell() {
    check_docker
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker exec -it ${CONTAINER_NAME} /bin/sh
    else
        log_error "容器未运行，请先运行 ./deploy.sh start"
    fi
}

# 主逻辑
case "${1:-help}" in
    build)
        do_build
        ;;
    start)
        do_start
        ;;
    stop)
        do_stop
        ;;
    restart)
        do_restart
        ;;
    logs)
        do_logs
        ;;
    status)
        do_status
        ;;
    clean)
        do_clean
        ;;
    shell)
        do_shell
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "未知命令: $1"
        show_help
        exit 1
        ;;
esac
