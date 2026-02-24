package com.yedam.app.issuetype.service;

import java.util.List;

public interface IssueTypeService {

	// 유형 타입 조회
	public List<IssueTypeVO> findIssueType();

	// 유형 타입 수정/삭제 유효성 체크
	public int countIssuesByTypeCode(int typeCode);
	
	// 유형 타입 등록
	public int insertIssueType(IssueTypeVO issueTypeVO);

	// 유형 타입 수정
	public int updateIssueType(IssueTypeVO issueTypeVO);

	// 유형 타입 삭제
	public int deleteIssueType(Integer typeCode);
	
	// 유형 타입 > 일감 목록 
	public List<IssueTypeListVO> findIssueListType(Integer typeCode);

}
