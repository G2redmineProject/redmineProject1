package com.yedam.app.notice.service;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class NoticeCommentVO {
	private Long commentCode;
	  private Long noticeCode;
	  private Integer userCode;

	  private String userName;
	  private String content;

	  private LocalDateTime createdAt;
	  private LocalDateTime updatedAt;

	  private Integer isDeleted;	
	  private LocalDateTime deletedAt;
	  private Integer deletedByCode;

	  private String deletedByName;
}
