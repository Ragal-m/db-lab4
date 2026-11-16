-- Lab 4 - Problem 2: Library database (DDL)
-- Run: mysql -u root -p < problem2_DDL.sql
DROP DATABASE IF EXISTS library;
CREATE DATABASE library;
USE library;

CREATE TABLE AUTHOR (
    author_id INT          NOT NULL AUTO_INCREMENT,
    name      VARCHAR(100) NOT NULL,
    country   VARCHAR(50),
    PRIMARY KEY (author_id)
);

CREATE TABLE PUBLISHER (
    publisher_id INT          NOT NULL AUTO_INCREMENT,
    name         VARCHAR(100) NOT NULL,
    country      VARCHAR(50),
    PRIMARY KEY (publisher_id)
);

CREATE TABLE CATEGORY (
    category_id INT         NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50) NOT NULL,
    PRIMARY KEY (category_id)
);

CREATE TABLE BOOK (
    book_id      INT           NOT NULL AUTO_INCREMENT,
    title        VARCHAR(150)  NOT NULL,
    price        DECIMAL(10,2) NOT NULL,
    publish_year INT,
    author_id    INT           NOT NULL,
    publisher_id INT           NOT NULL,
    category_id  INT           NOT NULL,
    PRIMARY KEY (book_id),
    -- when an author is deleted, all the books of that author are deleted too
    FOREIGN KEY (author_id)    REFERENCES AUTHOR(author_id) ON DELETE CASCADE,
    FOREIGN KEY (publisher_id) REFERENCES PUBLISHER(publisher_id),
    FOREIGN KEY (category_id)  REFERENCES CATEGORY(category_id)
);

CREATE TABLE MEMBER (
    member_id INT          NOT NULL AUTO_INCREMENT,
    name      VARCHAR(100) NOT NULL,
    email     VARCHAR(100),
    join_date DATE,
    PRIMARY KEY (member_id)
);

CREATE TABLE LOAN (
    loan_id     INT  NOT NULL AUTO_INCREMENT,
    book_id     INT  NOT NULL,
    member_id   INT  NOT NULL,
    loan_date   DATE NOT NULL,
    return_date DATE,                 -- NULL while the book is still borrowed
    PRIMARY KEY (loan_id),
    -- when a book is deleted, its loans are deleted too
    FOREIGN KEY (book_id)   REFERENCES BOOK(book_id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES MEMBER(member_id)
);
