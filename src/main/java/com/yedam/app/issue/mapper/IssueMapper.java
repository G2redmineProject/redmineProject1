package com.yedam.app.issue.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.issue.service.IssueVO;

public interface IssueMapper {
	// 전체조회
	public List<IssueVO> selectAll();
	// 등록
	public int insertIssue(IssueVO issue);
    // 일괄 삭제
    public int deleteIssues(@Param("issueCodes") List<Long> issueCodes);
}
