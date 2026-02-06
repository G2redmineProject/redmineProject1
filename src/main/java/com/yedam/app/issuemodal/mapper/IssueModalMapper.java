package com.yedam.app.issuemodal.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.issuemodal.service.IssueModalVO;

public interface IssueModalMapper {
	public List<IssueModalVO> selectIssueModalList(@Param("projectCode") Long projectCode);
}
