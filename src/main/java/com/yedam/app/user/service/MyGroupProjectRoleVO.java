package com.yedam.app.user.service;

import lombok.Data;

@Data
public class MyGroupProjectRoleVO {
	private Integer groupCode;
    private String groupName;
    private Integer projectCode;
    private String projectName;
    private String roles;
}
