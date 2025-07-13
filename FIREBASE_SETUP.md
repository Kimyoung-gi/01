# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 만들기" 클릭
3. 프로젝트 이름 입력 (예: "소상공인-오픈동행")
4. Google Analytics 사용 여부 선택 (선택사항)
5. "프로젝트 만들기" 클릭

## 2. Firestore 데이터베이스 설정

1. Firebase Console에서 "Firestore Database" 선택
2. "데이터베이스 만들기" 클릭
3. 보안 규칙 선택:
   - "테스트 모드에서 시작" 선택 (개발용)
   - 또는 "프로덕션 모드에서 시작" 선택 (운영용)
4. 위치 선택 (가까운 지역 선택)

## 3. 웹 앱 등록

1. Firebase Console에서 "프로젝트 개요" 옆의 설정 아이콘 클릭
2. "프로젝트 설정" 선택
3. "일반" 탭에서 "웹 앱에 Firebase 추가" 클릭
4. 앱 닉네임 입력 (예: "소상공인-웹")
5. "앱 등록" 클릭

## 4. 설정 정보 복사

웹 앱 등록 후 제공되는 설정 정보를 복사하여 `firebase-config.js` 파일에 붙여넣기:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

## 5. 보안 규칙 설정 (선택사항)

Firestore Database > 규칙 탭에서 다음 규칙 설정:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{document} {
      allow read, write: if true;  // 모든 사용자가 읽기/쓰기 가능
    }
  }
}
```

## 6. 배포 방법

### 방법 1: Firebase Hosting 사용 (권장)

1. Firebase CLI 설치:
```bash
npm install -g firebase-tools
```

2. Firebase 로그인:
```bash
firebase login
```

3. 프로젝트 초기화:
```bash
firebase init hosting
```

4. 배포:
```bash
firebase deploy
```

### 방법 2: 정적 웹 호스팅 서비스 사용

- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront

## 7. 사용 방법

1. 관리자 페이지에서 CSV 파일 업로드
2. 메인 페이지에서 지역별 검색
3. 어디서든 접속 가능한 웹 서비스 완성!

## 주의사항

- Firebase 무료 플랜 사용량 제한 확인
- 프로덕션 환경에서는 적절한 보안 규칙 설정
- API 키는 공개되어도 되지만, 보안 규칙으로 접근 제어 