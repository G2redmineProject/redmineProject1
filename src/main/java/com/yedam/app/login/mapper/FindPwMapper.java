package com.yedam.app.login.mapper;

import com.yedam.app.login.service.UserVO;

public interface FindPwMapper {
	// 사원번호, 이름, 전화번호 select
	public UserVO selectFindPwInfo(UserVO userVO);
}
