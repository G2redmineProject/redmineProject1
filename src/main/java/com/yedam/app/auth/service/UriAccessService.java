package com.yedam.app.auth.service;

import java.util.List;

public interface UriAccessService {
	// 전체 URI 정보 조회 (애플리케이션 시작시 캐싱용)
    public List<UriAccessInfoVO> getAllUriAccessInfo();
    
    // 특정 URI의 접근 정보 조회
    public UriAccessInfoVO getUriAccessInfo(String uri);
}
