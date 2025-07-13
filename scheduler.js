const cron = require('node-cron');
const admin = require('firebase-admin');
const { scrapeJobsFromSource, validateAndCleanData } = require('./scraper');

// Firebase Admin SDK 초기화
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://webtest-e472c-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

// 데이터 수집 함수
async function scrapeJobsData() {
  try {
    console.log('데이터 수집 시작:', new Date().toLocaleString());
    
    // 실제 스크래핑 실행
    const rawJobsData = await scrapeJobsFromSource();
    
    if (rawJobsData && rawJobsData.length > 0) {
      // 데이터 검증 및 정리
      const cleanJobsData = validateAndCleanData(rawJobsData);
      
      if (cleanJobsData.length > 0) {
        // Firebase에 저장
        await saveToFirebase(cleanJobsData);
        console.log(`${cleanJobsData.length}개의 데이터를 Firebase에 저장했습니다.`);
      } else {
        console.log('검증을 통과한 데이터가 없습니다.');
      }
    } else {
      console.log('수집된 데이터가 없습니다.');
    }
  } catch (error) {
    console.error('데이터 수집 오류:', error);
  }
}

// Firebase에 저장하는 함수
async function saveToFirebase(jobsData) {
  try {
    console.log('Firebase에 저장 시작...');
    
    // 기존 데이터 삭제
    await db.ref('jobs').remove();
    
    // 새 데이터 추가 (키 이름 수정)
    const updates = {};
    jobsData.forEach((job, index) => {
      // Realtime Database에 맞게 키 이름 수정
      const cleanJob = {};
      Object.keys(job).forEach(key => {
        // 특수문자를 언더스코어로 변경
        const cleanKey = key.replace(/[.#$\/\[\]]/g, '_');
        cleanJob[cleanKey] = job[key];
      });
      updates[`jobs/${index}`] = cleanJob;
    });
    
    await db.ref().update(updates);
    console.log('Firebase에 데이터 저장 완료');
    
    // 저장 시간 기록
    await db.ref('lastUpdate').set({
      timestamp: new Date().toISOString(),
      count: jobsData.length,
      source: 'automated_scraper'
    });
    
  } catch (error) {
    console.error('Firebase 저장 오류:', error);
    throw error;
  }
}

// 스케줄러 설정 (매일 오전 12시 36분)
cron.schedule('36 0 * * *', () => {
  console.log('스케줄러 실행:', new Date().toLocaleString());
  scrapeJobsData();
}, {
  timezone: "Asia/Seoul"
});

// 즉시 실행 (테스트용)
console.log('스케줄러가 시작되었습니다. 매일 오전 12시 36분에 실행됩니다.');
console.log('테스트를 위해 즉시 실행합니다...');
scrapeJobsData();

module.exports = {
  scrapeJobsData,
  saveToFirebase
}; 