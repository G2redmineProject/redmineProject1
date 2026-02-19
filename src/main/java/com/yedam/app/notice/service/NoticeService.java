package com.yedam.app.notice.service;

import java.util.List;

public interface NoticeService {
  List<NoticeVO> getNoticeList(Integer loginUserCode, NoticeVO cond);

  NoticeVO getNoticeInfo(Integer loginUserCode, Long noticeCode);

  Long createNotice(NoticeVO notice);
  
  Long updateNotice(NoticeVO notice);
  
  int deleteNotice(Long noticeCode);

}
