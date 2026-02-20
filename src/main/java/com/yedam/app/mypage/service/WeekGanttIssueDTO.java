package com.yedam.app.mypage.service;

import java.util.Date;

import lombok.Data;

@Data
public class WeekGanttIssueDTO {
	private Integer issueCode;
	private Integer projectCode;
	private String projectName;
	private String title;

	private Date startAt; // NVL(started_at, created_at)
	private Date endAt;   // NVL(resolved_at, due_at)
	
	// 체크박스 필터링용
    private String assignedYn;    // 'Y' / null
    private String registeredYn;  // 'Y' / null
}
