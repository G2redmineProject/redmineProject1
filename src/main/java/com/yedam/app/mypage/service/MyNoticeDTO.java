package com.yedam.app.mypage.service;

import java.util.Date;

import lombok.Data;

@Data
public class MyNoticeDTO {
	private Integer noticeCode;
	private Integer projectCode;
	private String projectName;
	private String title;
	private Date createdAt;
}
