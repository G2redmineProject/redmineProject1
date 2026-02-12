package com.yedam.app.user.mapper;

import com.yedam.app.login.service.UserVO;
import com.yedam.app.user.service.MyInfoUpdateReqDTO;

public interface MyInfoMapper {
	
	// 내 정보 select 단건
	public UserVO selectMyInfo(Integer userCode);
	
	// 내 정보 수정
	public int updateMyInfo(MyInfoUpdateReqDTO req);
	
	// 유저코드, 비밀번호 해시 select
	public UserVO selectByUserCode(Integer userCode);
	
	// 새 비밀번호 업데이트
	public int updatePassword(Integer userCode, String encodedPw);
	
}
