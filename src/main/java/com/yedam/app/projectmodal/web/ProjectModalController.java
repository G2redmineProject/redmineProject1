package com.yedam.app.projectmodal.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yedam.app.projectmodal.service.ProjectModalService;
import com.yedam.app.projectmodal.service.ProjectModalVO;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ProjectModalController {
	
	private final ProjectModalService projectModalService;
	
	@GetMapping("/api/projects/modal")
	  public List<ProjectModalVO> projectModalList() {
	    return projectModalService.findProjectModalList();
	  }
}
