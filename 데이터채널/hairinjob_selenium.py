from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager
import time
from datetime import datetime
import csv
import os
import re

class HairinjobSeleniumScraper:
    def __init__(self):
        # Chrome 옵션 설정
        self.chrome_options = Options()
        self.chrome_options.add_argument("--no-sandbox")
        self.chrome_options.add_argument("--disable-dev-shm-usage")
        self.chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        self.chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        self.chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # WebDriver 초기화 (webdriver-manager 사용)
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=self.chrome_options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        # 대기 시간 설정
        self.wait = WebDriverWait(self.driver, 10)
    
    def login(self, username, password):
        """헤어인잡 로그인"""
        try:
            print("헤어인잡 로그인 페이지 접속 중...")
            self.driver.get("https://www.hairinjob.com/cms/user/login.php")
            
            # 페이지 로딩 대기
            time.sleep(3)
            
            print("로그인 폼 입력 중...")
            
            # 아이디 입력
            userid_input = self.wait.until(
                EC.presence_of_element_located((By.NAME, "userid"))
            )
            userid_input.clear()
            userid_input.send_keys(username)
            print("아이디 입력 완료")
            
            # 비밀번호 입력
            pwd_input = self.driver.find_element(By.NAME, "pwd")
            pwd_input.clear()
            pwd_input.send_keys(password)
            print("비밀번호 입력 완료")
            
            # 로그인 버튼 클릭
            login_button = self.driver.find_element(By.CLASS_NAME, "btn_login")
            login_button.click()
            print("로그인 버튼 클릭")
            
            # 로그인 성공 확인
            time.sleep(3)
            
            # 로그인 성공 여부 확인 (로그아웃 버튼이나 사용자 메뉴가 있는지 확인)
            try:
                # 로그인 성공 시 나타나는 요소들 확인
                logout_elements = self.driver.find_elements(By.XPATH, "//a[contains(text(), '로그아웃')]")
                user_menu_elements = self.driver.find_elements(By.XPATH, "//a[contains(text(), '마이페이지')]")
                
                if logout_elements or user_menu_elements:
                    print("로그인 성공!")
                    return True
                else:
                    print("로그인 실패 - 로그아웃 버튼이나 사용자 메뉴를 찾을 수 없습니다.")
                    return False
                    
            except Exception as e:
                print(f"로그인 성공 확인 중 오류: {e}")
                return False
                
        except Exception as e:
            print(f"로그인 중 오류 발생: {e}")
            return False
    
    def search_jobs(self, search_keyword):
        """채용 정보 검색"""
        try:
            print(f"검색 시작: {search_keyword}")
            
            # 검색창 찾기 (여러 가능한 선택자 시도)
            search_selectors = [
                "input[name='keyword']",
                "input[name='search']",
                "input[name='q']",
                "input[type='text']",
                "input[placeholder*='검색']",
                "input[placeholder*='search']"
            ]
            
            search_input = None
            for selector in search_selectors:
                try:
                    search_input = self.driver.find_element(By.CSS_SELECTOR, selector)
                    print(f"검색창 발견: {selector}")
                    break
                except:
                    continue
            
            if not search_input:
                print("검색창을 찾을 수 없습니다.")
                return []
            
            # 검색어 입력
            search_input.clear()
            search_input.send_keys(search_keyword)
            print(f"검색어 입력: {search_keyword}")
            
            # 검색 버튼 클릭 또는 Enter 키 입력
            try:
                search_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
                search_button.click()
                print("검색 버튼 클릭")
            except:
                search_input.send_keys(Keys.RETURN)
                print("Enter 키 입력")
            
            # 검색 결과 로딩 대기
            time.sleep(3)
            
            # 검색 결과 확인
            print("검색 결과 페이지 확인 중...")
            
            # 현재 페이지의 HTML 저장 (디버깅용)
            with open('search_results_debug.html', 'w', encoding='utf-8') as f:
                f.write(self.driver.page_source)
            print("검색 결과 HTML을 search_results_debug.html로 저장했습니다.")
            
            return self.parse_search_results()
            
        except Exception as e:
            print(f"검색 중 오류 발생: {e}")
            return []
    
    def parse_search_results(self):
        """검색 결과에서 상세 페이지 링크 추출"""
        job_links = []
        seen_companies = set()  # 중복 회사 체크용
        seen_indices = set()    # 중복 idx 체크용
        
        try:
            # 상세 채용정보보기 링크 찾기
            link_selectors = [
                "a[href*='/cms/s01_v.php?idx=']",
                "a[title='상세채용정보보기']",
                "a[href*='s01_v.php']"
            ]
            
            all_links = []
            
            # 모든 선택자에서 링크 수집
            for selector in link_selectors:
                try:
                    links = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if links:
                        print(f"채용 공고 링크 발견 (선택자: {selector}): {len(links)}개")
                        all_links.extend(links)
                except Exception as e:
                    print(f"링크 검색 중 오류 ({selector}): {e}")
                    continue
            
            # 중복 제거
            unique_links = []
            seen_hrefs = set()
            
            for link in all_links:
                href = link.get_attribute('href')
                if href and href not in seen_hrefs:
                    seen_hrefs.add(href)
                    unique_links.append(link)
            
            print(f"중복 제거 후 고유한 링크: {len(unique_links)}개")
            
            # 링크 처리
            for link in unique_links:
                if len(job_links) >= 50:  # 50개만 수집
                    break
                    
                href = link.get_attribute('href')
                if href and 'idx=' in href:
                    # idx 값 추출
                    idx_match = re.search(r'idx=(\d+)', href)
                    if idx_match:
                        idx = idx_match.group(1)
                        
                        # 이미 처리한 idx인지 확인
                        if idx in seen_indices:
                            print(f"중복 idx 건너뛰기: {idx}")
                            continue
                        
                        link_text = link.text.strip()
                        
                        # 회사명 추출 시도 (제목에서)
                        company_name = self.extract_company_from_title(link_text)
                        
                        # 중복 회사 체크
                        if company_name and company_name in seen_companies:
                            print(f"중복 회사 건너뛰기: {company_name}")
                            continue
                        
                        # 링크 추가
                        job_links.append({
                            'idx': idx,
                            'href': href,
                            'title': link_text,
                            'company': company_name
                        })
                        
                        # 중복 체크용 세트에 추가
                        seen_indices.add(idx)
                        if company_name:
                            seen_companies.add(company_name)
                        
                        print(f"링크 추가 ({len(job_links)}/10): {link_text[:50]}... (회사: {company_name})")
            
            if not job_links:
                print("채용 공고 링크를 찾을 수 없습니다.")
                return []
            
            print(f"총 {len(job_links)}개의 채용 공고 링크 발견")
            print(f"수집된 회사들: {list(seen_companies)}")
            return job_links
            
        except Exception as e:
            print(f"검색 결과 파싱 중 오류: {e}")
            return job_links
    
    def extract_company_from_title(self, title):
        """제목에서 회사명 추출"""
        try:
            # 다양한 패턴으로 회사명 추출
            patterns = [
                r'\[([^\]]+)\]',  # [회사명] 형태
                r'^([^(]+?)\s*\(',  # 회사명( 형태
                r'^([^!]+?)\s*!',  # 회사명! 형태
                r'^([^점]+?)\s*점',  # 회사명점 형태
                r'^([^에서]+?)\s*에서',  # 회사명에서 형태
                r'^([^가]+?)\s*가',  # 회사명가 형태
                r'^([^는]+?)\s*는',  # 회사명는 형태
            ]
            
            for pattern in patterns:
                match = re.search(pattern, title)
                if match:
                    company = match.group(1).strip()
                    if len(company) > 1 and len(company) < 20:  # 너무 짧거나 긴 것은 제외
                        return company
            
            # 패턴에 맞지 않으면 첫 번째 단어를 회사명으로 추정
            words = title.split()
            if words and len(words[0]) > 1:
                return words[0]
                
        except Exception as e:
            print(f"회사명 추출 중 오류: {e}")
        
        return ""

    def get_job_detail(self, job_link):
        """개별 채용 공고 상세 정보 수집"""
        try:
            print(f"상세 페이지 접속: {job_link['href']}")
            self.driver.get(job_link['href'])
            time.sleep(3)
            
            # 상세 페이지 HTML 저장 (디버깅용)
            with open(f'job_detail_{job_link["idx"]}_debug.html', 'w', encoding='utf-8') as f:
                f.write(self.driver.page_source)
            
            job_info = {
                'company_name': '',
                'title': '헤어디자이너',  # 통일
                'schedule': '',
                'location': '',
                'address': '',
                'industry': '미용실(H)',  # 통일
                'contact': ''
            }
            
            # 접수기간 및 방법 섹션 찾기
            try:
                # 접수기간 및 방법 섹션의 부모 요소 찾기
                section_element = self.driver.find_element(By.XPATH, "//span[@class='tit_sub' and contains(text(), '접수기간 및 방법')]/..")
                
                # 회사명 추출 (업체명)
                company_selectors = [
                    ".//td[contains(text(), '업체명')]/following-sibling::td",
                    ".//th[contains(text(), '업체명')]/following-sibling::td",
                    ".//li[contains(text(), '업체명')]/following-sibling::li",
                    ".//div[contains(text(), '업체명')]/following-sibling::div"
                ]
                
                for selector in company_selectors:
                    try:
                        company_elem = section_element.find_element(By.XPATH, selector)
                        company_name = company_elem.text.strip()
                        if company_name:
                            job_info['company_name'] = company_name
                            print(f"회사명: {company_name}")
                            break
                    except:
                        continue
                        
            except Exception as e:
                print(f"접수기간 및 방법 섹션 처리 중 오류: {e}")
            
            # 일정 정보 추출 (채용시까지)
            try:
                schedule_selectors = [
                    "//span[@class='d_day text']",
                    "//span[contains(@class, 'd_day')]",
                    "//span[contains(text(), '채용시까지')]",
                    "//div[contains(@class, 'd_day')]"
                ]
                
                for selector in schedule_selectors:
                    try:
                        schedule_elem = self.driver.find_element(By.XPATH, selector)
                        schedule = schedule_elem.text.strip()
                        if schedule:
                            job_info['schedule'] = schedule
                            print(f"일정: {schedule}")
                            break
                    except:
                        continue
                        
            except Exception as e:
                print(f"일정 정보 처리 중 오류: {e}")
            
            # 업체주소 섹션 찾기
            try:
                # 업체주소 섹션 찾기
                address_section = self.driver.find_element(By.XPATH, "//li[@class='left' and contains(text(), '업체주소')]")
                address_parent = address_section.find_element(By.XPATH, "./..")
                
                # 업체주소 값 추출
                address_selectors = [
                    ".//li[@class='right']",
                    ".//td[contains(text(), '업체주소')]/following-sibling::td",
                    ".//div[contains(@class, 'address')]"
                ]
                
                for selector in address_selectors:
                    try:
                        address_elem = address_parent.find_element(By.XPATH, selector)
                        address = address_elem.text.strip()
                        if address:
                            job_info['address'] = address
                            job_info['location'] = address  # 위치도 동일하게 설정
                            print(f"업체주소: {address}")
                            break
                    except:
                        continue
                        
            except Exception as e:
                print(f"업체주소 섹션 처리 중 오류: {e}")
            
            # 연락처 정보 수집
            contact_parts = []
            
            # 전화번호 섹션 찾기
            try:
                phone_section = self.driver.find_element(By.XPATH, "//li[@class='left' and contains(text(), '전화번호')]")
                phone_parent = phone_section.find_element(By.XPATH, "./..")
                
                # 전화번호 추출 (li class="right"에서)
                try:
                    phone_elem = phone_parent.find_element(By.XPATH, ".//li[@class='right']")
                    phone_text = phone_elem.text.strip()
                    # 전화번호 패턴 추출
                    phone = self.extract_phone_number(phone_text)
                    if phone:
                        contact_parts.append(phone)
                        print(f"전화번호: {phone}")
                except:
                    pass
                        
            except Exception as e:
                print(f"전화번호 섹션 처리 중 오류: {e}")
            
            # 담당자연락처 섹션 찾기
            try:
                contact_section = self.driver.find_element(By.XPATH, "//li[@class='left' and contains(text(), '담당자연락처')]")
                contact_parent = contact_section.find_element(By.XPATH, "./..")
                
                # 담당자연락처 추출 (span 태그에서)
                try:
                    contact_elem = contact_parent.find_element(By.XPATH, ".//span")
                    contact_text = contact_elem.text.strip()
                    # 전화번호 패턴 추출
                    contact = self.extract_phone_number(contact_text)
                    if contact:
                        contact_parts.append(contact)
                        print(f"담당자연락처: {contact}")
                except:
                    pass
                        
            except Exception as e:
                print(f"담당자연락처 섹션 처리 중 오류: {e}")
            
            # 연락처 정보 결합
            if contact_parts:
                job_info['contact'] = ' / '.join(contact_parts)
            
            print(f"채용 정보 수집 완료: {job_info['company_name']}")
            return job_info
            
        except Exception as e:
            print(f"상세 정보 수집 중 오류: {e}")
            return None
    
    def extract_phone_number(self, text):
        """텍스트에서 전화번호 형식만 추출"""
        try:
            # 전화번호 패턴들
            phone_patterns = [
                r'(\d{3}-\d{3,4}-\d{4})',  # 010-1234-5678
                r'(\d{3}-\d{4}-\d{4})',    # 010-1234-5678
                r'(\d{2,3}-\d{3,4}-\d{4})', # 02-1234-5678, 031-123-4567
                r'(\d{4}-\d{4}-\d{4})',    # 0508-1234-5678
                r'(\d{10,11})',             # 01012345678
                r'(\d{2,3}-\d{3,4}-\d{3,4})', # 02-123-4567
            ]
            
            for pattern in phone_patterns:
                matches = re.findall(pattern, text)
                for match in matches:
                    # 안심번호나 특수한 패턴 제외
                    if not any(exclude in text.lower() for exclude in ['안심번호', '※', '이용 중']):
                        return match
            
            return ""
            
        except Exception as e:
            print(f"전화번호 추출 중 오류: {e}")
            return ""
    
    def collect_all_job_details(self, job_links):
        """모든 채용 공고의 상세 정보 수집"""
        jobs_data = []
        
        for i, job_link in enumerate(job_links):
            print(f"\n[{i+1}/{len(job_links)}] 채용 정보 수집 중...")
            job_detail = self.get_job_detail(job_link)
            
            if job_detail:
                jobs_data.append(job_detail)
                print(f"채용 정보 {len(jobs_data)}개 수집 완료")
            
            # 요청 간격 조절
            time.sleep(2)
        
        return jobs_data
    
    def save_to_csv(self, jobs_data):
        """CSV 파일로 저장 (한글 헤더)"""
        if not jobs_data:
            print("저장할 데이터가 없습니다.")
            return
        
        # 현재 시간으로 파일명 생성
        now = datetime.now()
        filename = f"HAIRINJOB_{now.strftime('%m%d')}({now.strftime('%H%M')})_50jobs.csv"
        
        # 한글 헤더
        fieldnames = ['회사명', '직무', '일정', '주소', '업종', '연락처']
        
        # CSV 파일 작성
        with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for job in jobs_data:
                # 영문 필드명을 한글 헤더에 매핑
                row = {
                    '회사명': job.get('company_name', ''),
                    '직무': job.get('title', ''),
                    '일정': job.get('schedule', ''),
                    '주소': job.get('address', ''),
                    '업종': job.get('industry', ''),
                    '연락처': job.get('contact', '')
                }
                writer.writerow(row)
        
        print(f"CSV 파일 저장 완료: {filename}")
        return filename
    
    def close(self):
        """브라우저 종료"""
        if self.driver:
            self.driver.quit()

def main():
    """메인 실행 함수"""
    scraper = HairinjobSeleniumScraper()
    
    try:
        # 로그인
        username = "01096325841"
        password = "379302"
        
        print("헤어인잡 로그인 시도...")
        if scraper.login(username, password):
            print("로그인 성공! 채용 정보 검색을 시작합니다.")
            
            # 검색 키워드
            search_keyword = "오픈예정"
            
            # 채용 정보 검색
            job_links = scraper.search_jobs(search_keyword)
            
            if job_links:
                # 각 채용 공고의 상세 정보 수집
                jobs_data = scraper.collect_all_job_details(job_links)
                
                if jobs_data:
                    # CSV 파일로 저장
                    filename = scraper.save_to_csv(jobs_data)
                    print(f"총 {len(jobs_data)}개의 채용 정보가 {filename} 파일로 저장되었습니다.")
                else:
                    print("수집된 채용 정보가 없습니다.")
            else:
                print("검색된 채용 공고가 없습니다.")
        else:
            print("로그인 실패. 프로그램을 종료합니다.")
    
    finally:
        # 브라우저 종료
        scraper.close()

if __name__ == "__main__":
    main() 
