package com.yedam.app.auth.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.auth.service.UriAccessInfoVO;



public interface UriAccessMapper {
	// 전체 URI 정보 조회
	public List<UriAccessInfoVO> selectAllUriAccessInfo();

	// 특정 URI 조회
	public UriAccessInfoVO selectUriAccessInfo(String uri);
}