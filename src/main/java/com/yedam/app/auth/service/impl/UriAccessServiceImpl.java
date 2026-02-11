package com.yedam.app.auth.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.yedam.app.auth.mapper.UriAccessMapper;
import com.yedam.app.auth.service.UriAccessInfoVO;
import com.yedam.app.auth.service.UriAccessService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UriAccessServiceImpl implements UriAccessService {

	private final UriAccessMapper uriAccessMapper;
    
    @Override
    public List<UriAccessInfoVO> getAllUriAccessInfo() {
        return uriAccessMapper.selectAllUriAccessInfo();
    }
    
    @Override
    public UriAccessInfoVO getUriAccessInfo(String uri) {
        return uriAccessMapper.selectUriAccessInfo(uri);
    }

}
