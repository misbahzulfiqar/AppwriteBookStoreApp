/**
 * Frontend-only in-memory book service. No backend.
 * Data is lost on page refresh.
 */

let books = [];

function uniqueId() {
  return 'book-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}

function addUrlsToBook(book) {
  if (!book) return book;
  return {
    ...book,
    coverImageUrl: book.coverImageId || null,
    pdfUrl: book.pdfFileId || null,
  };
}

async function getUserBooks() {
  return { documents: books.map(addUrlsToBook) };
}

async function getPublicBooks() {
  return { documents: books.filter((b) => b.isPublic).map(addUrlsToBook) };
}

async function createBook(bookData, pdfFile, coverFile = null) {
  const pdfFileId = pdfFile ? URL.createObjectURL(pdfFile) : null;
  let coverImageId = null;
  if (coverFile) {
    coverImageId = URL.createObjectURL(coverFile);
  } else if (bookData.coverImageId) {
    coverImageId = bookData.coverImageId;
  }

  const newBook = {
    $id: uniqueId(),
    title: bookData.title || '',
    author: bookData.author || '',
    description: bookData.description || '',
    status: bookData.status || 'want-to-read',
    pagesRead: String(bookData.pagesRead ?? '0'),
    totalPages: String(bookData.totalPages ?? '0'),
    rating: Number(bookData.rating ?? 0),
    pdfFileId,
    coverImageId,
    lastReadPage: 0,
    isPublic: bookData.isPublic !== undefined ? Boolean(bookData.isPublic) : false,
  };

  books.push(newBook);
  return addUrlsToBook({ ...newBook });
}

async function updateBook(bookId, updates) {
  const index = books.findIndex((b) => b.$id === bookId);
  if (index === -1) throw new Error('Book not found');
  books[index] = { ...books[index], ...updates };
  return addUrlsToBook(books[index]);
}

async function updateCoverImage(bookId, coverFile) {
  const coverImageId = URL.createObjectURL(coverFile);
  return updateBook(bookId, { coverImageId });
}

async function deleteBook(bookId) {
  const book = books.find((b) => b.$id === bookId);
  if (book) {
    if (book.pdfFileId && book.pdfFileId.startsWith('blob:')) URL.revokeObjectURL(book.pdfFileId);
    if (book.coverImageId && book.coverImageId.startsWith('blob:')) URL.revokeObjectURL(book.coverImageId);
    books = books.filter((b) => b.$id !== bookId);
  }
}

async function getBookById(bookId) {
  const book = books.find((b) => b.$id === bookId);
  return book ? addUrlsToBook(book) : null;
}

function getPdfUrl(fileId) {
  return fileId || null;
}

function getCoverImageUrl(fileId) {
  return fileId || null;
}

async function updateReadingProgress(bookId, lastReadPage) {
  return updateBook(bookId, { lastReadPage: Number(lastReadPage) || 0 });
}

export default {
  getUserBooks,
  getPublicBooks,
  createBook,
  updateBook,
  updateCoverImage,
  deleteBook,
  getBookById,
  getPdfUrl,
  getCoverImageUrl,
  addUrlsToBook,
  updateReadingProgress,
};
