package com.yedam.app.authority.web;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.yedam.app.authority.service.AuthorityService;
import com.yedam.app.login.service.UserVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class AuthorityApiController {

  private final AuthorityService authorityService;

  @GetMapping("/api/authority/issue/canWrite")
  public Map<String, Object> canWriteIssue(@RequestParam("projectCode") Long projectCode,
                                          HttpSession session) {
    Map<String, Object> res = new HashMap<>();

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) {
      res.put("success", false);
      res.put("canWrite", false);
      res.put("message", "LOGIN_REQUIRED");
      return res;
    }

    Integer userCode = user.getUserCode();
    boolean canWrite = authorityService.canWrite(projectCode, userCode, "일감");

    res.put("success", true);
    res.put("canWrite", canWrite);
    return res;
  }
}
