# Firebase Admin SDK 설정 가이드

## 1. Firebase 서비스 계정 키 생성

### 1.1 Firebase Console에서 서비스 계정 생성

1. **Firebase Console**에서 프로젝트로 이동
2. **"프로젝트 설정"** 클릭 (⚙️ 아이콘)
3. **"서비스 계정"** 탭 클릭
4. **"새 비공개 키 생성"** 클릭
5. **"키 생성"** 버튼 클릭
6. JSON 파일 다운로드

### 1.2 서비스 계정 키 파일 설정

1. 다운로드한 JSON 파일을 프로젝트 루트에 `firebase-service-account.json`으로 저장
2. **주의**: 이 파일은 절대 공개 저장소에 업로드하지 마세요!

## 2. 패키지 설치

```bash
npm install
```

## 3. 스케줄러 실행

### 3.1 개발 환경에서 실행

```bash
npm start
```

### 3.2 프로덕션 환경에서 실행

#### 방법 1: PM2 사용 (권장)

```bash
# PM2 설치
npm install -g pm2

# 스케줄러 시작
pm2 start scheduler.js --name "jobs-scraper"

# 상태 확인
pm2 status

# 로그 확인
pm2 logs jobs-scraper
```

#### 방법 2: Docker 사용

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "start"]
```

## 4. 실제 스크래핑 구현

### 4.1 scraper.js 파일 수정

`scraper.js` 파일에서 실제 스크래핑 로직을 구현하세요:

```javascript
// 사람인에서 데이터 수집
async function scrapeFromSaramin() {
  try {
    const response = await axios.get('https://www.saramin.co.kr/...');
    const $ = cheerio.load(response.data);
    
    const jobs = [];
    $('.job_item').each((index, element) => {
      const company = $(element).find('.company_name').text().trim();
      const job = $(element).find('.job_title').text().trim();
      const address = $(element).find('.job_location').text().trim();
      
      jobs.push({
        회사명: company,
        직무: job,
        일정: "오픈 예정",
        "등록일/수정일": new Date().toLocaleDateString(),
        주소: address
      });
    });
    
    return jobs;
  } catch (error) {
    console.error('사람인 스크래핑 오류:', error);
    return [];
  }
}
```

### 4.2 스크래핑 소스 추가

필요한 웹사이트에 따라 스크래핑 함수를 추가하세요:

- 사람인 (saramin.co.kr)
- 잡코리아 (jobkorea.co.kr)
- 알바천국 (albamon.com)
- 기타 채용 사이트

## 5. 스케줄 설정

### 5.1 시간 변경

`scheduler.js`에서 스케줄 시간을 변경할 수 있습니다:

```javascript
// 매일 오전 12시 36분
cron.schedule('36 0 * * *', () => {
  // 실행할 함수
});

// 매시간 실행
cron.schedule('0 * * * *', () => {
  // 실행할 함수
});

// 매일 오후 2시 30분
cron.schedule('30 14 * * *', () => {
  // 실행할 함수
});
```

### 5.2 크론 표현식 설명

```
* * * * *
│ │ │ │ │
│ │ │ │ └── 요일 (0-7, 0과 7은 일요일)
│ │ │ └──── 월 (1-12)
│ │ └────── 일 (1-31)
│ └──────── 시 (0-23)
└────────── 분 (0-59)
```

## 6. 모니터링 및 로그

### 6.1 로그 확인

```bash
# PM2 로그 확인
pm2 logs jobs-scraper

# 실시간 로그 확인
pm2 logs jobs-scraper --lines 100
```

### 6.2 Firebase에서 데이터 확인

Firebase Console에서 **Realtime Database** → **"데이터"** 탭에서 저장된 데이터를 확인할 수 있습니다.

## 7. 보안 주의사항

1. **서비스 계정 키 보호**: `firebase-service-account.json` 파일을 절대 공개하지 마세요
2. **환경 변수 사용**: 프로덕션에서는 환경 변수를 사용하세요
3. **스크래핑 정책 준수**: 각 웹사이트의 robots.txt와 이용약관을 확인하세요

## 8. 문제 해결

### 8.1 권한 오류

Firebase 서비스 계정에 적절한 권한이 있는지 확인하세요.

### 8.2 스크래핑 실패

- 웹사이트 구조 변경 확인
- 네트워크 연결 상태 확인
- 요청 제한 확인

### 8.3 스케줄러 실행 안됨

- 서버 시간대 확인
- PM2 상태 확인
- 로그 확인 