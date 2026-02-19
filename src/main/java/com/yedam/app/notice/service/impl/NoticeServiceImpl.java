package com.yedam.app.notice.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.yedam.app.log.service.LogService;
import com.yedam.app.notice.mapper.NoticeMapper;
import com.yedam.app.notice.service.NoticeService;
import com.yedam.app.notice.service.NoticeVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoticeServiceImpl implements NoticeService {

  private final NoticeMapper noticeMapper;
  private final LogService logService;

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
    int ins = noticeMapper.insertNotice(notice);
    if (ins != 1) return null;

    logService.addActionLog(
      notice.getProjectCode(),
      notice.getUserCode(),
      "CREATE",
      "NOTICE",
      notice.getNoticeCode(),
      null
    );

    return notice.getNoticeCode();
  }
  
  @Transactional
  @Override
  public Long updateNotice(NoticeVO notice) {
    if (notice == null || notice.getNoticeCode() == null) return null;

    // before
    NoticeVO before = noticeMapper.selectNoticeByCode(notice.getNoticeCode());
    if (before == null) return null;

    int upd = noticeMapper.updateNotice(notice);
    if (upd != 1) return null;

    // after
    NoticeVO after = noticeMapper.selectNoticeByCode(notice.getNoticeCode());

    String meta = buildUpdateMeta(before, after);

    logService.addActionLog(
      after.getProjectCode(),
      notice.getUserCode(),
      "UPDATE",
      "NOTICE",
      after.getNoticeCode(),
      meta
    );

    return after.getNoticeCode();
  }
  
  @Transactional
  @Override
  public int deleteNotice(Long noticeCode) {
	  return noticeMapper.deleteNotice(noticeCode);
  }

  
//-----------------------------
 // meta 만들기(UPDATE용): changes
 // -----------------------------
 private String buildUpdateMeta(NoticeVO before, NoticeVO after) {
   StringBuilder sb = new StringBuilder();
   sb.append("{\"changes\":[");

   boolean first = true;

   first = appendChange(sb, first, "title",
       before == null ? null : before.getTitle(),
       after == null ? null : after.getTitle());

   first = appendChange(sb, first, "content",
       before == null ? null : before.getContent(),
       after == null ? null : after.getContent());


   sb.append("]}");
   return sb.toString();
 }

 private boolean appendChange(StringBuilder sb, boolean first, String field, String before, String after) {
   if (before == null && after == null) return first;
   if (before != null && before.equals(after)) return first;

   if (!first) sb.append(",");
   sb.append("{\"field\":\"").append(esc(field)).append("\",")
     .append("\"before\":").append(jsonValue(before)).append(",")
     .append("\"after\":").append(jsonValue(after)).append("}");

   return false;
 }

 private String jsonValue(String v) {
   if (v == null) return "null";
   return "\"" + esc(v) + "\"";
 }

 private String esc(String s) {
   if (s == null) return "";
   return s.replace("\\", "\\\\")
           .replace("\"", "\\\"")
           .replace("\n", "\\n")
           .replace("\r", "\\r")
           .replace("\t", "\\t");
 }
}

