package com.yedam.app.issuemodal.service;

import java.util.List;

public interface IssueModalService {
	List<IssueModalVO> findIssueModalList(Long projectCode, Long typeCode);
	
	// 등록 모달 전체/내담당 분기
	List<IssueModalVO> findIssuesForWorklogCreate(Long projectCode, Long loginUserCode, String adminCk);

	}
