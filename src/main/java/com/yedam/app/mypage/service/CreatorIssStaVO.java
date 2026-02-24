package com.yedam.app.mypage.service;

import lombok.Data;

@Data
public class CreatorIssStaVO {
	private Integer userCode;
	private String userName;
	private Integer newIss;
	private Integer progress;
	private Integer solution;
	private Integer returnIss;
	private Integer completion;
	private Integer progressRate; // 평균 progress
}
