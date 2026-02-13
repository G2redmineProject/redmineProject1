package com.yedam.app.project.service;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
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
public class ProjectUpdateDTO {
	private Integer projectCode;
	private String projectName;
	private String description;
	private String status;

	// 구성원/그룹 정보
	private List<MemberUpdate> members;
	private List<GroupUpdate> groups;

	@Data
	public static class MemberUpdate {
		private Integer mappCode; // 기존: 매핑코드, 신규: null
		private Integer userCode;
		private Integer roleCode;
		private String action; // "add", "delete", "keep"
	}

	@Data
	public static class GroupUpdate {
		private Integer grProCode; // 기존: 매핑코드, 신규: null
		private Integer grCode;
		private Integer roleCode;
		private String action; // "add", "delete", "keep"
	}
}
