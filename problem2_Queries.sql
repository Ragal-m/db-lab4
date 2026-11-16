-- Lab 4 - Problem 2: the SQL of the website pages F2.1 - F2.6
-- Run: mysql -u root -p < problem2_Queries.sql
USE library;

-- F2.1 Search books (WHERE, LIKE, BETWEEN), cheapest first.
-- Example: title contains 'the', price between 10 and 20, category 1 (Fiction).
-- The website runs the same query with ? placeholders (prepared statement) instead of these values.
SELECT book_id, title, price, publish_year, author_id, category_id
FROM BOOK
WHERE title LIKE '%the%' AND price BETWEEN 10 AND 20 AND category_id = 1
ORDER BY price ASC;

-- F2.2 Catalogue (JOIN): author, publisher and category names instead of the ids
SELECT b.book_id, b.title, b.price, b.publish_year,
       a.name AS author, p.name AS publisher, c.name AS category
FROM BOOK b
JOIN AUTHOR a    ON b.author_id = a.author_id
JOIN PUBLISHER p ON b.publisher_id = p.publisher_id
JOIN CATEGORY c  ON b.category_id = c.category_id
ORDER BY b.book_id;

-- F2.3 (a) Reports: the number of books and the average price of each category
SELECT c.name AS category, COUNT(b.book_id) AS books, ROUND(AVG(b.price), 2) AS average_price
FROM CATEGORY c
LEFT JOIN BOOK b ON b.category_id = c.category_id
GROUP BY c.category_id, c.name
ORDER BY c.name;

-- F2.3 (b) Reports: the authors who wrote at least 2 books
SELECT a.author_id, a.name, COUNT(*) AS books
FROM AUTHOR a
JOIN BOOK b ON b.author_id = a.author_id
GROUP BY a.author_id, a.name
HAVING COUNT(*) >= 2
ORDER BY books DESC, a.name;

-- F2.3 (c) Reports: the total, smallest and largest price of the whole library
SELECT SUM(price) AS total_price, MIN(price) AS smallest_price, MAX(price) AS largest_price
FROM BOOK;

-- F2.4 (a) Loans: the loans not returned yet, with the book title and the member name
SELECT l.loan_id, b.title, m.name AS member, l.loan_date
FROM LOAN l
JOIN BOOK b   ON l.book_id = b.book_id
JOIN MEMBER m ON l.member_id = m.member_id
WHERE l.return_date IS NULL
ORDER BY l.loan_date;

-- F2.4 (b) Loans: the members who never borrowed a book
SELECT m.member_id, m.name, m.email
FROM MEMBER m
LEFT JOIN LOAN l ON l.member_id = m.member_id
WHERE l.loan_id IS NULL
ORDER BY m.member_id;

-- F2.4 (c) Loans: the books that were never borrowed
SELECT b.book_id, b.title
FROM BOOK b
LEFT JOIN LOAN l ON l.book_id = b.book_id
WHERE l.loan_id IS NULL
ORDER BY b.book_id;

-- F2.5 (a) Most borrowed: the 3 books with the most loans
SELECT b.book_id, b.title, COUNT(*) AS loans
FROM BOOK b
JOIN LOAN l ON l.book_id = b.book_id
GROUP BY b.book_id, b.title
ORDER BY loans DESC, b.title
LIMIT 3;

-- F2.5 (b) Most borrowed: the member with the most loans
SELECT m.member_id, m.name, COUNT(*) AS loans
FROM MEMBER m
JOIN LOAN l ON l.member_id = m.member_id
GROUP BY m.member_id, m.name
ORDER BY loans DESC, m.name
LIMIT 1;

-- F2.6 (a) Authors and books: every author with the number of books, including the authors who wrote 0
SELECT a.author_id, a.name, COUNT(b.book_id) AS books
FROM AUTHOR a
LEFT JOIN BOOK b ON b.author_id = a.author_id
GROUP BY a.author_id, a.name
ORDER BY a.author_id;

-- F2.6 (b) Authors and books: the books whose author and publisher come from the same country
SELECT b.book_id, b.title, a.name AS author, p.name AS publisher, a.country
FROM BOOK b
JOIN AUTHOR a    ON b.author_id = a.author_id
JOIN PUBLISHER p ON b.publisher_id = p.publisher_id
WHERE a.country = p.country
ORDER BY b.book_id;
