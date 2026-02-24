package com.yedam.app.issuetype.web;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.issuetype.service.IssueTypeListVO;
import com.yedam.app.issuetype.service.IssueTypeService;
import com.yedam.app.issuetype.service.IssueTypeVO;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class IssuetypeController {

	private final IssueTypeService issueTypeService;

	// 유형 타입 조회
	@GetMapping("issuetype")
	public String issueTypeList(Model model) {
		List<IssueTypeVO> find = issueTypeService.findIssueType();
		model.addAttribute("types", find);
		return "issuetype/issuetypelist";
	}

	// 유형 등록
	@ResponseBody
	@PostMapping("/api/issuetype/register")
	public Map<String, Object> registerType(@RequestBody IssueTypeVO vo) {
		Map<String, Object> result = new HashMap<>();
		int cnt = issueTypeService.insertIssueType(vo);
		if (cnt > 0) {
			result.put("success", true);
			result.put("message", "등록되었습니다.");
		} else {
			result.put("success", false);
			result.put("message", "등록에 실패했습니다.");
		}
		return result;
	}

	// 유형 수정
	@ResponseBody
	@PostMapping("/api/issuetype/{typeCode}/update")
	public Map<String, Object> updateType(@PathVariable Integer typeCode, @RequestBody IssueTypeVO vo) {
		Map<String, Object> result = new HashMap<>();
		int issueCount = issueTypeService.countIssuesByTypeCode(typeCode);
		if (issueCount > 0) {
			result.put("success", false);
			result.put("message", "해당 유형을 사용 중인 일감이 " + issueCount + "건 있어 수정할 수 없습니다.");
			return result;
		}

		vo.setTypeCode(typeCode);
		int cnt = issueTypeService.updateIssueType(vo);
		if (cnt > 0) {
			result.put("success", true);
			result.put("message", "수정되었습니다.");
		} else {
			result.put("success", false);
			result.put("message", "수정에 실패했습니다.");
		}
		return result;
	}

	// 유형 삭제 (소프트)
	@ResponseBody
	@PostMapping("/api/issuetype/{typeCode}/delete")
	public Map<String, Object> deleteType(@PathVariable Integer typeCode) {
		Map<String, Object> result = new HashMap<>();

		int issueCount = issueTypeService.countIssuesByTypeCode(typeCode);
		if (issueCount > 0) {
			result.put("success", false);
			result.put("message", "해당 유형을 사용 중인 일감이 " + issueCount + "건 있어 삭제할 수 없습니다.");
			return result;
		}

		int cnt = issueTypeService.deleteIssueType(typeCode);
		if (cnt > 0) {
			result.put("success", true);
			result.put("message", "삭제되었습니다.");
		} else {
			result.put("success", false);
			result.put("message", "삭제에 실패했습니다.");
		}
		return result;
	}

	// 일감 유형 -> 일감 목록 리스트
	@ResponseBody
	@GetMapping("/api/issuetype/{typeCode}/issueType")
	public List<IssueTypeListVO> getIssueListType(@PathVariable Integer typeCode) {
		return issueTypeService.findIssueListType(typeCode);
	}

}