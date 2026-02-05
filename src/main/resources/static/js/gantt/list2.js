(() => {
	//검색조건 HTML 불러오기
	fetch('search.html')
		.then(response => response.text())
		.then(data => {
			document.getElementById('search').innerHTML = data;
		});
	// 기본 초기화
	window.addEventListener("load", () => {
		gantt.init("e7eGantt");
		gantt.setSizes();
		fData();
	});

	window.addEventListener("resize", () => {
		gantt.setSizes();
	});

	// 색깔 에디터 추가
	let editor;
	gantt.config.editor_types.color = {
		show: function(id, column, config, placeholder) {
			var html =
				"<div><input type='color' name='" + column.name + "'></div>";
			placeholder.innerHTML = html;

			editor = $(placeholder)
				.find("input")
				.spectrum({
					change: () => {
						gantt.ext.inlineEditors.save();
					},
				});

			setTimeout(() => {
				editor.spectrum("show");
			});
		},
		hide: function() {
			if (editor) {
				editor.spectrum("destroy");
				editor = null;
			}
		},

		set_value: function(value, id, column, node) {
			editor.spectrum("set", value);
		},

		get_value: function(id, column, node) {
			return editor.spectrum("get").toHexString();
		},

		is_changed: function(value, id, column, node) {
			var newValue = this.get_value(id, column, node);
			return newValue !== value;
		},

		is_valid: function(value, id, column, node) {
			var newValue = this.get_value(id, column, node);
			return !!newValue;
		},

		save: function(id, column, node) {
			// only for inputs with map_to:auto. complex save behavior goes here
		},
		focus: function(node) {
			editor.spectrum("show");
		},
	};

	const colorEditor = {
		type: "color",
		map_to: "color",
	};

	var mainGridConfig = {
		columns: [{
			name: "text",
			tree: true,
			width: 200,
			label: "작업명"
		},

		{
			name: "priority",
			label: "우선순위",
			align: "center",
			width: 70
		},

		{
			name: "status",
			label: "상태",
			align: "center",
			width: 70
		},

		{
			name: "progress",
			label: "진척도",
			align: "center",
			width: 60,
			template: (t) => Math.round((t.progress || 0) * 100) + "%",
		},

		{
			name: "start_date",
			label: "시작일",
			align: "center",
			width: 110,
			template: (t) => t.start_date ? gantt.templates.date_grid(t.start_date) : ""
		},

		{
			name: "end_date",
			label: "종료일",
			align: "center",
			width: 110,
			template: (t) => t.end_date ? gantt.templates.date_grid(t.end_date) : ""
		},

		{
			name: "assigneeName",
			label: "작업자",
			align: "center",
			width: 80,
		},
		{
			name: "add",
			width: 44
		}
		],
	};

	var resourcePanelConfig = {
		columns: [{
			name: "name",
			label: "Name",
			align: "center",
			template: function(resource) {
				return resource.label;
			},
		},
		{
			name: "workload",
			label: "Workload",
			align: "center",
			template: function(resource) {
				var tasks = gantt.getTaskBy("user", resource.id);

				var totalDuration = 0;
				for (var i = 0; i < tasks.length; i++) {
					totalDuration += tasks[i].duration;
				}

				return (totalDuration || 0) * 8 + "";
			},
		},
		],
	};

	gantt.config.layout = {
		css: "gantt_container",
		rows: [{
			cols: [{
				view: "grid",
				group: "grids",
				config: mainGridConfig,
				scrollY: "scrollVer",
			},
			{
				resizer: true,
				width: 1,
				group: "vertical",
			},
			{
				view: "timeline",
				id: "timeline",
				scrollX: "scrollHor",
				scrollY: "scrollVer",
			},
			{
				view: "scrollbar",
				id: "scrollVer",
				group: "vertical",
			},
			],
		},
		{
			view: "scrollbar",
			id: "scrollHor",
		},
		],
	};

	// 기본 설정
	gantt.i18n.setLocale("kr");

	gantt.config.scales = [{
		unit: "month",
		step: 1,
		format: "%Y-%m",
	},
	{
		unit: "day",
		step: 1,
		format: "%d, %D",
	},
	];

	//날짜 형식
	gantt.config.date_format = "%Y-%m-%d %H:%i"; // 실제 전달되는 데이타의 start_date등의 포맷
	gantt.config.task_date = "%Y년 %m월 %d일";

	//===== 우선순위별 색상 템플릿 =====
	gantt.templates.task_class = function(start, end, task) {
		if (task.priority === "긴급") return "priority-now";
		if (task.priority === "높음") return "priority-high";
		if (task.priority === "보통") return "priority-medium";
		if (task.priority === "낮음") return "priority-low";
		return "";
	};

	// 비동기 데이터 가져오기
	const fData = async () => {
		try {
			let response = await fetch("/ganttData");
			let rawData = await response.json();

			// 프로젝트별로 그룹화
			let projectMap = new Map();

			rawData.forEach((item) => {
				if (!projectMap.has(item.projectCode)) {
					projectMap.set(item.projectCode, {
						projectName: item.projectName,
						issues: [],
					});
				}
				projectMap.get(item.projectCode).issues.push(item);
			});

			// dhtmlxGantt 형식으로 데이터 변환
			let transformedData = {
				data: [],
				links: [],
			};

			// 프로젝트와 일감을 트리 구조로 생성
			projectMap.forEach((project, projectCode) => {

				const startTimes = project.issues
					.map(i => i.issueStartDate)
					.filter(Boolean)
					.map(d => new Date(d).getTime());

				const endTimes = project.issues
					.map(i => i.issueEndDate)
					.filter(Boolean)
					.map(d => new Date(d).getTime());

				const projectStart = startTimes.length ?
					new Date(Math.min(...startTimes)) :
					null;

				const projectEnd = endTimes.length ?
					new Date(Math.max(...endTimes)) :
					null;

				const projectProgress =
					project.issues[0]?.projectProgress ?? 0;

				// 프로젝트 (부모)
				transformedData.data.push({
					id: "project_" + projectCode,
					text: project.projectName,
					start_date: projectStart,
					end_date: projectEnd,
					progress: projectProgress / 100,
					parent: 0,
					open: true,
					type: gantt.config.types.project,
				});

				// 일감들 (자식)
				project.issues.forEach((item) => {
					transformedData.data.push({
						id: item.issueCode,
						text: item.title,
						start_date: item.issueStartDate ?
							new Date(item.issueStartDate) : null,
						end_date: item.issueEndDate ?
							new Date(item.issueEndDate) : null,
						duration: item.duration || 1,
						progress: (item.progress || 0) / 100,
						priority: item.priority || "",
						status: item.issueStatus || "",
						assigneeName: item.assigneeName || "",
						user: item.assigneeCode ?? "0",
						parent: "project_" + projectCode
					});
				});
			});

			gantt.parse(transformedData);
		} catch (error) {
			console.error("데이터 로딩 실패:", error);
		}
	};
})();