package com.yedam.app.mypage.service;

import java.util.List;
import java.util.Map;

public interface MyPageService {

	// 내 페이지 블록 목록 조회 (기본 블록 보장)
	List<BlockVO> getBlocksEnsured(Integer userCode);

	// 블록 추가
	void addBlock(Integer userCode, String blockType);
	// 블록 삭제
	void deleteBlock(Integer userCode, Integer blockCode);
	// 블록 정렬 저장
	void saveOrder(Integer userCode, List<Integer> orderedBlockCodes);

	/**
     * 내 페이지 전체 데이터 조합
     *
     * 🔹 설명
     * - 화면에 필요한 모든 데이터를 한 번에 구성한다.
     * - 블록 목록 조회
     * - 블록 타입에 따라:
     *      ASSIGNED    → 할당된 일감
     *      REGISTERED  → 등록한 일감
     *      NOTICE      → 최근공지
     *      CALENDAR    → 주간 달력
     *      WORKLOG     → 작업내역
     * - 각각 필요한 데이터를 조회하여 Map 형태로 반환한다.
     *
     * 🔹 반환 구조 예시
     * {
     *   "blocks"    : 블록 목록,
     *   "blockData" : 블록별 실제 데이터,
     *   "days"      : 작업내역 조회 기간
     * }
     *
     * @param userCode 로그인 사용자 코드
     * @param userName 로그인 사용자 이름 (작업내역 표시용)
     * @param days 작업내역 조회 기간 (최근 N일)
     * @return 화면에 필요한 모든 데이터를 담은 Map
     */
	Map<String, Object> buildMyPage(Integer userCode, String userName, int days);
}
