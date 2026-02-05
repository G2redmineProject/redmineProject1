package com.yedam.app.login.service;

public interface FindPwService {
	// 사원번호, 이름, 전화번호 select
	public UserVO FindPwInfo(UserVO userVO);
	
	void sendOtpMail(String toEmail, String otp);
}
