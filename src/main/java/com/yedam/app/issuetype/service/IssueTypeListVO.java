package com.yedam.app.issuetype.service;

import java.util.Date;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@EqualsAndHashCode
@RequiredArgsConstructor
public class IssueTypeListVO {

	private Integer issueCode; // 일감 코드
	private String title; // 일감 명
	private String codeName; // 우선순위
	private String name; // 담당자
	private Integer progress; // 진행도
	private Integer totalCnt; // 행갯수
}
