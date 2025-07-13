# 자동 업로드 시스템 설정 가이드

## 개요

이 시스템은 매일 오전 9시에 자동으로 데이터를 수집하고 Firebase에 업로드하는 기능을 제공합니다.

## 시스템 구성

### 1. 데이터 수집 스크립트
- `데이터채널/saramin_jobs.py` - 사람인 채용정보 수집
- `데이터채널/medijob_jobs.py` - 메디잡 채용정보 수집  
- `데이터채널/hairinjob_selenium.py` - 헤어인잡 채용정보 수집

### 2. 웹 서버
- `server.js` - Node.js Express 서버 (파이썬 스크립트 실행 API)
- `auto_upload.js` - 자동 업로드 JavaScript 로직
- `admin_dashboard.html` - 관리자 대시보드

## 설치 및 설정

### 1. Node.js 의존성 설치

```bash
npm install
```

### 2. Python 의존성 설치

```bash
pip install selenium beautifulsoup4 requests webdriver-manager
```

### 3. Chrome 브라우저 설치

Selenium 스크립트 실행을 위해 Chrome 브라우저가 필요합니다.

## 실행 방법

### 1. 서버 시작

```bash
npm start
# 또는
node server.js
```

서버가 시작되면 `http://localhost:3000`에서 접속 가능합니다.

### 2. 관리자 대시보드 접속

1. 브라우저에서 `http://localhost:3000/admin_dashboard.html` 접속
2. 비밀번호 입력: `0070`
3. 자동 업로드 설정 및 수동 업로드 기능 사용

## 기능 설명

### 자동 업로드 기능

- **자동 실행**: 매일 오전 9시에 자동으로 모든 스크립트 실행
- **수동 실행**: "수동 업로드" 버튼으로 즉시 실행 가능
- **업로드 히스토리**: 성공/실패 기록 및 통계 확인
- **실시간 모니터링**: 업로드 진행 상황 실시간 확인

### 데이터 수집 과정

1. **사람인 (saramin_jobs.py)**
   - 키워드: "오픈예정", "신규오픈"
   - 수집 데이터: 회사명, 직무, 일정, 주소, 업종
   - 최대 10개 데이터 수집

2. **메디잡 (medijob_jobs.py)**
   - 키워드: "신규채용"
   - 수집 데이터: 병원명, 직무, 일정, 주소, 업종
   - 병원 관련 채용정보 수집

3. **헤어인잡 (hairinjob_selenium.py)**
   - 키워드: "오픈예정"
   - 수집 데이터: 회사명, 직무, 일정, 주소, 업종, 연락처
   - 로그인 후 데이터 수집

### Firebase 업로드

- 모든 수집된 데이터는 Firebase Realtime Database에 저장
- CSV 형식으로 변환 후 업로드
- 기존 데이터는 새 데이터로 교체

## 파일 구조

```
├── server.js                    # Node.js 서버
├── auto_upload.js              # 자동 업로드 JavaScript
├── admin_dashboard.html        # 관리자 대시보드
├── 데이터채널/
│   ├── saramin_jobs.py        # 사람인 데이터 수집
│   ├── medijob_jobs.py        # 메디잡 데이터 수집
│   └── hairinjob_selenium.py  # 헤어인잡 데이터 수집
├── static/
│   └── script.js              # 메인 JavaScript
└── firebase-config.js         # Firebase 설정
```

## API 엔드포인트

### POST /execute-python
단일 파이썬 스크립트 실행

**요청:**
```json
{
  "script": "saramin_jobs.py"
}
```

**응답:**
```json
{
  "success": true,
  "csvData": "회사명,직무,일정,주소,업종,연락처\n...",
  "filename": "SARAMIN_1201(1430)_10jobs.csv",
  "message": "saramin_jobs.py 실행 완료"
}
```

### POST /execute-all-python
모든 파이썬 스크립트 실행

**응답:**
```json
{
  "success": true,
  "results": [
    {
      "script": "saramin_jobs.py",
      "success": true,
      "csvData": "...",
      "filename": "SARAMIN_1201(1430)_10jobs.csv"
    },
    ...
  ]
}
```

### GET /health
서버 상태 확인

**응답:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-01T14:30:00.000Z",
  "uptime": 3600
}
```

## 문제 해결

### 1. 파이썬 스크립트 실행 오류

**문제**: `python` 명령어를 찾을 수 없음
**해결**: Python이 PATH에 추가되어 있는지 확인

**문제**: Selenium 관련 오류
**해결**: Chrome 브라우저와 ChromeDriver 설치 확인

### 2. Firebase 연결 오류

**문제**: Firebase 설정 오류
**해결**: `firebase-config.js` 파일의 설정 확인

### 3. 서버 시작 오류

**문제**: 포트 3000이 이미 사용 중
**해결**: 다른 포트 사용 또는 기존 프로세스 종료

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

## 로그 확인

### 서버 로그
서버 콘솔에서 실시간 로그 확인 가능:
- 파이썬 스크립트 실행 상태
- CSV 파일 생성 여부
- Firebase 업로드 결과

### 브라우저 로그
F12 개발자 도구에서 JavaScript 로그 확인:
- 자동 업로드 스케줄러 상태
- API 요청/응답
- 업로드 히스토리

## 성능 최적화

### 1. 스크립트 실행 시간
- 각 스크립트별 타임아웃: 5분
- 스크립트 간 간격: 2초
- 총 실행 시간: 약 15-20분

### 2. 메모리 사용량
- Chrome 브라우저 인스턴스 관리
- CSV 파일 임시 저장 후 삭제
- Firebase 연결 풀 관리

### 3. 네트워크 최적화
- 요청 간격 조절 (rate limiting)
- 에러 재시도 로직
- 연결 타임아웃 설정

## 보안 고려사항

### 1. API 보안
- CORS 설정으로 허용된 도메인만 접근
- 요청 크기 제한
- 입력 데이터 검증

### 2. 데이터 보안
- Firebase 보안 규칙 설정
- 민감한 정보 암호화
- 로그 파일 보안

### 3. 시스템 보안
- 정기적인 의존성 업데이트
- 보안 패치 적용
- 접근 권한 관리

## 모니터링 및 알림

### 1. 업로드 상태 모니터링
- 성공/실패 통계
- 실행 시간 측정
- 데이터 수량 추적

### 2. 오류 알림
- 스크립트 실행 실패 시 로그
- Firebase 연결 오류 알림
- 시스템 리소스 부족 경고

### 3. 성능 지표
- 일일 업로드 성공률
- 평균 실행 시간
- 데이터 수집 효율성

## 확장 가능성

### 1. 새로운 데이터 소스 추가
- 새로운 파이썬 스크립트 작성
- `auto_upload.js`에 스크립트 추가
- 서버 API 업데이트

### 2. 스케줄링 옵션 확장
- 다양한 시간대 설정
- 주간/월간 실행 옵션
- 조건부 실행 로직

### 3. 데이터 처리 개선
- 중복 데이터 제거
- 데이터 검증 로직
- 품질 점수 시스템

## 지원 및 문의

문제가 발생하거나 개선 사항이 있으면 이슈를 통해 제출해주세요.

### 체크리스트

- [ ] Node.js 및 npm 설치
- [ ] Python 및 pip 설치
- [ ] Chrome 브라우저 설치
- [ ] 의존성 패키지 설치
- [ ] Firebase 설정 완료
- [ ] 서버 실행 테스트
- [ ] 자동 업로드 기능 테스트
- [ ] 업로드 히스토리 확인 