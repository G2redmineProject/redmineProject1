package com.yedam.app.kanban.service;

import java.util.List;
import java.util.Map;

import com.yedam.app.issue.service.IssueVO;
import com.yedam.app.kanban.web.dto.KanbanMoveRequest;

public interface KanbanService {

  // scope + projectCode(optional)
  Map<String, List<IssueVO>> getBoardColumns(Integer userCode, Long projectCode, String viewScope);

  void moveCard(Integer userCode, KanbanMoveRequest req);
}
