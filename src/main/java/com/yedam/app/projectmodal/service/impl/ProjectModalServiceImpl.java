package com.yedam.app.projectmodal.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.yedam.app.projectmodal.mapper.ProjectModalMapper;
import com.yedam.app.projectmodal.service.ProjectModalService;
import com.yedam.app.projectmodal.service.ProjectModalVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProjectModalServiceImpl implements ProjectModalService {

	private final ProjectModalMapper projectModalMapper;
	
	@Override
	public List<ProjectModalVO> findProjectModalList() {
		return projectModalMapper.selectProjectModalList();
	}

}
