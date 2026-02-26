document.addEventListener("DOMContentLoaded", () => {
	const rows = document.querySelectorAll(".doc-row");
	const tbody = document.getElementById("docsTableBody");

	if (!rows.length) return;

	const fragment = document.createDocumentFragment();
	const renderedFolders = new Set();

	rows.forEach(row => {
		const rowType = row.dataset.rowType;
		const projectCode = row.dataset.projectCode;
		const projectName = row.dataset.projectName;
		const fileCode = row.dataset.fileCode;
		const fileName = row.dataset.fileName;
		const folderCode = row.dataset.folderCode;
		const folderPath = row.dataset.folderPath || "";
		const folderDepth = parseInt(row.dataset.folderDepth) || 0;
		const sizeBytes = parseInt(row.dataset.size) || 0;
		const uploadedAt = row.dataset.uploadedAt || "";
		const uploader = row.dataset.uploader || "";

		if (rowType === "PROJECT") {
			const tr = document.createElement("tr");
			tr.className = "row-project";
			tr.dataset.projectCode = projectCode;
			tr.style.cursor = "pointer";
			tr.innerHTML = `
				<td colspan="6" class="fw-bold py-2">
					<span class="project-toggle me-2">▶</span>
					<i class="fa-solid fa-folder-closed project-icon me-1"></i> ${projectName}
				</td>`;
			tr.addEventListener("click", () => toggleRows(projectCode));
			fragment.appendChild(tr);

		} else if (rowType === "FOLDER") {
			const folderKey = projectCode + ":" + folderCode;
			if (renderedFolders.has(folderKey)) return;
			renderedFolders.add(folderKey);

			const tr = document.createElement("tr");
			tr.className = "row-folder";
			tr.dataset.projectCode = projectCode;
			tr.dataset.folderPath = folderPath;
			tr.dataset.folderDepth = folderDepth;

			const indentPx = folderDepth * 24;
			const folderName = row.dataset.folderName || "폴더";
			const hasChild = hasChildren(projectCode, folderPath, rows);
			const arrow = hasChild ? '<span class="folder-toggle me-2">▶</span>' : '';

			tr.innerHTML = `
			    <td style="padding-left:${indentPx + 16}px;">
			        ${arrow} <i class="fa-solid fa-folder-closed folder-icon me-1"></i> ${folderName}
			    </td>
			    <td></td>
			    <td>
			        <a href="/api/folders/${folderCode}/download" class="btn btn-sm btn-primary">
			            <i class="fas fa-download"></i>
			        </a>
			    </td>
			    <td></td>
			    <td></td>
			    <td>
			        <button type="button" class="btn btn-sm btn-danger btn-delete-folder"
			            data-folder-code="${folderCode}"
			            data-folder-name="${folderName}">
			            <i class="fas fa-trash"></i>
			        </button>
			    </td>`;

			if (hasChild) {
				tr.style.cursor = "pointer";
				tr.addEventListener("click", e => {
					e.stopPropagation();
					toggleFolder(tr);
				});
			}

			tr.style.display = "none"; // 초기 닫힘
			fragment.appendChild(tr);

		} else if (rowType === "FILE") {
			const tr = document.createElement("tr");
			tr.className = "row-file";
			tr.dataset.projectCode = projectCode;
			tr.dataset.folderPath = folderPath;
			tr.dataset.folderDepth = folderDepth;

			const sizeKb = sizeBytes >= 1024 * 1024
				? (sizeBytes / 1024 / 1024).toFixed(1) + " MB"
				: (sizeBytes / 1024).toFixed(1) + " KB";

			const ext = (fileName || "").split(".").pop().toLowerCase();
			const extIcons = {
				pdf: "📄", doc: "📝", docx: "📝",
				xls: "📊", xlsx: "📊", ppt: "📋", pptx: "📋",
				jpg: "🖼️", jpeg: "🖼️", png: "🖼️", gif: "🖼️",
				zip: "🗜️", txt: "📃"
			};
			const icon = extIcons[ext] || "📎";
			const indentPx = (folderDepth + 1) * 24;

			tr.innerHTML = `
				<td style="padding-left:${indentPx + 16}px;">
					${icon} ${fileName}
				</td>
				<td>${sizeKb}</td>
				<td>
					<a href="/docsDownload?fileCode=${fileCode}" class="btn btn-sm btn-primary">
						<i class="fas fa-download"></i>
					</a>
				</td>
				<td>${uploadedAt}</td>
				<td>${uploader}</td>
				<td>
					<button type="button" class="btn btn-sm btn-danger btn-delete"
						data-file-code="${fileCode}"
						data-file-name="${fileName}">
						<i class="fas fa-trash"></i>
					</button>
				</td>`;
			tr.style.display = "none"; // 초기 닫힘
			fragment.appendChild(tr);
		}
	});

	rows.forEach(r => r.remove());
	tbody.appendChild(fragment);

	// 파일 삭제 버튼
	tbody.querySelectorAll(".btn-delete").forEach(btn => {
		btn.addEventListener("click", async () => {
			const fileCode = btn.dataset.fileCode;
			const fileName = btn.dataset.fileName;
			if (!confirm(`'${fileName}' 파일을 삭제하시겠습니까?`)) return;
			try {
				const res = await fetch(`/api/docs/${fileCode}`, { method: "DELETE" });
				if (!res.ok) throw new Error("삭제 실패");
				btn.closest("tr").remove();
			} catch (e) {
				alert(e.message);
			}
		});
	});

	// 폴더 삭제 버튼
	tbody.querySelectorAll(".btn-delete-folder").forEach(btn => {
		btn.addEventListener("click", async (e) => {
			e.stopPropagation();
			const folderCode = btn.dataset.folderCode;
			const folderName = btn.dataset.folderName;
			if (!confirm(`'${folderName}' 폴더를 삭제하시겠습니까?\n비어있는 폴더만 삭제 가능합니다.`)) return;
			try {
				const res = await fetch(`/api/folders/${folderCode}`, { method: "DELETE" });
				const data = await res.json();
				if (!res.ok) {
					alert(data.message);
					return;
				}
				btn.closest("tr").remove();
			} catch (e) {
				alert("서버 오류가 발생했습니다.");
			}
		});
	});
});

function setFolderIcon(folderRow, open) {
	const icon = folderRow.querySelector(".folder-icon");
	if (!icon) return;
	icon.classList.remove("fa-folder-open", "fa-folder-closed");
	icon.classList.add(open ? "fa-folder-open" : "fa-folder-closed");
}

function toggleRows(projectCode) {
	const header = document.querySelector(`.row-project[data-project-code="${projectCode}"]`);
	const toggle = header?.querySelector(".project-toggle");
	const icon = header?.querySelector(".project-icon");

	// depth=1인 FOLDER, depth=0인 FILE(폴더 없이 바로 프로젝트 아래)만
	const directChildren = Array.from(document.querySelectorAll(
		`.row-folder[data-project-code="${projectCode}"],
         .row-file[data-project-code="${projectCode}"]`
	)).filter(r => parseInt(r.dataset.folderDepth || 0) <= 1
		&& (r.classList.contains("row-folder")
			? parseInt(r.dataset.folderDepth) === 1
			: parseInt(r.dataset.folderDepth) === 0));

	const isVisible = directChildren[0]?.style.display !== "none";

	// 열 때는 직계만, 닫을 때는 전체 다 닫기
	if (isVisible) {
		// 전체 닫기
		document.querySelectorAll(
			`.row-folder[data-project-code="${projectCode}"],
             .row-file[data-project-code="${projectCode}"]`
		).forEach(r => {
			r.style.display = "none";
			const ft = r.querySelector(".folder-toggle");
			if (ft) ft.textContent = "▶";
			const fi = r.querySelector(".folder-icon");
			if (fi) { fi.classList.remove("fa-folder-open"); fi.classList.add("fa-folder-closed"); }
		});
		if (toggle) toggle.textContent = "▶";
		if (icon) { icon.classList.remove("fa-folder-open"); icon.classList.add("fa-folder-closed"); }
	} else {
		// 직계만 열기
		directChildren.forEach(r => {
			r.style.display = "";
		});
		if (toggle) toggle.textContent = "▼";
		if (icon) { icon.classList.remove("fa-folder-closed"); icon.classList.add("fa-folder-open"); }
	}
}

function toggleFolder(folderRow) {
	const folderPath = folderRow.dataset.folderPath;
	const projectCode = folderRow.dataset.projectCode;
	const toggle = folderRow.querySelector(".folder-toggle");
	const icon = folderRow.querySelector(".folder-icon");
	if (!toggle) return;

	const allFolders = document.querySelectorAll(`.row-folder[data-project-code="${projectCode}"]`);
	const allFiles = document.querySelectorAll(`.row-file[data-project-code="${projectCode}"]`);
	const isOpen = toggle.textContent === "▼";

	if (isOpen) {
		allFolders.forEach(r => {
			const path = r.dataset.folderPath || "";
			if (path.startsWith(folderPath + "/")) {
				r.style.display = "none";
				const ft = r.querySelector(".folder-toggle");
				if (ft) ft.textContent = "▶";
				const fIcon = r.querySelector(".folder-icon");
				if (fIcon) setFolderIcon(r, false);
			}
		});

		allFiles.forEach(r => {
			const path = r.dataset.folderPath || "";
			if (path === folderPath || path.startsWith(folderPath + "/")) r.style.display = "none";
		});

		if (icon) setFolderIcon(folderRow, false);
		toggle.textContent = "▶";
	} else {
		allFolders.forEach(r => {
			const path = r.dataset.folderPath || "";
			if (isDirectChildFolder(folderPath, path)) r.style.display = "";
		});

		allFiles.forEach(r => {
			const path = r.dataset.folderPath || "";
			if (path === folderPath) r.style.display = "";
		});

		if (icon) setFolderIcon(folderRow, true);
		toggle.textContent = "▼";
	}
}

function isDirectChildFolder(parentPath, childPath) {
	if (!childPath.startsWith(parentPath + "/")) return false;
	const parentDepth = (parentPath.match(/\//g) || []).length;
	const childDepth = (childPath.match(/\//g) || []).length;
	return childDepth === parentDepth + 1;
}

function hasChildren(projectCode, folderPath, allRows) {
	const normalized = folderPath.replace(/\/$/, "");
	return Array.from(allRows).some(r => {
		if (r.dataset.projectCode !== projectCode) return false;
		const path = (r.dataset.folderPath || "").replace(/\/$/, "");
		const rowType = r.dataset.rowType;
		return (rowType === "FOLDER" && path !== normalized && path.startsWith(normalized + "/"))
			|| (rowType === "FILE" && path === normalized);
	});
}