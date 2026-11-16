// Lab 4 - Problem 2: the search pages F2.1 - F2.6.
// The SQL here is the same SQL as in problem2_Queries.sql (there with example values instead of ?).
const express = require('express');
const pool = require('./pool');

const router = express.Router();

// logged-out users get JSON 401 instead of a redirect
router.use(['/search', '/lists', '/reports'], (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    next();
});

// run one query and return { title, columns, rows }
async function table(title, sql, params = []) {
    const [rows, fields] = await pool.execute(sql, params);
    return { title, columns: fields.map(f => f.name), rows };
}

function failure(res, label, error) {
    console.error(`${label} error:`, error);
    res.status(500).json({ error: `Failed to load ${label}. Check that problem2_DDL.sql and problem2_DML.sql were run.` });
}

// ---------- lists for the form drop-downs ----------
router.get('/lists/categories', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT category_id, name FROM CATEGORY ORDER BY name');
        res.json({ categories: rows });
    } catch (error) { failure(res, 'categories', error); }
});

router.get('/lists/publishers', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT publisher_id, name FROM PUBLISHER ORDER BY name');
        res.json({ publishers: rows });
    } catch (error) { failure(res, 'publishers', error); }
});

// ---------- F2.1 Search books (WHERE, LIKE, BETWEEN) - prepared statement (bonus) ----------
router.get('/search/books', async (req, res) => {
    const title = String(req.query.title || '').trim();
    const minText = String(req.query.min || '').trim();
    const maxText = String(req.query.max || '').trim();
    const category = String(req.query.category || '').trim();

    const errors = {};
    const min = minText === '' ? 0 : Number(minText);
    const max = maxText === '' ? 99999999.99 : Number(maxText);
    if (!Number.isFinite(min) || min < 0) errors.min = 'Minimum price must be a number of 0 or more';
    if (!Number.isFinite(max) || max < 0) errors.max = 'Maximum price must be a number of 0 or more';
    if (!errors.min && !errors.max && min > max) errors.max = 'Maximum price must not be smaller than the minimum';
    if (category !== '' && !/^[1-9][0-9]*$/.test(category)) errors.category = 'Choose a category from the list';
    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

    // the user's text only travels as a ? parameter, never inside the SQL text
    const keyword = '%' + title.replace(/[\\%_]/g, '\\$&') + '%';
    let sql = `SELECT book_id, title, price, publish_year, author_id, category_id
FROM BOOK
WHERE title LIKE ? AND price BETWEEN ? AND ?`;
    const params = [keyword, min, max];
    if (category !== '') {
        sql += ' AND category_id = ?';
        params.push(Number(category));
    }
    sql += '\nORDER BY price ASC';

    try {
        res.json(await table('Matching books', sql, params));
    } catch (error) { failure(res, 'search', error); }
});

// ---------- F2.2 Catalogue (JOIN) ----------
router.get('/reports/catalogue', async (req, res) => {
    try {
        res.json({ tables: [await table('All books', `SELECT b.book_id, b.title, b.price, b.publish_year,
       a.name AS author, p.name AS publisher, c.name AS category
FROM BOOK b
JOIN AUTHOR a    ON b.author_id = a.author_id
JOIN PUBLISHER p ON b.publisher_id = p.publisher_id
JOIN CATEGORY c  ON b.category_id = c.category_id
ORDER BY b.book_id`)] });
    } catch (error) { failure(res, 'catalogue', error); }
});

// ---------- F2.3 Reports (GROUP BY, HAVING) ----------
router.get('/reports/summary', async (req, res) => {
    try {
        res.json({ tables: [
            await table('(a) Books and average price of each category', `SELECT c.name AS category, COUNT(b.book_id) AS books, ROUND(AVG(b.price), 2) AS average_price
FROM CATEGORY c
LEFT JOIN BOOK b ON b.category_id = c.category_id
GROUP BY c.category_id, c.name
ORDER BY c.name`),
            await table('(b) Authors who wrote at least 2 books', `SELECT a.author_id, a.name, COUNT(*) AS books
FROM AUTHOR a
JOIN BOOK b ON b.author_id = a.author_id
GROUP BY a.author_id, a.name
HAVING COUNT(*) >= 2
ORDER BY books DESC, a.name`),
            await table('(c) Total, smallest and largest price of the library', `SELECT SUM(price) AS total_price, MIN(price) AS smallest_price, MAX(price) AS largest_price
FROM BOOK`)
        ] });
    } catch (error) { failure(res, 'reports', error); }
});

// ---------- F2.4 Loans (JOIN, LEFT JOIN) ----------
router.get('/reports/loans', async (req, res) => {
    try {
        res.json({ tables: [
            await table('(a) Loans not returned yet', `SELECT l.loan_id, b.title, m.name AS member, l.loan_date
FROM LOAN l
JOIN BOOK b   ON l.book_id = b.book_id
JOIN MEMBER m ON l.member_id = m.member_id
WHERE l.return_date IS NULL
ORDER BY l.loan_date`),
            await table('(b) Members who never borrowed a book', `SELECT m.member_id, m.name, m.email
FROM MEMBER m
LEFT JOIN LOAN l ON l.member_id = m.member_id
WHERE l.loan_id IS NULL
ORDER BY m.member_id`),
            await table('(c) Books that were never borrowed', `SELECT b.book_id, b.title
FROM BOOK b
LEFT JOIN LOAN l ON l.book_id = b.book_id
WHERE l.loan_id IS NULL
ORDER BY b.book_id`)
        ] });
    } catch (error) { failure(res, 'loans', error); }
});

// ---------- F2.5 Most borrowed (GROUP BY, ORDER BY, LIMIT) ----------
router.get('/reports/most-borrowed', async (req, res) => {
    try {
        res.json({ tables: [
            await table('(a) The 3 books with the most loans', `SELECT b.book_id, b.title, COUNT(*) AS loans
FROM BOOK b
JOIN LOAN l ON l.book_id = b.book_id
GROUP BY b.book_id, b.title
ORDER BY loans DESC, b.title
LIMIT 3`),
            await table('(b) The member with the most loans', `SELECT m.member_id, m.name, COUNT(*) AS loans
FROM MEMBER m
JOIN LOAN l ON l.member_id = m.member_id
GROUP BY m.member_id, m.name
ORDER BY loans DESC, m.name
LIMIT 1`)
        ] });
    } catch (error) { failure(res, 'most borrowed', error); }
});

// ---------- F2.6 Authors and books (LEFT JOIN, JOIN) ----------
router.get('/reports/authors-books', async (req, res) => {
    try {
        res.json({ tables: [
            await table('(a) Every author with the number of books', `SELECT a.author_id, a.name, COUNT(b.book_id) AS books
FROM AUTHOR a
LEFT JOIN BOOK b ON b.author_id = a.author_id
GROUP BY a.author_id, a.name
ORDER BY a.author_id`),
            await table('(b) Books whose author and publisher are from the same country', `SELECT b.book_id, b.title, a.name AS author, p.name AS publisher, a.country
FROM BOOK b
JOIN AUTHOR a    ON b.author_id = a.author_id
JOIN PUBLISHER p ON b.publisher_id = p.publisher_id
WHERE a.country = p.country
ORDER BY b.book_id`)
        ] });
    } catch (error) { failure(res, 'authors and books', error); }
});

module.exports = router;
