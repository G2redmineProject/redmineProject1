package com.yedam.app.main.service;

import lombok.Data;

@Data
public class AssigneeIssStaVO {
	private Integer userCode;
	private String userName;
	private Integer newIss;
	private Integer progress;
	private Integer solution;
	private Integer returnIss;
	private Integer completion;
}
