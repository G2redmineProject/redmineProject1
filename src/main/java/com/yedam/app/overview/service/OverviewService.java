package com.yedam.app.overview.service;

import java.util.List;

import com.yedam.app.main.service.ProIssStaVO;

public interface OverviewService {
	// 프로젝트 일감 현황 단건 조회
	public List<ProIssStaVO> getProjectIssueStatus(Integer projectCode);
}
