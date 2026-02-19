// /js/overview/overview.js 
document.querySelectorAll('#mainIssueTable tr.click-row').forEach(row => {
    row.addEventListener('click', () => {
        const url = row.getAttribute('data-url');
        if(url) {
            window.location.href = url;
        }
    });
});
