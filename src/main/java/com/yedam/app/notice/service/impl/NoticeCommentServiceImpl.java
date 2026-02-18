package com.yedam.app.notice.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.yedam.app.authority.AuthorityVO;
import com.yedam.app.authority.service.AuthorityService;
import com.yedam.app.notice.mapper.NoticeCommentMapper;
import com.yedam.app.notice.service.NoticeCommentService;
import com.yedam.app.notice.service.NoticeCommentVO;
import com.yedam.app.notice.service.NoticeService;
import com.yedam.app.notice.service.NoticeVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoticeCommentServiceImpl implements NoticeCommentService {

  private final NoticeCommentMapper noticeCommentMapper;
  private final NoticeService noticeService;
  private final AuthorityService authorityService;

  @Override
  public List<NoticeCommentVO> getCommentList(Integer loginUserCode, Long noticeCode) {
    return noticeCommentMapper.selectCommentList(loginUserCode, noticeCode);
  }

  @Transactional
  @Override
  public NoticeCommentVO createComment(Integer loginUserCode, Long noticeCode, Integer userCode, String content) {
    NoticeVO notice = noticeService.getNoticeInfo(loginUserCode, noticeCode);
    if (notice == null) {
      throw new IllegalArgumentException("NOT_FOUND");
    }

    Long projectCode = notice.getProjectCode();
    boolean canWrite = authorityService.canWrite(projectCode, userCode, "공지");
    if (!canWrite) {
      throw new SecurityException("NO_PERMISSION");
    }

    NoticeCommentVO c = new NoticeCommentVO();
    c.setNoticeCode(noticeCode);
    c.setUserCode(userCode);
    c.setContent(content);

    noticeCommentMapper.insertComment(c);

    return noticeCommentMapper.selectCommentOne(loginUserCode, c.getCommentCode());
  }

  @Transactional
  @Override
  public NoticeCommentVO modifyComment(Integer loginUserCode, Long commentCode, Integer userCode, String content) {
    NoticeCommentVO origin = noticeCommentMapper.selectCommentOne(loginUserCode, commentCode);
    if (origin == null) {
      throw new IllegalArgumentException("NOT_FOUND");
    }
    if (origin.getIsDeleted() != null && origin.getIsDeleted() == 1) {
      throw new IllegalArgumentException("ALREADY_DELETED");
    }
    if (origin.getUserCode() == null || !origin.getUserCode().equals(userCode)) {
      throw new SecurityException("NO_PERMISSION");
    }

    NoticeVO notice = noticeService.getNoticeInfo(loginUserCode, origin.getNoticeCode());
    if (notice == null) throw new IllegalArgumentException("NOT_FOUND");

    boolean canModify = authorityService.canModify(notice.getProjectCode(), userCode, "공지");
    if (!canModify) {
      throw new SecurityException("NO_PERMISSION");
    }

    NoticeCommentVO upd = new NoticeCommentVO();
    upd.setCommentCode(commentCode);
    upd.setContent(content);

    noticeCommentMapper.updateComment(upd);
    return noticeCommentMapper.selectCommentOne(loginUserCode, commentCode);
  }

  @Transactional
  @Override
  public void deleteComment(Integer loginUserCode, Long commentCode, Integer userCode) {
    NoticeCommentVO origin = noticeCommentMapper.selectCommentOne(loginUserCode, commentCode);
    if (origin == null) {
      throw new IllegalArgumentException("NOT_FOUND");
    }
    if (origin.getIsDeleted() != null && origin.getIsDeleted() == 1) {
      return;
    }

    NoticeVO notice = noticeService.getNoticeInfo(loginUserCode, origin.getNoticeCode());
    if (notice == null) throw new IllegalArgumentException("NOT_FOUND");

    Long projectCode = notice.getProjectCode();

    // 삭제 버튼 노출 - 작성자/ 관리자
    AuthorityVO auth = authorityService.getProjectAuth(userCode, projectCode);
    boolean isAdmin = (auth != null) && "Y".equalsIgnoreCase(auth.getAdminCk());
    boolean isOwner = origin.getUserCode() != null && origin.getUserCode().equals(userCode);
    if (!(isOwner || isAdmin)) {
      throw new SecurityException("NO_PERMISSION");
    }

    // 삭제 권한
    boolean canDelete = authorityService.canDelete(projectCode, userCode, "공지");
    if (!canDelete) {
      throw new SecurityException("NO_PERMISSION");
    }

    noticeCommentMapper.softDeleteComment(loginUserCode, commentCode, userCode);
  }
}
