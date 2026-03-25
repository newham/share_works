#!/bin/bash
#===============================================================================
# 一键部署脚本 (使用 docker-compose)
# 适用于已安装 docker-compose 的环境
#===============================================================================

set -e

echo "=========================================="
echo "  Share Works 一键部署脚本"
echo "=========================================="
echo ""

# 检查 docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "错误: docker-compose 未安装"
    echo "请使用 ./deploy.sh 脚本代替"
    exit 1
fi

# 检查 Docker
if ! docker info > /dev/null 2>&1; then
    echo "错误: Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi

echo "[1/4] 构建镜像..."
docker-compose build

echo ""
echo "[2/4] 停止旧容器 (如果存在)..."
docker-compose down 2>/dev/null || true

echo ""
echo "[3/4] 启动服务..."
docker-compose up -d

echo ""
echo "[4/4] 等待服务就绪..."
sleep 3

echo ""
echo "=========================================="
echo -e "  \033[0;32m✓ 部署完成!\033[0m"
echo "=========================================="
echo ""
echo "访问地址: http://localhost:8888"
echo "Admin 后台: http://localhost:8888/admin"
echo ""
echo "常用命令:"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo ""
