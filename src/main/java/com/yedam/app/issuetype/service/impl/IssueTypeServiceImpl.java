package com.yedam.app.issuetype.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.yedam.app.issuetype.mapper.IssueTypeMapper;
import com.yedam.app.issuetype.service.IssueTypeListVO;
import com.yedam.app.issuetype.service.IssueTypeService;
import com.yedam.app.issuetype.service.IssueTypeVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IssueTypeServiceImpl implements IssueTypeService {

	private final IssueTypeMapper issueTypeMapper;

	// 유형 타입 조회
	@Override
	public List<IssueTypeVO> findIssueType() {
		return issueTypeMapper.selectAllIssueType();
	}
	
	// 유형 타입 수정/삭제 유효성 체크
	@Override
    public int countIssuesByTypeCode(int typeCode) {
        return issueTypeMapper.countIssuesByTypeCode(typeCode);
    }

	// 유형 타입 등록
	@Override
	public int insertIssueType(IssueTypeVO issueTypeVO) {
		return issueTypeMapper.addIssueType(issueTypeVO);
	}

	// 유형 타입 수정
	@Override
	public int updateIssueType(IssueTypeVO issueTypeVO) {
		return issueTypeMapper.modifyIssueType(issueTypeVO);
	}

	// 유형 타입 삭제
	@Override
	public int deleteIssueType(Integer typeCode) {
		return issueTypeMapper.deleteIssueType(typeCode);
	}

	@Override
	public List<IssueTypeListVO> findIssueListType(Integer typeCode) {
		return issueTypeMapper.selectListIssueType(typeCode);
	}

}
