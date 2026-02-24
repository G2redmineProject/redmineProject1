package com.yedam.app.issuemodal.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.issuemodal.service.IssueModalVO;

public interface IssueModalMapper {
	List<IssueModalVO> selectIssueModalList(@Param("projectCode") Long projectCode,
            @Param("typeCode") Long typeCode);
	
	// 프로젝트 전체 일감
	List<IssueModalVO> selectIssuesByProjectAll(@Param("projectCode") Long projectCode);

	// 프로젝트 내 담당 일감만
	List<IssueModalVO> selectIssuesByProjectMine(
	    @Param("projectCode") Long projectCode,
	    @Param("loginUserCode") Long loginUserCode
	);
}
