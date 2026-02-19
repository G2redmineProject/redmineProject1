package com.yedam.app.mypage.service;

import java.util.Date;

import lombok.Data;

@Data
public class WeekIssueDTO {
	private String day; // yyyy-mm-dd
	private Integer issueCode;
	private Integer projectCode;
	private String projectName;
	private String title;
	private Date dueAt;
}
