package com.yedam.app.overview.mapper;

import java.util.List;

import com.yedam.app.main.service.ProIssStaVO;

public interface OverviewMapper {
	// 프로젝트 일감 현황 단건 조회
	public List<ProIssStaVO> selectProjectIssueStatus(Integer projectCode);

}
