@echo off
cd /d C:\Users\33960\Desktop\product-system
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)
echo Starting project...
npm start
pause
