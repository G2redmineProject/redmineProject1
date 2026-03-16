# G2gether 프로젝트 협업 프로그램

<p align="center">
<img width="1889" height="948" alt="메인" src="https://github.com/user-attachments/assets/8a8b91ff-a352-4c88-bd2f-d9bdd0d71459"/>
</p>

---

## 📑 바로가기

<p align="center">
  <a href="#프로젝트-개요"><kbd>📘 프로젝트 개요</kbd></a>
  &nbsp;&nbsp;
  <a href="#개발-환경"><kbd>⚙️ 개발 환경</kbd></a>
  &nbsp;&nbsp;
  <a href="#데이터-베이스"><kbd>🗄️ 데이터 베이스</kbd></a>
  &nbsp;&nbsp;
  <a href="#메뉴-구성도"><kbd>📑 메뉴 구성도</kbd></a>
  &nbsp;&nbsp;
  <a href="#Project-Structure"><kbd>📁 Project Structure</kbd></a>
  &nbsp;&nbsp;
  <a href="#프로젝트-소감"><kbd>📝 프로젝트 소감</kbd></a>
</p>

<p align="center">
  <a href="#계정관리-파트"><kbd>🧩 계정 관리</kbd></a>
  &nbsp;&nbsp;
  <a href="#업무관리-파트"><kbd>🧩 업무 관리</kbd></a>
  &nbsp;&nbsp;
  <a href="#일정관리-파트"><kbd>🧩 일정 관리</kbd></a>
  &nbsp;&nbsp;
  <a href="#협업관리-파트"><kbd>🧩 협업 관리</kbd></a>
  &nbsp;&nbsp;
  <a href="#시스템관리-파트"><kbd>🧩 시스템 관리</kbd></a>
</p>

---

# 프로젝트 개요

현재 팀 프로젝트 운영 환경에서는 일감 생성, 일정 관리, 상태 추적 등 다양한 작업이 서로 다른 도구에 분산되어 있어 업무 흐름이 단절되는 문제가 빈번하게 발생합니다. 기존 협업 도구들은 기능 자체는 풍부하지만, 정보 밀도가 지나치게 높고 화면 이동이 많아 실제 업무 현장에서 기능 탐색이 어렵다는 한계가 있습니다. 특히 필터·검색·정렬 흐름이 실무자의 실제 작업 방식과 맞지 않아 동일한 작업을 반복 수행해야 하는 비효율이 발생하고 있습니다.

이에 본 프로젝트는 **프로젝트 관리·일정 조율·팀원 간 협업 기능**을 하나의 시스템에서 **통합적으로 처리할 수 있는 웹 기반 협업 플랫폼**을 구현하는 것을 목표로 했습니다. 기존 도구의 핵심 기능은 유지하면서 사용 흐름을 단순화하고, 로그인 사용자의 권한에 따라 접근 가능한 메뉴와 기능을 구분하는 구조를 설계하여 팀원 누구나 쉽게 사용할 수 있는 협업 환경을 구축하고자 했습니다.

### 개발 일정
- **2026.01.29 ~ 2026.03.12**

---

# 활용 방안

* **업무 운영 지원**  
조건 필터 기능을 활용하여 필요한 업무를 신속하게 조회하고 회의 및 데일리 스크럼 등 업무 운영 과정에서 활용할 수 있습니다.

* **진행 현황 관리**  
보드 화면을 통해 업무의 진행 상태를 한눈에 확인할 수 있으며 업무 흐름을 직관적으로 관리할 수 있습니다.

* **대량 업무 처리**  
목록 화면을 활용하여 다수의 일감을 효율적으로 조회하고 정리할 수 있습니다.

* **프로젝트 단위 관리**  
권한 기반 접근 구조를 통해 프로젝트별 독립적인 관리가 가능하며 사용자 권한에 따라 접근 범위를 구분할 수 있습니다.

---

# 기대 효과

* **업무 파악 시간 단축**  
필요한 업무 정보를 빠르게 조회할 수 있어 업무 파악 시간을 줄일 수 있습니다.

* **반복 작업 감소**  
화면 이동을 최소화하여 불필요한 반복 작업을 줄이고 작업 효율을 높일 수 있습니다.

* **오류 및 혼선 감소**  
권한 및 상태 구분을 통해 업무 책임과 진행 상태를 명확하게 관리할 수 있습니다.

* **팀 협업 효율 증대**  
업무 공유와 진행 상황을 투명하게 관리하여 협업 효율을 높일 수 있습니다.

---

# 팀 구성 및 역할

<table border="1" cellpadding="12" cellspacing="0" align="center">
<tr>
<th align="center">정재은</th>
<th align="center">도우서</th>
<th align="center">성찬혁</th>
<th align="center">권수민</th>
</tr>

<tr>
<td align="center">
<img width="120" src="https://github.com/user-attachments/assets/8d5708ba-b9f8-41e6-bd47-7c5e777a0088"/>
</td>

<td align="center">
<img width="120" src="https://github.com/user-attachments/assets/fd2ed4de-b16c-4339-a6f7-bc8f4d846d29"/>
</td>

<td align="center">
<img width="120" src="https://github.com/user-attachments/assets/4c713a36-ac69-4107-bf2e-e7de21af0f90"/>
</td>

<td align="center">
<img width="120" src="https://github.com/user-attachments/assets/8d5708ba-b9f8-41e6-bd47-7c5e777a0088"/>
</td>
</tr>

<tr>
<td align="center">팀장<br>배포</td>
<td align="center">부팀장<br>Git 관리</td>
<td align="center">DB 관리</td>
<td align="center">개발환경 구축</td>
</tr>
</table>

---

# 개발 환경
[FRONTEND] HTML5, CSS, JavaScript, jQuery, Bootstrap 5, Thymeleaf  
[BACKEND] Java, Spring Framework, MyBatis  
[DATABASE] Oracle Database  
[SERVER] AWS EC2  
[DEVOPS] Maven, Jenkins, Docker  
[TOOL] Eclipse 2025-06, Oracle Developer  
[OS] Windows 10 Pro, Ubuntu 11

---

# 데이터 베이스

<p align="center">
<img width="808" src="https://github.com/user-attachments/assets/b86cd035-8393-4156-b865-1524f135b7b1"/>
</p>

---

# 메뉴 구성도

<p align="center">
<img width="910" src="https://github.com/user-attachments/assets/e934bf07-03ff-4e93-a3a5-8565d37ad21e"/>
</p>

---

# 계정관리 파트

계정 생성, 로그인, 권한 관리 등 사용자 인증 및 권한 제어 기능을 담당합니다.

---

# 업무관리 파트

프로젝트 내 업무 생성, 상태 변경, 필터링 및 보드 기반 업무 관리 기능을 제공합니다.

---

# 일정관리 파트

캘린더 기반 일정 관리 및 프로젝트 일정 공유 기능을 제공합니다.

---

# 협업관리 파트

팀원 간 협업을 위한 게시판, 메일함, 파일 공유 기능을 제공합니다.

---

# 시스템관리 파트
관리자 권한 기반으로 프로젝트 및 시스템 설정을 관리하는 기능을 제공합니다.
<br>
🔗 [GitHub 개인 Repository 바로가기](https://github.com/Peinoi/redmineProject1)
---

## 프로젝트 관리

<table>
<tr>
<td><img src="https://github.com/user-attachments/assets/487f0cd3-5d02-4680-9b2c-5016ee01eec7" width="100%"></td>
<td><img src="https://github.com/user-attachments/assets/df6a623d-a4d2-447c-aba4-59d9384c25f9" width="100%"></td>
</tr>
</table>

- 프로젝트 목록을 확인하고 관리할 수 있습니다.  
- 신규 프로젝트 등록을 통해 프로젝트명, 진척률, 상태 등 기본 정보를 설정할 수 있습니다.  
- 프로젝트별 협업 환경 구성을 위한 초기 설정을 진행할 수 있습니다.  

---

## 사용자 관리

<table>
<tr>
<td><img src="https://github.com/user-attachments/assets/41f73de4-c31a-4781-b02c-3570688fb42c" width="100%"></td>
<td><img src="https://github.com/user-attachments/assets/24e0cd73-92b3-405b-961b-89fff3210065" width="100%"></td>
</tr>
</table>

- 시스템에 등록된 사용자 정보를 조회하고 관리할 수 있습니다.  
- 사용자 등록을 통해 신규 사용자를 시스템에 추가할 수 있습니다.  
- 계정 상태 관리 및 기본 사용자 정보를 설정할 수 있습니다.  

---

## 역할 관리

<table>
<tr>
<td><img src="https://github.com/user-attachments/assets/2a335793-4f10-4df0-a97f-7063fcfaf8e2" width="100%"></td>
<td><img src="https://github.com/user-attachments/assets/49543620-081e-4645-b7a1-f639bced618a" width="100%"></td>
</tr>
</table>

- 역할 목록을 조회하고 역할별 권한을 관리할 수 있습니다.  
- 역할 등록을 통해 시스템 내 권한 체계를 정의할 수 있습니다.  
- 역할 기반 접근 제어(RBAC)를 통해 기능 접근 권한을 관리합니다.  

---

## 그룹 관리

<table>
<tr>
<td><img src="https://github.com/user-attachments/assets/27f09c95-0342-4510-a0a0-5decc95416b1" width="100%"></td>
<td><img src="https://github.com/user-attachments/assets/56282bdf-59fe-43fb-b924-6171764a7c95" width="100%"></td>
</tr>
</table>

- 사용자 그룹을 생성하고 관리할 수 있습니다.  
- 그룹 등록을 통해 조직 단위의 사용자 관리가 가능합니다.  
- 그룹별 사용자 분류를 통해 권한 및 프로젝트 접근을 효율적으로 관리합니다.  

---

## 일감 유형 관리

<table>
<tr>
<td><img src="https://github.com/user-attachments/assets/c3f38673-75ce-455e-9452-3d5f94b314b7" width="100%"></td>
<td><img src="https://github.com/user-attachments/assets/efe28ba5-6140-4684-b76c-fb2050fd69a6" width="100%"></td>
</tr>
</table>

- 프로젝트에서 사용할 일감 유형을 관리할 수 있습니다.  
- 신규 일감 유형을 등록하여 작업 분류 체계를 설정할 수 있습니다.  
- 계층 구조를 통해 상위/하위 일감 유형을 구성할 수 있습니다.  
---

# 프로젝트 소감

프로젝트를 진행하며 업무 프로세스를 이해하고 이를 기반으로 초기 기획 기능을 목적에 맞게 구현하는 데 집중했습니다. 특히 사용자 역할과 프로젝트 권한 구조를 설계하고 구현하는 과정에서 시스템 구조와 접근 제어의 중요성을 깊이 이해할 수 있었습니다.

개발 과정에서는 팀원들과 협업하며 소통과 역할 분담의 중요성을 경험했고 다양한 기능을 함께 구현하면서 MVC 구조에 대한 이해와 권한 설계, 문제 해결 역량을 향상시킬 수 있었습니다.

또한 사용자 편의성을 높이기 위해 화면 구성을 더욱 직관적으로 개선할 필요가 있으며 데이터 조회 성능 향상을 위한 쿼리 및 응답 구조 최적화가 향후 보완해야 할 부분이라고 생각합니다.

---

# Project Structure

### Client / Server Architecture

<div align="center">
<table>
<tr>
<td align="center">

**Client**

<img src="https://github.com/user-attachments/assets/f992ab2c-4ee9-41fb-8e81-9cf986f08260" width="420"/>

</td>

<td align="center">

**Server**

<img src="https://github.com/user-attachments/assets/cdf58929-7cb8-4598-a087-d4abf488c450" width="420"/>

</td>

</tr>
</table>
</div>
