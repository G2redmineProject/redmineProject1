package com.yedam.app.mypage.mapper;

import java.util.Date;
import java.util.List;

import org.apache.ibatis.annotations.Param;

import com.yedam.app.mypage.service.BlockVO;
import com.yedam.app.mypage.service.MyIssueRowDTO;
import com.yedam.app.mypage.service.MyNoticeDTO;
import com.yedam.app.mypage.service.WeekGanttIssueDTO;
import com.yedam.app.mypage.service.WeekIssueDTO;
import com.yedam.app.user.service.UserWorkLogVO;

public interface MyPageMapper {

	// 블록 CRUD
	List<BlockVO> selectBlocks(Integer userCode);
	
	int insertBlock(BlockVO vo);
	
	int deleteBlock(@Param("blockCode") Integer blockCode, @Param("userCode") Integer userCode);
	
	int updateBlockPosition(@Param("blockCode") Integer blockCode,
            @Param("userCode") Integer userCode,
            @Param("position") Integer position);
	
	// 블록 데이터
	List<MyIssueRowDTO> selectAssignedIssues(@Param("userCode") Integer userCode, @Param("limit") int limit);
	
	List<MyIssueRowDTO> selectRegisteredIssues(@Param("userCode") Integer userCode, @Param("limit") int limit);

	List<MyNoticeDTO> selectRecentNotices(@Param("userCode") Integer userCode, @Param("limit") int limit);

	List<WeekIssueDTO> selectWeekCalendarIssues(@Param("userCode") Integer userCode,
	                                              @Param("from") Date from,
	                                              @Param("to") Date to);

	List<UserWorkLogVO> selectWorkLogs(@Param("userCode") Integer userCode,
	                                     @Param("from") Date from,
	                                     @Param("to") Date to);
	
	List<WeekGanttIssueDTO> selectWeekGanttIssues(@Param("userCode") Integer userCode,
            @Param("from") Date from,
            @Param("to") Date to);

	
}
