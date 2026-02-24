package com.yedam.app.issuemodal.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.yedam.app.issuemodal.service.IssueModalService;
import com.yedam.app.issuemodal.service.IssueModalVO;
import com.yedam.app.login.service.UserVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class IssueModalController {

    private final IssueModalService issueModalService;

    @GetMapping("/api/issues/parents")
    public List<IssueModalVO> issueModalList(@RequestParam("projectCode") Long projectCode,
                                            @RequestParam("typeCode") Long typeCode) {
      return issueModalService.findIssueModalList(projectCode, typeCode);
    }
    
    private Long getLoginUserCode(HttpSession session) {
    	  UserVO user = (UserVO) session.getAttribute("user");
    	  if (user == null || user.getUserCode() == null) {
    	    throw new IllegalStateException("로그인 정보가 없습니다.");
    	  }
    	  return user.getUserCode().longValue();
    	}

    	@GetMapping("/api/issues/modal/worklog/create")
    	public List<IssueModalVO> issuesForWorklogCreate(
    	    @RequestParam("projectCode") Long projectCode,
    	    @RequestParam("adminCk") String adminCk,
    	    HttpSession session
    	) {
    	  Long loginUserCode = getLoginUserCode(session);
    	  return issueModalService.findIssuesForWorklogCreate(projectCode, loginUserCode, adminCk);
    	}
}