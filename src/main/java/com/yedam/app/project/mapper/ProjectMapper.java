package com.yedam.app.project.mapper;

import java.util.List;

import com.yedam.app.project.service.GroupVO;
import com.yedam.app.project.service.ProjectPrVO;
import com.yedam.app.project.service.ProjectVO;
import com.yedam.app.project.service.PruserVO;
import com.yedam.app.project.service.RoleVO;

public interface ProjectMapper {
	public List<ProjectVO> selectAll();

	public List<PruserVO> userAll();

	public List<RoleVO> roleAll();

	public List<GroupVO> groupAll();
	
	public List<ProjectPrVO> projPrAll();
}
