package com.yedam.app.main.service;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class ProIssStaVO {
	private Integer projectCode;
	private String projectName;
	
	// 전체
	private Integer NewIss;
	private Integer Progress;
	private Integer Solution;
	private Integer ReturnIss;
	private Integer Completion;

	// 내 이슈
	private Integer myNewIss;
	private Integer myProgress;
	private Integer mySolution;
	private Integer myReturnIss;
	private Integer myCompletion;
}
