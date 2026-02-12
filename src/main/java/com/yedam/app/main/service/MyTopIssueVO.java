package com.yedam.app.main.service;

import java.util.Date;

import lombok.Data;

@Data
public class MyTopIssueVO {
	private Integer issueCode;
	private String title;
	private String priority;		// OA1~OA4
	private String statusCodeId;   	// OB1~OB5
	private Date dueAt;
	private Date updatedAt;
	private Integer progress;
}
