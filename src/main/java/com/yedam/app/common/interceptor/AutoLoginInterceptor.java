package com.yedam.app.common.interceptor;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.yedam.app.login.service.LoginService;
import com.yedam.app.login.service.UserVO;
import com.yedam.app.project.service.ProjectService;
import com.yedam.app.project.service.UserProjectAuthVO;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AutoLoginInterceptor implements HandlerInterceptor {

    private final LoginService loginService;
    private final ProjectService projectService;

    private static final String AUTO_LOGIN_COOKIE = "AUTO_LOGIN";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {

        // 이미 로그인 세션 있으면 통과
        HttpSession session = request.getSession(false);
        if (session != null && session.getAttribute("user") != null) return true;

        // 자동로그인 쿠키 없으면 통과
        String rawToken = readCookie(request, AUTO_LOGIN_COOKIE);
        if (rawToken == null || rawToken.isBlank()) return true;

        // 토큰 해시로 유저 조회
        String tokenHash = sha256Hex(rawToken);
        UserVO user = loginService.findUserByValidAutoLoginToken(tokenHash);

        // 무효/만료면 쿠키 삭제 후 통과(여기서 막진 않음. LoginCheck가 처리)
        if (user == null) {
            deleteCookie(response, AUTO_LOGIN_COOKIE);
            return true;
        }

        // 세션 복구
        HttpSession newSession = request.getSession(true);
        newSession.setAttribute("user", user);

        List<UserProjectAuthVO> auths = projectService.getUserProjectAuthAll(user.getUserCode());
        newSession.setAttribute("userAuth", auths);

        // 마지막 사용시간 갱신(추천)
        loginService.touchAutoLoginToken(tokenHash);

        return true;
    }

    private String readCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }

    private void deleteCookie(HttpServletResponse response, String name) {
        Cookie c = new Cookie(name, "");
        c.setPath("/");
        c.setMaxAge(0);
        c.setHttpOnly(true);
        response.addCookie(c);
    }

    private String sha256Hex(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(s.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
