# 소상공인의 오픈 동행

Firebase를 활용한 웹 기반 CSV 데이터 관리 및 검색 시스템입니다. 매일 오전 9시에 자동으로 데이터를 수집하고 업로드하는 기능을 포함합니다.

## 주요 기능

- 📊 CSV 파일 업로드 및 파싱
- 🤖 자동 데이터 수집 및 업로드 (매일 오전 9시)
- 🔍 지역별 오픈 정보 검색
- 📱 반응형 웹 디자인
- ☁️ Firebase Firestore를 통한 데이터 저장
- 🌐 어디서든 접속 가능한 웹 서비스
- 📈 업로드 히스토리 및 통계 관리

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Firestore, Node.js (Express)
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome 6
- **Hosting**: Firebase Hosting (권장)
- **Data Collection**: Python (Selenium, BeautifulSoup)

## 설치 및 설정

### 1. Firebase 프로젝트 설정

자세한 설정 방법은 [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)를 참조하세요.

### 2. 프로젝트 클론

```bash
git clone <repository-url>
cd 소상공인-오픈동행
```

### 3. Firebase 설정

1. `firebase-config.js` 파일에서 Firebase 설정 정보를 업데이트
2. Firebase Console에서 Firestore Database 활성화

### 4. 의존성 설치

```bash
npm install
```

### 5. 서버 실행

```bash
# 개발 서버 실행
npm start
# 또는
node server.js
```

브라우저에서 `http://localhost:3000` 접속

### 6. 파이썬 의존성 설치

```bash
pip install selenium beautifulsoup4 requests webdriver-manager
```

## 사용 방법

### 관리자 기능

1. 메인 페이지 우상단 "관리자" 버튼 클릭
2. 비밀번호 입력 (기본: 0070)
3. 자동 업로드 설정
   - 매일 오전 9시 자동 실행
   - 수동 업로드 기능
   - 업로드 히스토리 확인
4. CSV 파일 수동 업로드
   - 필수 컬럼: 회사명, 직무, 일정, 업종, 연락처, 주소
   - UTF-8 인코딩 권장

### 사용자 기능

1. 메인 페이지에서 지역명 입력
2. "검색하기" 버튼 클릭
3. 검색 결과 확인 및 복사

## CSV 파일 형식

```csv
회사명,직무,일정,업종,연락처,주소
ABC회사,매장직,오픈 예정,25/07/11,서울 강남구
XYZ기업,영업직,오픈 예정,25/07/12,경기 성남시
```

## 배포

### Firebase Hosting (권장)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### 기타 호스팅 서비스

- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront

## 파일 구조

```
├── index.html              # 메인 페이지
├── admin_login.html        # 관리자 로그인
├── admin_dashboard.html    # 관리자 대시보드
├── server.js              # Node.js 서버 (파이썬 스크립트 실행)
├── auto_upload.js         # 자동 업로드 JavaScript
├── firebase-config.js     # Firebase 설정
├── static/
│   └── script.js          # 메인 JavaScript
├── 데이터채널/
│   ├── saramin_jobs.py    # 사람인 데이터 수집
│   ├── medijob_jobs.py    # 메디잡 데이터 수집
│   └── hairinjob_selenium.py # 헤어인잡 데이터 수집
├── FIREBASE_SETUP.md      # Firebase 설정 가이드
└── README.md              # 프로젝트 설명
```

## 주요 특징

- **실시간 데이터 동기화**: Firebase Firestore를 통한 실시간 데이터 저장
- **자동 데이터 수집**: 매일 오전 9시 자동으로 데이터 수집 및 업로드
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원
- **사용자 친화적 UI**: 직관적인 인터페이스와 부드러운 애니메이션
- **데이터 복사 기능**: 검색 결과를 클립보드에 쉽게 복사
- **관리자 기능**: CSV 파일 업로드 및 데이터 관리
- **업로드 히스토리**: 자동/수동 업로드 기록 및 통계 관리

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 기여

버그 리포트나 기능 제안은 이슈를 통해 제출해주세요.

## 지원

문제가 발생하면 다음을 확인해주세요:

1. Firebase 설정이 올바른지 확인
2. 브라우저 콘솔에서 오류 메시지 확인
3. CSV 파일 형식이 올바른지 확인 