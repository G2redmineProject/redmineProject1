package com.yedam.app.issue.service;

import java.util.List;

public interface IssueService {
	// 전체조회
	public List<IssueVO> findAll();
	// 등록
	public long addIssue(IssueVO issue);
	// 일괄삭제
    public int removeIssues(List<Long> issueCodes);
}
