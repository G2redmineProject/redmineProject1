package com.yedam.app.login.service;

public interface LoginService {
	// 마지막 로그인 업데이트
	public int modifyLastLoginAt(Integer userCode);
	
	// 로그인 검증
	public LoginResultDTO login(UserVO userVO);
	
	// 첫 로그인 필수정보 업데이트
	public int modifyFirstLoginInfo(UserVO userVO);
	
	// 토큰 저장
    int saveAutoLoginToken(AutoLoginTokenVO autoLoginTokenVO);

    // 유효 토큰으로 사용자 조회
    UserVO findUserByValidAutoLoginToken(String tokenHash);

    // 마지막 사용 갱신
    int touchAutoLoginToken(String tokenHash);

    // 토큰 삭제(로그아웃)
    int removeAutoLoginToken(String tokenHash);
}
