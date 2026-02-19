package com.yedam.app.mypage.service.impl;

import java.text.SimpleDateFormat;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yedam.app.mypage.mapper.MyPageMapper;
import com.yedam.app.mypage.service.BlockVO;
import com.yedam.app.mypage.service.MyIssueRowDTO;
import com.yedam.app.mypage.service.MyNoticeDTO;
import com.yedam.app.mypage.service.MyPageService;
import com.yedam.app.mypage.service.WeekGanttIssueDTO;
import com.yedam.app.user.service.UserWorkLogVO;
import com.yedam.app.user.service.WorkLogViewDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MyPageServiceImpl implements MyPageService {

    private final MyPageMapper myPageMapper;

    private static final String BT_ASSIGNED = "ASSIGNED";
    private static final String BT_REGISTERED = "REGISTERED";

    // 화면에서 허용하는 블록 타입
    private static final Set<String> ALLOWED_BLOCK_TYPES =
            Set.of("ASSIGNED", "REGISTERED", "NOTICE", "CALENDAR", "WORKLOG");

    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    // ================================
    // 블록 목록 조회 (블록 0개일 때만 기본 생성)
    // ================================
    @Override
    @Transactional
    public List<BlockVO> getBlocksEnsured(Integer userCode) {
        List<BlockVO> blocks = myPageMapper.selectBlocks(userCode);

        // ✅ 블록이 0개면 기본 2개만 생성
        if (blocks == null || blocks.isEmpty()) {
            BlockVO a = new BlockVO();
            a.setUserCode(userCode);
            a.setBlockType(BT_ASSIGNED);
            a.setPosition(0);
            myPageMapper.insertBlock(a);

            BlockVO r = new BlockVO();
            r.setUserCode(userCode);
            r.setBlockType(BT_REGISTERED);
            r.setPosition(1);
            myPageMapper.insertBlock(r);

            return myPageMapper.selectBlocks(userCode);
        }

        return blocks;
    }

    // ================================
    // 블록 추가
    // ================================
    @Override
    @Transactional
    public void addBlock(Integer userCode, String blockType) {
        if (blockType == null) return;

        String bt = blockType.toUpperCase();

        // 허용 타입만
        if (!ALLOWED_BLOCK_TYPES.contains(bt)) return;

        // 중복 추가 방지
        List<BlockVO> blocks = myPageMapper.selectBlocks(userCode);
        for (BlockVO b : blocks) {
            if (bt.equalsIgnoreCase(b.getBlockType())) return;
        }

        // 마지막 position + 1
        int maxPos = blocks.stream()
                .map(BlockVO::getPosition)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(-1);

        BlockVO vo = new BlockVO();
        vo.setUserCode(userCode);
        vo.setBlockType(bt);
        vo.setPosition(maxPos + 1);

        myPageMapper.insertBlock(vo);
    }

    // ================================
    // 블록 삭제
    // ================================
    @Override
    @Transactional
    public void deleteBlock(Integer userCode, Integer blockCode) {
        if (blockCode == null) return;
        myPageMapper.deleteBlock(blockCode, userCode);
    }

    // ================================
    // 블록 정렬 저장
    // ================================
    @Override
    @Transactional
    public void saveOrder(Integer userCode, List<Integer> orderedBlockCodes) {
        if (orderedBlockCodes == null) return;

        for (int i = 0; i < orderedBlockCodes.size(); i++) {
            Integer blockCode = orderedBlockCodes.get(i);
            if (blockCode == null) continue;
            myPageMapper.updateBlockPosition(blockCode, userCode, i);
        }
    }

    // ================================
    // 내 페이지 전체 데이터 조립
    // ================================
    @Override
    public Map<String, Object> buildMyPage(Integer userCode, String userName, int days) {
        // 1) 블록 목록
        List<BlockVO> blocks = getBlocksEnsured(userCode);

        // 2) 블록별 데이터
        Map<String, Object> blockData = new HashMap<>();
        int limit = 8;

        for (BlockVO b : blocks) {
            String t = (b.getBlockType() == null) ? "" : b.getBlockType().toUpperCase();

            switch (t) {
                case BT_ASSIGNED -> {
                    List<MyIssueRowDTO> assigned = myPageMapper.selectAssignedIssues(userCode, limit);
                    blockData.put(BT_ASSIGNED, assigned);
                }
                case BT_REGISTERED -> {
                    List<MyIssueRowDTO> registered = myPageMapper.selectRegisteredIssues(userCode, limit);
                    blockData.put(BT_REGISTERED, registered);
                }
                case "NOTICE" -> {
                    List<MyNoticeDTO> notices = myPageMapper.selectRecentNotices(userCode, limit);
                    blockData.put("NOTICE", notices);
                }
                case "CALENDAR" -> {
                    // ✅ 간트차트 데이터
                    blockData.put("CALENDAR", buildWeekGantt(userCode));
                }
                case "WORKLOG" -> {
                    blockData.put("WORKLOG", buildWorkLogsForView(userCode, userName, days));
                }
                default -> {
                }
            }
        }

        // ✅ 이미 존재하는 블록 타입 집합
        Set<String> existed = new HashSet<>();
        for (BlockVO b : blocks) {
            if (b.getBlockType() != null) existed.add(b.getBlockType().toUpperCase());
        }

        // ✅ 모달에 보여줄 "추가 가능한 블록"만 구성 (이미 있으면 제외)
        List<Map<String, String>> addables = new ArrayList<>();
        addIfNotExists(addables, existed, "NOTICE", "최근공지");
        addIfNotExists(addables, existed, "CALENDAR", "달력(주간)");
        addIfNotExists(addables, existed, "WORKLOG", "작업내역");

        // ✅ 오늘/주말(간트 헤더 스타일용)
        String todayStr = LocalDate.now(ZONE).toString();
        Set<String> weekendDays = calcWeekendDaysOfThisWeek();

        Map<String, Object> result = new HashMap<>();
        result.put("blocks", blocks);
        result.put("blockData", blockData);
        result.put("days", Math.max(days, 1));

        result.put("addableBlocks", addables);
        result.put("todayStr", todayStr);
        result.put("weekendDays", weekendDays);

        return result;
    }

    private void addIfNotExists(List<Map<String, String>> out, Set<String> existed, String type, String label) {
        if (existed.contains(type)) return;
        Map<String, String> m = new HashMap<>();
        m.put("type", type);
        m.put("label", label);
        out.add(m);
    }

    private Set<String> calcWeekendDaysOfThisWeek() {
        LocalDate today = LocalDate.now(ZONE);
        LocalDate monday = today.with(DayOfWeek.MONDAY);

        Set<String> weekendDays = new HashSet<>();
        for (int i = 0; i < 7; i++) {
            LocalDate d = monday.plusDays(i);
            DayOfWeek dow = d.getDayOfWeek();
            if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
                weekendDays.add(d.toString());
            }
        }
        return weekendDays;
    }

    // ================================
    // 주간 간트 데이터 만들기
    // - start: started_at 없으면 created_at
    // - end  : resolved_at 없으면 due_at (없으면 start)
    // ================================
    private Map<String, Object> buildWeekGantt(Integer userCode) {
        LocalDate today = LocalDate.now(ZONE);
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        LocalDate nextMonday = monday.plusDays(7);

        Date from = Date.from(monday.atStartOfDay(ZONE).toInstant());
        Date to = Date.from(nextMonday.atStartOfDay(ZONE).toInstant());

        List<WeekGanttIssueDTO> rows = myPageMapper.selectWeekGanttIssues(userCode, from, to);

        // 프로젝트별 그룹
        Map<Integer, Map<String, Object>> byProject = new LinkedHashMap<>();
        for (WeekGanttIssueDTO r : rows) {
            if (r.getProjectCode() == null) continue;

            byProject.computeIfAbsent(r.getProjectCode(), k -> {
                Map<String, Object> m = new HashMap<>();
                m.put("projectCode", r.getProjectCode());
                m.put("projectName", r.getProjectName());
                m.put("items", new ArrayList<WeekGanttIssueDTO>());
                return m;
            });

            @SuppressWarnings("unchecked")
            List<WeekGanttIssueDTO> items = (List<WeekGanttIssueDTO>) byProject.get(r.getProjectCode()).get("items");
            items.add(r);
        }

        // 헤더 day list (yyyy-MM-dd)
        List<String> days = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            days.add(monday.plusDays(i).toString());
        }

        Map<String, Object> out = new HashMap<>();
        out.put("weekStart", monday.toString());
        out.put("days", days);
        out.put("projects", new ArrayList<>(byProject.values()));

        return out;
    }

    // ================================
    // 작업내역(로그) -> 화면용 Map 변환
    // ================================
    private Map<String, List<WorkLogViewDTO>> buildWorkLogsForView(Integer userCode, String actorName, int days) {
        ZonedDateTime now = ZonedDateTime.now(ZONE);

        int d = Math.max(days, 1);
        LocalDate startDay = now.toLocalDate().minusDays(d - 1);
        ZonedDateTime fromZdt = startDay.atStartOfDay(ZONE);

        Date from = Date.from(fromZdt.toInstant());
        Date to = Date.from(now.toInstant());

        List<UserWorkLogVO> logs = myPageMapper.selectWorkLogs(userCode, from, to);

        SimpleDateFormat dayFmt = new SimpleDateFormat("yyyy-MM-dd");
        SimpleDateFormat timeFmt = new SimpleDateFormat("HH:mm");

        Map<String, List<WorkLogViewDTO>> grouped = new LinkedHashMap<>();
        ObjectMapper om = new ObjectMapper();

        for (UserWorkLogVO log : logs) {
            String day = (log.getCreatedAt() == null) ? "unknown" : dayFmt.format(log.getCreatedAt());
            String time = (log.getCreatedAt() == null) ? "" : timeFmt.format(log.getCreatedAt());

            WorkLogViewDTO dto = new WorkLogViewDTO();
            dto.setDay(day);
            dto.setTime(time);
            dto.setActorName(actorName);
            dto.setActionLabel(toKoreanAction(log.getActionType()));
            dto.setProjectName(log.getProjectName());
            dto.setIssueTitle(log.getIssueTitle());
            dto.setDetailHtml(buildDetailHtml(log.getMeta(), om));

            grouped.computeIfAbsent(day, k -> new ArrayList<>()).add(dto);
        }

        return grouped;
    }

    private String toKoreanAction(String actionType) {
        if (actionType == null) return "작업";
        return switch (actionType.toUpperCase()) {
            case "UPDATE" -> "수정";
            case "CREATE" -> "등록";
            case "DELETE" -> "삭제";
            case "REJECT" -> "반려";
            case "APPROVE" -> "완료";
            default -> actionType;
        };
    }

    private String buildDetailHtml(String meta, ObjectMapper om) {
        if (meta == null || meta.isBlank()) return "";

        try {
            JsonNode root = om.readTree(meta);
            JsonNode changes = root.get("changes");
            if (changes == null || !changes.isArray() || changes.size() == 0) return "";

            StringBuilder sb = new StringBuilder();
            for (JsonNode c : changes) {
                String field = text(c.get("field"));
                String before = text(c.get("before"));
                String after = text(c.get("after"));

                String label = toFieldLabel(field);
                String beforeDisp = formatValueByField(field, before);
                String afterDisp = formatValueByField(field, after);

                sb.append(escapeHtml(label)).append(" : ")
                        .append(escapeHtml(nvl(beforeDisp))).append(" &gt;&gt; ")
                        .append(escapeHtml(nvl(afterDisp))).append("<br>");
            }
            return sb.toString();

        } catch (Exception e) {
            return escapeHtml(meta);
        }
    }

    private String nvl(String s) { return (s == null) ? "" : s; }

    private String toFieldLabel(String field) {
        if (field == null) return "변경";
        return switch (field) {
            case "status" -> "상태";
            case "startedAt" -> "시작일";
            case "dueAt" -> "마감일";
            case "resolvedAt" -> "완료일";
            case "progress" -> "진척도";
            default -> field;
        };
    }

    private String formatValueByField(String field, String v) {
        if (v == null || "null".equals(v)) return "";
        if ("startedAt".equals(field) || "dueAt".equals(field) || "resolvedAt".equals(field)) {
            try {
                LocalDateTime dt = LocalDateTime.parse(v, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                return dt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
            } catch (Exception ignore) {
                return v;
            }
        }
        return v;
    }

    private String text(JsonNode n) {
        return (n == null || n.isNull()) ? null : n.asText();
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
