package com.yedam.app.login.service;

import lombok.Data;

@Data
public class UserVO {
	private Integer employeeNo;
	private String email;
	private String password;
	private String passwordHash;
	private String name;
	private String phone;
}
