package com.yedam.app.notice.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.notice.service.NoticeVO;

public interface NoticeMapper {

  // 로그인 사용자 프로젝트의 공지
  List<NoticeVO> selectNoticeList(@Param("loginUserCode") Integer loginUserCode,
                                  @Param("cond") NoticeVO cond);

  // 상세
  NoticeVO selectNoticeInfo(@Param("loginUserCode") Integer loginUserCode,
                            @Param("noticeCode") Long noticeCode);

  // 등록
  int insertNotice(NoticeVO notice);
  
  // 수정
  int updateNotice(NoticeVO notice);
  
  //삭제
  int deleteNotice(@Param("noticeCode") Long noticeCode);
  
  // before/after 비교
  NoticeVO selectNoticeByCode(@Param("noticeCode") Long noticeCode);
}
