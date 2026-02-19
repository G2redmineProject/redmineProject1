package com.yedam.app.gantt.service.impl;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.yedam.app.gantt.mapper.GanttMapper;
import com.yedam.app.gantt.service.GanttService;
import com.yedam.app.gantt.service.GanttVO;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class GanttServiceImpl implements GanttService {

	private final GanttMapper ganttMapper;

	// 전체조회
	@Override
	public List<GanttVO> getGanttList(Integer userCode, GanttVO ganttVO) {
		List<GanttVO> list = ganttMapper.selectGanttList(userCode, ganttVO);

		Map<Integer, LocalDateTime> projectEndDateMap = new HashMap<>();

		calculateProjectEndDates(list, projectEndDateMap);

		// 1단계: ISSUE 날짜 먼저 계산
		for (GanttVO vo : list) {
			if ("ISSUE".equals(vo.getRowType())) {
				vo.setIssueStartDate(issueStartDate(vo));
				vo.setIssueEndDate(issueEndDate(vo));

			}
		}

		// 2단계: 나머지 계산 결과 적용
		applyCalculatedValues(list, projectEndDateMap);

		return list;
	}

	// 프로젝트 종료일 계산
	private void calculateProjectEndDates(List<GanttVO> list, Map<Integer, LocalDateTime> projectEndDateMap) {
		for (GanttVO vo : list) {
			// 핵심: ISSUE만
			if (!"ISSUE".equals(vo.getRowType())) {
				continue;
			}

			Integer projectCode = vo.getProjectCode();
			if (projectCode == null)
				continue;

			LocalDateTime issueEnd = issueEndDate(vo);
			if (issueEnd == null)
				continue;

			projectEndDateMap.merge(projectCode, issueEnd,
					(oldVal, newVal) -> newVal.isAfter(oldVal) ? newVal : oldVal);
		}
	}

	// 작업 기간 계산
	private Integer calculateDuration(GanttVO vo) {
		String status = vo.getIssueStatus();

		LocalDateTime start = null;
		LocalDateTime end = null;

		// 완료
		if ("완료".equals(status)) {
			start = vo.getStartedAt();
			end = vo.getResolvedAt();
		}
		// 신규
		else if (status == null || "신규".equals(status)) {
			start = vo.getCreatedAt();
			end = vo.getDueAt();
		}
		// 진행 / 해결 / 반려
		else {
			start = vo.getStartedAt();
			end = vo.getDueAt();
		}

		if (start == null || end == null)
			return 0;

		// 날짜 기준 계산 (시작일 포함)
		return (int) ChronoUnit.DAYS.between(start.toLocalDate(), end.toLocalDate()) + 1;
	}

	// 계산 결과 VO에 넣기
	private void applyCalculatedValues(List<GanttVO> list, Map<Integer, LocalDateTime> projectEndDateMap) {

		for (GanttVO vo : list) {
			Integer projectCode = vo.getProjectCode();

			// 1. 프로젝트 종료일 (PROJECT / TYPE / ISSUE 공통)
			if ("완료".equals(vo.getProjectStatus())) {
				vo.setProjectEndDate(vo.getCompletedOn());
			} else {
				vo.setProjectEndDate(projectEndDateMap.get(projectCode));
			}

			// 2️. ISSUE만 날짜 계산
			if ("ISSUE".equals(vo.getRowType())) {
				vo.setDuration(calculateDuration(vo));
			}
		}
	}

	// ===== 일감 시작일 규칙 =====
	private LocalDateTime issueStartDate(GanttVO vo) {

		String status = vo.getIssueStatus();
		LocalDateTime result = null;

		// 신규 → 마감기한 - 1
		if (status == null || "신규".equals(status)) {
			if (vo.getDueAt() != null) {
				return vo.getDueAt().minusDays(1);
			}
		}
		// 진행 / 해결 / 반려 / 완료 → startedAt
		else if (vo.getStartedAt() != null) {
			result = vo.getStartedAt();
		} else {
			result = vo.getDueAt();
		}

		// 여기 추가 (중요)
		return result == null ? null : result.toLocalDate().atStartOfDay();
	}

	// ===== 일감 종료일 규칙 =====
	private LocalDateTime issueEndDate(GanttVO vo) {
		LocalDateTime result = null;

		// 완료 → resolvedAt
		if ("완료".equals(vo.getIssueStatus()) && vo.getResolvedAt() != null) {
			result = vo.getResolvedAt();
		} else {
			result = vo.getDueAt();
		}

		// 여기 추가
		return result == null ? null : result.toLocalDate().atStartOfDay();
	}
}
