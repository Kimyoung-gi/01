const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 파이썬 스크립트 실행 함수
function executePythonScript(scriptName) {
    return new Promise((resolve, reject) => {
        console.log(`파이썬 스크립트 실행: ${scriptName}`);
        
        const scriptPath = path.join(__dirname, '데이터채널', scriptName);
        
        // 스크립트 파일 존재 확인
        if (!fs.existsSync(scriptPath)) {
            reject(new Error(`스크립트 파일을 찾을 수 없습니다: ${scriptPath}`));
            return;
        }
        
        // 파이썬 프로세스 실행
        const pythonProcess = spawn('python', [scriptPath], {
            cwd: path.join(__dirname, '데이터채널'),
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        // 표준 출력 처리
        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
            console.log(`[${scriptName}] stdout:`, data.toString());
        });
        
        // 표준 오류 처리
        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
            console.error(`[${scriptName}] stderr:`, data.toString());
        });
        
        // 프로세스 종료 처리
        pythonProcess.on('close', (code) => {
            console.log(`[${scriptName}] 프로세스 종료 코드: ${code}`);
            
            if (code === 0) {
                // 성공적으로 완료된 경우 생성된 CSV 파일 찾기
                try {
                    const csvFiles = findGeneratedCSVFiles();
                    if (csvFiles.length > 0) {
                        // 가장 최근에 생성된 CSV 파일 읽기
                        const latestCSV = csvFiles[0];
                        const csvContent = fs.readFileSync(latestCSV, 'utf-8');
                        
                        resolve({
                            success: true,
                            csvData: csvContent,
                            filename: path.basename(latestCSV),
                            message: `${scriptName} 실행 완료`
                        });
                    } else {
                        reject(new Error('생성된 CSV 파일을 찾을 수 없습니다.'));
                    }
                } catch (error) {
                    reject(new Error(`CSV 파일 읽기 오류: ${error.message}`));
                }
            } else {
                reject(new Error(`스크립트 실행 실패 (종료 코드: ${code}): ${stderr}`));
            }
        });
        
        // 프로세스 오류 처리
        pythonProcess.on('error', (error) => {
            console.error(`[${scriptName}] 프로세스 오류:`, error);
            reject(new Error(`프로세스 실행 오류: ${error.message}`));
        });
        
        // 타임아웃 설정 (5분)
        setTimeout(() => {
            pythonProcess.kill();
            reject(new Error('스크립트 실행 시간 초과 (5분)'));
        }, 300000);
    });
}

// 생성된 CSV 파일 찾기
function findGeneratedCSVFiles() {
    const dataChannelDir = path.join(__dirname, '데이터채널');
    const files = fs.readdirSync(dataChannelDir);
    
    // CSV 파일들 필터링
    const csvFiles = files
        .filter(file => file.endsWith('.csv'))
        .map(file => path.join(dataChannelDir, file))
        .sort((a, b) => {
            // 파일 수정 시간 기준으로 정렬 (최신순)
            return fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime();
        });
    
    return csvFiles;
}

// 파이썬 스크립트 실행 API 엔드포인트
app.post('/execute-python', async (req, res) => {
    try {
        const { script } = req.body;
        
        if (!script) {
            return res.status(400).json({
                success: false,
                error: '스크립트 이름이 필요합니다.'
            });
        }
        
        console.log(`파이썬 스크립트 실행 요청: ${script}`);
        
        // 스크립트 실행
        const result = await executePythonScript(script);
        
        res.json(result);
        
    } catch (error) {
        console.error('스크립트 실행 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 모든 파이썬 스크립트 실행 API 엔드포인트
app.post('/execute-all-python', async (req, res) => {
    try {
        const scripts = [
            'saramin_jobs.py',
            'medijob_jobs.py',
            'hairinjob_selenium.py'
        ];
        
        const results = [];
        
        for (const script of scripts) {
            try {
                console.log(`${script} 실행 중...`);
                const result = await executePythonScript(script);
                results.push({
                    script,
                    ...result
                });
                
                // 스크립트 간 간격
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`${script} 실행 오류:`, error);
                results.push({
                    script,
                    success: false,
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            results
        });
        
    } catch (error) {
        console.error('전체 스크립트 실행 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 서버 상태 확인 API
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`http://localhost:${PORT}`);
    console.log('사용 가능한 엔드포인트:');
    console.log('  POST /execute-python - 단일 파이썬 스크립트 실행');
    console.log('  POST /execute-all-python - 모든 파이썬 스크립트 실행');
    console.log('  GET /health - 서버 상태 확인');
});

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
    console.log('\n서버를 종료합니다...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n서버를 종료합니다...');
    process.exit(0);
}); 