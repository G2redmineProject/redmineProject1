package com.yedam.app.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.yedam.app.auth.web.AuthInterceptor;
import com.yedam.app.common.interceptor.AutoLoginInterceptor;
import com.yedam.app.common.interceptor.LoginCheckInterceptor;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {
	
	private final AutoLoginInterceptor autoLoginInterceptor;
	private final AuthInterceptor authInterceptor; 
	
	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		
		// 자동로그인 복구 (가장 먼저!)
        registry.addInterceptor(autoLoginInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns(
                        "/login", "/logout",
                        "/findPw", "/findPw/**",
                        "/error",
                        "/css/**", "/js/**", "/images/**", "/webjars/**", "/favicon.ico"
                );
		
		// 로그인 체크 (세션 없으면 /login)
		registry.addInterceptor(new LoginCheckInterceptor()).addPathPatterns("/**") // 전체 요청에 적용
				.excludePathPatterns(
						"/login", "/logout", 
						"/findPw", "/findPw/**", // 로그인 관련은 예외
						"/error", // 에러페이지 예외
						"/css/**", "/js/**", "/images/**", "/webjars/**", "/favicon.ico");

		// 권한 체크 인터셉터 추가
		registry.addInterceptor(authInterceptor).addPathPatterns("/**").excludePathPatterns("/login", "/logout",
				"/firstLogin", "/findPw", "/findPw/**", "/error", "/accessDenied", "/css/**", "/js/**", "/images/**",
				"/webjars/**", "/favicon.ico");
	}

}
