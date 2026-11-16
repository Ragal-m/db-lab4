# Lab 4 - Search Queries in SQL

Introduction to Database Systems, Alexandria National University (Fall 2026)

- **Student ID:** 2304037 (Group 2)

This repository contains Part II (Problem 2, database `library`) of Lab 4: the six-table
library database, its seed data, the SQL of the new pages, and the website that continues Lab 3.

## Folder content

```
lab4-2304037/
  problem2_DDL.sql       # library database: AUTHOR, PUBLISHER, CATEGORY, BOOK, MEMBER, LOAN
  problem2_DML.sql       # seed data: 6 authors, 3 publishers, 3 categories, 10 books, 5 members, 12 loans
  problem2_Queries.sql   # the SQL of the pages F2.1 - F2.6 (a "-- F2.x" comment before each query)
  website/               # the website: Lab 2 login + to-do, Lab 3 books/authors, Lab 4 search pages
  README.md              # this file
```

## Prerequisites

- MySQL Server 8.0+ and the `mysql` client
- Node.js 14+ and npm

## 1. Create the databases

```bash
# from the lab4-2304037 folder
mysql -u root -p < problem2_DDL.sql          # database "library": the six tables
mysql -u root -p < problem2_DML.sql          # seed data
mysql -u root -p < problem2_Queries.sql      # (optional) runs the SQL of F2.1 - F2.6 and prints the results

# the Lab 2 database for login/registration (needed to log in to the website)
mysql -u root -p < website/database/schema.sql
```

`problem2_DDL.sql` starts with `DROP DATABASE IF EXISTS library;`, so it can be re-run at any time
(run `problem2_DML.sql` again after it to get the seed data back).

## 2. Configure and start the website

```bash
cd website
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

Open `.env` and set `DB_PASSWORD` to your MySQL root password. Keep `DB_NAME=registration` and
`LIBRARY_DB_NAME=library`. Then:

```bash
npm start                   # Windows PowerShell: npm.cmd start
```

You should see `Server running on http://localhost:3000`.

## 3. Use the website

1. Open http://localhost:3000, click **Register**, create an account and log in.
2. Open http://localhost:3000/search (or click **Search & Reports** on the Library page).

| Page (tab) | What it shows | SQL features |
|---|---|---|
| **F2.1 Search** | Form: title keyword, minimum and maximum price, category list. Matching books, cheapest first. | `WHERE`, `LIKE`, `BETWEEN`, `ORDER BY` |
| **F2.2 Catalogue** | All books with the author, publisher and category **names** | `JOIN` (3 joins) |
| **F2.3 Reports** | (a) books and average price per category, (b) authors with at least 2 books, (c) total, smallest and largest price | `GROUP BY`, `HAVING`, aggregates |
| **F2.4 Loans** | (a) loans not returned yet, (b) members who never borrowed, (c) books never borrowed | `JOIN`, `LEFT JOIN`, `IS NULL` |
| **F2.5 Most borrowed** | The 3 books with the most loans, and the member with the most loans | `GROUP BY`, `ORDER BY`, `LIMIT` |
| **F2.6 Authors & books** | (a) every author with the number of books (0 included), (b) books whose author and publisher are from the same country | `LEFT JOIN`, `JOIN` |

The SQL of each page is in `problem2_Queries.sql` (with example values) and in `website/routes/queries.js`.

**Bonus (prepared statements):** the search form of F2.1 uses `?` placeholders. The text typed by the user
is sent only as a parameter (`pool.execute(sql, params)`), never inside the SQL text, and `%` and `_`
typed in the keyword are escaped so they are searched literally.

## Notes

- The pages need a login because they are part of the Lab 2 website.
- The Lab 3 page (**Library**, http://localhost:3000/library) still works. Its book form now also asks for
  the publisher, the category and the publish year, because `BOOK` has these columns in Lab 4.
  Deleting an author deletes its books, and deleting a book deletes its loans (`ON DELETE CASCADE`).
- Book covers and author photos (Lab 3 bonus) are saved in `website/uploads/`.

## Website files added or changed in Lab 4

- `website/routes/queries.js` - the queries of F2.1 - F2.6 and the drop-down lists
- `website/routes/pool.js` - one shared connection pool for the `library` database
- `website/routes/library.js` - Lab 3 book routes updated for the new `BOOK` columns
- `website/public/search.html`, `website/public/search.js` - the new pages
- `website/public/library.html`, `website/public/library.js` - book form with publisher, category and year
- `website/public/styles.css` - extra styles at the end of the file
- `website/server.js` - loads the new routes and the `/search` page

The original Lab 2 README is kept in `website/README_lab2.md`.
