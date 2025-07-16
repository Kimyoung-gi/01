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
    from bs4 import BeautifulSoup

    # 크롬 드라이버 설정 (헤드리스 모드 제거해서 화면에 띄우기)
    options = webdriver.ChromeOptions()
    # options.add_argument('--headless')  # 이 줄을 주석처리해서 화면에 띄우기
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')

    # 크롬 드라이버 실행
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    wait = WebDriverWait(driver, 10)

    # 메디잡 로그인 페이지로 직접 이동
    print("메디잡 로그인 페이지로 이동 중...")
    driver.get("https://www.medijob.cc/login")

    # 로그인 기능 추가
    print("로그인을 시도하는 중...")
    try:
        # 로그인 폼 입력
        username_field = wait.until(EC.presence_of_element_located((By.ID, "username")))
        password_field = wait.until(EC.presence_of_element_located((By.ID, "password")))
        
        # 로그인 정보 입력
        username_field.clear()
        username_field.send_keys("kamyoun7")
        password_field.clear()
        password_field.send_keys("ktmns1132005!")
        
        # 개인회원 로그인 버튼 클릭
        login_button = driver.find_element(By.CSS_SELECTOR, "a#loginSubmit.btnLogin.person")
        login_button.click()
        
        time.sleep(3)
        print("로그인 시도 완료")
        # 로그인 후 URL 확인
        print(f"로그인 후 URL: {driver.current_url}")
        if "login" not in driver.current_url:
            print("로그인 성공으로 보입니다!")
        else:
            print("로그인 실패 - 로그인 페이지에 머물러 있습니다.")
            
    except Exception as e:
        print(f"로그인 중 오류 발생: {e}. 로그인 없이 진행합니다.")

    # 검색 키워드별로 반복 수집
    search_keywords = [
        ("개원예정", 50),
        ("오픈예정", 20)
    ]
    job_data = []
    hospital_names = set()

    for keyword, target_count in search_keywords:
        print(f"\n=== '{keyword}' 키워드로 채용정보 수집 시작 (목표: {target_count}개) ===")
        # 메인 페이지로 이동(새로고침)
        driver.get("https://www.medijob.cc")
        time.sleep(2)
        # 검색창 찾기 및 입력
        search_box = wait.until(EC.element_to_be_clickable((By.ID, "searchText")))
        search_box.clear()
        search_box.send_keys(keyword)
        search_box.send_keys(Keys.ENTER)
        print(f"'{keyword}' 검색 완료, 결과 로딩 대기...")
        time.sleep(5)

        # 각 채용공고 링크로 들어가서 정보 추출
        collected = 0
        page_num = 1
        while collected < target_count:
            print(f"현재 페이지: {page_num}")
            job_links = driver.find_elements(By.CSS_SELECTOR, "a[href*='com_cpn_100_view_02']")
            print(f"'{keyword}' 페이지 {page_num}에서 찾은 채용공고 링크 개수: {len(job_links)}")
            
            if not job_links:
                print(f"'{keyword}' 페이지 {page_num}에서 더 이상 채용공고를 찾을 수 없습니다.")
                break
                
            for i, link in enumerate(job_links, 1):
                if collected >= target_count:
                    break
                try:
                    print(f"\n=== {keyword} 페이지 {page_num} {i}번째 채용공고 처리 중 ===")
                    driver.execute_script("arguments[0].click();", link)
                    time.sleep(3)
                    driver.switch_to.window(driver.window_handles[-1])
                    wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
                    time.sleep(2)
                    job_info = {}
                    # 병원명 추출
                    try:
                        hospital_name = ""
                        spans = driver.find_elements(By.TAG_NAME, "span")
                        for span in spans:
                            text = span.text.strip()
                            if text and len(text) > 2 and ("병원" in text or "외과" in text or "의원" in text or "치료" in text):
                                hospital_name = text
                                break
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
                    # 중복 병원명 제외
                    norm_name = job_info['병원명'].strip()
                    if not norm_name or norm_name == "정보 없음" or norm_name in hospital_names:
                        print(f"중복 또는 유효하지 않은 병원명 제외: {norm_name}")
                        driver.close()
                        driver.switch_to.window(driver.window_handles[0])
                        continue
                    hospital_names.add(norm_name)
                    # 직무 추출
                    try:
                        job_title = driver.find_element(By.TAG_NAME, "dd").text.strip()
                        job_info['직무'] = job_title
                        print(f"직무: {job_title}")
                    except:
                        job_info['직무'] = "정보 없음"
                        print("직무: 정보 없음")
                    # 일정 추출
                    try:
                        schedule = driver.find_element(By.CSS_SELECTOR, "span.text").text.strip()
                        job_info['일정'] = schedule
                        print(f"일정: {schedule}")
                    except:
                        job_info['일정'] = "정보 없음"
                        print("일정: 정보 없음")
                    # 주소 및 연락처 BeautifulSoup로 추출
                    try:
                        page_text = driver.page_source
                        soup = BeautifulSoup(page_text, "html.parser")
                        # 주소 추출
                        address = ""
                        address_dt = soup.find("dt", class_="roundIcon blue", string="병원 주소")
                        if address_dt:
                            address_dd = address_dt.find_next_sibling("dd")
                            if address_dd:
                                address = address_dd.get_text(strip=True)
                        job_info['주소'] = address
                        print(f"주소: {address}")
                        # 연락처 추출
                        phone = ""
                        phone_dd = soup.find("dd", class_="phone")
                        if phone_dd:
                            phone = phone_dd.get_text(strip=True)
                        else:
                            phone_dt = soup.find("dt", string="휴대폰번호")
                            if phone_dt:
                                phone_dd2 = phone_dt.find_next_sibling("dd")
                                if phone_dd2:
                                    phone = phone_dd2.get_text(strip=True)
                        job_info['연락처'] = phone
                        print(f"연락처: {phone}")
                    except Exception as e:
                        job_info['주소'] = job_info.get('주소', '')
                        job_info['연락처'] = job_info.get('연락처', '')
                        print(f"주소/연락처 추출 오류: {e}")
                    # 업종 (병원(M)으로 고정)
                    job_info['업종'] = "병원(M)"
                    print("업종: 병원(M)")
                    # 데이터 리스트에 추가
                    job_data.append(job_info)
                    collected += 1
                    print(f"수집 완료: {collected}/{target_count}")
                    # 현재 탭 닫기
                    driver.close()
                    driver.switch_to.window(driver.window_handles[0])
                except Exception as e:
                    print(f"{keyword} 페이지 {page_num} {i}번째 채용공고 처리 중 오류: {e}")
                    try:
                        driver.close()
                        driver.switch_to.window(driver.window_handles[0])
                    except:
                        pass
            
            # 다음 페이지로 이동
            if collected < target_count:
                try:
                    # 다음 페이지 링크 찾기 (여러 패턴 시도)
                    next_page_selectors = [
                        f"a[href*='pageList02({page_num+1})']",
                        f"a[onclick*='pageList02({page_num+1})']",
                        f"a:contains('{page_num+1}')",
                        "a:contains('다음')",
                        "a:contains('>')"
                    ]
                    
                    next_page_found = False
                    for selector in next_page_selectors:
                        try:
                            next_page = driver.find_element(By.CSS_SELECTOR, selector)
                            next_page.click()
                            page_num += 1
                            time.sleep(3)
                            print(f"다음 페이지로 이동: {page_num}")
                            next_page_found = True
                            break
                        except:
                            continue
                    
                    if not next_page_found:
                        print("더 이상 다음 페이지가 없습니다.")
                        break
                        
                except Exception as e:
                    print(f"다음 페이지 이동 중 오류: {e}")
                    break

    # CSV 파일로 저장
    if job_data:
        now = datetime.now()
        filename = f"MEDIJOB_{now.strftime('%m%d')}({now.strftime('%H%M')})_{len(job_data)}jobs.csv"
        with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            fieldnames = ['병원명', '직무', '일정', '주소', '업종', '연락처']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for job in job_data:
                writer.writerow(job)
        print(f"\n총 {len(job_data)}개의 채용정보를 {filename} 파일로 저장했습니다.")
    else:
        print("저장할 채용정보가 없습니다.")

    print("\n데이터 추출이 완료되었습니다. 10초 후 브라우저가 닫힙니다.")
    time.sleep(10)
    driver.quit()
    print("브라우저가 닫혔습니다.")

except Exception as e:
    print(f"스크립트 실행 중 예외 발생: {e}") 
