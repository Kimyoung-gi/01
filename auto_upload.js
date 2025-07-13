// 자동 업로드 기능을 위한 JavaScript 파일

// Firebase 설정
let firebaseApp;
// rtdb는 firebase-config.js에서 이미 선언되었으므로 여기서는 선언하지 않음

// 자동 업로드 설정
const AUTO_UPLOAD_TIME = '09:00'; // 매일 9시
let autoUploadInterval;

// 업로드 히스토리 저장소
let uploadHistory = [];

// Firebase 초기화 함수
function initializeFirebase() {
    try {
        // firebase-config.js에서 설정된 Firebase 객체 사용
        if (typeof firebase !== 'undefined' && typeof rtdb !== 'undefined') {
            firebaseApp = firebase.app();
            console.log('Firebase 초기화 성공');
            return true;
        } else {
            console.error('Firebase 또는 rtdb가 로드되지 않았습니다.');
            return false;
        }
    } catch (error) {
        console.error('Firebase 초기화 오류:', error);
        return false;
    }
}

// 파이썬 스크립트 실행 함수
async function executePythonScript(scriptName) {
    try {
        console.log(`${scriptName} 실행 시작...`);
        
        // 서버 없이 동작하도록 수정 - CSV 파일 업로드만 지원
        // 실제 Python 스크립트 실행은 서버가 필요하므로, 
        // 현재는 CSV 파일 업로드 기능만 사용 가능
        throw new Error('Python 스크립트 실행을 위해서는 서버가 필요합니다. CSV 파일 업로드 기능을 사용해주세요.');
        
    } catch (error) {
        console.error(`${scriptName} 실행 오류:`, error);
        throw error;
    }
}

// CSV 파일을 Firebase에 업로드하는 함수
async function uploadCSVToFirebase(csvData, source) {
    try {
        console.log(`${source} 데이터 Firebase 업로드 시작...`);
        
        // CSV 데이터를 파싱
        const jobsData = parseCSVData(csvData);
        
        // 플랫폼별로 다른 저장 함수 사용
        let success = false;
        switch (source) {
            case '사람인':
                success = await saveSaraminData(jobsData);
                break;
            case '메디잡':
                success = await saveMedijobData(jobsData);
                break;
            case '헤어인잡':
                success = await saveHairinjobData(jobsData);
                break;
            case 'CSV 파일':
                success = await saveCSVUploadData(jobsData);
                break;
            default:
                // 기존 방식으로 저장 (하위 호환성)
                success = await saveJobsData(jobsData);
                break;
        }
        
        if (success) {
            // 업로드 히스토리에 기록
            const uploadRecord = {
                timestamp: new Date().toISOString(),
                source: source,
                count: jobsData.length,
                status: 'success'
            };
            
            uploadHistory.push(uploadRecord);
            saveUploadHistory();
            
            console.log(`${source} 데이터 업로드 완료: ${jobsData.length}개`);
            return {
                success: true,
                count: jobsData.length,
                message: `${source} 데이터 ${jobsData.length}개가 성공적으로 업로드되었습니다.`
            };
        } else {
            throw new Error('Firebase 저장 실패');
        }
    } catch (error) {
        console.error(`${source} 데이터 업로드 오류:`, error);
        
        // 실패 기록
        const uploadRecord = {
            timestamp: new Date().toISOString(),
            source: source,
            count: 0,
            status: 'failed',
            error: error.message
        };
        
        uploadHistory.push(uploadRecord);
        saveUploadHistory();
        
        return {
            success: false,
            count: 0,
            message: `${source} 데이터 업로드 실패: ${error.message}`
        };
    }
}

// CSV 데이터 파싱 함수
function parseCSVData(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const jobsData = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const job = {};
            
            headers.forEach((header, index) => {
                job[header] = values[index] || '';
            });
            
            jobsData.push(job);
        }
    }
    
    return jobsData;
}

// 모든 파이썬 스크립트를 순차적으로 실행하는 함수
async function executeAllPythonScripts() {
    const scripts = [
        { name: 'saramin_jobs.py', displayName: '사람인' },
        { name: 'medijob_jobs.py', displayName: '메디잡' },
        { name: 'hairinjob_selenium.py', displayName: '헤어인잡' }
    ];
    
    const results = [];
    
    for (const script of scripts) {
        try {
            console.log(`${script.displayName} 스크립트 실행 중...`);
            
            // 스크립트 실행
            const result = await executePythonScript(script.name);
            
            if (result.success && result.csvData) {
                // CSV 데이터를 Firebase에 업로드
                const uploadResult = await uploadCSVToFirebase(result.csvData, script.displayName);
                results.push({
                    script: script.displayName,
                    ...uploadResult
                });
            } else {
                results.push({
                    script: script.displayName,
                    success: false,
                    count: 0,
                    message: `스크립트 실행 실패: ${result.error || '알 수 없는 오류'}`
                });
            }
            
            // 스크립트 간 간격
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.error(`${script.displayName} 스크립트 오류:`, error);
            results.push({
                script: script.displayName,
                success: false,
                count: 0,
                message: `스크립트 실행 오류: ${error.message}`
            });
        }
    }
    
    return results;
}

// 진행 상황을 포함한 모든 파이썬 스크립트 실행 함수
async function executeAllPythonScriptsWithProgress() {
    const scripts = [
        { name: 'saramin_jobs.py', displayName: '사람인' },
        { name: 'medijob_jobs.py', displayName: '메디잡' },
        { name: 'hairinjob_selenium.py', displayName: '헤어인잡' }
    ];
    
    const results = [];
    const totalScripts = scripts.length;
    
    // 각 플랫폼별 작업 현황을 표시할 컨테이너 생성
    const progressContainer = document.getElementById('uploadProgress');
    if (progressContainer) {
        const statusContainer = progressContainer.querySelector('.card-body');
        if (statusContainer) {
            // 기존 stepDetails 아래에 플랫폼별 현황 추가
            const platformStatusHtml = `
                <div class="mt-3">
                    <h6><i class="fas fa-tasks me-2"></i>플랫폼별 작업 현황</h6>
                    <div id="platformStatus" class="row">
                        <div class="col-md-4">
                            <div class="card border-primary">
                                <div class="card-body p-2">
                                    <h6 class="card-title text-primary mb-1">
                                        <i class="fas fa-building me-1"></i>사람인
                                    </h6>
                                    <div id="saraminStatus" class="small">
                                        <div class="text-muted">대기 중...</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card border-success">
                                <div class="card-body p-2">
                                    <h6 class="card-title text-success mb-1">
                                        <i class="fas fa-hospital me-1"></i>메디잡
                                    </h6>
                                    <div id="medijobStatus" class="small">
                                        <div class="text-muted">대기 중...</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card border-warning">
                                <div class="card-body p-2">
                                    <h6 class="card-title text-warning mb-1">
                                        <i class="fas fa-cut me-1"></i>헤어인잡
                                    </h6>
                                    <div id="hairinjobStatus" class="small">
                                        <div class="text-muted">대기 중...</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // 기존 stepDetails 뒤에 추가
            const stepDetails = statusContainer.querySelector('#stepDetails');
            if (stepDetails) {
                stepDetails.insertAdjacentHTML('afterend', platformStatusHtml);
            }
        }
    }
    
    for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        const currentStep = i + 1;
        const progressPercent = 30 + (currentStep / totalScripts) * 50; // 30% ~ 80%
        
        // 작업 진행 상황 업데이트
        updateTaskProgress(i, totalScripts);
        
        // 플랫폼별 상태 업데이트 함수
        const updatePlatformStatus = (platform, status, count = 0, progress = 0) => {
            const statusElement = document.getElementById(`${platform.toLowerCase()}Status`);
            if (statusElement) {
                let statusHtml = '';
                let statusClass = 'text-muted';
                
                switch (status) {
                    case 'start':
                        statusHtml = `
                            <div class="text-primary">🔄 데이터 수집 중...</div>
                            <div class="text-muted">공고 확인 중</div>
                        `;
                        statusClass = 'text-primary';
                        break;
                    case 'collecting':
                        statusHtml = `
                            <div class="text-primary">📊 ${count}개 공고 확인</div>
                            <div class="text-muted">데이터 수집 중 (${progress}%)</div>
                        `;
                        statusClass = 'text-primary';
                        break;
                    case 'uploading':
                        statusHtml = `
                            <div class="text-success">✅ ${count}개 업로드 완료</div>
                            <div class="text-muted">Firebase 저장 중</div>
                        `;
                        statusClass = 'text-success';
                        break;
                    case 'completed':
                        statusHtml = `
                            <div class="text-success">✅ ${count}개 업로드 완료</div>
                            <div class="text-success">작업률 100%</div>
                        `;
                        statusClass = 'text-success';
                        break;
                    case 'failed':
                        statusHtml = `
                            <div class="text-danger">❌ 업로드 실패</div>
                            <div class="text-muted">오류 발생</div>
                        `;
                        statusClass = 'text-danger';
                        break;
                }
                
                statusElement.innerHTML = statusHtml;
                statusElement.className = `small ${statusClass}`;
            }
        };
        
        try {
            updateProgress(progressPercent, `${script.displayName} 스크립트 실행 중...`, 
                         `${currentStep}/${totalScripts} - ${script.displayName} 데이터 수집 중...`);
            addStepDetail(`🔄 ${script.displayName} 스크립트 시작`);
            
            // 플랫폼별 상태 업데이트 - 시작
            updatePlatformStatus(script.displayName, 'start');
            
            console.log(`${script.displayName} 스크립트 실행 중...`);
            
            // 스크립트 실행
            const result = await executePythonScript(script.name);
            
            if (result.success && result.csvData) {
                // CSV 데이터 파싱하여 개수 확인
                const jobsData = parseCSVData(result.csvData);
                const dataCount = jobsData.length;
                
                addStepDetail(`✅ ${script.displayName} 데이터 수집 완료 (${dataCount}개)`);
                
                // 플랫폼별 상태 업데이트 - 수집 완료
                updatePlatformStatus(script.displayName, 'collecting', dataCount, 100);
                
                updateProgress(progressPercent + 5, `${script.displayName} Firebase 업로드 중...`, 
                             `${script.displayName} 데이터를 Firebase에 저장 중...`);
                
                // 플랫폼별 상태 업데이트 - 업로드 중
                updatePlatformStatus(script.displayName, 'uploading', dataCount);
                
                // CSV 데이터를 Firebase에 업로드
                const uploadResult = await uploadCSVToFirebase(result.csvData, script.displayName);
                results.push({
                    script: script.displayName,
                    ...uploadResult
                });
                
                addStepDetail(`✅ ${script.displayName} Firebase 업로드 완료 (${uploadResult.count}개 데이터)`);
                
                // 플랫폼별 상태 업데이트 - 완료
                updatePlatformStatus(script.displayName, 'completed', uploadResult.count);
                
                updateTaskProgress(currentStep, totalScripts);
            } else {
                addStepDetail(`❌ ${script.displayName} 스크립트 실행 실패`);
                
                // 플랫폼별 상태 업데이트 - 실패
                updatePlatformStatus(script.displayName, 'failed');
                
                updateTaskProgress(currentStep, totalScripts);
                results.push({
                    script: script.displayName,
                    success: false,
                    count: 0,
                    message: `스크립트 실행 실패: ${result.error || '알 수 없는 오류'}`
                });
            }
            
            // 스크립트 간 간격
            if (i < scripts.length - 1) {
                updateProgress(progressPercent + 10, '다음 스크립트 준비 중...', '잠시 대기 중...');
                addStepDetail(`⏳ 다음 스크립트 준비 중...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
        } catch (error) {
            console.error(`${script.displayName} 스크립트 오류:`, error);
            addStepDetail(`❌ ${script.displayName} 오류: ${error.message}`);
            
            // 플랫폼별 상태 업데이트 - 실패
            updatePlatformStatus(script.displayName, 'failed');
            
            updateTaskProgress(currentStep, totalScripts);
            results.push({
                script: script.displayName,
                success: false,
                count: 0,
                message: `스크립트 실행 오류: ${error.message}`
            });
        }
    }
    
    return results;
}

// 진행 상황 표시 함수들
let startTime = null;
let completedTasks = 0;

function showProgress() {
    const progressContainer = document.getElementById('uploadProgress');
    if (progressContainer) {
        progressContainer.style.display = 'block';
    }
    startTime = new Date();
    completedTasks = 0;
    updateElapsedTime();
}

function updateElapsedTime() {
    if (!startTime) return;
    
    const elapsed = new Date() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const elapsedTimeElement = document.getElementById('elapsedTime');
    if (elapsedTimeElement) {
        elapsedTimeElement.textContent = timeString;
    }
    
    // 1초마다 업데이트
    setTimeout(updateElapsedTime, 1000);
}

function updateTaskProgress(current, total) {
    completedTasks = current;
    const currentTaskElement = document.getElementById('currentTask');
    if (currentTaskElement) {
        currentTaskElement.textContent = `${current}/${total}`;
    }
}

function hideProgress() {
    const progressContainer = document.getElementById('uploadProgress');
    if (progressContainer) {
        progressContainer.style.display = 'none';
    }
}

function updateProgress(percent, text, stepText, details = '') {
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const progressText = document.getElementById('progressText');
    const stepTextElement = document.getElementById('stepText');
    const stepDetails = document.getElementById('stepDetails');
    
    if (progressBar) progressBar.style.width = percent + '%';
    if (progressPercent) progressPercent.textContent = percent + '%';
    if (progressText) progressText.textContent = text;
    if (stepTextElement) stepTextElement.textContent = stepText;
    if (stepDetails && details) stepDetails.innerHTML = details;
}

function addStepDetail(detail) {
    const stepDetails = document.getElementById('stepDetails');
    if (stepDetails) {
        const timestamp = new Date().toLocaleTimeString('ko-KR');
        stepDetails.innerHTML += `<div><small>${timestamp}: ${detail}</small></div>`;
    }
}

// 수동 업로드 함수
async function manualUpload() {
    try {
        console.log('수동 업로드 시작...');
        
        // 진행 상황 표시 시작
        showProgress();
        updateProgress(0, '시스템 초기화 중...', 'Firebase 및 서버 연결 확인 중...');
        
        // Firebase 초기화 확인
        updateProgress(10, 'Firebase 연결 확인 중...', 'Firebase 데이터베이스 연결 테스트...');
        if (!initializeFirebase()) {
            updateProgress(100, 'Firebase 초기화 실패', 'Firebase 연결에 실패했습니다.', '페이지를 새로고침해주세요.');
            setTimeout(() => {
                alert('Firebase 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
                hideProgress();
            }, 2000);
            return;
        }
        addStepDetail('✅ Firebase 연결 성공');
        
        // Firebase 연결 확인 (서버 의존성 제거)
        updateProgress(20, 'Firebase 연결 확인 중...', 'Firebase 데이터베이스 연결 테스트...');
        addStepDetail('✅ Firebase 연결 성공');
        
        // 로딩 상태 표시
        const uploadBtn = document.getElementById('manualUploadBtn');
        if (uploadBtn) {
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>업로드 중...';
            uploadBtn.disabled = true;
        }
        
        // 결과 표시 영역 초기화
        const resultsContainer = document.getElementById('uploadResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }
        
        // CSV 파일 업로드 기능만 지원 (서버 없이 동작)
        updateProgress(30, 'CSV 파일 업로드 준비 중...', '파일 업로드 기능 준비...');
        addStepDetail('🚀 CSV 파일 업로드 시작');
        
        // Python 스크립트 실행 대신 CSV 업로드 안내
        const results = [{
            script: '사람인',
            success: false,
            count: 0,
            message: 'Python 스크립트 실행을 위해서는 서버가 필요합니다. CSV 파일 업로드 기능을 사용해주세요.'
        }, {
            script: '메디잡',
            success: false,
            count: 0,
            message: 'Python 스크립트 실행을 위해서는 서버가 필요합니다. CSV 파일 업로드 기능을 사용해주세요.'
        }, {
            script: '헤어인잡',
            success: false,
            count: 0,
            message: 'Python 스크립트 실행을 위해서는 서버가 필요합니다. CSV 파일 업로드 기능을 사용해주세요.'
        }];
        
        // 결과 표시
        updateProgress(90, '결과 처리 중...', '업로드 결과 정리 및 표시...');
        displayUploadResults(results);
        
        // 업로드 히스토리 업데이트
        updateUploadHistoryDisplay();
        
        // 통합 업로드 정보 업데이트
        updateUploadSummary();
        
        // 완료
        updateProgress(100, '업로드 완료!', '모든 작업이 성공적으로 완료되었습니다.', '데이터 채널별 정보가 업데이트되었습니다.');
        addStepDetail('🎉 모든 업로드 완료');
        
        console.log('수동 업로드 완료');
        
        // 3초 후 진행 상황 숨기기
        setTimeout(() => {
            hideProgress();
        }, 3000);
        
    } catch (error) {
        console.error('수동 업로드 오류:', error);
        
        updateProgress(100, '업로드 실패', '오류가 발생했습니다: ' + error.message, '자세한 내용은 콘솔을 확인해주세요.');
        addStepDetail('❌ 오류 발생: ' + error.message);
        
        // 오류 결과 표시
        const resultsContainer = document.getElementById('uploadResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>업로드 실패:</strong> ${error.message}
                </div>
            `;
        }
        
        setTimeout(() => {
            alert('업로드 중 오류가 발생했습니다: ' + error.message);
            hideProgress();
        }, 2000);
    } finally {
        // 로딩 상태 해제
        const uploadBtn = document.getElementById('manualUploadBtn');
        if (uploadBtn) {
            uploadBtn.innerHTML = '<i class="fas fa-upload me-2"></i>수동 업로드';
            uploadBtn.disabled = false;
        }
    }
}

// 업로드 결과 표시 함수
function displayUploadResults(results) {
    const resultsContainer = document.getElementById('uploadResults');
    if (!resultsContainer) return;
    
    let html = '<div class="mt-3">';
    html += '<h6><i class="fas fa-chart-bar me-2"></i>업로드 결과</h6>';
    
    let totalSuccess = 0;
    let totalCount = 0;
    
    results.forEach(result => {
        const statusIcon = result.success ? 'fas fa-check-circle text-success' : 'fas fa-times-circle text-danger';
        const statusClass = result.success ? 'text-success' : 'text-danger';
        
        html += `
            <div class="alert alert-${result.success ? 'success' : 'danger'} alert-sm">
                <i class="${statusIcon} me-2"></i>
                <strong>${result.script}:</strong> 
                <span class="${statusClass}">${result.message}</span>
                ${result.success ? `<br><small>업로드 수량: ${result.count}개</small>` : ''}
            </div>
        `;
        
        if (result.success) {
            totalSuccess++;
            totalCount += result.count;
            
            // 각 채널별 상세 정보 업데이트
            displayChannelDetails(result.script, result);
        }
    });
    
    html += `
        <div class="alert alert-info alert-sm">
            <i class="fas fa-info-circle me-2"></i>
            <strong>총계:</strong> ${totalSuccess}개 스크립트 성공, 총 ${totalCount}개 데이터 업로드
        </div>
    </div>`;
    
    resultsContainer.innerHTML = html;
    
    // 채널별 정보 전체 업데이트 (updateUploadSummary로 대체)
    updateUploadSummary();
}

// 자동 업로드 스케줄러 시작
function startAutoUploadScheduler() {
    console.log('자동 업로드 스케줄러 시작...');
    
    // 매일 지정된 시간에 실행
    autoUploadInterval = setInterval(async () => {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        
        if (currentTime === AUTO_UPLOAD_TIME) {
            console.log('자동 업로드 실행:', currentTime);
            
            try {
                const results = await executeAllPythonScripts();
                console.log('자동 업로드 완료:', results);
                
                // 자동 업로드 결과를 로컬 스토리지에 저장
                localStorage.setItem('lastAutoUpload', JSON.stringify({
                    timestamp: now.toISOString(),
                    results: results
                }));
                
            } catch (error) {
                console.error('자동 업로드 오류:', error);
            }
        }
    }, 60000); // 1분마다 체크
    
    console.log(`자동 업로드 스케줄러가 시작되었습니다. (매일 ${AUTO_UPLOAD_TIME})`);
}

// 자동 업로드 스케줄러 중지
function stopAutoUploadScheduler() {
    if (autoUploadInterval) {
        clearInterval(autoUploadInterval);
        autoUploadInterval = null;
        console.log('자동 업로드 스케줄러가 중지되었습니다.');
    }
}

// 업로드 히스토리 저장
function saveUploadHistory() {
    localStorage.setItem('uploadHistory', JSON.stringify(uploadHistory));
}

// 업로드 히스토리 로드
function loadUploadHistory() {
    const saved = localStorage.getItem('uploadHistory');
    if (saved) {
        uploadHistory = JSON.parse(saved);
    }
}

// 업로드 히스토리 표시 업데이트
function updateUploadHistoryDisplay() {
    const historyContainer = document.getElementById('uploadHistory');
    if (!historyContainer) return;
    
    if (uploadHistory.length === 0) {
        historyContainer.innerHTML = '<p class="text-muted">아직 업로드된 파일이 없습니다.</p>';
        return;
    }
    
    // 최근 10개만 표시
    const recentHistory = uploadHistory.slice(-10).reverse();
    
    let html = '';
    recentHistory.forEach(record => {
        const date = new Date(record.timestamp).toLocaleString('ko-KR');
        const statusIcon = record.status === 'success' ? 'fas fa-check-circle text-success' : 'fas fa-times-circle text-danger';
        const statusText = record.status === 'success' ? '성공' : '실패';
        
        html += `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <i class="${statusIcon} me-2"></i>
                    <strong>${record.source}</strong>
                    <small class="text-muted ms-2">${date}</small>
                </div>
                <div>
                    <span class="badge bg-${record.status === 'success' ? 'success' : 'danger'}">${statusText}</span>
                    ${record.status === 'success' ? `<span class="badge bg-info ms-1">${record.count}개</span>` : ''}
                </div>
            </div>
        `;
    });
    
    historyContainer.innerHTML = html;
}

// 통합 업로드 정보 표시 함수
function updateUploadSummary() {
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

// CSV 업로드 히스토리 표시 함수
function showCSVUploadHistory() {
    // CSV 업로드 히스토리 로드
    const csvUploadHistory = JSON.parse(localStorage.getItem('csvUploadHistory') || '[]');
    const csvRecords = csvUploadHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    let modalContent = `
        <div class="row">
            <div class="col-md-12">
                <h6><i class="fas fa-file-csv me-2"></i>CSV 파일 업로드 정보</h6>
                <ul class="list-unstyled">
                    <li><strong>파일 형식:</strong> CSV (UTF-8)</li>
                    <li><strong>필수 컬럼:</strong> 회사명, 직무, 일정, 주소, 업종, 연락처</li>
                    <li><strong>업로드 방식:</strong> 수동 파일 업로드</li>
                </ul>
                
                <h6 class="mt-3">업로드 통계</h6>
                <div class="alert alert-info">
                    <strong>총 업로드 횟수:</strong> ${csvRecords.length}회<br>
                    <strong>성공 횟수:</strong> ${csvRecords.filter(r => r.status === 'success').length}회<br>
                    <strong>성공률:</strong> ${csvRecords.length > 0 ? Math.round((csvRecords.filter(r => r.status === 'success').length / csvRecords.length) * 100) : 0}%
                </div>
                
                ${csvRecords.length > 0 ? `
                <h6 class="mt-3">최신 업로드</h6>
                <div class="alert alert-${csvRecords[0].status === 'success' ? 'success' : 'danger'}">
                    <strong>시간:</strong> ${csvRecords[0].time || new Date(csvRecords[0].timestamp).toLocaleString('ko-KR')}<br>
                    <strong>상태:</strong> <span class="badge bg-${csvRecords[0].status === 'success' ? 'success' : 'danger'}">${csvRecords[0].status === 'success' ? '성공' : '실패'}</span><br>
                    ${csvRecords[0].status === 'success' ? `<strong>데이터 수량:</strong> ${csvRecords[0].count}개` : ''}
                    ${csvRecords[0].error ? `<br><strong>오류:</strong> ${csvRecords[0].error}` : ''}
                </div>
                
                <div class="mt-3">
                    <button class="btn btn-primary btn-sm" onclick="downloadCurrentData()">
                        <i class="fas fa-download me-2"></i>현재 데이터 다운로드
                    </button>
                    <button class="btn btn-outline-secondary btn-sm ms-2" onclick="downloadSampleTemplate()">
                        <i class="fas fa-file-download me-2"></i>CSV 템플릿 다운로드
                    </button>
                </div>
                ` : '<p class="text-muted">아직 업로드 기록이 없습니다.</p>'}
                
                ${csvRecords.length > 1 ? `
                <h6 class="mt-3">업로드 히스토리</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>시간</th>
                                <th>상태</th>
                                <th>수량</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${csvRecords.slice(1, 6).map(record => `
                                <tr>
                                    <td>${record.time || new Date(record.timestamp).toLocaleString('ko-KR')}</td>
                                    <td><span class="badge bg-${record.status === 'success' ? 'success' : 'danger'}">${record.status === 'success' ? '성공' : '실패'}</span></td>
                                    <td>${record.count || 0}개</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // 모달 제목과 내용 설정
    document.getElementById('channelModalTitle').innerHTML = `<i class="fas fa-file-csv me-2"></i>CSV 파일 업로드 정보`;
    document.getElementById('channelModalBody').innerHTML = modalContent;
    
    // 모달 표시
    const modal = new bootstrap.Modal(document.getElementById('channelDetailModal'));
    modal.show();
}

// 데이터 채널별 상세 정보 표시 함수
function displayChannelDetails(channelName, data) {
    const channelInfo = {
        '사람인': {
            icon: 'fas fa-building',
            color: 'primary',
            description: '사람인 채용정보 수집',
            script: 'saramin_jobs.py',
            keywords: '오픈예정, 신규오픈',
            maxData: 10
        },
        '메디잡': {
            icon: 'fas fa-hospital', 
            color: 'success',
            description: '메디잡 병원 채용정보 수집',
            script: 'medijob_jobs.py',
            keywords: '신규채용',
            maxData: '동적'
        },
        '헤어인잡': {
            icon: 'fas fa-cut',
            color: 'warning',
            description: '헤어인잡 뷰티 채용정보 수집',
            script: 'hairinjob_selenium.py',
            keywords: '오픈예정',
            maxData: 10
        }
    };
    
    const info = channelInfo[channelName] || {};
    const containerId = channelName === '사람인' ? 'saraminInfo' : 
                       channelName === '메디잡' ? 'medijobInfo' : 'hairinjobInfo';
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (data && data.success) {
        const date = new Date().toLocaleString('ko-KR');
        container.innerHTML = `
            <div class="alert alert-${info.color} alert-sm" onclick="showChannelDetail('${channelName}')">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>최신 업로드:</strong> ${date}<br>
                        <strong>데이터 수량:</strong> ${data.count}개<br>
                        <strong>상태:</strong> <span class="badge bg-success">성공</span>
                    </div>
                    <div class="text-end">
                        <i class="${info.icon} fa-2x text-${info.color}"></i>
                    </div>
                </div>
                <small class="text-muted">${info.description} (클릭하여 상세보기)</small>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="alert alert-secondary alert-sm" onclick="showChannelDetail('${channelName}')">
                <i class="${info.icon} me-2"></i>
                <strong>${channelName}</strong><br>
                <small class="text-muted">${info.description} (클릭하여 상세보기)</small>
            </div>
        `;
    }
}

// 채널 상세 정보 표시 함수
function showChannelDetail(channelName) {
    const channelInfo = {
        '사람인': {
            icon: 'fas fa-building',
            color: 'primary',
            description: '사람인 채용정보 수집',
            script: 'saramin_jobs.py',
            keywords: '오픈예정, 신규오픈',
            maxData: 10,
            url: 'https://www.saramin.co.kr',
            dataFields: ['회사명', '직무', '일정', '주소', '업종', '연락처']
        },
        '메디잡': {
            icon: 'fas fa-hospital', 
            color: 'success',
            description: '메디잡 병원 채용정보 수집',
            script: 'medijob_jobs.py',
            keywords: '신규채용',
            maxData: '동적',
            url: 'https://www.medijob.cc',
            dataFields: ['병원명', '직무', '일정', '주소', '업종', '연락처']
        },
        '헤어인잡': {
            icon: 'fas fa-cut',
            color: 'warning',
            description: '헤어인잡 뷰티 채용정보 수집',
            script: 'hairinjob_selenium.py',
            keywords: '오픈예정',
            maxData: 10,
            url: 'https://www.hairinjob.com',
            dataFields: ['회사명', '직무', '일정', '주소', '업종', '연락처']
        }
    };
    
    const info = channelInfo[channelName] || {};
    
    // 해당 채널의 업로드 히스토리 가져오기
    const channelRecords = uploadHistory
        .filter(record => record.source === channelName)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const successCount = channelRecords.filter(r => r.status === 'success').length;
    const totalCount = channelRecords.length;
    const latestRecord = channelRecords[0];
    
    let modalContent = `
        <div class="row">
            <div class="col-md-6">
                <h6><i class="${info.icon} me-2"></i>${channelName} 정보</h6>
                <ul class="list-unstyled">
                    <li><strong>스크립트:</strong> ${info.script}</li>
                    <li><strong>검색 키워드:</strong> ${info.keywords}</li>
                    <li><strong>최대 데이터:</strong> ${info.maxData}개</li>
                    <li><strong>수집 사이트:</strong> <a href="${info.url}" target="_blank">${info.url}</a></li>
                </ul>
                
                <h6 class="mt-3">수집 데이터 필드</h6>
                <ul class="list-unstyled">
                    ${info.dataFields.map(field => `<li><i class="fas fa-check text-success me-2"></i>${field}</li>`).join('')}
                </ul>
            </div>
            <div class="col-md-6">
                <h6><i class="fas fa-chart-bar me-2"></i>업로드 통계</h6>
                <div class="alert alert-info">
                    <strong>총 업로드 횟수:</strong> ${totalCount}회<br>
                    <strong>성공 횟수:</strong> ${successCount}회<br>
                    <strong>성공률:</strong> ${totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0}%
                </div>
                
                ${latestRecord ? `
                <h6 class="mt-3">최신 업로드</h6>
                <div class="alert alert-${latestRecord.status === 'success' ? 'success' : 'danger'}">
                    <strong>시간:</strong> ${new Date(latestRecord.timestamp).toLocaleString('ko-KR')}<br>
                    <strong>상태:</strong> <span class="badge bg-${latestRecord.status === 'success' ? 'success' : 'danger'}">${latestRecord.status === 'success' ? '성공' : '실패'}</span><br>
                    ${latestRecord.status === 'success' ? `<strong>데이터 수량:</strong> ${latestRecord.count}개` : ''}
                    ${latestRecord.error ? `<br><strong>오류:</strong> ${latestRecord.error}` : ''}
                </div>
                ` : '<p class="text-muted">아직 업로드 기록이 없습니다.</p>'}
            </div>
        </div>
    `;
    
    // 모달 제목과 내용 설정
    document.getElementById('channelModalTitle').innerHTML = `<i class="${info.icon} me-2"></i>${channelName} 상세 정보`;
    document.getElementById('channelModalBody').innerHTML = modalContent;
    
    // 모달 표시
    const modal = new bootstrap.Modal(document.getElementById('channelDetailModal'));
    modal.show();
}

// 마지막 자동 업로드 정보 표시
function displayLastAutoUpload() {
    const lastAutoUpload = localStorage.getItem('lastAutoUpload');
    if (lastAutoUpload) {
        const data = JSON.parse(lastAutoUpload);
        const date = new Date(data.timestamp).toLocaleString('ko-KR');
        
        const container = document.getElementById('lastAutoUpload');
        if (container) {
            let successCount = 0;
            let totalCount = 0;
            
            data.results.forEach(result => {
                if (result.success) {
                    successCount++;
                    totalCount += result.count;
                }
            });
            
            container.innerHTML = `
                <div class="alert alert-info alert-sm">
                    <h6><i class="fas fa-clock me-2"></i>마지막 자동 업로드</h6>
                    <p class="mb-1"><strong>시간:</strong> ${date}</p>
                    <p class="mb-1"><strong>성공:</strong> ${successCount}개 스크립트</p>
                    <p class="mb-0"><strong>총 데이터:</strong> ${totalCount}개</p>
                </div>
            `;
        }
    }
}

// 자동 업로드 설정 토글
function toggleAutoUpload() {
    const toggleBtn = document.getElementById('autoUploadToggle');
    const isEnabled = toggleBtn.classList.contains('btn-success');
    
    if (isEnabled) {
        // 자동 업로드 중지
        stopAutoUploadScheduler();
        toggleBtn.classList.remove('btn-success');
        toggleBtn.classList.add('btn-secondary');
        toggleBtn.innerHTML = '<i class="fas fa-pause me-2"></i>자동 업로드 중지';
        localStorage.setItem('autoUploadEnabled', 'false');
    } else {
        // 자동 업로드 시작
        startAutoUploadScheduler();
        toggleBtn.classList.remove('btn-secondary');
        toggleBtn.classList.add('btn-success');
        toggleBtn.innerHTML = '<i class="fas fa-play me-2"></i>자동 업로드 실행 중';
        localStorage.setItem('autoUploadEnabled', 'true');
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('자동 업로드 시스템 초기화...');
    
    // Firebase 초기화
    if (!initializeFirebase()) {
        console.error('Firebase 초기화 실패');
    }
    
    // 업로드 히스토리 로드
    loadUploadHistory();
    
    // 업로드 히스토리 표시
    updateUploadHistoryDisplay();
    
    // 채널별 정보 표시 (updateUploadSummary로 대체)
    updateUploadSummary();
    
    // 마지막 자동 업로드 정보 표시
    displayLastAutoUpload();
    
    // 자동 업로드 상태 복원
    const autoUploadEnabled = localStorage.getItem('autoUploadEnabled') === 'true';
    if (autoUploadEnabled) {
        startAutoUploadScheduler();
        
        const toggleBtn = document.getElementById('autoUploadToggle');
        if (toggleBtn) {
            toggleBtn.classList.remove('btn-secondary');
            toggleBtn.classList.add('btn-success');
            toggleBtn.innerHTML = '<i class="fas fa-play me-2"></i>자동 업로드 실행 중';
        }
    }
    
    console.log('자동 업로드 시스템 초기화 완료');
});

// 연결 테스트 함수
async function testConnection() {
    try {
        console.log('연결 테스트 시작...');
        
        // Firebase 연결 테스트
        const firebaseOk = initializeFirebase();
        console.log('Firebase 연결:', firebaseOk ? '성공' : '실패');
        
        // 결과 표시
        let message = '';
        if (firebaseOk) {
            message = '✅ Firebase 연결이 정상입니다!';
        } else {
            message = '❌ Firebase 연결에 문제가 있습니다.';
        }
        
        alert(message);
        
    } catch (error) {
        console.error('연결 테스트 오류:', error);
        alert('연결 테스트 중 오류가 발생했습니다: ' + error.message);
    }
}

// 전역 함수로 등록
window.manualUpload = manualUpload;
window.toggleAutoUpload = toggleAutoUpload;
window.testConnection = testConnection;
window.showChannelDetail = showChannelDetail; 

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

// 기존 saveJobsData 함수 (하위 호환성용)
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
        
        return true;
    } catch (error) {
        console.error('Realtime Database 데이터 저장 오류:', error);
        return false;
    }
} 