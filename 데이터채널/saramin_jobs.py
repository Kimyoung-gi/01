from flask import Flask, render_template, request, jsonify
import requests
from bs4 import BeautifulSoup
import re
import time
from datetime import datetime
import csv
import os

class SaraminScraper:
    def __init__(self):
        self.base_url = "https://www.saramin.co.kr"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        }
    
    def parse_job_listing(self, job_html):
        """채용 공고 정보 파싱"""
        soup = BeautifulSoup(job_html, 'html.parser')
        
        company_name = ""
        title = ""
        schedule = ""
        location = ""
        address = ""
        industry = ""  # 업종 추가
        
        try:
            # 제목 (h2.job_tit 또는 a.job_tit)
            title_elem = soup.find('h2', class_='job_tit') or soup.find('a', class_='job_tit')
            if title_elem:
                title = title_elem.get_text(strip=True)
            
            # 회사명은 기업정보 페이지에서 가져올 예정이므로 여기서는 임시로 빈 값 설정
            company_name = ""
            
            # 위치 정보 (기업위치)
            location_elem = soup.find('div', class_='job_condition') or soup.find('span', class_='loc')
            if not location_elem:
                location_elem = soup.find('div', class_='location') or soup.find('span', class_='location')
            if not location_elem:
                location_elem = soup.find('div', class_='area') or soup.find('span', class_='area')
            
            if location_elem:
                location = location_elem.get_text(strip=True)
            

            
            # 공고일정 (마감일)
            schedule_elem = soup.find('span', class_='date') or soup.find('div', class_='date')
            if schedule_elem:
                schedule = schedule_elem.get_text(strip=True)
            
            # 기업정보 링크 찾기 (기업주소와 업종을 가져오기 위해)
            company_link = None
            
            # 방법 1: corp_name 클래스의 링크
            company_link = soup.find('a', class_='corp_name')
            
            # 방법 2: 기업정보 텍스트가 포함된 링크
            if not company_link:
                company_link = soup.find('a', string=re.compile(r'기업정보|회사정보', re.IGNORECASE))
            
            # 방법 3: href에 company가 포함된 링크
            if not company_link:
                company_link = soup.find('a', href=re.compile(r'company|corp', re.IGNORECASE))
            
            # 방법 4: 모든 링크 중에서 기업정보 관련 링크 찾기
            if not company_link:
                all_links = soup.find_all('a', href=True)
                for link in all_links:
                    href = link.get('href', '')
                    if 'company' in href or 'corp' in href or '기업정보' in link.get_text():
                        company_link = link
                        break
            
            # 기업정보 페이지에서 주소와 업종 가져오기
            if company_link:
                try:
                    company_url = company_link.get('href')
                    if company_url.startswith('/'):
                        company_url = self.base_url + company_url
                    
                    print(f"기업정보 링크 찾음: {company_name} - {company_url}")
                    
                    # 기업정보 페이지 접속
                    company_response = requests.get(company_url, headers=self.headers, timeout=5)
                    if company_response.status_code == 200:
                        company_soup = BeautifulSoup(company_response.text, 'html.parser')
                        
                        # 회사명 찾기 (기업정보 페이지에서)
                        company_name_elem = company_soup.find('h1', class_='company_name') or company_soup.find('div', class_='company_name')
                        if not company_name_elem:
                            company_name_elem = company_soup.find('h1', class_='corp_name') or company_soup.find('div', class_='corp_name')
                        if not company_name_elem:
                            company_name_elem = company_soup.find('h1', class_='title') or company_soup.find('div', class_='title')
                        if not company_name_elem:
                            company_name_elem = company_soup.find('h1') or company_soup.find('div', class_='company')
                        
                        if company_name_elem:
                            company_name = company_name_elem.get_text(strip=True)
                            # "기업정보" 텍스트 제거
                            company_name = company_name.replace('기업정보', '').strip()
                            print(f"회사명 찾음: {company_name}")
                        
                        # 업종 찾기 (여러 방법 시도)
                        industry_elem = company_soup.find('div', class_='industry') or company_soup.find('span', class_='industry')
                        if not industry_elem:
                            industry_elem = company_soup.find('div', class_='business') or company_soup.find('span', class_='business')
                        if not industry_elem:
                            industry_elem = company_soup.find('div', class_='sector') or company_soup.find('span', class_='sector')
                        if not industry_elem:
                            industry_elem = company_soup.find('div', class_='category') or company_soup.find('span', class_='category')
                        
                        if industry_elem:
                            industry = industry_elem.get_text(strip=True)
                            print(f"업종 찾음: {industry}")
                        else:
                            # 업종 패턴으로 찾기
                            industry_patterns = [
                                r'업종[:\s]*([가-힣\s,]+)',
                                r'사업분야[:\s]*([가-힣\s,]+)',
                                r'산업분야[:\s]*([가-힣\s,]+)',
                                r'사업영역[:\s]*([가-힣\s,]+)',
                                r'주요사업[:\s]*([가-힣\s,]+)',
                                r'([가-힣\s,]+업|제조업|서비스업|IT|소프트웨어|하드웨어|인터넷|모바일|게임|금융|보험|부동산|건설|제조|유통|무역|식품|의료|제약|화학|자동차|전자|반도체|통신|미디어|교육|문화|스포츠|레저|여행|호텔|식당|카페|뷰티|패션|화장품|가전|가구|도서|문구|스포츠용품|자동차용품|주유소|주차장|세차장|주차|세차|세탁|청소|보안|경비|운송|택배|물류|창고|농업|어업|광업|전력|가스|수도|폐기물|재활용|환경|에너지|신재생|태양광|풍력|수력|지열|바이오|바이오매스|수소|전기차|하이브리드|플러그인|충전소|배터리|전기|전자|반도체|디스플레이|OLED|LCD|LED|조명|전구|램프|전선|케이블|전자부품|반도체|IC|칩|웨이퍼|마스크|포토레지스트|식각|증착|이온주입|확산|열처리|도금|도장|도자기|유리|플라스틱|고무|섬유|종이|목재|가죽|펠트|부직포|타일|시멘트|콘크리트|벽돌|블록|석재|대리석|화강암|편암|점판암|사암|이암|석회암|백운암|대리석|화강암|편암|점판암|사암|이암|석회암|백운암)',
                            ]
                            
                            for pattern in industry_patterns:
                                industry_match = re.search(pattern, company_response.text)
                                if industry_match:
                                    industry = industry_match.group(1)
                                    print(f"업종 찾음: {industry}")
                                    break
                        
                        # 주소 찾기 (여러 방법 시도)
                        address_elem = company_soup.find('div', class_='address') or company_soup.find('span', class_='address')
                        if not address_elem:
                            address_elem = company_soup.find('div', class_='location') or company_soup.find('span', class_='location')
                        if not address_elem:
                            address_elem = company_soup.find('div', class_='addr') or company_soup.find('span', class_='addr')
                        
                        if address_elem:
                            address = address_elem.get_text(strip=True)
                            print(f"주소 찾음: {address}")
                        else:
                            # 주소 패턴으로 찾기
                            address_patterns = [
                                r'([가-힣]+ [가-힣]+ [가-힣]+로?\s*\d+[,\s]*\d*층?)',
                                r'([가-힣]+ [가-힣]+ [가-힣]+길?\s*\d+[,\s]*\d*층?)',
                                r'([가-힣]+ [가-힣]+ [가-힣]+동\s*\d+[,\s]*\d*층?)'
                            ]
                            
                            for pattern in address_patterns:
                                address_match = re.search(pattern, company_response.text)
                                if address_match:
                                    address = address_match.group(1)
                                    print(f"주소 찾음: {address}")
                                    break
                    
                    time.sleep(0.5)  # 요청 간격 조절
                    
                except Exception as e:
                    print(f"기업정보 페이지 접속 실패: {e}")
            
            # 기업정보 페이지 접속이 실패한 경우 위치 정보에서 주소 추출
            if not address or address == "":
                if location:
                    # 위치 정보에서 주소 패턴 찾기
                    address_patterns = [
                        r'([가-힣]+ [가-힣]+ [가-힣]+로?\s*\d+[,\s]*\d*층?)',
                        r'([가-힣]+ [가-힣]+ [가-힣]+길?\s*\d+[,\s]*\d*층?)',
                        r'([가-힣]+ [가-힣]+ [가-힣]+동\s*\d+[,\s]*\d*층?)',
                        r'([가-힣]+ [가-힣]+ [가-힣]+구\s*[가-힣]+)',
                        r'([가-힣]+ [가-힣]+ [가-힣]+시\s*[가-힣]+)'
                    ]
                    
                    for pattern in address_patterns:
                        address_match = re.search(pattern, location)
                        if address_match:
                            address = address_match.group(1)
                            print(f"위치에서 주소 추출: {address}")
                            break
                    
                    if not address or address == "":
                        address = location  # 위치 정보를 주소로 사용
                        print(f"위치 정보를 주소로 사용: {address}")
                else:
                    address = "주소 정보 없음"
            
            # 회사명이 없으면 채용공고 제목에서 추출 시도
            if not company_name or company_name == "":
                # 제목에서 회사명 패턴 찾기 (예: [회사명] 제목)
                company_pattern = r'\[([^\]]+)\]'
                company_match = re.search(company_pattern, title)
                if company_match:
                    company_name = company_match.group(1)
                    print(f"제목에서 회사명 추출: {company_name}")
            
        except Exception as e:
            print(f"파싱 오류: {e}")
        
        return {
            'company': company_name,
            'title': title,
            'schedule': schedule,
            'location': location,
            'address': address,
            'industry': industry  # 업종 추가
        }
    
    def search_jobs(self, max_count=70):  # 70개로 변경
        """사람인에서 채용 정보 검색 (70개)"""
        try:
            # 검색 키워드와 각각의 목표 개수 설정
            search_keywords = ["오픈예정", "개원예정"]
            keyword_targets = {"오픈예정": 50, "개원예정": 20}  # 각 키워드별 목표 개수
            
            print(f"'{', '.join(search_keywords)}' 키워드로 채용 정보 검색 중... (총 {max_count}개)")
            
            jobs_data = []
            
            # 각 키워드별로 검색
            for keyword in search_keywords:
                target_count = keyword_targets[keyword]  # 각 키워드별 목표 개수
                current_keyword_count = 0  # 현재 키워드로 수집한 개수
                
                print(f"키워드 '{keyword}' 검색 중... (목표: {target_count}개)")
                page = 1
                
                while current_keyword_count < target_count:
                    # 검색 URL 구성 - 사람인 검색 URL 구조 수정
                    # 방법 1: 기본 검색 URL
                    search_url = f"{self.base_url}/zf_user/search/recruit"
                    params = {
                        'searchword': keyword,
                        'recruitPage': page,
                        'recruitSort': 'accuracy',  # 관련도순
                        'recruitType': 'all',  # 전체 채용
                        'recruitPageCount': 40  # 페이지당 40개
                    }
                    
                    print(f"검색 URL: {search_url}?searchword={keyword}&recruitPage={page}")
                    response = requests.get(search_url, params=params, headers=self.headers)
                    
                    # 응답 상태 확인 및 디버깅
                    print(f"응답 상태 코드: {response.status_code}")
                    if response.status_code != 200:
                        # 방법 2: 다른 검색 URL 시도
                        search_url = f"{self.base_url}/zf_user/search/recruit?searchword={keyword}&recruitPage={page}"
                        print(f"대체 검색 URL 시도: {search_url}")
                        response = requests.get(search_url, headers=self.headers)
                        print(f"대체 URL 응답 상태 코드: {response.status_code}")
                    
                    if response.status_code != 200:
                        print(f"응답 내용 일부: {response.text[:500]}")
                    
                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')
                        
                        # 여러 가능한 채용정보 컨테이너 클래스 시도
                        job_listings = soup.find_all('div', class_='item_recruit')
                        if not job_listings:
                            job_listings = soup.find_all('div', class_='job_item')
                        if not job_listings:
                            job_listings = soup.find_all('div', class_='recruit_item')
                        if not job_listings:
                            job_listings = soup.find_all('div', class_='job_list_item')
                        if not job_listings:
                            job_listings = soup.find_all('div', class_='recruit_list_item')
                        
                        print(f"키워드 '{keyword}' 페이지 {page}에서 {len(job_listings)}개의 채용정보 발견")
                        
                        if not job_listings:
                            print(f"키워드 '{keyword}' 페이지 {page}에서 더 이상 채용정보를 찾을 수 없습니다.")
                            break
                        
                        for job in job_listings:
                            if current_keyword_count >= target_count:
                                break
                            
                            job_info = self.parse_job_listing(str(job))
                            if job_info['title']:  # 제목이 있는 경우만 추가
                                # 중복 체크 (회사명이 동일한 경우 제외)
                                duplicate = False
                                for existing_job in jobs_data:
                                    if existing_job['company'] == job_info['company']:
                                        duplicate = True
                                        print(f"중복 회사 제외: {job_info['company']}")
                                        break
                                
                                if not duplicate:
                                    jobs_data.append(job_info)
                                    current_keyword_count += 1
                                    print(f"처리 완료 ({len(jobs_data)}/총{max_count}, {current_keyword_count}/{target_count}): {job_info['company']} - {job_info['title']}")
                        
                        page += 1
                        time.sleep(1)  # 페이지 간 요청 간격
                    else:
                        print(f"키워드 '{keyword}' 페이지 {page} 요청 실패: {response.status_code}")
                        break
            
            print(f"총 {len(jobs_data)}개의 채용정보를 수집했습니다.")
            return jobs_data
            
        except Exception as e:
            print(f"검색 중 오류 발생: {e}")
            return []

    def save_to_csv(self, jobs_data):
        """검색 결과를 CSV 파일로 저장"""
        try:
            # 현재 시간으로 파일명 생성 (SARAMIN_MMDD(HHMM) 형식)
            now = datetime.now()
            filename = f"SARAMIN_{now.strftime('%m%d')}({now.strftime('%H%M')})_70jobs.csv"  # 70jobs로 변경
            
            # CSV 파일 저장
            with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
                fieldnames = ['회사명', '직무', '일정', '주소', '업종', '연락처']  # 연락처 추가
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                writer.writeheader()
                for job in jobs_data:
                    writer.writerow({
                        '회사명': job['company'],
                        '직무': job['title'],
                        '일정': job['schedule'],
                        '주소': job['address'],
                        '업종': job['industry'],  # 업종 추가
                        '연락처': ''  # 연락처는 빈 값으로 설정
                    })
            
            print(f"CSV 파일 저장 완료: {filename}")
            return filename
            
        except Exception as e:
            print(f"CSV 파일 저장 중 오류: {e}")
            return None

if __name__ == "__main__":
    scraper = SaraminScraper()
    
    # 70개 채용정보 스크래핑 (오픈예정 50개, 개원예정 20개)
    print("=== 오픈예정 50개, 개원예정 20개 채용정보 스크래핑 시작 ===")
    jobs = scraper.search_jobs(70)  # 70개로 변경
    
    if jobs:
        # CSV 파일로 저장
        filename = scraper.save_to_csv(jobs)
        if filename:
            print(f"스크래핑 완료! CSV 파일: {filename}")
        else:
            print("CSV 파일 저장에 실패했습니다.")
    else:
        print("채용정보를 찾을 수 없습니다.") 
