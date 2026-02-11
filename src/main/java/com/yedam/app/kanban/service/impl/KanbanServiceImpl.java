package com.yedam.app.kanban.service.impl;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.yedam.app.issue.service.IssueVO;
import com.yedam.app.kanban.mapper.KanbanMapper;
import com.yedam.app.kanban.service.KanbanService;
import com.yedam.app.kanban.web.dto.IssuePosUpdate;
import com.yedam.app.kanban.web.dto.KanbanMoveRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class KanbanServiceImpl implements KanbanService {

  private final KanbanMapper kanbanMapper;

  @Override
  public Map<String, List<IssueVO>> getBoardColumns(Integer userCode, Long projectCode, String viewScope) {
    String scope = (viewScope == null || viewScope.isBlank()) ? "ME" : viewScope;
    List<IssueVO> list = kanbanMapper.selectKanbanIssuesByScope(userCode, scope, projectCode);
    return groupByStatus(list);
  }

  private Map<String, List<IssueVO>> groupByStatus(List<IssueVO> list) {
    Map<String, List<IssueVO>> cols = new LinkedHashMap<>();
    cols.put("OB1", new ArrayList<>());
    cols.put("OB2", new ArrayList<>());
    cols.put("OB3", new ArrayList<>());
    cols.put("OB4", new ArrayList<>());
    cols.put("OB5", new ArrayList<>());

    if (list == null) return cols;

    for (IssueVO it : list) {
      String s = it.getStatusId();
      if (s == null) continue;
      cols.computeIfAbsent(s, k -> new ArrayList<>()).add(it);
    }
    return cols;
  }

  @Transactional
  @Override
  public void moveCard(Integer userCode, KanbanMoveRequest req) {
    if (req == null || req.getProjectCode() == null || req.getIssueCode() == null || req.getToStatusCode() == null) {
      throw new IllegalArgumentException("invalid request");
    }

    boolean hasOrders = req.getToOrder() != null && !req.getToOrder().isEmpty();
    int tmpPos = (req.getToIndex() == null ? 9999 : req.getToIndex() + 1);

    // 상태 + 임시 position 먼저 반영
    kanbanMapper.updateIssueStatusAndPosition(
    	    req.getProjectCode(),
    	    req.getIssueCode(),
    	    req.getFromStatusCode(),
    	    req.getToStatusCode(),
    	    tmpPos
    	);

    if (!hasOrders) return;

    // from/to 컬럼을 1..N으로 재정렬 저장
    List<IssuePosUpdate> updates = new ArrayList<>();

    for (int i = 0; i < req.getToOrder().size(); i++) {
      updates.add(new IssuePosUpdate(req.getToOrder().get(i), i + 1));
    }

    if (req.getFromOrder() != null && !req.getFromOrder().isEmpty()) {
      for (int i = 0; i < req.getFromOrder().size(); i++) {
        updates.add(new IssuePosUpdate(req.getFromOrder().get(i), i + 1));
      }
    }

    kanbanMapper.batchUpdatePositions(updates);
  }
}
