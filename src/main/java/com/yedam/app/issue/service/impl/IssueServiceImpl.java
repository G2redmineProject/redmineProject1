package com.yedam.app.issue.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.yedam.app.issue.mapper.IssueMapper;
import com.yedam.app.issue.service.IssueService;
import com.yedam.app.issue.service.IssueVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IssueServiceImpl implements IssueService {
	
	private final IssueMapper issueMapper;
	
	@Override
	public List<IssueVO> findAll() {
		return issueMapper.selectAll();
	}

	@Override
	public long addIssue(IssueVO issue) {
		int result = issueMapper.insertIssue(issue);
		return result == 1 ? issue.getIssueCode() : null;
	}
	
	@Override
	@Transactional
	public int removeIssues(List<Long> issueCodes) {
	    return issueMapper.deleteIssues(issueCodes);
	}

}
