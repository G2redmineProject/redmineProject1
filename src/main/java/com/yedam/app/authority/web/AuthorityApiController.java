package com.yedam.app.authority.web;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.yedam.app.authority.AuthorityVO;
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
  
  @GetMapping("/api/authority/issue/canModify")
  public Map<String, Object> canModifyIssue(@RequestParam("projectCode") Long projectCode,
                                           HttpSession session) {
    Map<String, Object> res = new HashMap<>();

    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) {
      res.put("success", false);
      res.put("canModify", false);
      res.put("message", "LOGIN_REQUIRED");
      return res;
    }

    Integer userCode = user.getUserCode();
    boolean canModify = authorityService.canModify(projectCode, userCode, "일감");

    res.put("success", true);
    res.put("canModify", canModify);
    return res;
  }

  
  @GetMapping("/api/authority/project/isAdmin")
  public Map<String, Object> isAdmin(@RequestParam("projectCode") Long projectCode,
                                    HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null || user.getUserCode() == null) {
      return Map.of("success", false, "isAdmin", false, "message", "LOGIN_REQUIRED");
    }

    Integer userCode = user.getUserCode().intValue();

    AuthorityVO auth = authorityService.getProjectAuth(userCode, projectCode);
    boolean isAdmin = (auth != null) && "Y".equalsIgnoreCase(auth.getAdminCk());

    return Map.of("success", true, "isAdmin", isAdmin);
  }
  
  @GetMapping("/api/authority/notice/canWrite")
  public Map<String, Object> canWriteNotice(@RequestParam("projectCode") Long projectCode,
                                           HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return Map.of("success", false, "canWrite", false, "message", "LOGIN_REQUIRED");

    boolean canWrite = authorityService.canWrite(projectCode, user.getUserCode(), "공지");
    return Map.of("success", true, "canWrite", canWrite);
  }


}
