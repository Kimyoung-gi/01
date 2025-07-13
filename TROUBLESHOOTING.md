# 수동 업로드 버튼 문제 해결 가이드

## 문제 상황
수동 업로드 버튼을 눌러도 아무 반응이 없는 경우

## 해결 방법

### 1. 서버 실행 확인

가장 중요한 것은 **Node.js 서버가 실행되고 있는지** 확인하는 것입니다.

#### 서버 시작 방법:
```bash
# 터미널/명령 프롬프트에서
npm start
# 또는
node server.js
```

#### 서버가 정상 실행되면 다음과 같은 메시지가 표시됩니다:
```
서버가 포트 3000에서 실행 중입니다.
http://localhost:3000
사용 가능한 엔드포인트:
  POST /execute-python - 단일 파이썬 스크립트 실행
  POST /execute-all-python - 모든 파이썬 스크립트 실행
  GET /health - 서버 상태 확인
```

### 2. 연결 테스트

관리자 대시보드에서 "연결 테스트" 버튼을 클릭하여 다음을 확인하세요:

- ✅ Firebase 연결 상태
- ✅ 서버 연결 상태

### 3. 브라우저 개발자 도구 확인

F12를 눌러 개발자 도구를 열고 Console 탭에서 오류 메시지를 확인하세요.

#### 일반적인 오류들:

**1. CORS 오류**
```
Access to fetch at 'http://localhost:3000/health' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**해결**: 서버가 실행되지 않았거나 CORS 설정 문제

**2. Firebase 오류**
```
Firebase is not defined
```
**해결**: firebase-config.js 파일이 제대로 로드되지 않음

**3. 네트워크 오류**
```
Failed to fetch
```
**해결**: 서버가 실행되지 않음

### 4. 단계별 확인 사항

#### 4-1. 서버 실행 확인
```bash
# 터미널에서
curl http://localhost:3000/health
```
정상 응답:
```json
{"status":"ok","timestamp":"2024-12-01T14:30:00.000Z","uptime":3600}
```

#### 4-2. 의존성 설치 확인
```bash
# Node.js 의존성
npm install

# Python 의존성
pip install selenium beautifulsoup4 requests webdriver-manager
```

#### 4-3. 포트 충돌 확인
```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000
```

### 5. 자주 발생하는 문제들

#### 문제 1: 서버가 시작되지 않음
**증상**: `npm start` 실행 시 오류 발생
**해결**:
```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
npm start
```

#### 문제 2: Python 스크립트 실행 오류
**증상**: 서버는 실행되지만 파이썬 스크립트 실행 시 오류
**해결**:
```bash
# Python 경로 확인
python --version
pip list | grep selenium
```

#### 문제 3: Firebase 연결 오류
**증상**: Firebase 관련 오류 메시지
**해결**: `firebase-config.js` 파일의 설정 확인

### 6. 디버깅 방법

#### 6-1. 브라우저 콘솔에서 확인
```javascript
// 개발자 도구 콘솔에서 실행
console.log('Firebase 상태:', typeof firebase);
console.log('서버 연결 테스트...');
fetch('http://localhost:3000/health')
  .then(response => response.json())
  .then(data => console.log('서버 응답:', data))
  .catch(error => console.error('서버 오류:', error));
```

#### 6-2. 수동 테스트
```javascript
// 개발자 도구 콘솔에서 실행
manualUpload();
```

### 7. 완전한 재시작 방법

1. **모든 프로세스 종료**
   ```bash
   # Windows
   taskkill /f /im node.exe
   
   # Mac/Linux
   pkill -f node
   ```

2. **브라우저 캐시 삭제**
   - Ctrl+Shift+R (강제 새로고침)
   - 또는 개발자 도구 → Network 탭 → Disable cache 체크

3. **서버 재시작**
   ```bash
   npm start
   ```

4. **페이지 새로고침**
   - 브라우저에서 F5 또는 Ctrl+R

### 8. 체크리스트

- [ ] Node.js 서버 실행 중 (`npm start`)
- [ ] 브라우저에서 `http://localhost:3000` 접속 가능
- [ ] 관리자 대시보드 접속 가능
- [ ] "연결 테스트" 버튼 클릭 시 모든 항목 성공
- [ ] 브라우저 개발자 도구에 오류 없음
- [ ] Python 및 필요한 라이브러리 설치됨

### 9. 추가 도움

문제가 지속되면 다음 정보를 확인해주세요:

1. **운영체제**: Windows/Mac/Linux
2. **Node.js 버전**: `node --version`
3. **Python 버전**: `python --version`
4. **브라우저**: Chrome/Firefox/Safari
5. **오류 메시지**: 개발자 도구 콘솔의 전체 오류 메시지
6. **서버 로그**: 터미널에 표시되는 서버 로그

### 10. 대안 방법

서버 실행이 어려운 경우, 간단한 테스트를 위해 다음을 시도해보세요:

```javascript
// 개발자 도구 콘솔에서 실행
console.log('수동 업로드 함수 테스트');
console.log('Firebase 객체:', typeof firebase);
console.log('수동 업로드 함수:', typeof manualUpload);
```

이 정보를 바탕으로 더 구체적인 해결책을 제시할 수 있습니다. 