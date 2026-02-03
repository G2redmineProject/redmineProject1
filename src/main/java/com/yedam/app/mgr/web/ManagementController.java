package com.yedam.app.mgr.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import com.yedam.app.common.service.CommonService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Controller
public class ManagementController {
	@GetMapping("/mangement")
	public String home() {
		return "mgr/mgr";
	}
}
