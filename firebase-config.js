// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyBvljQ-5YxcyTSC4gJfMBo6OBH4yiSctKg",
    authDomain: "webtest-e472c.firebaseapp.com",
    projectId: "webtest-e472c",
    storageBucket: "webtest-e472c.firebasestorage.app",
    messagingSenderId: "190579878777",
    appId: "1:190579878777:web:704ff040bdeba3bc85dda8",
    measurementId: "G-H3K4763NTH"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firestore 데이터베이스 참조
const db = firebase.firestore();

// Realtime Database 참조 (대안)
const rtdb = firebase.database(); 