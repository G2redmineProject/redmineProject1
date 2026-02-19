package com.yedam.app.overview.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.yedam.app.main.service.ProIssStaVO;
import com.yedam.app.overview.mapper.OverviewMapper;
import com.yedam.app.overview.service.OverviewService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OverviewServiceImpl implements OverviewService {

	private final OverviewMapper overviewMapper;
	
	@Override
	public List<ProIssStaVO> getProjectIssueStatus(Integer projectCode) {
		return overviewMapper.selectProjectIssueStatus(projectCode);
	}

}
