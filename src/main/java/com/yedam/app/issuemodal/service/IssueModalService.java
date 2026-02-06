package com.yedam.app.issuemodal.service;

import java.util.List;

public interface IssueModalService {
	public List<IssueModalVO> findIssueModalList(Long projectCode);
}
