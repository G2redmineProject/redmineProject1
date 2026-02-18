// /js/calendar/list.js
(() => {

    document.addEventListener('DOMContentLoaded', function() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        let currentFilters = {};

        const headerToolbar = {
            left: 'prevYear,prev,next,nextYear today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,timeGridDay'
        };

        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: headerToolbar,

            locale: 'ko',

            titleFormat: function(dateInfo) {
                const year = dateInfo.date.year;
                const month = dateInfo.date.month + 1;
                return `${year}년 ${month}월`;
            },

            events: function(fetchInfo, successCallback, failureCallback) {
                fetch("/calendarData")
                    .then(res => res.json())
                    .then(data => {

                        const events = data
                            .filter(r => r.rowType === "ISSUE")
                            .filter(r => {
                                // -------------------------
                                // 검색조건 필터링
                                // -------------------------
                                if (currentFilters.projectCode &&
                                    String(r.projectCode) !== String(currentFilters.projectCode)) {
                                    return false;
                                }

                                if (currentFilters.title &&
                                    !r.title?.toLowerCase().includes(currentFilters.title)) {
                                    return false;
                                }

                                if (currentFilters.type &&
                                    String(r.typeCode) !== String(currentFilters.type)) {
                                    return false;
                                }

                                if (currentFilters.status &&
                                    r.issueStatus !== currentFilters.status) {
                                    return false;
                                }

                                if (currentFilters.priority &&
                                    r.priority !== currentFilters.priority) {
                                    return false;
                                }

                                if (currentFilters.assigneeCode &&
                                    String(r.assigneeCode) !== String(currentFilters.assigneeCode)) {
                                    return false;
                                }

                                if (currentFilters.createdAt &&
                                    r.createdAt !== currentFilters.createdAt) {
                                    return false;
                                }

                                if (currentFilters.dueAt &&
                                    r.dueAt !== currentFilters.dueAt) {
                                    return false;
                                }

                                return true;
                            })
                            .map(r => {

                                let color = '#5AB2FF';

                                if (r.issueStatus === '신규') color = '#90b8ff';
                                else if (r.issueStatus === '진행') color = '#ffe27a';
                                else if (r.issueStatus === '해결') color = '#a78bfa';
                                else if (r.issueStatus === '반려') color = '#f8a1d1';
                                else if (r.issueStatus === '완료') color = '#8fe6a2';

                                const addOneDay = (dateStr) => {
                                    if (!dateStr) return null;
                                    const d = new Date(dateStr);
                                    d.setDate(d.getDate() + 1);
                                    return d;
                                };

                                const endDate = r.issueEndDate || r.dueAt;

                                const progressText = r.progress != null ? `${r.progress}%` : '';
                                const displayTitle = `${r.title}(${progressText})`;

                                return {
                                    id: r.nodeId,
                                    title: displayTitle,
                                    start: r.issueStartDate || r.startedAt,
                                    end: addOneDay(endDate),
                                    allDay: true,

                                    backgroundColor: color,
                                    borderColor: color,

                                    extendedProps: {
                                        issueCode: r.issueCode,
                                        projectName: r.projectName,
                                        assignee: r.assigneeName,
                                        priority: r.priority,
                                        status: r.issueStatus
                                    }
                                };
                            });

                        successCallback(events);
                    })
                    .catch(err => {
                        failureCallback(err);
                    });
            },

            eventClick: function(info) {
                const issueCode =
                    info.event.extendedProps.issueCode ||
                    info.event.id?.replace('ISSUE_', '');

                if (!issueCode) return;

                window.location.href = `/issueInfo?issueCode=${issueCode}`;
            }
        });

        calendar.render();

        window.calendarReload = (filters = {}) => {
            currentFilters = filters || {};
            calendar.refetchEvents();
        };
    });

})();
