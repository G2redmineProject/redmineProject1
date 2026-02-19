package com.yedam.app.notice.service;

import java.util.List;

public interface NoticeCommentService {

  List<NoticeCommentVO> getCommentList(Integer loginUserCode, Long noticeCode);

  NoticeCommentVO createComment(Integer loginUserCode, Long noticeCode, Integer userCode, String content);

  NoticeCommentVO modifyComment(Integer loginUserCode, Long commentCode, Integer userCode, String content);

  void deleteComment(Integer loginUserCode, Long commentCode, Integer userCode);
}
