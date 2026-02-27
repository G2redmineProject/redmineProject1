package com.yedam.app.foldermodal.web;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.yedam.app.foldermodal.service.FolderModalService;
import com.yedam.app.foldermodal.service.FolderModalVO;
import com.yedam.app.login.service.UserVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class FolderModalController {

	private final FolderModalService folderModalService;

	@GetMapping("/api/folders/modal")
	@ResponseBody
	public Map<String, Object> folderModalList(HttpSession session) {
		UserVO user = (UserVO) session.getAttribute("user");
		if (user == null) {
			return Map.of("projects", List.of(), "folders", List.of());
		}

		FolderModalVO param = new FolderModalVO();
		param.setUserCode(user.getUserCode());

		// 시스템 관리자 여부만 확실히 세팅 (isAdmin이면 1, 아니면 0)
		boolean isAdmin = "Y".equals(user.getSysCk());
		param.setAdmin(isAdmin ? 1 : 0);

		List<FolderModalVO> projects = folderModalService.findProjectListByUser(user.getUserCode());
		List<FolderModalVO> folders = folderModalService.findFolderModalListByUser(user.getUserCode());

		return Map.of("projects", projects, "folders", folders);
	}
}
