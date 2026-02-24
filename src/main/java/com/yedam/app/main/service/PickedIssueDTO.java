package com.yedam.app.main.service;

import java.util.Date;

import lombok.Data;

@Data
public class PickedIssueDTO {
	private Long issueCode;
	private String title;
	private String statusName;
	private String priorityName;
	private Date dueAt;
}