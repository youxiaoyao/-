@echo off
echo ========================================
echo 前端服务启动测试
necho ========================================
echo.

cd /d "%~dp0"

echo 当前目录: %cd%
echo.

echo [步骤1] 检查依赖...
if exist "node_modules" (
    echo ✅ node_modules 存在
) else (
    echo ❌ node_modules 不存在，正在安装...
    npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
)

echo.
echo [步骤2] 构建前端...
if not exist "dist" (
    echo 正在构建...
    npm run build
    if errorlevel 1 (
        echo ❌ 构建失败
        echo 错误信息:
        npm run build
        pause
        exit /b 1
    )
    echo ✅ 构建完成
) else (
    echo ✅ 使用现有构建文件
)

echo.
echo [步骤3] 启动前端服务...
echo 正在启动前端预览服务...
echo 如果成功，应该显示 "Local: http://localhost:4173/"
echo.
echo 按任意键开始启动...
pause > nul

echo.
npm run preview

echo.
echo 前端服务已停止
pause