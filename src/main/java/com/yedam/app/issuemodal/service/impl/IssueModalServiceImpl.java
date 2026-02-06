package com.yedam.app.issuemodal.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.yedam.app.issuemodal.mapper.IssueModalMapper;
import com.yedam.app.issuemodal.service.IssueModalService;
import com.yedam.app.issuemodal.service.IssueModalVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IssueModalServiceImpl implements IssueModalService {

    private final IssueModalMapper issueModalMapper;

    @Override
    public List<IssueModalVO> findIssueModalList(Long projectCode) {
        return issueModalMapper.selectIssueModalList(projectCode);
    }
}
