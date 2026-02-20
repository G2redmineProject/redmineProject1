package com.yedam.app.issuemodal.service;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class IssueModalVO {
	private Long issueCode;
	private String title;
	private String name;
	private Long projectCode;
	
	private Long parIssueCode;
	
	// 트리용
	  private List<IssueModalVO> children = new ArrayList<>();
}
