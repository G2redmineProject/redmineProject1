package com.yedam.app.issue.web;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.yedam.app.issue.service.IssueService;
import com.yedam.app.issue.service.IssueVO;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class IssueController {

	private final IssueService issueService;
	
	@GetMapping("issueList")
	public String issueList(Model model) {
		List<IssueVO> findVO = issueService.findAll();
		model.addAttribute("list", findVO);
		return "issue/list";
	}
	
	 // 등록 화면
    @GetMapping("issueInsert")
    public String issueInsertForm(Model model) {
        model.addAttribute("issue", new IssueVO());
        return "issue/insert";
    }

    // 등록 처리
    @PostMapping("issueInsert")
    public String issueInsertProcess(IssueVO issue) {
        Long issueCode = issueService.addIssue(issue);

        return "redirect:/issueList";
    }
    
    // 삭제
    @PostMapping("issueDelete")
    public String issueDeleteProcess(@RequestParam("issueCodes") List<Long> issueCodes) {
        if (issueCodes != null && !issueCodes.isEmpty()) {
            issueService.removeIssues(issueCodes);
        }
        return "redirect:/issueList";
    }
}
