-- Lab 4 - Problem 2: Library database (seed data)
-- Run: mysql -u root -p < problem2_DML.sql
USE library;

-- 6 authors: Mahfouz and Soueif are both from Egypt; Christie and Orwell are both from the UK;
-- Soueif (6) has no books; Christie wrote 3 books.
INSERT INTO AUTHOR (author_id, name, country) VALUES
(1, 'Naguib Mahfouz',          'Egypt'),
(2, 'Agatha Christie',         'United Kingdom'),
(3, 'Gabriel Garcia Marquez',  'Colombia'),
(4, 'Paulo Coelho',            'Brazil'),
(5, 'George Orwell',           'United Kingdom'),
(6, 'Ahdaf Soueif',            'Egypt');

-- Mahfouz (Egypt) and Dar Al-Shorouk (Egypt) share a country; Christie and HarperCollins (United Kingdom) too.
INSERT INTO PUBLISHER (publisher_id, name, country) VALUES
(1, 'Dar Al-Shorouk',       'Egypt'),
(2, 'HarperCollins',        'United Kingdom'),
(3, 'Penguin Random House', 'United States');

INSERT INTO CATEGORY (category_id, name) VALUES
(1, 'Fiction'),
(2, 'Mystery'),
(3, 'Classics');

-- 10 books. Priced between 15 and 20: books 5, 6, 7, 8, 10.
-- Never borrowed: books 2, 8, 9, 10.
INSERT INTO BOOK (book_id, title, price, publish_year, author_id, publisher_id, category_id) VALUES
(1,  'Palace Walk',                    14.50, 1956, 1, 1, 1),
(2,  'Midaq Alley',                    11.00, 1947, 1, 1, 1),
(3,  'Murder on the Orient Express',   12.99, 1934, 2, 2, 2),
(4,  'And Then There Were None',       13.50, 1939, 2, 2, 2),
(5,  'One Hundred Years of Solitude',  18.75, 1967, 3, 3, 1),
(6,  'Love in the Time of Cholera',    16.20, 1985, 3, 3, 1),
(7,  'The Alchemist',                  15.00, 1988, 4, 3, 1),
(8,  'Nineteen Eighty-Four',           17.50, 1949, 5, 2, 3),
(9,  'Animal Farm',                     9.99, 1945, 5, 2, 3),
(10, 'The ABC Murders',                19.99, 1936, 2, 1, 2);

-- 5 members: member 5 (Hana Ibrahim) has no loans.
INSERT INTO MEMBER (member_id, name, email, join_date) VALUES
(1, 'Mona Adel',      'mona.adel@example.com',      '2025-09-01'),
(2, 'Omar Khaled',    'omar.khaled@example.com',    '2025-10-15'),
(3, 'Sara Mostafa',   'sara.mostafa@example.com',   '2026-01-20'),
(4, 'Youssef Ali',    'youssef.ali@example.com',    '2026-03-05'),
(5, 'Hana Ibrahim',   'hana.ibrahim@example.com',   '2026-09-10');

-- 12 loans. Not returned yet (return_date NULL): loans 7, 9, 11, 12.
INSERT INTO LOAN (loan_id, book_id, member_id, loan_date, return_date) VALUES
(1,  5, 1, '2026-09-01', '2026-09-10'),
(2,  5, 2, '2026-09-12', '2026-09-20'),
(3,  5, 1, '2026-09-25', '2026-10-02'),
(4,  5, 3, '2026-10-05', '2026-10-12'),
(5,  3, 1, '2026-09-03', '2026-09-14'),
(6,  3, 2, '2026-09-18', '2026-09-28'),
(7,  3, 4, '2026-10-08', NULL),
(8,  1, 1, '2026-10-01', '2026-10-09'),
(9,  1, 3, '2026-10-15', NULL),
(10, 4, 4, '2026-10-20', '2026-10-27'),
(11, 6, 1, '2026-10-22', NULL),
(12, 7, 2, '2026-11-02', NULL);
