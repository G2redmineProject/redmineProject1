package com.yedam.app.notice.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.notice.service.NoticeCommentVO;

public interface NoticeCommentMapper {

  List<NoticeCommentVO> selectCommentList(@Param("loginUserCode") Integer loginUserCode,
                                         @Param("noticeCode") Long noticeCode);

  NoticeCommentVO selectCommentOne(@Param("loginUserCode") Integer loginUserCode,
                                  @Param("commentCode") Long commentCode);

  int insertComment(NoticeCommentVO c);

  int updateComment(NoticeCommentVO c);

  int softDeleteComment(@Param("loginUserCode") Integer loginUserCode,
                        @Param("commentCode") Long commentCode,
                        @Param("deletedByCode") Integer deletedByCode);
}
