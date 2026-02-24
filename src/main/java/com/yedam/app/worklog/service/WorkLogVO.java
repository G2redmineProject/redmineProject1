package com.yedam.app.worklog.service;

import java.time.LocalDate;

import lombok.Data;

@Data
public class WorkLogVO {
  private Long workLogCode;

  private Long issueCode;
  private String issueTitle;

  private Long projectCode;
  private String projectName;

  private Long typeCode;
  private String typeName;

  private LocalDate workDate;

  private Integer workerCode;
  private String workerName;

  private Integer spentMinutes;
  private String description;
}