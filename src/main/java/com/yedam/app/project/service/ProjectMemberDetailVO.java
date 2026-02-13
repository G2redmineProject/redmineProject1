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
public class ProjectMemberDetailVO {
	private Integer mappCode; // 매핑 코드
	private Integer projectCode; // 프로젝트 코드
	private Integer userCode; // 구성원 코드
	private String userName; // 구성원 이름 
	private String email; // 유저 메일
	private Integer roleCode; // 역할 코드
	private String roleName; // 역할명 
}
