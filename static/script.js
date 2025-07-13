// Realtime Database에 데이터 저장 (대안)
async function saveJobsDataRTDB(jobsData) {
    console.log('Realtime Database에 데이터 저장 시작...');
    console.log('저장할 데이터:', jobsData);
    
    try {
        // 기존 데이터 삭제
        await rtdb.ref('jobs').remove();
        console.log('기존 데이터 삭제 완료');
        
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
        
        await rtdb.ref().update(updates);
        console.log('Realtime Database에 데이터 저장 완료');
        
        return true;
    } catch (error) {
        console.error('Realtime Database 데이터 저장 오류:', error);
        return false;
    }
}

// Realtime Database에서 데이터 로드 (대안)
async function getJobsDataRTDB() {
    console.log('Realtime Database에서 데이터 로드 중...');
    try {
        const snapshot = await rtdb.ref('jobs').once('value');
        const jobsData = [];
        snapshot.forEach(childSnapshot => {
            const job = childSnapshot.val();
            // 키 이름을 원래대로 복원
            const restoredJob = {};
            Object.keys(job).forEach(key => {
                // 언더스코어를 원래 특수문자로 복원
                const originalKey = key
                    .replace(/_/g, '/')  // 언더스코어를 슬래시로 복원
                    .replace(/등록일_수정일/g, '등록일/수정일');  // 특별한 경우 처리
                restoredJob[originalKey] = job[key];
            });
            jobsData.push(restoredJob);
        });
        console.log('Realtime Database에서 로드된 데이터:', jobsData);
        return jobsData;
    } catch (error) {
        console.error('Realtime Database 데이터 로드 오류:', error);
        return [];
    }
}

// Firebase에서 데이터 로드 (Realtime Database 우선)
async function getJobsData() {
    console.log('Realtime Database에서 데이터 로드 중...');
    try {
        const snapshot = await rtdb.ref('jobs').once('value');
        const jobsData = [];
        snapshot.forEach(childSnapshot => {
            const job = childSnapshot.val();
            // 키 이름을 원래대로 복원
            const restoredJob = {};
            Object.keys(job).forEach(key => {
                // 언더스코어를 원래 특수문자로 복원
                const originalKey = key
                    .replace(/_/g, '/')  // 언더스코어를 슬래시로 복원
                    .replace(/등록일_수정일/g, '등록일/수정일');  // 특별한 경우 처리
                restoredJob[originalKey] = job[key];
            });
            jobsData.push(restoredJob);
        });
        console.log('Realtime Database에서 로드된 데이터:', jobsData);
        return jobsData;
    } catch (error) {
        console.error('Realtime Database 데이터 로드 오류:', error);
        return [];
    }
}

// Firebase에 데이터 저장 (Realtime Database 우선)
async function saveJobsData(jobsData) {
    console.log('Realtime Database에 데이터 저장 시작...');
    console.log('저장할 데이터:', jobsData);
    
    try {
        // 기존 데이터 삭제
        await rtdb.ref('jobs').remove();
        console.log('기존 데이터 삭제 완료');
        
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
        
        await rtdb.ref().update(updates);
        console.log('Realtime Database에 데이터 저장 완료');
        
        // 업로드 성공 시 마지막 업데이트 시간과 수량 저장
        const currentTime = new Date().toLocaleString();
        localStorage.setItem('lastUpdateTime', currentTime);
        localStorage.setItem('lastUploadCount', jobsData.length.toString());
        
        // CSV 업로드 히스토리에 기록 추가
        const uploadRecord = {
            timestamp: new Date().toISOString(),
            source: 'CSV 파일',
            status: 'success',
            count: jobsData.length,
            time: currentTime
        };
        
        // 기존 히스토리 로드
        let uploadHistory = JSON.parse(localStorage.getItem('csvUploadHistory') || '[]');
        uploadHistory.unshift(uploadRecord);
        
        // 최근 10개만 유지
        uploadHistory = uploadHistory.slice(0, 10);
        localStorage.setItem('csvUploadHistory', JSON.stringify(uploadHistory));
        
        return true;
    } catch (error) {
        console.error('Realtime Database 데이터 저장 오류:', error);
        return false;
    }
}

// 강제로 업로드된 데이터만 사용하는 함수 (디버깅용)
async function getUploadedDataOnly() {
    try {
        const snapshot = await rtdb.ref('jobs').once('value');
        const jobsData = [];
        snapshot.forEach(childSnapshot => {
            const job = childSnapshot.val();
            // 키 이름을 원래대로 복원
            const restoredJob = {};
            Object.keys(job).forEach(key => {
                const originalKey = key
                    .replace(/_/g, '/')
                    .replace(/등록일_수정일/g, '등록일/수정일');
                restoredJob[originalKey] = job[key];
            });
            jobsData.push(restoredJob);
        });
        return jobsData;
    } catch (error) {
        console.error('Realtime Database 데이터 로드 오류:', error);
        return [];
    }
}

// Firebase 데이터 초기화 함수 (디버깅용)
async function clearUploadedData() {
    try {
        await rtdb.ref('jobs').remove();
        console.log('Realtime Database 데이터가 초기화되었습니다.');
        alert('업로드된 데이터가 초기화되었습니다.');
    } catch (error) {
        console.error('Realtime Database 데이터 초기화 오류:', error);
        alert('데이터 초기화 중 오류가 발생했습니다.');
    }
}

// 업로드된 데이터만 테스트하는 함수
async function testUploadedData() {
    const uploadedData = await getUploadedDataOnly();
    console.log('업로드된 데이터만 테스트:', uploadedData);
    
    if (uploadedData.length > 0) {
        alert(`업로드된 데이터가 ${uploadedData.length}개 있습니다.\n콘솔을 확인하세요.`);
    } else {
        alert('업로드된 데이터가 없습니다.');
    }
}

// 관리자 비밀번호
const ADMIN_PASSWORD = "0070";

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 메인 페이지인지 확인
    if (document.getElementById('searchBtn')) {
        initializeMainPage();
    }
    
    // 관리자 로그인 페이지인지 확인
    if (document.getElementById('adminLoginForm')) {
        initializeAdminLogin();
    }
    
    // 관리자 대시보드 페이지인지 확인
    if (document.getElementById('adminDashboard')) {
        initializeAdminDashboard();
    }
});

// 메인 페이지 초기화
function initializeMainPage() {
    const searchBtn = document.getElementById('searchBtn');
    const locationInput = document.getElementById('location');
    const industryInput = document.getElementById('industry');
    const searchResults = document.getElementById('searchResults');
    const loadingStatus = document.getElementById('loadingStatus');
    const resultCount = document.getElementById('resultCount');
    
    // 로딩 상태 숨기기
    loadingStatus.style.display = 'none';
    
    // 검색 버튼 클릭 이벤트
    searchBtn.addEventListener('click', async function() {
        const location = locationInput.value.trim();
        const industry = industryInput.value.trim();
        
        // 로딩 상태 표시
        loadingStatus.style.display = 'block';
        searchResults.innerHTML = '';
        
        // 검색 실행
        setTimeout(async () => {
            await performSearch(location, industry);
            loadingStatus.style.display = 'none';
        }, 1000);
    });
    
    // 엔터키 검색 (지역명 입력 필드)
    locationInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
    
    // 엔터키 검색 (업종 입력 필드)
    industryInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
}

// 검색 실행
async function performSearch(location, industry) {
    const searchResults = document.getElementById('searchResults');
    const resultCount = document.getElementById('resultCount');
    
    // Firebase에서 데이터 로드
    const uploadedData = await getUploadedDataOnly();
    console.log('업로드된 데이터:', uploadedData);
    
    // 업로드된 데이터가 없으면 안내 메시지 표시
    if (uploadedData.length === 0) {
        resultCount.textContent = '업로드된 데이터가 없습니다';
        searchResults.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-upload fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">업로드된 데이터가 없습니다</h5>
                <p class="text-muted">관리자 페이지에서 CSV 파일을 업로드해주세요.</p>
                <div class="mt-3">
                    <a href="admin_login.html" class="btn btn-primary btn-sm">
                        <i class="fas fa-cog me-1"></i>관리자 페이지
                    </a>
                </div>
            </div>
        `;
        return;
    }
    
    const currentJobsData = uploadedData;
    console.log('검색에 사용된 데이터:', currentJobsData);
    console.log('검색 지역:', location);
    console.log('검색 업종:', industry);
    
    // 지역명과 업종 필터링
    const filteredJobs = currentJobsData.filter(job => {
        const address = job.address || job.주소 || '';
        const company = job.company || job.회사명 || '';
        const title = job.title || job.직무 || '';
        const jobIndustry = job.industry || job.업종 || '';
        
        // 검색 대상 텍스트
        const searchText = `${address} ${company} ${title} ${jobIndustry}`.toLowerCase();
        const searchLocation = location.toLowerCase();
        const searchIndustry = industry.toLowerCase();
        
        // 지역명 필터링
        const locationMatch = !location || searchText.includes(searchLocation);
        
        // 업종 필터링
        const industryMatch = !industry || searchText.includes(searchIndustry);
        
        console.log('검색 대상:', searchText, '지역:', searchLocation, '업종:', searchIndustry, '지역매치:', locationMatch, '업종매치:', industryMatch);
        
        return locationMatch && industryMatch;
    });
    
    console.log('필터링된 결과:', filteredJobs);
    
    // 검색 조건 표시
    let searchCondition = '';
    if (location && industry) {
        searchCondition = `지역: "${location}", 업종: "${industry}"`;
    } else if (location) {
        searchCondition = `지역: "${location}"`;
    } else if (industry) {
        searchCondition = `업종: "${industry}"`;
    } else {
        searchCondition = '전체 데이터';
    }
    
    // 결과 개수 업데이트
    resultCount.textContent = `${searchCondition} - 총 ${filteredJobs.length}개의 오픈 정보를 찾았습니다`;
    
    // 검색 결과 표시
    if (filteredJobs.length === 0) {
        searchResults.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">검색 결과가 없습니다</h5>
                <p class="text-muted">다른 검색 조건으로 시도해보세요.</p>
                <div class="mt-3">
                    <button class="btn btn-outline-primary btn-sm" onclick="window.open('debug.html', '_blank')">
                        <i class="fas fa-bug me-1"></i>데이터 디버깅
                    </button>
                </div>
            </div>
        `;
    } else {
        let resultsHTML = '';
        filteredJobs.forEach((job, index) => {
            console.log(`결과 ${index + 1}:`, job);
            
            // 복사할 텍스트 생성
            const copyText = `회사명: ${job.company || job.회사명 || '회사명 없음'}
직무: ${job.title || job.직무 || '직무 없음'}
일정: ${job.schedule || job['일정'] || '일정 없음'}
업종: ${job.industry || job.업종 || '업종 없음'}
연락처: ${job.contact || job.연락처 || '연락처 없음'}
주소: ${job.address || job.주소 || '주소 없음'}`;
            
            resultsHTML += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card job-card h-100 position-relative">
                        <div class="card-body pb-5">
                            <h5 class="card-title company-name">${job.company || job.회사명 || '회사명 없음'}</h5>
                            <p class="card-text">
                                <strong>직무:</strong> ${job.title || job.직무 || '직무 없음'}<br>
                                <strong>일정:</strong> ${job.schedule || job['일정'] || '일정 없음'}<br>
                                <strong>업종:</strong> ${job.industry || job.업종 || '업종 없음'}<br>
                                <strong>연락처:</strong> ${job.contact || job.연락처 || '연락처 없음'}
                            </p>
                            <div class="address-info-compact">
                                <i class="fas fa-map-marker-alt me-1"></i>${job.address || job.주소 || '주소 없음'}
                            </div>
                        </div>
                        <div class="position-absolute bottom-0 end-0 p-2">
                            <button class="btn btn-sm btn-outline-primary copy-btn" 
                                    onclick="copyJobInfo('${encodeURIComponent(copyText)}', this)" 
                                    title="게시물 복사">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        searchResults.innerHTML = `<div class="row">${resultsHTML}</div>`;
    }
}

// 관리자 로그인 페이지 초기화
function initializeAdminLogin() {
    const loginForm = document.getElementById('adminLoginForm');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        
        if (password === ADMIN_PASSWORD) {
            // 로그인 성공 - 관리자 대시보드로 이동
            window.location.href = 'admin_dashboard.html';
        } else {
            // 로그인 실패
            alert('비밀번호가 올바르지 않습니다.');
        }
    });
}

// 관리자 대시보드 초기화
async function initializeAdminDashboard() {
    console.log('관리자 대시보드 초기화');
    
    // 업로드 히스토리 표시
    await updateUploadHistory();
    
    // CSV 업로드 정보 초기화
    updateCSVUploadInfo();
    
    // 파일 업로드 이벤트 리스너 설정
    const fileInput = document.getElementById('csvFile');
    const fileInfo = document.getElementById('fileInfo');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadForm = document.getElementById('uploadForm');
    
    // 파일 선택 이벤트
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        
        if (file) {
            fileInfo.innerHTML = `
                <div class="mt-3">
                    <i class="fas fa-file-csv fa-3x text-success mb-3"></i>
                    <h5>선택된 파일: ${file.name}</h5>
                    <p class="text-muted">파일 크기: ${(file.size / 1024).toFixed(2)} KB</p>
                </div>
            `;
            fileInfo.style.display = 'block';
            uploadBtn.style.display = 'inline-block';
        } else {
            fileInfo.style.display = 'none';
            uploadBtn.style.display = 'none';
        }
    });
    
    // 폼 제출 이벤트
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const file = fileInput.files[0];
        if (!file) {
            alert('파일을 선택해주세요.');
            return;
        }
        
        // 로딩 상태 표시
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>업로드 중...';
        uploadBtn.disabled = true;
        
        try {
            // 파일 읽기 및 처리
            const jobsData = await parseCSVFile(file);
            
            // Firebase에 저장
            const success = await saveJobsData(jobsData);
            
            if (success) {
                alert(`CSV 파일이 성공적으로 업로드되었습니다!\n총 ${jobsData.length}개의 데이터가 저장되었습니다.`);
                
                // 파일 정보 초기화
                fileInput.value = '';
                fileInfo.style.display = 'none';
                uploadBtn.style.display = 'none';
                
                // 업로드 히스토리 업데이트
                await updateUploadHistory();
            } else {
                // 실패 기록 추가
                const uploadRecord = {
                    timestamp: new Date().toISOString(),
                    source: 'CSV 파일',
                    status: 'error',
                    count: 0,
                    time: new Date().toLocaleString(),
                    error: 'Firebase 저장 실패'
                };
                
                let uploadHistory = JSON.parse(localStorage.getItem('csvUploadHistory') || '[]');
                uploadHistory.unshift(uploadRecord);
                uploadHistory = uploadHistory.slice(0, 10);
                localStorage.setItem('csvUploadHistory', JSON.stringify(uploadHistory));
                
                alert('업로드 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('업로드 오류:', error);
            
            // 오류 기록 추가
            const uploadRecord = {
                timestamp: new Date().toISOString(),
                source: 'CSV 파일',
                status: 'error',
                count: 0,
                time: new Date().toLocaleString(),
                error: error.message
            };
            
            let uploadHistory = JSON.parse(localStorage.getItem('csvUploadHistory') || '[]');
            uploadHistory.unshift(uploadRecord);
            uploadHistory = uploadHistory.slice(0, 10);
            localStorage.setItem('csvUploadHistory', JSON.stringify(uploadHistory));
            
            alert('파일 처리 중 오류가 발생했습니다: ' + error.message);
        } finally {
            // 로딩 상태 해제
            uploadBtn.innerHTML = '<i class="fas fa-upload me-2"></i>업로드';
            uploadBtn.disabled = false;
        }
    });
}

// CSV 파일 파싱
function parseCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n').filter(line => line.trim() !== '');
                
                if (lines.length < 2) {
                    reject(new Error('CSV 파일에 데이터가 없습니다.'));
                    return;
                }
                
                const headers = lines[0].split(',').map(h => h.trim());
                
                // 필수 컬럼 확인
                const requiredColumns = ['회사명', '직무', '일정', '업종', '연락처', '주소'];
                const missingColumns = requiredColumns.filter(col => 
                    !headers.some(header => header === col)
                );
                
                if (missingColumns.length > 0) {
                    reject(new Error(`필수 컬럼이 누락되었습니다: ${missingColumns.join(', ')}`));
                    return;
                }
                
                // CSV 데이터를 객체 배열로 변환
                const jobsData = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    if (values.length >= headers.length) {
                        const job = {};
                        headers.forEach((header, index) => {
                            job[header] = values[index] || '';
                        });
                        jobsData.push(job);
                    }
                }
                
                resolve(jobsData);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('파일 읽기 오류'));
        };
        
        reader.readAsText(file, 'UTF-8');
    });
}

// 업로드 히스토리 업데이트 (Realtime Database만 사용)
async function updateUploadHistory() {
    try {
        const snapshot = await rtdb.ref('jobs').once('value');
        const count = snapshot.numChildren();
        
        const historyDiv = document.getElementById('uploadHistory');
        const downloadSection = document.getElementById('downloadSection');
        
        if (count > 0) {
            // 마지막 업데이트 시간을 고정 (실시간 업데이트 방지)
            const lastUpdateTime = localStorage.getItem('lastUpdateTime') || new Date().toLocaleString();
            const lastUploadCount = localStorage.getItem('lastUploadCount') || count.toString();
            historyDiv.innerHTML = `
                <p><strong>저장된 데이터:</strong> ${count}개 (Realtime Database)</p>
                <p><strong>마지막 업데이트:</strong> ${lastUpdateTime}</p>
                <p><strong>업로드 수량:</strong> ${lastUploadCount}개</p>
            `;
        } else {
            historyDiv.innerHTML = '<p class="text-muted">아직 업로드된 파일이 없습니다.</p>';
        }
        
        // 다운로드 섹션은 항상 표시
        if (downloadSection) {
            downloadSection.style.display = 'block';
        }
        
        // CSV 업로드 정보 업데이트
        updateCSVUploadInfo();
    } catch (error) {
        console.error('Realtime Database 히스토리 업데이트 오류:', error);
        const historyDiv = document.getElementById('uploadHistory');
        historyDiv.innerHTML = '<p class="text-muted">데이터베이스 연결 오류</p>';
        
        // 오류가 있어도 다운로드 섹션은 표시
        const downloadSection = document.getElementById('downloadSection');
        if (downloadSection) {
            downloadSection.style.display = 'block';
        }
    }
}

// 현재 데이터를 CSV로 다운로드
async function downloadCurrentData() {
    try {
        console.log('현재 데이터 다운로드 시작...');
        
        // Firebase에서 데이터 로드
        const snapshot = await rtdb.ref('jobs').once('value');
        const jobsData = [];
        
        snapshot.forEach(childSnapshot => {
            const job = childSnapshot.val();
            // 키 이름을 원래대로 복원
            const restoredJob = {};
            Object.keys(job).forEach(key => {
                const originalKey = key
                    .replace(/_/g, '/')
                    .replace(/등록일_수정일/g, '등록일/수정일');
                restoredJob[originalKey] = job[key];
            });
            jobsData.push(restoredJob);
        });
        
        if (jobsData.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }
        
        // CSV 생성
        const csvContent = generateCSV(jobsData);
        
        // 파일 다운로드
        downloadCSV(csvContent, `SARAMIN_${getCurrentDate()}.csv`);
        
        console.log(`${jobsData.length}개의 데이터를 다운로드했습니다.`);
        
    } catch (error) {
        console.error('데이터 다운로드 오류:', error);
        alert('데이터 다운로드 중 오류가 발생했습니다.');
    }
}

// CSV 템플릿 다운로드
function downloadSampleTemplate() {
    const templateData = [
        {
            회사명: "샘플회사",
            직무: "매장직",
            "일정": "오픈 예정",
            업종: "서비스업",
            연락처: "02-1234-5678",
            주소: "서울 강남구"
        },
        {
            회사명: "예시기업",
            직무: "영업직",
            "일정": "오픈 예정",
            업종: "제조업",
            연락처: "031-987-6543",
            주소: "경기 성남시"
        }
    ];
    
    const csvContent = generateCSV(templateData);
    downloadCSV(csvContent, 'CSV_템플릿.csv');
}

// CSV 생성 함수
function generateCSV(data) {
    if (data.length === 0) return '';
    
    // 헤더 생성
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // 헤더 추가
    csvRows.push(headers.join(','));
    
    // 데이터 추가
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            // CSV에서 특수문자 처리 (쉼표, 따옴표 등)
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}

// CSV 파일 다운로드 함수
function downloadCSV(csvContent, filename) {
    const blob = new Blob(['\ufeff' + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 메모리 정리
    URL.revokeObjectURL(url);
}

// 현재 날짜를 YYMMDD 형식으로 반환
function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${month}${day}(${hours}${minutes})`;
}

// 게시물 정보 복사
function copyJobInfo(encodedText, buttonElement) {
    const text = decodeURIComponent(encodedText);
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('게시물이 클립보드에 복사되었습니다!');
            
            // 버튼 스타일 변경
            const icon = buttonElement.querySelector('i');
            icon.className = 'fas fa-check';
            buttonElement.classList.remove('btn-outline-primary');
            buttonElement.classList.add('btn-success');
            
            // 2초 후 원래 상태로 복원
            setTimeout(() => {
                icon.className = 'fas fa-copy';
                buttonElement.classList.remove('btn-success');
                buttonElement.classList.add('btn-outline-primary');
            }, 2000);
        }).catch(err => {
            console.error('클립보드 복사 실패:', err);
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

// 클립보드 복사 폴백 함수
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('게시물이 클립보드에 복사되었습니다!');
    } catch (err) {
        console.error('폴백 복사 실패:', err);
        showToast('복사에 실패했습니다.');
    }
    
    document.body.removeChild(textArea);
}

// 토스트 메시지 표시
function showToast(message) {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 새 토스트 생성
    const toast = document.createElement('div');
    toast.className = 'toast-message position-fixed';
    toast.style.cssText = `
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 5px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 500;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 3초 후 제거
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// CSV 업로드 정보 업데이트 함수
function updateCSVUploadInfo() {
    // 사람인 데이터 정보 업데이트
    const saraminSummary = document.getElementById('saraminSummary');
    if (saraminSummary) {
        const saraminLastUpdateTime = localStorage.getItem('saraminLastUpdateTime');
        const saraminLastUploadCount = localStorage.getItem('saraminLastUploadCount');
        
        if (saraminLastUpdateTime && saraminLastUploadCount) {
            saraminSummary.innerHTML = `
                <div class="upload-time">업로드 시간: ${saraminLastUpdateTime}</div>
                <div class="upload-count">업로드 수량: ${saraminLastUploadCount}개</div>
            `;
            
            // 데이터가 있으면 스타일 변경
            const uploadItem = saraminSummary.closest('.upload-item');
            if (uploadItem) {
                uploadItem.classList.add('has-data');
            }
        } else {
            saraminSummary.innerHTML = `
                <div class="upload-time">업로드 시간: -</div>
                <div class="upload-count">업로드 수량: 0개</div>
            `;
            
            // 데이터가 없으면 스타일 제거
            const uploadItem = saraminSummary.closest('.upload-item');
            if (uploadItem) {
                uploadItem.classList.remove('has-data');
            }
        }
    }
    
    // 메디잡 데이터 정보 업데이트
    const medijobSummary = document.getElementById('medijobSummary');
    if (medijobSummary) {
        const medijobLastUpdateTime = localStorage.getItem('medijobLastUpdateTime');
        const medijobLastUploadCount = localStorage.getItem('medijobLastUploadCount');
        
        if (medijobLastUpdateTime && medijobLastUploadCount) {
            medijobSummary.innerHTML = `
                <div class="upload-time">업로드 시간: ${medijobLastUpdateTime}</div>
                <div class="upload-count">업로드 수량: ${medijobLastUploadCount}개</div>
            `;
            
            // 데이터가 있으면 스타일 변경
            const uploadItem = medijobSummary.closest('.upload-item');
            if (uploadItem) {
                uploadItem.classList.add('has-data');
            }
        } else {
            medijobSummary.innerHTML = `
                <div class="upload-time">업로드 시간: -</div>
                <div class="upload-count">업로드 수량: 0개</div>
            `;
            
            // 데이터가 없으면 스타일 제거
            const uploadItem = medijobSummary.closest('.upload-item');
            if (uploadItem) {
                uploadItem.classList.remove('has-data');
            }
        }
    }
    
    // 헤어인잡 데이터 정보 업데이트
    const hairinjobSummary = document.getElementById('hairinjobSummary');
    if (hairinjobSummary) {
        const hairinjobLastUpdateTime = localStorage.getItem('hairinjobLastUpdateTime');
        const hairinjobLastUploadCount = localStorage.getItem('hairinjobLastUploadCount');
        
        if (hairinjobLastUpdateTime && hairinjobLastUploadCount) {
            hairinjobSummary.innerHTML = `
                <div class="upload-time">업로드 시간: ${hairinjobLastUpdateTime}</div>
                <div class="upload-count">업로드 수량: ${hairinjobLastUploadCount}개</div>
            `;
            
            // 데이터가 있으면 스타일 변경
            const uploadItem = hairinjobSummary.closest('.upload-item');
            if (uploadItem) {
                uploadItem.classList.add('has-data');
            }
        } else {
            hairinjobSummary.innerHTML = `
                <div class="upload-time">업로드 시간: -</div>
                <div class="upload-count">업로드 수량: 0개</div>
            `;
            
            // 데이터가 없으면 스타일 제거
            const uploadItem = hairinjobSummary.closest('.upload-item');
            if (uploadItem) {
                uploadItem.classList.remove('has-data');
            }
        }
    }
    
    // CSV 업로드 데이터 정보 업데이트
    const csvSummary = document.getElementById('csvSummary');
    if (csvSummary) {
        const csvLastUpdateTime = localStorage.getItem('csvLastUpdateTime');
        const csvLastUploadCount = localStorage.getItem('csvLastUploadCount');
        
        if (csvLastUpdateTime && csvLastUploadCount) {
            csvSummary.innerHTML = `
                <div class="upload-time">업로드 시간: ${csvLastUpdateTime}</div>
                <div class="upload-count">업로드 수량: ${csvLastUploadCount}개</div>
            `;
            
            // 데이터가 있으면 스타일 변경
            const uploadItem = csvSummary.closest('.upload-item');
            if (uploadItem) {
                uploadItem.classList.add('has-data');
            }
        } else {
            csvSummary.innerHTML = `
                <div class="upload-time">업로드 시간: -</div>
                <div class="upload-count">업로드 수량: 0개</div>
            `;
            
            // 데이터가 없으면 스타일 제거
            const uploadItem = csvSummary.closest('.upload-item');
            if (uploadItem) {
                uploadItem.classList.remove('has-data');
            }
        }
    }
} 

// 플랫폼별 데이터 다운로드 함수들
async function downloadSaraminData() {
    try {
        console.log('사람인 데이터 다운로드 시작...');
        
        // Firebase에서 사람인 데이터 로드
        const snapshot = await rtdb.ref('saramin_jobs').once('value');
        const jobsData = [];
        
        snapshot.forEach(childSnapshot => {
            const job = childSnapshot.val();
            // 키 이름을 원래대로 복원
            const restoredJob = {};
            Object.keys(job).forEach(key => {
                const originalKey = key
                    .replace(/_/g, '/')
                    .replace(/등록일_수정일/g, '등록일/수정일');
                restoredJob[originalKey] = job[key];
            });
            jobsData.push(restoredJob);
        });
        
        if (jobsData.length === 0) {
            alert('사람인 데이터가 없습니다.');
            return;
        }
        
        // CSV 생성
        const csvContent = generateCSV(jobsData);
        
        // 파일 다운로드
        downloadCSV(csvContent, `SARAMIN_${getCurrentDate()}.csv`);
        
        console.log(`사람인 데이터 ${jobsData.length}개를 다운로드했습니다.`);
        
    } catch (error) {
        console.error('사람인 데이터 다운로드 오류:', error);
        alert('사람인 데이터 다운로드 중 오류가 발생했습니다.');
    }
}

async function downloadMedijobData() {
    try {
        console.log('메디잡 데이터 다운로드 시작...');
        
        // Firebase에서 메디잡 데이터 로드
        const snapshot = await rtdb.ref('medijob_jobs').once('value');
        const jobsData = [];
        
        snapshot.forEach(childSnapshot => {
            const job = childSnapshot.val();
            // 키 이름을 원래대로 복원
            const restoredJob = {};
            Object.keys(job).forEach(key => {
                const originalKey = key
                    .replace(/_/g, '/')
                    .replace(/등록일_수정일/g, '등록일/수정일');
                restoredJob[originalKey] = job[key];
            });
            jobsData.push(restoredJob);
        });
        
        if (jobsData.length === 0) {
            alert('메디잡 데이터가 없습니다.');
            return;
        }
        
        // CSV 생성
        const csvContent = generateCSV(jobsData);
        
        // 파일 다운로드
        downloadCSV(csvContent, `MEDIJOB_${getCurrentDate()}.csv`);
        
        console.log(`메디잡 데이터 ${jobsData.length}개를 다운로드했습니다.`);
        
    } catch (error) {
        console.error('메디잡 데이터 다운로드 오류:', error);
        alert('메디잡 데이터 다운로드 중 오류가 발생했습니다.');
    }
}

async function downloadHairinjobData() {
    try {
        console.log('헤어인잡 데이터 다운로드 시작...');
        
        // Firebase에서 헤어인잡 데이터 로드
        const snapshot = await rtdb.ref('hairinjob_jobs').once('value');
        const jobsData = [];
        
        snapshot.forEach(childSnapshot => {
            const job = childSnapshot.val();
            // 키 이름을 원래대로 복원
            const restoredJob = {};
            Object.keys(job).forEach(key => {
                const originalKey = key
                    .replace(/_/g, '/')
                    .replace(/등록일_수정일/g, '등록일/수정일');
                restoredJob[originalKey] = job[key];
            });
            jobsData.push(restoredJob);
        });
        
        if (jobsData.length === 0) {
            alert('헤어인잡 데이터가 없습니다.');
            return;
        }
        
        // CSV 생성
        const csvContent = generateCSV(jobsData);
        
        // 파일 다운로드
        downloadCSV(csvContent, `HAIRINJOB_${getCurrentDate()}.csv`);
        
        console.log(`헤어인잡 데이터 ${jobsData.length}개를 다운로드했습니다.`);
        
    } catch (error) {
        console.error('헤어인잡 데이터 다운로드 오류:', error);
        alert('헤어인잡 데이터 다운로드 중 오류가 발생했습니다.');
    }
}

async function downloadCSVUploadData() {
    try {
        console.log('CSV 업로드 데이터 다운로드 시작...');
        
        // Firebase에서 CSV 업로드 데이터 로드
        const snapshot = await rtdb.ref('csv_jobs').once('value');
        const jobsData = [];
        
        snapshot.forEach(childSnapshot => {
            const job = childSnapshot.val();
            // 키 이름을 원래대로 복원
            const restoredJob = {};
            Object.keys(job).forEach(key => {
                const originalKey = key
                    .replace(/_/g, '/')
                    .replace(/등록일_수정일/g, '등록일/수정일');
                restoredJob[originalKey] = job[key];
            });
            jobsData.push(restoredJob);
        });
        
        if (jobsData.length === 0) {
            alert('CSV 업로드 데이터가 없습니다.');
            return;
        }
        
        // CSV 생성
        const csvContent = generateCSV(jobsData);
        
        // 파일 다운로드
        downloadCSV(csvContent, `CSV_UPLOAD_${getCurrentDate()}.csv`);
        
        console.log(`CSV 업로드 데이터 ${jobsData.length}개를 다운로드했습니다.`);
        
    } catch (error) {
        console.error('CSV 업로드 데이터 다운로드 오류:', error);
        alert('CSV 업로드 데이터 다운로드 중 오류가 발생했습니다.');
    }
}

// 플랫폼별 데이터 저장 함수들
async function saveSaraminData(jobsData) {
    console.log('사람인 데이터 Firebase 저장 시작...');
    console.log('저장할 데이터:', jobsData);
    
    try {
        // 기존 데이터 삭제
        await rtdb.ref('saramin_jobs').remove();
        console.log('기존 사람인 데이터 삭제 완료');
        
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
            updates[`saramin_jobs/${index}`] = cleanJob;
        });
        
        await rtdb.ref().update(updates);
        console.log('사람인 데이터 Firebase 저장 완료');
        
        // 업로드 성공 시 마지막 업데이트 시간과 수량 저장
        const currentTime = new Date().toLocaleString();
        localStorage.setItem('saraminLastUpdateTime', currentTime);
        localStorage.setItem('saraminLastUploadCount', jobsData.length.toString());
        
        return true;
    } catch (error) {
        console.error('사람인 데이터 Firebase 저장 오류:', error);
        return false;
    }
}

async function saveMedijobData(jobsData) {
    console.log('메디잡 데이터 Firebase 저장 시작...');
    console.log('저장할 데이터:', jobsData);
    
    try {
        // 기존 데이터 삭제
        await rtdb.ref('medijob_jobs').remove();
        console.log('기존 메디잡 데이터 삭제 완료');
        
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
            updates[`medijob_jobs/${index}`] = cleanJob;
        });
        
        await rtdb.ref().update(updates);
        console.log('메디잡 데이터 Firebase 저장 완료');
        
        // 업로드 성공 시 마지막 업데이트 시간과 수량 저장
        const currentTime = new Date().toLocaleString();
        localStorage.setItem('medijobLastUpdateTime', currentTime);
        localStorage.setItem('medijobLastUploadCount', jobsData.length.toString());
        
        return true;
    } catch (error) {
        console.error('메디잡 데이터 Firebase 저장 오류:', error);
        return false;
    }
}

async function saveHairinjobData(jobsData) {
    console.log('헤어인잡 데이터 Firebase 저장 시작...');
    console.log('저장할 데이터:', jobsData);
    
    try {
        // 기존 데이터 삭제
        await rtdb.ref('hairinjob_jobs').remove();
        console.log('기존 헤어인잡 데이터 삭제 완료');
        
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
            updates[`hairinjob_jobs/${index}`] = cleanJob;
        });
        
        await rtdb.ref().update(updates);
        console.log('헤어인잡 데이터 Firebase 저장 완료');
        
        // 업로드 성공 시 마지막 업데이트 시간과 수량 저장
        const currentTime = new Date().toLocaleString();
        localStorage.setItem('hairinjobLastUpdateTime', currentTime);
        localStorage.setItem('hairinjobLastUploadCount', jobsData.length.toString());
        
        return true;
    } catch (error) {
        console.error('헤어인잡 데이터 Firebase 저장 오류:', error);
        return false;
    }
}

async function saveCSVUploadData(jobsData) {
    console.log('CSV 업로드 데이터 Firebase 저장 시작...');
    console.log('저장할 데이터:', jobsData);
    
    try {
        // 기존 데이터 삭제
        await rtdb.ref('csv_jobs').remove();
        console.log('기존 CSV 업로드 데이터 삭제 완료');
        
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
            updates[`csv_jobs/${index}`] = cleanJob;
        });
        
        await rtdb.ref().update(updates);
        console.log('CSV 업로드 데이터 Firebase 저장 완료');
        
        // 업로드 성공 시 마지막 업데이트 시간과 수량 저장
        const currentTime = new Date().toLocaleString();
        localStorage.setItem('csvLastUpdateTime', currentTime);
        localStorage.setItem('csvLastUploadCount', jobsData.length.toString());
        
        // CSV 업로드 히스토리에 기록 추가
        const uploadRecord = {
            timestamp: new Date().toISOString(),
            source: 'CSV 파일',
            status: 'success',
            count: jobsData.length,
            time: currentTime
        };
        
        // 기존 히스토리 로드
        let uploadHistory = JSON.parse(localStorage.getItem('csvUploadHistory') || '[]');
        uploadHistory.unshift(uploadRecord);
        
        // 최근 10개만 유지
        uploadHistory = uploadHistory.slice(0, 10);
        localStorage.setItem('csvUploadHistory', JSON.stringify(uploadHistory));
        
        return true;
    } catch (error) {
        console.error('CSV 업로드 데이터 Firebase 저장 오류:', error);
        return false;
    }
} 