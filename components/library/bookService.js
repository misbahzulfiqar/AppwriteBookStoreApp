import { Client, Databases, Storage, ID, Query } from 'appwrite';
import conf from '../../conf/conf';

class BookService {
  constructor() {
    this.client = new Client()
      .setEndpoint(conf.appwriteUrl)
      .setProject(conf.appwriteProjectId);

    this.databases = new Databases(this.client);
    this.storage = new Storage(this.client);

    this.databaseId = conf.appwriteDatabaseId;
    this.collectionId = conf.appwriteCollectionId;
    this.bucketId = conf.appwriteBucketId;
  }

  getCoverImageUrl(fileId) {
    if (!fileId) return null;
    return this.storage.getFileView(this.bucketId, fileId);
  }

  getPdfUrl(fileId) {
    if (!fileId) return null;
    return this.storage.getFileView(this.bucketId, fileId);
  }

  addUrlsToBook(book) {
    if (!book) return book;
    return {
      ...book,
      coverImageUrl: this.getCoverImageUrl(book.coverImageId),
      pdfUrl: this.getPdfUrl(book.pdfFileId),
    };
  }

  async uploadFile(file, type = 'pdf') {
    if (type === 'pdf' && file.type !== 'application/pdf') {
      throw new Error('File must be a PDF');
    }
    if (type === 'image' && !file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    const fileId = ID.unique();
    await this.storage.createFile(this.bucketId, fileId, file);
    return fileId;
  }

  async uploadPdf(file) {
    return this.uploadFile(file, 'pdf');
  }

  async uploadCoverImage(file) {
    return this.uploadFile(file, 'image');
  }

  async getPublicBooks() {
    const response = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [Query.equal('isPublic', true)]
    );
    return {
      ...response,
      documents: (response.documents || []).map(book => this.addUrlsToBook(book)),
    };
  }

  async getAllBooks() {
    const response = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId
    );
    return {
      ...response,
      documents: (response.documents || []).map(book => this.addUrlsToBook(book)),
    };
  }

  async createBook(bookData, pdfFile, coverFile = null) {
    const pdfFileId = await this.uploadPdf(pdfFile);
    let coverImageId = null;
    if (bookData.coverImageId) {
      coverImageId = bookData.coverImageId;
    } else if (coverFile) {
      coverImageId = await this.uploadCoverImage(coverFile);
    }

    const bookDocumentData = {
      title: bookData.title || '',
      author: bookData.author || '',
      description: bookData.description || '',
      status: bookData.status || 'want-to-read',
      pagesRead: String(bookData.pagesRead || '0'),
      totalPages: String(bookData.totalPages || '0'),
      rating: Number(bookData.rating || 0),
      pdfFileId,
      coverImageId,
      lastReadPage: 0,
      isPublic: bookData.isPublic !== undefined ? Boolean(bookData.isPublic) : false,
    };

    const newBook = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      ID.unique(),
      bookDocumentData
    );
    return this.addUrlsToBook(newBook);
  }

  async getUserBooks() {
    const response = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId
    );
    return {
      ...response,
      documents: (response.documents || []).map(book => this.addUrlsToBook(book)),
    };
  }

  async updateBook(bookId, updates) {
    const updated = await this.databases.updateDocument(
      this.databaseId,
      this.collectionId,
      bookId,
      updates
    );
    return this.addUrlsToBook(updated);
  }

  async updateCoverImage(bookId, coverFile) {
    const coverImageId = await this.uploadCoverImage(coverFile);
    const updated = await this.databases.updateDocument(
      this.databaseId,
      this.collectionId,
      bookId,
      { coverImageId }
    );
    return this.addUrlsToBook(updated);
  }

  async deleteBook(bookId) {
    const book = await this.databases.getDocument(
      this.databaseId,
      this.collectionId,
      bookId
    );
    if (book.pdfFileId) {
      await this.storage.deleteFile(this.bucketId, book.pdfFileId);
    }
    if (book.coverImageId) {
      await this.storage.deleteFile(this.bucketId, book.coverImageId);
    }
    return this.databases.deleteDocument(
      this.databaseId,
      this.collectionId,
      bookId
    );
  }

  async getBookById(bookId, forcePublic = false) {
    try {
      if (forcePublic) {
        const endpoint = `https://nyc.cloud.appwrite.io/v1/databases/${this.databaseId}/collections/${this.collectionId}/documents/${bookId}`;
        const response = await fetch(endpoint, {
          headers: {
            'X-Appwrite-Project': this.client.config.project,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Book not found or not public`);
        }
        const book = await response.json();
        return this.addUrlsToBook(book);
      }
      const book = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        bookId
      );
      return this.addUrlsToBook(book);
    } catch (error) {
      console.error('getBookById error:', error.message);
      throw error;
    }
  }

  async toggleBookVisibility(bookId, makePublic) {
    return this.updateBook(bookId, { isPublic: Boolean(makePublic) });
  }

  async searchBooks(query, publicOnly = false) {
    const queries = [
      Query.search('title', query),
      Query.search('author', query)
    ];
    if (publicOnly) queries.push(Query.equal('isPublic', true));
    const response = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );
    return {
      ...response,
      documents: (response.documents || []).map(book => this.addUrlsToBook(book)),
    };
  }

  async getBooksByStatus(status, publicOnly = false) {
    const queries = [Query.equal('status', status)];
    if (publicOnly) queries.push(Query.equal('isPublic', true));
    const response = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );
    return {
      ...response,
      documents: (response.documents || []).map(book => this.addUrlsToBook(book)),
    };
  }

  async getRecentBooks(limit = 10, publicOnly = false) {
    const queries = publicOnly ? [Query.equal('isPublic', true)] : [];
    const response = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries,
      limit,
      0,
      'createdAt',
      'DESC'
    );
    return {
      ...response,
      documents: (response.documents || []).map(book => this.addUrlsToBook(book)),
    };
  }

  async updateReadingProgress(bookId, lastReadPage) {
    return this.updateBook(bookId, {
      lastReadPage: Number(lastReadPage) || 0,
      lastReadAt: new Date().toISOString()
    });
  }
}

export default new BookService();
