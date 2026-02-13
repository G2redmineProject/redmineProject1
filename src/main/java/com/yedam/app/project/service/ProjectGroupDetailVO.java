package com.yedam.app.project.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@EqualsAndHashCode
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectGroupDetailVO {
	private Integer grProCode; // 그룹-프로젝트 매핑 코드
	private Integer grCode; // 그룹 코드
	private String grName; // 그룹명
	private Integer projectCode; // 프로젝트 코드
	private Integer roleCode; // 역할 코드
	private String roleName; // 역할명
}
