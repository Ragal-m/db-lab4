// Pages F2.1 - F2.6: every page asks the server for the result of one SQL query and shows it as a table.
const PAGES = {
    f22: '/api/reports/catalogue',
    f23: '/api/reports/summary',
    f24: '/api/reports/loans',
    f25: '/api/reports/most-borrowed',
    f26: '/api/reports/authors-books'
};
const loaded = {};

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => openTab(tab.dataset.tab));
    });
    document.getElementById('searchForm').addEventListener('submit', runSearch);
    loadCategories();
    runSearch(); // show all the books at first
});

function $(id) { return document.getElementById(id); }

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text === null || text === undefined ? '' : String(text);
    return div.innerHTML;
}

async function api(url) {
    const response = await fetch(url);
    if (response.status === 401) {
        window.location.href = '/login';
        throw new Error('Not logged in');
    }
    let data = {};
    try { data = await response.json(); } catch (e) { /* no body */ }
    return { ok: response.ok, data };
}

function openTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('.panel').forEach(p => { p.style.display = p.id === name ? 'block' : 'none'; });
    $('pageError').textContent = '';
    if (PAGES[name] && !loaded[name]) loadPage(name);
}

// a result table; NULL is shown as "-" (for example return_date of a loan, or a missing year)
function tableHtml(result) {
    let html = '';
    if (result.title) html += `<h2 class="result-title">${escapeHtml(result.title)}</h2>`;
    if (result.rows.length === 0) return html + '<div class="empty-state"><p>No rows.</p></div>';
    html += '<div class="table-wrap"><table class="data-table"><thead><tr>';
    html += result.columns.map(c => `<th>${escapeHtml(c)}</th>`).join('');
    html += '</tr></thead><tbody>';
    result.rows.forEach(row => {
        html += '<tr>' + result.columns.map(c => {
            const value = row[c];
            return `<td>${value === null || value === undefined ? '-' : escapeHtml(value)}</td>`;
        }).join('') + '</tr>';
    });
    return html + '</tbody></table></div>';
}

async function loadPage(name) {
    const box = document.querySelector(`#${name} .result`);
    box.innerHTML = '<p class="muted">Loading...</p>';
    try {
        const { ok, data } = await api(PAGES[name]);
        if (!ok) {
            box.innerHTML = '';
            $('pageError').textContent = data.error || 'Failed to load the page';
            return;
        }
        box.innerHTML = data.tables.map(tableHtml).join('');
        loaded[name] = true;
    } catch (error) {
        console.error('Error loading page:', error);
    }
}

// ---------- F2.1 ----------
async function loadCategories() {
    try {
        const { ok, data } = await api('/api/lists/categories');
        if (!ok) return;
        data.categories.forEach(c => {
            const option = document.createElement('option');
            option.value = c.category_id;
            option.textContent = c.name;
            $('kCategory').appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function runSearch(event) {
    if (event) event.preventDefault();
    ['kMinError', 'kMaxError', 'kCategoryError'].forEach(id => { $(id).textContent = ''; });
    $('pageError').textContent = '';

    const params = new URLSearchParams({
        title: $('kTitle').value.trim(),
        min: $('kMin').value.trim(),
        max: $('kMax').value.trim(),
        category: $('kCategory').value
    });

    try {
        const { ok, data } = await api('/api/search/books?' + params.toString());
        if (!ok) {
            const errs = data.errors || {};
            $('kMinError').textContent = errs.min || '';
            $('kMaxError').textContent = errs.max || '';
            $('kCategoryError').textContent = errs.category || '';
            if (!data.errors) $('pageError').textContent = data.error || 'Search failed';
            return;
        }
        const count = data.rows.length;
        $('f21Result').innerHTML = `<p class="muted">${count} book${count === 1 ? '' : 's'} found, cheapest first</p>` +
            tableHtml({ columns: data.columns, rows: data.rows });
    } catch (error) {
        console.error('Error searching:', error);
    }
}
