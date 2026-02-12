package com.yedam.app.user.service;

import lombok.Data;

@Data
public class MyInfoUpdateReqDTO {
	private Integer userCode; // 컨트롤러에서 세션으로 세팅
	private String email;
	private String phone;
}
