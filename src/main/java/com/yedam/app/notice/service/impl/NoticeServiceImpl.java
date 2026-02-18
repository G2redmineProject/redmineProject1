package com.yedam.app.notice.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.yedam.app.notice.mapper.NoticeMapper;
import com.yedam.app.notice.service.NoticeService;
import com.yedam.app.notice.service.NoticeVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoticeServiceImpl implements NoticeService {

  private final NoticeMapper noticeMapper;

  @Override
  public List<NoticeVO> getNoticeList(Integer loginUserCode, NoticeVO cond) {
    return noticeMapper.selectNoticeList(loginUserCode, cond);
  }

  @Override
  public NoticeVO getNoticeInfo(Integer loginUserCode, Long noticeCode) {
    return noticeMapper.selectNoticeInfo(loginUserCode, noticeCode);
  }

  @Transactional
  @Override
  public Long createNotice(NoticeVO notice) {
    noticeMapper.insertNotice(notice);
    return notice.getNoticeCode();
  }
  
  @Transactional
  @Override
  public Long updateNotice(NoticeVO notice) {
    noticeMapper.updateNotice(notice);
    return notice.getNoticeCode();
  }
  
  @Transactional
  @Override
  public int deleteNotice(Long noticeCode) {
	  return noticeMapper.deleteNotice(noticeCode);
  }

}
