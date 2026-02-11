package com.yedam.app.main.service;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class ProIssStaVO {
	private Integer projectCode;
	private String projectName;
	private Integer newIss;
	private Integer progress;
	private Integer solution;
	private Integer returnIss;
	private Integer completion;
}
