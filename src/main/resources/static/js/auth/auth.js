(() => {
	const $ = (sel) => document.querySelector(sel);
	const $$ = (sel) => Array.from(document.querySelectorAll(sel));

	const pageSize = 10;

	const rowsAll = () => $$("#projectTbody tr.projectRow");
	const rowsVisible = () => rowsAll().filter((tr) => tr.dataset.filtered !== "1");

	const ui = {
		title: $("#filterTitle"),
		btnApply: $("#btnApplyFilters"),
		btnReset: $("#btnResetFilters"),
		pagination: $("#projectPagination"),
		pageInfo: $("#projectPageInfo"),
	};

	let currentPage = 1;

	// 행 데이터 추출
	function rowData(tr) {
		const cells = tr.querySelectorAll("td");
		return {
			number: cells[0]?.textContent.trim() || "",
			roleName: cells[1]?.textContent.trim() || "",
			explanation: cells[2]?.textContent.trim() || "",
		};
	}

	// 필터 적용
	function applyFilters() {
		const roleName = ui.title.value.trim().toLowerCase();

		rowsAll().forEach((tr) => {
			const d = rowData(tr);
			let ok = true;

			if (roleName && !d.roleName.toLowerCase().includes(roleName)) {
				ok = false;
			}

			tr.dataset.filtered = ok ? "0" : "1";
		});

		currentPage = 1;
		renderPage();
	}

	// 필터 초기화
	function resetFilters() {
		ui.title.value = "";
		rowsAll().forEach((tr) => (tr.dataset.filtered = "0"));
		currentPage = 1;
		renderPage();
	}

	// 페이지네이션 렌더링
	function renderPagination(totalPages) {
		ui.pagination.innerHTML = "";
		if (totalPages <= 1) return;

		const makeItem = (label, page, disabled, active) => {
			const li = document.createElement("li");
			li.className = "page-item";
			if (disabled) li.classList.add("disabled");
			if (active) li.classList.add("active");

			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "page-link";
			btn.textContent = label;
			btn.addEventListener("click", () => {
				if (disabled) return;
				currentPage = page;
				renderPage();
			});

			li.appendChild(btn);
			return li;
		};

		ui.pagination.appendChild(
			makeItem("이전", Math.max(1, currentPage - 1), currentPage === 1, false)
		);

		for (let p = 1; p <= totalPages; p++) {
			ui.pagination.appendChild(makeItem(String(p), p, false, p === currentPage));
		}

		ui.pagination.appendChild(
			makeItem("다음", Math.min(totalPages, currentPage + 1), currentPage === totalPages, false)
		);
	}

	// 페이지 렌더링
	function renderPage() {
		const visible = rowsVisible();
		const total = visible.length;
		const totalPages = Math.max(1, Math.ceil(total / pageSize));

		if (currentPage > totalPages) currentPage = totalPages;

		const start = (currentPage - 1) * pageSize;
		const end = start + pageSize;

		rowsAll().forEach((tr) => {
			tr.style.display = "none";
		});

		visible.slice(start, end).forEach((tr) => {
			tr.style.display = "";
		});

		renderPagination(totalPages);

		if (ui.pageInfo) {
			const from = total === 0 ? 0 : start + 1;
			const to = Math.min(end, total);
			ui.pageInfo.textContent = `${from}-${to} / ${total}`;
		}
	}
	// 삭제 버튼 이벤트
	$("#projectTbody").addEventListener("click", async (e) => {
	    const btn = e.target.closest("button");
	    if (!btn || !btn.classList.contains("delete-btn")) return;

	    const row = btn.closest("tr");
	    const roleCode = row.dataset.roleCode;
	    const roleName = rowData(row).roleName;

	    if (!confirm(`"${roleName}" 역할을 삭제하시겠습니까?`)) return;

	    try {
	        const response = await fetch(`/api/auth/${roleCode}/delete`, {
	            method: 'POST',
	            headers: {
	                'Content-Type': 'application/json'
	            }
	        });

	        const result = await response.json();

	        if (result.success) {
	            alert(result.message);
	            // 화면에서 제거
	            row.dataset.filtered = "1";
	            row.style.display = "none";
	            renderPage();
	        } else {
	            alert(result.message); // "삭제 권한이 없습니다." 메시지 표시
	        }
	    } catch (error) {
	        console.error('삭제 오류:', error);
	        alert('삭제 처리 중 오류가 발생했습니다.');
	    }
	});

	// 체크박스는 읽기 전용으로 설정 (클릭 방지)
	$$("input[name='adminck']").forEach((checkbox) => {
		checkbox.addEventListener("click", (e) => {
			e.preventDefault(); // 클릭 방지
		});
	});

	// 이벤트 바인딩
	ui.btnApply.addEventListener("click", applyFilters);
	ui.btnReset.addEventListener("click", resetFilters);

	// 초기 화면 설정
	rowsAll().forEach((tr) => {
		tr.dataset.filtered = "0";
	});

	// 초기 렌더링
	renderPage();
})();