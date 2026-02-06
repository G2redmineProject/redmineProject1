package com.yedam.app.issuemodal.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.yedam.app.issuemodal.service.IssueModalService;
import com.yedam.app.issuemodal.service.IssueModalVO;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class IssueModalController {

    private final IssueModalService issueModalService;

    @GetMapping("/api/issues/parents")
    public List<IssueModalVO> issueModalList(@RequestParam("projectCode") Long projectCode) {
        return issueModalService.findIssueModalList(projectCode);
    }
}