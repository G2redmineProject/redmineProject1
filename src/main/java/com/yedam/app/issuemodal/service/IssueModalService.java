package com.yedam.app.issuemodal.service;

import java.util.List;

public interface IssueModalService {
	List<IssueModalVO> findIssueModalList(Long projectCode, Long typeCode);
	}
