package com.yedam.app.log.web;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.yedam.app.log.service.LogService;
import com.yedam.app.log.service.LogVO;
import com.yedam.app.login.service.UserVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class LogController {

  private final LogService logService;

  @GetMapping("/logs")
  public String logList(
      LogVO cond,
      @RequestParam(value="types", required=false) List<String> types,
      Model model,
      HttpSession session
  ) {
    UserVO loginUser = (UserVO) session.getAttribute("user");
    if (loginUser == null) return "redirect:/login";

    Integer loginUserCode = loginUser.getUserCode();

    List<String> targetTypes = (types == null) ? new ArrayList<>() : types;
    List<LogVO> logs = logService.findLogs(loginUserCode, cond, targetTypes);

    model.addAttribute("cond", cond);
    model.addAttribute("types", targetTypes);
    model.addAttribute("logs", logs);

    return "log/list";
  }
}
