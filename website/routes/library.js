// Library (Lab 3, Problem 2): AUTHOR and BOOK pages and API.
// Plain SQL with prepared statements, no JOIN.
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const pool = require('./pool');

// ---------- images (bonus): saved as uploads/<books|authors>/<id>.<ext> ----------
const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };
const EXTS = Object.values(EXT);

function imageUrl(kind, id) {
    for (const ext of EXTS) {
        const file = path.join(UPLOAD_ROOT, kind, `${id}.${ext}`);
        if (fs.existsSync(file)) {
            return `/uploads/${kind}/${id}.${ext}?v=${Math.floor(fs.statSync(file).mtimeMs)}`;
        }
    }
    return null;
}

function removeImages(kind, id) {
    for (const ext of EXTS) {
        const file = path.join(UPLOAD_ROOT, kind, `${id}.${ext}`);
        if (fs.existsSync(file)) fs.unlinkSync(file);
    }
}

// ---------- helpers ----------
function isId(value) {
    return /^[1-9][0-9]*$/.test(String(value));
}

function validateAuthor(body) {
    const errors = {};
    const name = (body.name || '').trim();
    const country = (body.country || '').trim();
    if (!name) errors.name = 'Name is required';
    else if (name.length > 100) errors.name = 'Name is too long (100 characters at most)';
    if (country.length > 50) errors.country = 'Country is too long (50 characters at most)';
    return { errors, name, country: country || null };
}

function validateBook(body) {
    const errors = {};
    const title = (body.title || '').trim();
    const priceText = String(body.price === undefined || body.price === null ? '' : body.price).trim();
    const price = Number(priceText);
    if (!title) errors.title = 'Title is required';
    else if (title.length > 150) errors.title = 'Title is too long (150 characters at most)';
    if (priceText === '') errors.price = 'Price is required';
    else if (!Number.isFinite(price) || price < 0 || price > 99999999.99) errors.price = 'Price must be a number of 0 or more';
    if (!isId(body.author_id)) errors.author_id = 'Author is required';
    if (!isId(body.publisher_id)) errors.publisher_id = 'Publisher is required';
    if (!isId(body.category_id)) errors.category_id = 'Category is required';

    const yearText = String(body.publish_year === undefined || body.publish_year === null ? '' : body.publish_year).trim();
    let year = null;
    if (yearText !== '') {
        year = Number(yearText);
        if (!/^[0-9]{1,4}$/.test(yearText) || year < 1000 || year > 2100) errors.publish_year = 'Year must be between 1000 and 2100';
    }
    return {
        errors, title, price: Math.round(price * 100) / 100, year,
        authorId: Number(body.author_id), publisherId: Number(body.publisher_id), categoryId: Number(body.category_id)
    };
}

// a foreign key failed: say which one
function foreignKeyErrors(error) {
    const message = error.sqlMessage || '';
    const errors = {};
    if (message.includes('`publisher_id`')) errors.publisher_id = 'This publisher does not exist';
    else if (message.includes('`category_id`')) errors.category_id = 'This category does not exist';
    else errors.author_id = 'This author does not exist';
    return errors;
}

// Same API for both pages: logged-out users get JSON 401 instead of a redirect
router.use(['/authors', '/books'], (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    next();
});

// ---------- AUTHORS ----------
router.get('/authors', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT author_id, name, country FROM AUTHOR ORDER BY author_id');
        res.json({ authors: rows.map(a => ({ ...a, image: imageUrl('authors', a.author_id) })) });
    } catch (error) {
        console.error('Fetch authors error:', error);
        res.status(500).json({ error: 'Failed to fetch authors' });
    }
});

router.post('/authors', async (req, res) => {
    const { errors, name, country } = validateAuthor(req.body);
    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });
    try {
        const [result] = await pool.execute('INSERT INTO AUTHOR (name, country) VALUES (?, ?)', [name, country]);
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Add author error:', error);
        res.status(500).json({ error: 'Failed to add author' });
    }
});

router.put('/authors/:id', async (req, res) => {
    if (!isId(req.params.id)) return res.status(404).json({ error: 'Author not found' });
    const { errors, name, country } = validateAuthor(req.body);
    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });
    try {
        const [result] = await pool.execute(
            'UPDATE AUTHOR SET name = ?, country = ? WHERE author_id = ?',
            [name, country, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Author not found' });
        res.json({ success: true });
    } catch (error) {
        console.error('Edit author error:', error);
        res.status(500).json({ error: 'Failed to edit author' });
    }
});

router.delete('/authors/:id', async (req, res) => {
    if (!isId(req.params.id)) return res.status(404).json({ error: 'Author not found' });
    try {
        // remember the books of this author: ON DELETE CASCADE removes them from the database
        const [books] = await pool.execute('SELECT book_id FROM BOOK WHERE author_id = ?', [req.params.id]);
        const [result] = await pool.execute('DELETE FROM AUTHOR WHERE author_id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Author not found' });
        books.forEach(b => removeImages('books', b.book_id));
        removeImages('authors', req.params.id);
        res.json({ success: true, deletedBooks: books.length });
    } catch (error) {
        console.error('Delete author error:', error);
        res.status(500).json({ error: 'Failed to delete author' });
    }
});

// ---------- BOOKS ----------
router.get('/books', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT book_id, title, price, publish_year, author_id, publisher_id, category_id FROM BOOK ORDER BY book_id');
        res.json({ books: rows.map(b => ({ ...b, image: imageUrl('books', b.book_id) })) });
    } catch (error) {
        console.error('Fetch books error:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

router.post('/books', async (req, res) => {
    const { errors, title, price, year, authorId, publisherId, categoryId } = validateBook(req.body);
    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });
    try {
        const [result] = await pool.execute(
            'INSERT INTO BOOK (title, price, publish_year, author_id, publisher_id, category_id) VALUES (?, ?, ?, ?, ?, ?)',
            [title, price, year, authorId, publisherId, categoryId]
        );
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ errors: foreignKeyErrors(error) });
        }
        console.error('Add book error:', error);
        res.status(500).json({ error: 'Failed to add book' });
    }
});

router.put('/books/:id', async (req, res) => {
    if (!isId(req.params.id)) return res.status(404).json({ error: 'Book not found' });
    const { errors, title, price, year, authorId, publisherId, categoryId } = validateBook(req.body);
    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });
    try {
        const [result] = await pool.execute(
            'UPDATE BOOK SET title = ?, price = ?, publish_year = ?, author_id = ?, publisher_id = ?, category_id = ? WHERE book_id = ?',
            [title, price, year, authorId, publisherId, categoryId, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Book not found' });
        res.json({ success: true });
    } catch (error) {
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ errors: foreignKeyErrors(error) });
        }
        console.error('Edit book error:', error);
        res.status(500).json({ error: 'Failed to edit book' });
    }
});

router.delete('/books/:id', async (req, res) => {
    if (!isId(req.params.id)) return res.status(404).json({ error: 'Book not found' });
    try {
        const [result] = await pool.execute('DELETE FROM BOOK WHERE book_id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Book not found' });
        removeImages('books', req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete book error:', error);
        res.status(500).json({ error: 'Failed to delete book' });
    }
});

// ---------- image upload (bonus): the raw image file is the request body ----------
function imageRoute(kind, table, idColumn) {
    router.put(`/${kind}/:id/image`, express.raw({ type: Object.keys(EXT), limit: '5mb' }), async (req, res) => {
        if (!isId(req.params.id)) return res.status(404).json({ error: 'Not found' });
        const type = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
        if (!EXT[type] || !Buffer.isBuffer(req.body) || req.body.length === 0) {
            return res.status(400).json({ error: 'Please choose a JPG, PNG, GIF or WEBP image (5 MB at most)' });
        }
        try {
            const [rows] = await pool.execute(`SELECT ${idColumn} FROM ${table} WHERE ${idColumn} = ?`, [req.params.id]);
            if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
            fs.mkdirSync(path.join(UPLOAD_ROOT, kind), { recursive: true });
            removeImages(kind, req.params.id);
            fs.writeFileSync(path.join(UPLOAD_ROOT, kind, `${req.params.id}.${EXT[type]}`), req.body);
            res.json({ success: true });
        } catch (error) {
            console.error('Image upload error:', error);
            res.status(500).json({ error: 'Failed to save the image' });
        }
    });
}
imageRoute('books', 'BOOK', 'book_id');
imageRoute('authors', 'AUTHOR', 'author_id');

module.exports = router;
