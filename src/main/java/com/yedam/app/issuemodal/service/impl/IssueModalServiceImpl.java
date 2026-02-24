package com.yedam.app.issuemodal.service.impl;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.yedam.app.issuemodal.mapper.IssueModalMapper;
import com.yedam.app.issuemodal.service.IssueModalService;
import com.yedam.app.issuemodal.service.IssueModalVO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IssueModalServiceImpl implements IssueModalService {

  private final IssueModalMapper issueModalMapper;

  @Override
  public List<IssueModalVO> findIssueModalList(Long projectCode, Long typeCode) {
    List<IssueModalVO> flat = issueModalMapper.selectIssueModalList(projectCode, typeCode);
    return buildIssueTree(flat);
  }

  @Override
  public List<IssueModalVO> findIssuesForWorklogCreate(Long projectCode, Long loginUserCode, String adminCk) {
    boolean isAdmin = "Y".equalsIgnoreCase(String.valueOf(adminCk));

    List<IssueModalVO> flat = isAdmin
        ? issueModalMapper.selectIssuesByProjectAll(projectCode)
        : issueModalMapper.selectIssuesByProjectMine(projectCode, loginUserCode);

    return buildIssueTree(flat);
  }

  private List<IssueModalVO> buildIssueTree(List<IssueModalVO> flat) {
    if (flat == null || flat.isEmpty()) return List.of();

    Map<Long, IssueModalVO> nodeMap = new LinkedHashMap<>();
    for (IssueModalVO v : flat) {
      if (v == null || v.getIssueCode() == null) continue;
      if (v.getChildren() == null) v.setChildren(new ArrayList<>());
      nodeMap.put(v.getIssueCode(), v);
    }

    List<IssueModalVO> roots = new ArrayList<>();
    for (IssueModalVO node : nodeMap.values()) {
      Long parentId = node.getParIssueCode();

      if (parentId == null) {
        roots.add(node);
        continue;
      }

      if (parentId.equals(node.getIssueCode())) {
        node.setParIssueCode(null);
        roots.add(node);
        continue;
      }

      IssueModalVO parent = nodeMap.get(parentId);

      // 같은 목록 안에 부모가 없으면 루트 취급
      if (parent == null) {
        roots.add(node);
        continue;
      }

      parent.getChildren().add(node);
    }

    return roots;
  }
}