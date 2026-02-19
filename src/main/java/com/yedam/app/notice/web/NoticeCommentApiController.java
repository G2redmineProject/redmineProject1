package com.yedam.app.notice.web;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.*;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.notice.service.NoticeCommentService;
import com.yedam.app.notice.service.NoticeCommentVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class NoticeCommentApiController {

  private final NoticeCommentService noticeCommentService;

  @GetMapping("/api/notice/{noticeCode}/comments")
  public Map<String, Object> list(@PathVariable("noticeCode") Long noticeCode, HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return Map.of("success", false, "message", "LOGIN_REQUIRED");

    List<NoticeCommentVO> list = noticeCommentService.getCommentList(user.getUserCode(), noticeCode);
    return Map.of("success", true, "comments", list);
  }

  public static class CommentCreateReq {
    public String content;
  }

  @PostMapping("/api/notice/{noticeCode}/comments")
  public Map<String, Object> create(@PathVariable("noticeCode") Long noticeCode,
                                    @RequestBody CommentCreateReq req,
                                    HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return Map.of("success", false, "message", "LOGIN_REQUIRED");

    String content = (req == null || req.content == null) ? "" : req.content.trim();
    if (content.isEmpty()) return Map.of("success", false, "message", "EMPTY_CONTENT");
    if (content.length() > 500) return Map.of("success", false, "message", "TOO_LONG");

    try {
      NoticeCommentVO saved = noticeCommentService.createComment(user.getUserCode(), noticeCode, user.getUserCode(), content);

      Map<String, Object> comment = toClientComment(saved);
      return Map.of("success", true, "comment", comment);
    } catch (SecurityException se) {
      return Map.of("success", false, "message", "NO_PERMISSION");
    } catch (IllegalArgumentException ie) {
      return Map.of("success", false, "message", ie.getMessage());
    }
  }

  public static class CommentUpdateReq {
    public String content;
  }

  @PutMapping("/api/notice/comments/{commentCode}")
  public Map<String, Object> update(@PathVariable("commentCode") Long commentCode,
                                    @RequestBody CommentUpdateReq req,
                                    HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return Map.of("success", false, "message", "LOGIN_REQUIRED");

    String content = (req == null || req.content == null) ? "" : req.content.trim();
    if (content.isEmpty()) return Map.of("success", false, "message", "EMPTY_CONTENT");
    if (content.length() > 500) return Map.of("success", false, "message", "TOO_LONG");

    try {
      NoticeCommentVO updated = noticeCommentService.modifyComment(user.getUserCode(), commentCode, user.getUserCode(), content);
      return Map.of("success", true, "comment", toClientComment(updated));
    } catch (SecurityException se) {
      return Map.of("success", false, "message", "NO_PERMISSION");
    } catch (IllegalArgumentException ie) {
      return Map.of("success", false, "message", ie.getMessage());
    }
  }

  @DeleteMapping("/api/notice/comments/{commentCode}")
  public Map<String, Object> delete(@PathVariable("commentCode") Long commentCode, HttpSession session) {
    UserVO user = (UserVO) session.getAttribute("user");
    if (user == null) return Map.of("success", false, "message", "LOGIN_REQUIRED");

    try {
      noticeCommentService.deleteComment(user.getUserCode(), commentCode, user.getUserCode());
      return Map.of("success", true);
    } catch (SecurityException se) {
      return Map.of("success", false, "message", "NO_PERMISSION");
    } catch (IllegalArgumentException ie) {
      return Map.of("success", false, "message", ie.getMessage());
    }
  }

  private Map<String, Object> toClientComment(NoticeCommentVO c) {
    Map<String, Object> m = new HashMap<>();
    m.put("commentCode", c.getCommentCode());
    m.put("noticeCode", c.getNoticeCode());
    m.put("userCode", c.getUserCode());
    m.put("userName", c.getUserName());
    m.put("content", c.getContent());
    m.put("isDeleted", c.getIsDeleted());

    String createdAtText = "";
    if (c.getCreatedAt() != null) {
      createdAtText = c.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
    m.put("createdAtText", createdAtText);
    return m;
  }
}
