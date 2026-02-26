package com.yedam.app.main.web;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.main.service.AssigneeIssStaVO;
import com.yedam.app.main.service.MainProjectStatusVO;
import com.yedam.app.main.service.MainService;
import com.yedam.app.main.service.MyTopIssueVO;
import com.yedam.app.main.service.ProIssStaVO;
import com.yedam.app.mypage.service.MyNoticeDTO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class MainController {

	private final MainService mainService;

	@GetMapping("G2main")
	public String G2main(HttpSession session, Model model) {
		UserVO user = (UserVO) session.getAttribute("user");
		session.removeAttribute("currentProject");

		if (user == null) {
			return "login/login";
		}

		int limit = 8;

		Integer userCode = user.getUserCode();

		// ✅ 무거운 2개(프로젝트 현황/진행률)는 AJAX로 빼고, 페이지는 빠르게 렌더
		List<ProIssStaVO> proIssList = mainService.findProIssSta(userCode);
		List<Integer> adminProList = mainService.findAdminProByUserCode(userCode);
		List<MyNoticeDTO> recentNotices = mainService.findRecentNoticesForMain(userCode, limit);

		model.addAttribute("ProIssStatusList", proIssList != null ? proIssList : List.of());
		model.addAttribute("adminProjectList", adminProList != null ? adminProList : List.of());
		model.addAttribute("noticeList", recentNotices != null ? recentNotices : List.of());

		// ✅ 화면 초기값(로딩 전)
		model.addAttribute("todayProgressRate", 0);
		model.addAttribute("statusListCnt", List.of());

		return "main/main";
	}

	// ✅ 프로젝트 현황(도넛 차트) AJAX
	@GetMapping("/api/main/statusCnt")
	@ResponseBody
	public List<MainProjectStatusVO> statusCnt(HttpSession session) {
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return List.of();
		return mainService.findCodeNameCnt(user.getUserCode());
	}

	// ✅ 전체 진행률 AJAX
	@GetMapping("/api/main/todayProgressRate")
	@ResponseBody
	public Map<String, Object> todayProgressRate(HttpSession session) {
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return Map.of("ok", false, "rate", 0);

		int rate = mainService.findTodayProgressRate(user.getUserCode());
		if (rate < 0)
			rate = 0;
		if (rate > 100)
			rate = 100;

		return Map.of("ok", true, "rate", rate);
	}

	@GetMapping("/G2main/{projectCode}/issuesStatus")
	public String issStaByproject(@PathVariable Integer projectCode, HttpSession session, Model model) {

		Integer userCode = ((UserVO) session.getAttribute("user")).getUserCode();

		boolean isAdmin = mainService.findIsAdminInProject(userCode, projectCode);

		// 프로젝트 담당자별 일감현황 조회
		List<AssigneeIssStaVO> assIssStaList;
		if (isAdmin) {
			// 관리자: 프로젝트 담당자별(전체)
			assIssStaList = mainService.findAssIssSta(projectCode);
		} else {
			assIssStaList = mainService.findMyAssIssSta(projectCode, userCode);
		}

		List<MyTopIssueVO> topIssueList = List.of();
		if (!isAdmin) {
			topIssueList = mainService.findMyTopIssues(projectCode, userCode);
		}

		String projectName = mainService.findProjectName(projectCode);

		model.addAttribute("projectName", projectName);
		model.addAttribute("AssIssStaList", assIssStaList);
		model.addAttribute("isAdmin", isAdmin);
		model.addAttribute("projectCode", projectCode);
		model.addAttribute("topIssueList", topIssueList);

		return "main/issuesStatus";
	}

	@GetMapping("/api/main/issuesStatus/picked")
	@ResponseBody
	public List<com.yedam.app.main.service.PickedIssueDTO> pickedIssues(@RequestParam Integer projectCode,
			@RequestParam(required = false) Integer assigneeCode, @RequestParam(required = false) String statusId,
			@RequestParam(defaultValue = "50") int limit, HttpSession session) {
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return List.of();

		Integer userCode = user.getUserCode();
		boolean isAdmin = mainService.findIsAdminInProject(userCode, projectCode);

		// 안전: limit 상한
		if (limit <= 0)
			limit = 50;
		if (limit > 200)
			limit = 200;

		return mainService.findPickedIssues(projectCode, assigneeCode, statusId, userCode, isAdmin, limit);
	}

	@GetMapping("/api/main/memos")
	@ResponseBody
	public List<com.yedam.app.main.service.MainMemoDTO> memosByMonth(@RequestParam String month, // "YYYY-MM"
			HttpSession session) {
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return List.of();
		return mainService.findMemosByMonth(user.getUserCode(), month);
	}

	@GetMapping("/api/main/memos/day")
	@ResponseBody
	public com.yedam.app.main.service.MainMemoDTO memoByDay(@RequestParam String date, // "YYYY-MM-DD"
			HttpSession session) {
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return null;
		return mainService.findMemoByDate(user.getUserCode(), date);
	}

	@PostMapping("/api/main/memos")
	@ResponseBody
	public ResponseEntity<?> saveMemo(@org.springframework.web.bind.annotation.RequestBody Map<String, String> body,
			HttpSession session) {
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return ResponseEntity.status(401).body(Map.of("ok", false));

		String date = body.get("date"); // "YYYY-MM-DD"
		String content = body.get("content");

		if (date == null || date.isBlank()) {
			return ResponseEntity.badRequest().body(Map.of("ok", false, "msg", "date required"));
		}

		mainService.saveMemo(user.getUserCode(), date, content);
		return ResponseEntity.ok(Map.of("ok", true));
	}

	@DeleteMapping("/api/main/memos")
	@ResponseBody
	public ResponseEntity<?> deleteMemo(@RequestParam String date, // "YYYY-MM-DD"
			HttpSession session) {
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null)
			return ResponseEntity.status(401).body(Map.of("ok", false));

		if (date == null || date.isBlank()) {
			return ResponseEntity.badRequest().body(Map.of("ok", false, "msg", "date required"));
		}

		boolean deleted = mainService.removeMemo(user.getUserCode(), date);
		return ResponseEntity.ok(Map.of("ok", true, "deleted", deleted));
	}
}
