package com.yedam.app.login.web;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.yedam.app.login.service.FindPwService;
import com.yedam.app.login.service.UserVO;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class FindPwController {

	private final FindPwService findPwService;
	
	// 메일 세션
	private static final String S_EMAIL = "FINDPW_EMAIL";   // 인증 대상 이메일
	private static final String S_OTP = "FINDPW_OTP";     // 인증번호
	private static final String S_EXPIRES = "FINDPW_EXPIRES"; // 만료시간(밀리초)
	
	private static final long OTP_TTL_MS = TimeUnit.MINUTES.toMillis(1);
	
	// 이메일, 이름, 전화번호 select
	// 페이지 이동
	@GetMapping("/findPw")
	public String findPwForm() {
		return "login/findPw";
	}
	
	// 처리
	@PostMapping("/findPw")
	public String findPw(UserVO userVO
						,HttpSession session
						,RedirectAttributes ra) {
		
		// 비밀번호 찾기 조회
		UserVO findUser = findPwService.FindPwInfo(userVO);
		
		if (findUser == null) {
			// 비밀번호 찾기 실패
			ra.addFlashAttribute("findPwErrorMsg", "입력하신 정보가 올바르지 않습니다.");
			return "redirect:/findPw";
		}
		
		// 인증번호 담기
		String otp = generateOtp6();
		
		// 세션 저장
		session.setAttribute(S_EMAIL, findUser.getEmail());
		session.setAttribute(S_OTP, otp);
		session.setAttribute(S_EXPIRES, System.currentTimeMillis() + OTP_TTL_MS); //현재 시간부터 10분 뒤 만료
		
		// 이메일 발송
		try {
			findPwService.sendOtpMail(findUser.getEmail(), otp);
		} catch(Exception e) {
			ra.addFlashAttribute("findPwErrorMsg", "메일 전송에 실패했습니다. 관리자에게 문의하세요.");
	        return "redirect:/findPw";
		}
		
		
		return "redirect:/findPw/verify";
	}
	
	// 메일 인증
	// 페이지
	@GetMapping("/findPw/verify")
	public String verifyForm(HttpSession session, RedirectAttributes ra, Model model) {
		// 만료시간 가져오기
		Long expires = (Long) session.getAttribute(S_EXPIRES);
		
		// 가져온 만료시간이 null이면
		if (expires == null) {
			ra.addFlashAttribute("findPwErrorMsg", "인증 세션이 없습니다. 다시 인증메일을 요청해주세요.");
			return "redirect:/findPw";
		}
		
		// 모델에 expiresAt 이름으로 시간 저장
		model.addAttribute("expiresAt", expires);
		
		return "login/verify";
	}
	
	// 처리
	@PostMapping("/findPw/verify")
	public String verify(@RequestParam("inputOtp") String inputOtp
						,HttpSession session
						,RedirectAttributes ra) {
		
		// 세션 값 꺼내기
		String savedOtp = (String) session.getAttribute(S_OTP);
	    Long expires = (Long) session.getAttribute(S_EXPIRES);
	    String email = (String) session.getAttribute(S_EMAIL);
	    
	    // 세션이 없거나 만료되었으면 비밀번호 찾기로
	    if (savedOtp == null || expires == null || email == null) {
	        ra.addFlashAttribute("verifyErrorMsg", "인증 세션이 만료되었습니다. 다시 인증메일을 요청해주세요.");
	        return "redirect:/findPw";
	    }
	    
	    // 시간 만료 체크
	    if (System.currentTimeMillis() > expires) {
	    	// 보안상 만료되면 세션값 제거
	        session.removeAttribute(S_OTP);
	        session.removeAttribute(S_EXPIRES);
	        
	        ra.addFlashAttribute("verifyErrorMsg", "인증번호가 만료되었습니다. 다시 인증메일을 요청해주세요.");
	        return "redirect:/findPw";
	    }
	    
	    // OTP 비교
	    if(!savedOtp.equals(inputOtp == null ? "" : inputOtp.trim())) {
	    	ra.addFlashAttribute("verifyErrorMsg", "인증번호가 올바르지 않습니다.");
	        return "redirect:/findPw/verify";
	    }
	    
	    // 성공 처리
	    // OTP 제거
	    session.removeAttribute(S_OTP);
	    session.removeAttribute(S_EXPIRES);
	    // 성공했으니 세션에 FINDPW_VERIFIED = true 넣기
	    session.setAttribute("FINDPW_VERIFIED", true);
	    
	    // 비밀번호 재설정 페이지로 이동
		return "redirect:/findPw/pwReset";
	}
	
	// 인증번호 생성
	private String generateOtp6() {
		SecureRandom r = new SecureRandom();
		int n = r.nextInt(900000) + 100000; // 100000~999999
		return String.valueOf(n); // String으로 형변환
	}
}
