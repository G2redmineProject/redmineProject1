package com.yedam.app.notice.web;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.yedam.app.attach.service.AttachmentService;
import com.yedam.app.authority.AuthorityVO;
import com.yedam.app.authority.service.AuthorityService;
import com.yedam.app.login.service.UserVO;
import com.yedam.app.notice.service.NoticeCommentService;
import com.yedam.app.notice.service.NoticeCommentVO;
import com.yedam.app.notice.service.NoticeService;
import com.yedam.app.notice.service.NoticeVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class NoticeController {

  private final NoticeService noticeService;
  private final AuthorityService authorityService;
  private final NoticeCommentService noticeCommentService;
  private final AttachmentService attachmentService;


  @GetMapping("/noticeList")
  public String noticeList(NoticeVO cond, Model model, HttpSession session) {
    UserVO loginUser = (UserVO) session.getAttribute("user");
    if (loginUser == null) return "redirect:/login";

    Integer loginUserCode = loginUser.getUserCode();

    List<NoticeVO> list = noticeService.getNoticeList(loginUserCode, cond);
    
    boolean showCreateBtn = authorityService.hasAnyAdminProject(loginUserCode);
    model.addAttribute("showCreateBtn", showCreateBtn);

    model.addAttribute("list", list);

    model.addAttribute("projectCode", cond.getProjectCode());
    model.addAttribute("projectName", "");
    model.addAttribute("creatorName", "");

    return "notice/list";
  }

  // 공지 등록 화면
  @GetMapping("/noticeCreate")
  public String noticeCreateForm(Model model, HttpSession session,
                                 @RequestParam(value = "projectCode", required = false) Long projectCode) {
    UserVO loginUser = (UserVO) session.getAttribute("user");
    if (loginUser == null) return "redirect:/login";

    NoticeVO notice = new NoticeVO();
    notice.setProjectCode(projectCode);
    
    Integer loginUserCode = loginUser.getUserCode();
    
    boolean canWrite = (projectCode != null) && authorityService.canWrite(projectCode, loginUserCode, "공지");

    model.addAttribute("notice", notice);
    model.addAttribute("canWrite", canWrite);
    model.addAttribute("projectName", ""); 

    return "notice/create";
  }

  // 공지 등록 처리
  @PostMapping("/noticeCreate")
  public String noticeCreate(NoticeVO notice, @RequestParam(value="uploadFile", required=false) MultipartFile uploadFile,
		  HttpSession session, Model model) {
    UserVO loginUser = (UserVO) session.getAttribute("user");
    if (loginUser == null) return "redirect:/login";
    
    Integer loginUserCode = loginUser.getUserCode();
    Long projectCode = notice.getProjectCode();

    // 서버에서 최종 권한 체크
    boolean canWrite = authorityService.canWrite(projectCode, loginUserCode, "공지");
    if (!canWrite) {
      model.addAttribute("errorMessage", "권한이 없습니다.");
      model.addAttribute("notice", notice);
      model.addAttribute("canWrite", false);
      model.addAttribute("projectName", "");
      return "notice/create";
    }

    // 작성자 = 로그인 사용자
    notice.setUserCode(loginUser.getUserCode());
    
    // 첨부파일
    Long fileCode = attachmentService.saveSingleFile("NOTICE", loginUserCode, uploadFile);
    notice.setFileCode(fileCode);

    Long noticeCode = noticeService.createNotice(notice);
    return "redirect:/noticeInfo?noticeCode=" + noticeCode;
  }

  // 공지 상세
  @GetMapping("/noticeInfo")
  public String noticeInfo(@RequestParam("noticeCode") Long noticeCode,
                           Model model,
                           HttpSession session) {

    UserVO loginUser = (UserVO) session.getAttribute("user");
    if (loginUser == null) return "redirect:/login";

    Integer loginUserCode = loginUser.getUserCode();

    NoticeVO notice = noticeService.getNoticeInfo(loginUserCode, noticeCode);
    if (notice == null) {
      return "redirect:/noticeList";
    }

    Long projectCode = notice.getProjectCode();

    // isAdmin
    AuthorityVO auth = authorityService.getProjectAuth(loginUserCode, projectCode);
    boolean isAdmin = (auth != null) && "Y".equalsIgnoreCase(auth.getAdminCk());

    //isOwner
    boolean isOwner = (notice.getUserCode() != null) && notice.getUserCode().equals(loginUserCode);

    // 버튼 노출 조건
    boolean showManageButtons = isOwner || isAdmin;

    // 실행 권한
    boolean canModify = authorityService.canModify(projectCode, loginUserCode, "공지");
    boolean canDelete = authorityService.canDelete(projectCode, loginUserCode, "공지");

    model.addAttribute("notice", notice);
    model.addAttribute("showManageButtons", showManageButtons);
    model.addAttribute("canModify", canModify);
    model.addAttribute("canDelete", canDelete);
    
 // 댓글 권한
    boolean canWriteComment  = authorityService.canWrite(projectCode, loginUserCode, "댓글");
    boolean canModifyComment = authorityService.canModify(projectCode, loginUserCode, "댓글");
    boolean canDeleteComment = authorityService.canDelete(projectCode, loginUserCode, "댓글");

    model.addAttribute("canWriteComment", canWriteComment);
    model.addAttribute("canModifyComment", canModifyComment);
    model.addAttribute("canDeleteComment", canDeleteComment);
    model.addAttribute("loginUserCode", loginUserCode);
    model.addAttribute("isAdmin", isAdmin);

    // 댓글 목록 조회
    List<NoticeCommentVO> comments = noticeCommentService.getCommentList(loginUserCode, noticeCode);
    model.addAttribute("comments", comments);

    return "notice/info";
  }
  
  // 수정
@GetMapping("/noticeEdit")
public String noticeEditForm(@RequestParam("noticeCode") Long noticeCode,
                            Model model,
                            HttpSession session) {
 UserVO loginUser = (UserVO) session.getAttribute("user");
 if (loginUser == null) return "redirect:/login";

 Integer loginUserCode = loginUser.getUserCode();

 NoticeVO notice = noticeService.getNoticeInfo(loginUserCode, noticeCode);
 if (notice == null) return "redirect:/noticeList";

 Long projectCode = notice.getProjectCode();

 AuthorityVO auth = authorityService.getProjectAuth(loginUserCode, projectCode);
 boolean isAdmin = (auth != null) && "Y".equalsIgnoreCase(auth.getAdminCk());
 boolean isOwner = (notice.getUserCode() != null) && notice.getUserCode().equals(loginUserCode);

 boolean showManageButtons = isOwner || isAdmin;
 if (!showManageButtons) {
   return "redirect:/noticeInfo?noticeCode=" + noticeCode;
 }

 boolean canModify = authorityService.canModify(projectCode, loginUserCode, "공지");

 model.addAttribute("notice", notice);
 model.addAttribute("projectName", notice.getProjectName());
 model.addAttribute("canModify", canModify);

 return "notice/edit";
}

//공지 수정 처리
@PostMapping("/noticeEdit")
public String noticeEdit(
    NoticeVO notice,
    @RequestParam(value="uploadFile", required=false) MultipartFile uploadFile,
    @RequestParam(value="removeFile", required=false) Boolean removeFile,
    HttpSession session,
    Model model
) {
  UserVO loginUser = (UserVO) session.getAttribute("user");
  if (loginUser == null) return "redirect:/login";

  Integer loginUserCode = loginUser.getUserCode();

  NoticeVO origin = noticeService.getNoticeInfo(loginUserCode, notice.getNoticeCode());
  if (origin == null) return "redirect:/noticeList";

  Long projectCode = origin.getProjectCode();

  AuthorityVO auth = authorityService.getProjectAuth(loginUserCode, projectCode);
  boolean isAdmin = (auth != null) && "Y".equalsIgnoreCase(auth.getAdminCk());
  boolean isOwner = (origin.getUserCode() != null) && origin.getUserCode().equals(loginUserCode);

  boolean canModify = authorityService.canModify(projectCode, loginUserCode, "공지");
  if (!(isOwner || isAdmin) || !canModify) {
    model.addAttribute("errorMessage", "권한이 없습니다.");
    model.addAttribute("notice", origin);
    model.addAttribute("projectName", origin.getProjectName());
    model.addAttribute("canModify", false);
    return "notice/edit";
  }

  // 공통 세팅
  notice.setProjectCode(origin.getProjectCode());
  notice.setUserCode(origin.getUserCode());

  Long oldFileCode = origin.getFileCode();
  boolean wantRemove = Boolean.TRUE.equals(removeFile);

  // 삭제 요청
  if (wantRemove) {
    notice.setFileCode(null);

    //  FK 끊기
    noticeService.updateNotice(notice);

    //  실제 파일/attachments 삭제
    if (oldFileCode != null) {
      attachmentService.deleteSingleFile(oldFileCode);
    }

    return "redirect:/noticeInfo?noticeCode=" + notice.getNoticeCode();
  }

  //  새 파일 업로드(교체)
  if (uploadFile != null && !uploadFile.isEmpty()) {
    Long newFileCode = attachmentService.saveSingleFile("NOTICE", loginUserCode, uploadFile);
    notice.setFileCode(newFileCode);

    // 공지 업데이트, FK 새 fileCode 연결
    noticeService.updateNotice(notice);

    // 기존 파일 삭제
    if (oldFileCode != null) {
      attachmentService.deleteSingleFile(oldFileCode);
    }

    return "redirect:/noticeInfo?noticeCode=" + notice.getNoticeCode();
  }

  //  파일 유지
  notice.setFileCode(oldFileCode);
  noticeService.updateNotice(notice);

  return "redirect:/noticeInfo?noticeCode=" + notice.getNoticeCode();
}


  
  @PostMapping("/noticeDelete")
  @ResponseBody
  public Map<String, Object> noticeDelete(@RequestParam("noticeCode") Long noticeCode,
                                          HttpSession session) {
    UserVO loginUser = (UserVO) session.getAttribute("user");
    if (loginUser == null) {
      return Map.of("success", false, "message", "LOGIN_REQUIRED");
    }

    Integer userCode = loginUser.getUserCode();

    NoticeVO notice = noticeService.getNoticeInfo(userCode, noticeCode);
    if (notice == null) {
      return Map.of("success", false, "message", "NOT_FOUND");
    }

    Long projectCode = notice.getProjectCode();

    // 관리자 여부
    AuthorityVO auth = authorityService.getProjectAuth(userCode, projectCode);
    boolean isAdmin = (auth != null) && "Y".equalsIgnoreCase(auth.getAdminCk());

    // 등록자 여부
    boolean isOwner = (notice.getUserCode() != null) && notice.getUserCode().equals(userCode);

    // 삭제 권한
    boolean canDelete = authorityService.canDelete(projectCode, userCode, "공지");

    if (!(isOwner || isAdmin)) {
      return Map.of("success", false, "message", "NO_PERMISSION");
    }
    if (!canDelete) {
      return Map.of("success", false, "message", "NO_PERMISSION");
    }

    noticeService.deleteNotice(noticeCode);
    return Map.of("success", true);
  }

}
