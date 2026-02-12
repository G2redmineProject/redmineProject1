package com.yedam.app.login.service;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class AutoLoginTokenVO {

	private String tokenHash;     // SHA-256 해시값 (PK)
    private Integer userCode;        // 사용자 코드
    private LocalDateTime expiresAt;   // 만료 일시
    private LocalDateTime createdAt;   // 생성 일시
    private LocalDateTime lastUsedAt;  // 마지막 사용 일시
    private String userAgent;     // 브라우저 정보
    private String ipAddr;        // IP 주소
    private Long ttlSeconds; // 자동로그인 유지시간(초)
}
