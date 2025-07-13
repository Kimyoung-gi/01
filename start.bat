@echo off
echo ========================================
echo 소상공인의 오픈 동행 - 자동 업로드 시스템
echo ========================================
echo.

echo 1. 의존성 설치 중...
npm install

echo.
echo 2. 서버 시작 중...
echo 서버가 시작되면 브라우저에서 http://localhost:3000 으로 접속하세요.
echo.

node server.js

pause 