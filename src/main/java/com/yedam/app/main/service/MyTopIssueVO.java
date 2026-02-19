package com.yedam.app.main.service;

import java.util.Date;

import lombok.Data;

@Data
public class MyTopIssueVO {
	private Integer issueCode;
	private String title;
	private String priorityName;
	private String statusName;
	private Date dueAt;
	private Date updatedAt;
	private Integer progress;
}
