print("스크립트 시작")
try:
    from selenium import webdriver
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from webdriver_manager.chrome import ChromeDriverManager
    import time
    import csv
    from datetime import datetime
    import re

    # 크롬 드라이버 설정 (헤드리스 모드 제거해서 화면에 띄우기)
    options = webdriver.ChromeOptions()
    # options.add_argument('--headless')  # 이 줄을 주석처리해서 화면에 띄우기
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')

    # 크롬 드라이버 실행
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    wait = WebDriverWait(driver, 10)

    # 메디잡 사이트 열기
    print("메디잡 사이트를 여는 중...")
    driver.get("https://www.medijob.cc")

    # 검색창 찾기
    print("검색창을 찾는 중...")
    search_box = wait.until(EC.element_to_be_clickable((By.ID, "searchText")))

    # 검색창에 "신규채용" 입력
    print("검색창에 '신규채용'을 입력하는 중...")
    search_box.clear()
    search_box.send_keys("신규채용")

    # 엔터 키 누르기
    print("엔터 키를 누르는 중...")
    search_box.send_keys(Keys.ENTER)

    # 검색 결과 페이지 로딩 대기
    print("검색 결과 페이지 로딩을 기다리는 중...")
    time.sleep(5)

    # 채용공고 링크들 찾기
    print("채용공고 링크들을 찾는 중...")
    job_links = driver.find_elements(By.CSS_SELECTOR, "a[href*='com_cpn_100_view_02']")
    print(f"찾은 채용공고 링크 개수: {len(job_links)}")

    # 채용 정보를 저장할 리스트
    job_data = []

    # 각 채용공고 링크로 들어가서 정보 추출
    for i, link in enumerate(job_links, 1):
        try:
            print(f"\n=== {i}번째 채용공고 처리 중 ===")
            
            # 링크 클릭 (새 탭에서 열기)
            driver.execute_script("arguments[0].click();", link)
            time.sleep(3)
            
            # 새 탭으로 전환
            driver.switch_to.window(driver.window_handles[-1])
            
            # 상세페이지 로딩 대기
            wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            time.sleep(2)
            
            # 정보 추출
            job_info = {}
            
            # 병원명 추출
            try:
                hospital_name = ""
                # 방법 1: span 태그들 중에서 병원명 패턴 찾기
                spans = driver.find_elements(By.TAG_NAME, "span")
                for span in spans:
                    text = span.text.strip()
                    if text and len(text) > 2 and ("병원" in text or "외과" in text or "의원" in text or "치료" in text):
                        hospital_name = text
                        break
                
                # 방법 2: 페이지에서 병원명 패턴 찾기
                if not hospital_name:
                    page_text = driver.page_source
                    hospital_pattern = r'([가-힣]+(?:병원|외과|의원|치료|클리닉))'
                    matches = re.findall(hospital_pattern, page_text)
                    if matches:
                        hospital_name = matches[0]
                
                job_info['병원명'] = hospital_name
                print(f"병원명: {hospital_name}")
            except:
                job_info['병원명'] = "정보 없음"
                print("병원명: 정보 없음")
            
            # 직무 추출 (현재 주소에 기재된 내용을 직무로 사용)
            try:
                # 현재 주소에 기재된 내용을 직무로 사용
                job_title = driver.find_element(By.TAG_NAME, "dd").text.strip()
                job_info['직무'] = job_title
                print(f"직무: {job_title}")
            except:
                job_info['직무'] = "정보 없음"
                print("직무: 정보 없음")
            
            # 일정 추출 (span.text 클래스)
            try:
                schedule = driver.find_element(By.CSS_SELECTOR, "span.text").text.strip()
                job_info['일정'] = schedule
                print(f"일정: {schedule}")
            except:
                job_info['일정'] = "정보 없음"
                print("일정: 정보 없음")
            
            # 주소 추출 (병원정보 탭에서 실제 병원 주소)
            try:
                # 병원정보 탭을 찾아서 클릭
                hospital_info_tab = driver.find_element(By.CSS_SELECTOR, "a[title='병원 상세정보']")
                hospital_info_tab.click()
                time.sleep(2)
                
                # 병원 주소 찾기 (여러 방법 시도)
                address = ""
                
                # 방법 1: dd 태그들 중에서 완전한 주소 패턴 찾기
                dds = driver.find_elements(By.TAG_NAME, "dd")
                for dd in dds:
                    text = dd.text.strip()
                    # 완전한 주소 패턴 (시/구 + 로/길 + 번지/층)
                    if text and ("시" in text or "구" in text) and ("로" in text or "길" in text) and ("층" in text or "번지" in text or "호" in text):
                        address = text
                        break
                
                # 방법 2: 페이지에서 완전한 주소 패턴 찾기
                if not address:
                    page_text = driver.page_source
                    # 완전한 주소 패턴: 시/구 + 로/길 + 번지/층
                    address_patterns = [
                        r'([가-힣]+ [가-힣]+시 [가-힣]+로 \d+[층]?)',
                        r'([가-힣]+ [가-힣]+구 [가-힣]+로 \d+[층]?)',
                        r'([가-힣]+ [가-힣]+시 [가-힣]+길 \d+[층]?)',
                        r'([가-힣]+ [가-힣]+구 [가-힣]+길 \d+[층]?)',
                        r'([가-힣]+ [가-힣]+시 [가-힣]+로 \d+-\d+[층]?)',
                        r'([가-힣]+ [가-힣]+구 [가-힣]+로 \d+-\d+[층]?)'
                    ]
                    
                    for pattern in address_patterns:
                        matches = re.findall(pattern, page_text)
                        if matches:
                            address = matches[0]
                            break
                
                # 방법 3: 특정 텍스트가 포함된 요소 찾기
                if not address:
                    elements = driver.find_elements(By.XPATH, "//*[contains(text(), '로') and contains(text(), '층')]")
                    for element in elements:
                        text = element.text.strip()
                        if text and ("시" in text or "구" in text) and ("로" in text or "길" in text) and ("층" in text):
                            address = text
                            break
                
                job_info['주소'] = address
                print(f"주소: {address}")
            except:
                job_info['주소'] = "정보 없음"
                print("주소: 정보 없음")
            
            # 업종 (병원(M)으로 고정)
            job_info['업종'] = "병원(M)"
            print("업종: 병원(M)")
            
            # 데이터 리스트에 추가
            job_data.append(job_info)
            
            # 현재 탭 닫기
            driver.close()
            
            # 원래 탭으로 돌아가기
            driver.switch_to.window(driver.window_handles[0])
            
        except Exception as e:
            print(f"{i}번째 채용공고 처리 중 오류: {e}")
            # 오류 발생 시 현재 탭 닫고 원래 탭으로 돌아가기
            try:
                driver.close()
                driver.switch_to.window(driver.window_handles[0])
            except:
                pass

    # CSV 파일로 저장
    if job_data:
        # 현재 시간으로 파일명 생성 (SARAMIN_MMDD(HHMM) 형식)
        now = datetime.now()
        filename = f"MEDIJOB_{now.strftime('%m%d')}({now.strftime('%H%M')})_{len(job_data)}jobs.csv"
        
        with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            fieldnames = ['병원명', '직무', '일정', '주소', '업종', '연락처']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for job in job_data:
                # 연락처 필드 추가
                job['연락처'] = ''
                writer.writerow(job)
        
        print(f"\n총 {len(job_data)}개의 채용정보를 {filename} 파일로 저장했습니다.")
    else:
        print("저장할 채용정보가 없습니다.")

    # 잠시 대기 (결과 확인용)
    print("\n데이터 추출이 완료되었습니다. 10초 후 브라우저가 닫힙니다.")
    time.sleep(10)

    # 브라우저 닫기
    driver.quit()
    print("브라우저가 닫혔습니다.") 
except Exception as e:
    print(f"스크립트 실행 중 예외 발생: {e}") 