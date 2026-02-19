package com.yedam.app.projectmodal.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.projectmodal.service.ProjectModalVO;

public interface ProjectModalMapper {
	// OD1 + admin이면 OD3
	List<ProjectModalVO> selectProjectModalListForListPage(@Param("userCode") Integer userCode); 
	// OD1
	List<ProjectModalVO> selectProjectModalListForCreate(@Param("userCode") Integer userCode);
	// 공지 등록용
	List<ProjectModalVO> selectProjectModalListForNotice(@Param("userCode") Integer userCode); 
}
