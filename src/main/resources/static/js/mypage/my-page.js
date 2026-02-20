document.addEventListener("DOMContentLoaded", () => {
	const grid = document.getElementById("myBlockGrid");
	if (!grid) return;

	// =========================
	// 블록 타입 라벨(모달 표시용)
	// =========================
	const BLOCK_LABEL = {
		ASSIGNED: "할당된 일감",
		REGISTERED: "등록한 일감",
		NOTICE: "최근공지",
		CALENDAR: "달력(주간)",
		WORKLOG: "작업내역"
	};

	// =========================================================
	// ✅ 헤더 드래그는 유지하면서,
	//    헤더 안 컨트롤(.my-block-actions) 클릭/체크/submit은
	//    드래그 시작을 막아서 정상 동작하게 한다.
	// =========================================================
	["pointerdown", "mousedown", "touchstart"].forEach((evtName) => {
		grid.addEventListener(
			evtName,
			(e) => {
				if (e.target.closest(".my-block-actions")) {
					e.stopPropagation();
				}
			},
			true
		);
	});

	// =========================
	// 블록 추가 모달
	// =========================
	const addBtn = document.getElementById("btnAddBlock");
	const modalEl = document.getElementById("addBlockModal");
	const modal =
		modalEl && window.bootstrap?.Modal ? new bootstrap.Modal(modalEl) : null;

	const modalList = modalEl?.querySelector(".list-group") || null;

	const emptyHint = modalEl
		? Array.from(modalEl.querySelectorAll(".text-muted.small, .text-muted")).find(
			(el) => (el.textContent || "").includes("추가할 수 있는 블록이 없습니다")
		)
		: null;

	if (addBtn && modal) {
		addBtn.addEventListener("click", () => {
			syncModalEmptyHint();
			modal.show();
		});
	}

	// =========================
	// 모달 버튼 클릭(블록 추가) - 이벤트 위임
	// =========================
	if (modalList) {
		modalList.addEventListener("click", async (e) => {
			const btn = e.target.closest(".add-block-item");
			if (!btn) return;

			const type = (btn.dataset.type || "").toUpperCase();
			if (!type) return;

			const res = await fetch(
				`/my/blocks?blockType=${encodeURIComponent(type)}`,
				{ method: "POST" }
			);
			if (res.ok) {
				removeAddable(type);
				syncModalEmptyHint();
				location.reload();
			} else {
				console.warn("블록 추가 실패", await safeText(res));
			}
		});
	}

	// =========================
	// 블록 삭제 (AJAX)
	// =========================
	grid.querySelectorAll(".btnDelBlock").forEach((btn) => {
		btn.addEventListener("click", async (e) => {
			const card = e.target.closest(".my-block");
			const blockCode = card?.dataset?.blockCode;
			const blockType = (card?.dataset?.blockType || "").toUpperCase();
			if (!blockCode) return;

			const res = await fetch(`/my/blocks/${blockCode}`, { method: "DELETE" });
			if (res.ok) {
				card.remove();
				await saveOrder();
				if (blockType) addAddable(blockType);
				syncModalEmptyHint();
			} else {
				console.warn("블록 삭제 실패", await safeText(res));
			}
		});
	});

	// =========================
	// Sortable + AutoScroll + ✅ 드래그 중 휠 스크롤
	// =========================
	if (window.Sortable) {
		// ✅ AutoScroll 플러그인 마운트 (있으면)
		try {
			const AutoScrollPlugin = window.SortableAutoScroll;
			if (AutoScrollPlugin && Sortable.mount) {
				Sortable.mount(new AutoScrollPlugin());
			}
		} catch (e) {
			console.warn("AutoScroll mount failed:", e);
		}

		// ✅ 실제 스크롤 컨테이너 찾기
		const scrollEl = findScrollContainer(grid);
		const rootScroll = document.scrollingElement || document.documentElement;
		const isWinScroll = scrollEl === rootScroll;

		let isDragging = false;
		let wheelHandler = null;

		// ✅ 드래그 중에만 wheel 강제 스크롤 활성화
		function enableWheelScroll() {
			if (wheelHandler) return;

			wheelHandler = (e) => {
				if (!isDragging) return;

				// 트랙패드/휠 모두 대응 (deltaMode=1이면 line 단위라 조금 보정)
				const unit = e.deltaMode === 1 ? 16 : 1;
				const dy = (e.deltaY || 0) * unit;
				const dx = (e.deltaX || 0) * unit;

				if (isWinScroll) {
					// ✅ 윈도우 스크롤은 scrollBy가 제일 안정적
					window.scrollBy(dx, dy);
				} else {
					scrollEl.scrollTop += dy;
					scrollEl.scrollLeft += dx;
				}

				// ✅ Sortable이 wheel을 먹어버리기 전에 우리가 선점
				if (e.cancelable) e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
			};

			// capture + passive:false 필수
			window.addEventListener("wheel", wheelHandler, { capture: true, passive: false });
		}

		function disableWheelScroll() {
			if (!wheelHandler) return;
			window.removeEventListener("wheel", wheelHandler, { capture: true });
			wheelHandler = null;
		}

		new Sortable(grid, {
			animation: 150,
			handle: ".my-block-header",
			filter: "a, button, input, label, select",
			preventOnFilter: true,

			ghostClass: "sortable-ghost",
			chosenClass: "sortable-chosen",
			dragClass: "sortable-drag",

			// ✅ 끝쪽 가져다대면 자동 스크롤(기존 유지)
			scroll: isWinScroll ? true : scrollEl,
			bubbleScroll: true,
			scrollSensitivity: 80,
			scrollSpeed: 15,

			// ✅ window 스크롤일 때도 rootScroll을 직접 움직이기
			scrollFn: (offsetX, offsetY) => {
				if (isWinScroll) {
					window.scrollBy(offsetX, offsetY);
				} else {
					scrollEl.scrollLeft += offsetX;
					scrollEl.scrollTop += offsetY;
				}
			},

			onMove: (evt) => {
				const t = evt.originalEvent?.target;
				if (t && t.closest(".my-block-actions")) return false;
				return true;
			},

			// ✅ 여기서부터가 핵심: unchoose로 끄지 말고 end에서만 끄기
			onStart: () => {
				isDragging = true;
				enableWheelScroll();
				document.body.classList.add("is-dragging");
			},

			onEnd: async () => {
				isDragging = false;
				disableWheelScroll();
				document.body.classList.remove("is-dragging");
				await saveOrder();
			}
		});
	}

	// =========================
	// 순서 저장
	// =========================
	async function saveOrder() {
		const ids = Array.from(grid.querySelectorAll(".my-block"))
			.map((el) => Number(el.dataset.blockCode))
			.filter((n) => !isNaN(n));

		const res = await fetch("/my/blocks/order", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(ids)
		});

		if (!res.ok) console.warn("정렬 저장 실패", await safeText(res));
	}

	async function safeText(res) {
		try {
			return await res.text();
		} catch {
			return "";
		}
	}

	// =========================
	// ✅ 모달 목록 조작 함수들
	// =========================
	function getExistingTypesInGrid() {
		return new Set(
			Array.from(document.querySelectorAll(".my-block"))
				.map((el) => (el.dataset.blockType || "").toUpperCase())
				.filter(Boolean)
		);
	}

	function getExistingAddableTypesInModal() {
		if (!modalEl) return new Set();
		return new Set(
			Array.from(modalEl.querySelectorAll(".add-block-item"))
				.map((el) => (el.dataset.type || "").toUpperCase())
				.filter(Boolean)
		);
	}

	function addAddable(type) {
		if (!modalList) return;

		const t = (type || "").toUpperCase();
		if (!t) return;

		const inGrid = getExistingTypesInGrid().has(t);
		if (inGrid) return;

		const inModal = getExistingAddableTypesInModal().has(t);
		if (inModal) return;

		const label = BLOCK_LABEL[t] || t;

		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "list-group-item list-group-item-action add-block-item";
		btn.dataset.type = t;
		btn.textContent = label;

		modalList.appendChild(btn);
	}

	function removeAddable(type) {
		if (!modalEl) return;
		const t = (type || "").toUpperCase();
		if (!t) return;

		modalEl
			.querySelectorAll(`.add-block-item[data-type="${CSS.escape(t)}"]`)
			.forEach((el) => el.remove());
	}

	function syncModalEmptyHint() {
		if (!modalEl) return;

		const hasAny = modalEl.querySelectorAll(".add-block-item").length > 0;

		if (emptyHint) {
			emptyHint.style.display = hasAny ? "none" : "";
		}
	}

	syncModalEmptyHint();

	// =========================
	// ✅ 간트 bar 위치 계산 + tooltip
	// =========================
	initGantt();

	// =========================
	// ✅ 블록 페이징
	// =========================
	initBlockPaging();

	// =========================
	// ✅ 달력 체크박스 필터
	// =========================
	initCalendarFilter();

	// ✅ 작업내역: 조회 버튼을 AJAX로 처리(페이지 새로고침 방지)
	initWorklogAjax();
});

function initBlockPaging() {
	const PAGE_SIZE = 6;

	setupPager({
		itemSelector: '[data-block-type="ASSIGNED"] tbody tr',
		pagerSelector: '.block-pager[data-pager-for="ASSIGNED"]',
		pageSize: PAGE_SIZE,
		fillMode: "table"
	});

	setupPager({
		itemSelector: '[data-block-type="REGISTERED"] tbody tr',
		pagerSelector: '.block-pager[data-pager-for="REGISTERED"]',
		pageSize: PAGE_SIZE,
		fillMode: "table"
	});

	setupPager({
		itemSelector: '[data-block-type="NOTICE"] .list-group > .list-group-item',
		pagerSelector: '.block-pager[data-pager-for="NOTICE"]',
		pageSize: PAGE_SIZE,
		fillMode: "list"
	});
}

function setupPager({ itemSelector, pagerSelector, pageSize, fillMode }) {
	const pager = document.querySelector(pagerSelector);
	if (!pager) return;

	const pagesWrap = pager.querySelector(".pager-pages");
	const btnPrev = pager.querySelector(".pager-prev");
	const btnNext = pager.querySelector(".pager-next");

	// ✅ itemSelector는 "원본 리스트"를 의미 (dummy 제외)
	const getRealItems = () =>
		Array.from(document.querySelectorAll(itemSelector)).filter(
			(el) => !el.dataset.pagerDummy
		);

	let page = 0;

	// ✅ dummy 제거 유틸
	const clearDummies = () => {
		if (fillMode === "table") {
			const table = itemsContainer();
			if (!table) return;
			table.querySelectorAll('tr[data-pager-dummy="1"]').forEach((tr) => tr.remove());
		} else if (fillMode === "list") {
			const list = itemsContainer();
			if (!list) return;
			list.querySelectorAll('[data-pager-dummy="1"]').forEach((li) => li.remove());
		}
	};

	// ✅ dummy를 붙일 컨테이너 찾기
	function itemsContainer() {
		if (fillMode === "table") {
			const first = document.querySelector(itemSelector);
			return first ? first.closest("tbody") : null;
		}
		if (fillMode === "list") {
			const first = document.querySelector(itemSelector);
			return first ? first.parentElement : null;
		}
		return null;
	}

	// ✅ dummy 생성
	const appendDummies = (count) => {
		if (count <= 0) return;

		if (fillMode === "table") {
			const tbody = itemsContainer();
			if (!tbody) return;

			const table = tbody.closest("table");
			const colCount = table?.querySelectorAll("thead th")?.length || 1;

			for (let i = 0; i < count; i++) {
				const tr = document.createElement("tr");
				tr.setAttribute("data-pager-dummy", "1");
				tr.className = "pager-dummy-row";

				for (let c = 0; c < colCount; c++) {
					const td = document.createElement("td");
					td.innerHTML = "&nbsp;";
					tr.appendChild(td);
				}
				tbody.appendChild(tr);
			}
		}

		if (fillMode === "list") {
			const list = itemsContainer();
			if (!list) return;

			for (let i = 0; i < count; i++) {
				const li = document.createElement("li");
				li.setAttribute("data-pager-dummy", "1");
				li.className = "list-group-item pager-dummy-li";
				li.innerHTML = "&nbsp;";
				list.appendChild(li);
			}
		}
	};

	const render = () => {
		const items = getRealItems();
		const totalPages = Math.ceil(items.length / pageSize);

		if (page > totalPages - 1) page = Math.max(totalPages - 1, 0);

		if (items.length <= pageSize) {
			pager.style.display = "none";
			clearDummies();
			return;
		} else {
			pager.style.display = "";
		}

		const start = page * pageSize;
		const end = start + pageSize;

		clearDummies();

		items.forEach((el, idx) => {
			el.style.display = idx >= start && idx < end ? "" : "none";
		});

		const visibleCount = items.slice(start, end).length;
		const lack = pageSize - visibleCount;

		appendDummies(lack);

		if (btnPrev) btnPrev.disabled = page === 0;
		if (btnNext) btnNext.disabled = page === totalPages - 1;

		if (pagesWrap) {
			pagesWrap.innerHTML = "";

			const windowSize = 7;
			let s = Math.max(0, page - Math.floor(windowSize / 2));
			let e = s + windowSize - 1;
			if (e > totalPages - 1) {
				e = totalPages - 1;
				s = Math.max(0, e - (windowSize - 1));
			}

			for (let p = s; p <= e; p++) {
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className =
					"btn btn-sm btn-outline-secondary pager-page" +
					(p === page ? " is-active" : "");
				btn.textContent = String(p + 1);
				btn.addEventListener("click", () => {
					page = p;
					render();
				});
				pagesWrap.appendChild(btn);
			}
		}
	};

	btnPrev?.addEventListener("click", () => {
		page--;
		render();
	});

	btnNext?.addEventListener("click", () => {
		page++;
		render();
	});

	render();
}

function initGantt() {
	const wraps = document.querySelectorAll(".gantt .gantt-bars");
	if (!wraps.length) return;

	const colorMap = new Map();
	let colorIdx = 0;

	wraps.forEach((barsWrap) => {
		const weekStart = barsWrap.dataset.weekStart;
		if (!weekStart) return;

		const projectCode =
			barsWrap.closest("tr")?.dataset?.project ||
			barsWrap.closest(".gantt-row")?.dataset?.project ||
			barsWrap.closest("[data-project]")?.dataset?.project ||
			"";

		if (projectCode && !colorMap.has(projectCode)) {
			colorMap.set(projectCode, colorIdx % 6);
			colorIdx++;
		}

		const bars = barsWrap.querySelectorAll(".gantt-bar");
		if (!bars.length) return;

		const startBase = new Date(weekStart + "T00:00:00");
		const weekMin = startBase;
		const weekMax = new Date(startBase);
		weekMax.setDate(weekMax.getDate() + 6);

		bars.forEach((bar) => {
			const s = bar.dataset.start;
			const e = bar.dataset.end;
			if (!s) return;

			const start = new Date(s + "T00:00:00");
			const end = e ? new Date(e + "T00:00:00") : start;

			const clippedStart = start < weekMin ? weekMin : start;
			const clippedEnd = end > weekMax ? weekMax : end;

			if (clippedEnd < weekMin || clippedStart > weekMax) {
				bar.style.display = "none";
				return;
			}

			const leftDays = Math.floor((clippedStart - weekMin) / 86400000);
			let spanDays = Math.floor((clippedEnd - clippedStart) / 86400000) + 1;
			if (spanDays < 1) spanDays = 1;

			const leftPct = (leftDays / 7) * 100;
			const widthPct = (spanDays / 7) * 100;

			bar.style.display = "";
			bar.style.left = `calc(${leftPct}% + 6px)`;
			bar.style.width = `calc(${widthPct}% - 12px)`;

			const idx = colorMap.get(projectCode) ?? 0;
			bar.classList.remove(
				"pcolor-0",
				"pcolor-1",
				"pcolor-2",
				"pcolor-3",
				"pcolor-4",
				"pcolor-5"
			);
			bar.classList.add(`pcolor-${idx}`);
		});
	});

	if (window.bootstrap?.Tooltip) {
		document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
			if (!bootstrap.Tooltip.getInstance(el)) new bootstrap.Tooltip(el);
		});
	}

	document.addEventListener("click", (e) => {
		const bar = e.target.closest(".gantt-bar");
		if (!bar) return;

		const issueCode = bar.dataset.issue;
		if (!issueCode) return;

		window.location.href = `/issueInfo?issueCode=${encodeURIComponent(issueCode)}`;
	});
}

function initCalendarFilter() {
	const calBlock = document.querySelector('.my-block[data-block-type="CALENDAR"]');
	if (!calBlock) return;

	const chks = Array.from(calBlock.querySelectorAll(".calFilterChk"));
	if (chks.length === 0) return;

	const chkAssigned = chks.find((c) => c.dataset.kind === "ASSIGNED");
	const chkRegistered = chks.find((c) => c.dataset.kind === "REGISTERED");

	const toYN = (v) => String(v || "").toUpperCase() === "Y";

	function apply() {
		const onA = chkAssigned ? chkAssigned.checked : true;
		const onR = chkRegistered ? chkRegistered.checked : true;

		const allowAny = onA || onR;

		calBlock.querySelectorAll(".gantt-project").forEach((projectEl) => {
			projectEl.style.display = "";

			const table = projectEl.querySelector("table.gantt-table");

			if (!table) {
				projectEl.style.display = "none";
				return;
			}

			const tbody = table.querySelector("tbody");
			const rows = Array.from(tbody.querySelectorAll("tr"));

			tbody.querySelectorAll("td.gantt-left-cell").forEach((td) => td.remove());

			rows.forEach((tr) => {
				if (!allowAny) {
					tr.style.display = "none";
					return;
				}
				const a = toYN(tr.dataset.assigned);
				const r = toYN(tr.dataset.registered);
				const ok = (onA && a) || (onR && r);
				tr.style.display = ok ? "" : "none";
			});

			const visible = rows.filter((tr) => tr.style.display !== "none");

			if (visible.length === 0) {
				projectEl.style.display = "none";
				return;
			}

			const projectName = projectEl.dataset.projectName || "";
			const firstRow = visible[0];

			const leftTd = document.createElement("td");
			leftTd.className = "gantt-left-cell";
			leftTd.rowSpan = visible.length;

			const inner = document.createElement("div");
			inner.className = "gantt-left-inner";
			inner.textContent = projectName;

			leftTd.appendChild(inner);
			firstRow.insertBefore(leftTd, firstRow.firstChild);
		});
	}

	chks.forEach((chk) => chk.addEventListener("change", apply));
	apply();
}

function initWorklogAjax() {
	document.addEventListener(
		"submit",
		async (e) => {
			const form = e.target;
			if (!form) return;

			if (!form.classList.contains("worklog-range")) return;

			e.preventDefault();
			e.stopPropagation();

			const worklogBlock = form.closest('.my-block[data-block-type="WORKLOG"]');
			if (!worklogBlock) return;

			const select = form.querySelector('select[name="days"]');
			const days = select ? select.value : "7";

			const url = new URL(form.getAttribute("action") || "/my", window.location.origin);
			url.searchParams.set("days", days);

			const body = worklogBlock.querySelector(".card-body");
			const oldHTML = body ? body.innerHTML : "";
			if (body) body.style.opacity = "0.6";

			try {
				const res = await fetch(url.toString(), {
					method: "GET",
					headers: { "X-Requested-With": "fetch" }
				});
				if (!res.ok) throw new Error("worklog fetch failed: " + res.status);

				const html = await res.text();
				const doc = new DOMParser().parseFromString(html, "text/html");

				const newWorklogBody = doc.querySelector(
					'.my-block[data-block-type="WORKLOG"] .card-body'
				);

				if (!body || !newWorklogBody) {
					console.warn("WORKLOG 블록(card-body)을 응답 HTML에서 찾지 못함");
					return;
				}

				body.innerHTML = newWorklogBody.innerHTML;
			} catch (err) {
				console.error(err);
				if (body) body.innerHTML = oldHTML;
			} finally {
				if (body) body.style.opacity = "1";
			}
		},
		true
	);
}

function findScrollContainer(el) {
	let cur = el;

	while (cur && cur !== document.body) {
		const style = window.getComputedStyle(cur);
		const overflowY = style.overflowY;
		const overflowX = style.overflowX;

		const canScrollY =
			(overflowY === "auto" || overflowY === "scroll") &&
			cur.scrollHeight > cur.clientHeight;

		const canScrollX =
			(overflowX === "auto" || overflowX === "scroll") &&
			cur.scrollWidth > cur.clientWidth;

		if (canScrollY || canScrollX) return cur;
		cur = cur.parentElement;
	}

	// body/html이 스크롤이면 documentElement로 처리 (크롬에서 실제 스크롤 주체)
	return document.scrollingElement || document.documentElement;
}