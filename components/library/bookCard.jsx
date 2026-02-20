import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateBook, deleteBook } from './bookSlice';

function BookCard({ book, onCoverUpdate, isEditable = false, showPublishButton = false }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  useEffect(() => {
    setImageUrl(book?.coverImageId || book?.coverImageUrl || null);
  }, [book?.coverImageId, book?.coverImageUrl]);

  const progress = book.totalPages && book.pagesRead 
    ? Math.round((parseInt(book.pagesRead) / parseInt(book.totalPages)) * 100)
    : 0;

  const statusColors = {
    'want-to-read': 'bg-gray-100 text-gray-800',
    'reading': 'bg-blue-100 text-blue-800',
    'finished': 'bg-green-100 text-green-800',
  };

  const statusText = {
    'want-to-read': 'Want to Read',
    'reading': 'Reading',
    'finished': 'Complete',
  };

  const renderStars = () => {
    return [...Array(5)].map((_, i) => (
      <span 
        key={i} 
        className={`text-2xl ${i < book.rating ? 'text-yellow-500' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    setUploading(true);
    try {
      const blobUrl = URL.createObjectURL(file);
      await dispatch(updateBook({ bookId: book.$id, updates: { coverImageId: blobUrl } })).unwrap();
      setImageUrl(blobUrl);
      if (onCoverUpdate) onCoverUpdate(book.$id, blobUrl);
      alert('Cover image updated');
    } catch (error) {
      alert('Failed to update: ' + error.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleReadClick = () => {
    navigate(`/reader/${book.$id}`);
  };

  // When "Again Read" is clicked: set status back to 'reading' so card shows 3 buttons again, then go to PDF
  const handleAgainReadClick = async () => {
    try {
      await dispatch(updateBook({
        bookId: book.$id,
        updates: { status: 'reading' }
      })).unwrap();
      navigate(`/reader/${book.$id}`);
    } catch (error) {
      alert('Failed to update: ' + error.message);
    }
  };

  const handleTogglePublish = async () => {
    setPublishLoading(true);
    try {
      await dispatch(updateBook({
        bookId: book.$id,
        updates: { isPublic: !book.isPublic }
      })).unwrap();
    } catch (error) {
      alert('Failed to update visibility: ' + error.message);
    } finally {
      setPublishLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await dispatch(updateBook({
        bookId: book.$id,
        updates: { status: newStatus }
      })).unwrap();
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await dispatch(deleteBook(book.$id)).unwrap();
      } catch (error) {
        alert('Failed to delete book: ' + error.message);
      }
    }
  };

  useEffect(() => {
    console.log('BookCard rendered for book:', book);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200 transform hover:-translate-y-1">
      {/* REMOVED: The onClick from the entire image container */}
      <div className="h-74 relative overflow-hidden group">
        <img 
          src={imageUrl} 
          alt={`Cover of ${book.title}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          // Removed pointer cursor and onClick from the image
        />
        
        {/* KEPT: File upload input - but it's hidden */}
        {isEditable && (
          <div className="absolute bottom-4 right-4">
            <label 
              className= "bg-white text-gray-800 rounded-md h-30 not-even:cursor-pointer font-medium shadow-lg transition-all ${uploading ? 'opacity-50' : 'hover:bg-gray-100 hover:scale-105"
              htmlFor={`cover-upload-${book.$id}`}
            >
              {uploading ? 'Uploading...' : 'Change Cover'}
            </label>
            <input
              type="file"
              id={`cover-upload-${book.$id}`}
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </div>
        )}
        
        <div className="absolute top-6 left-4">
          <span className={`px-4 py-2 rounded-full text-xl ${statusColors[book.status]} backdrop-blur-sm bg-white/80 shadow-lg ex-adding`}>
            {statusText[book.status]}
          </span>
        </div>

        {book.rating > 0 && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg">
            <div className="flex items-center gap-1">
              {renderStars()}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4 div-padding">
        <h3 
          className="font-bold text-3xl text-gray-900 truncate cursor-pointer hover:text-[#8b5a2b] transition-colors"
          onClick={handleReadClick}
          title={book.title}
        >
          {book.title}
        </h3>
        <p className="text-gray-700 text-xl mb-2 font-medium margin">by {book.author}</p>

        {book.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 bg-gray-50 p-3 rounded-lg">
            {book.description}
          </p>
        )}

        {book.status === 'reading' && book.totalPages && (
          <div className="mb-5 bg-gray-50 p-4 rounded-xl margin">
            <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Progress: {book.pagesRead || 0}/{book.totalPages} pages</span>
              <span className="font-bold margin">{progress}%</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-[#8b5a2b] to-[#a67c52] h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {book.lastReadPage > 0 && book.status !== 'finished' && (
          <div className="mb-4">
            <button
              onClick={handleReadClick}
              className="w-full px-5 py-4 bg-gradient-to-r from-[#8b5a2b] to-[#a67c52] hover:from-[#a67c52] hover:to-[#8b5a2b] text-white text-base font-bold rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg"
            >
              <span className="text-xl">▶️</span>
              Resume from Page {book.lastReadPage}
            </button>
          </div>
        )}

        <div className="flex justify-between items-center text-base text-gray-700 mb-6 bg-gray-50 p-3 rounded-xl margin">
          <div className="font-semibold">
            {book.totalPages ? `${book.totalPages} pages` : 'Unknown pages'}
          </div>
          {book.rating > 0 && (
            <div className="flex items-center gap-2 font-bold">
              <span>{book.rating}/5</span>
              <span className="text-yellow-500">★</span>
            </div>
          )}
        </div>

        <div className="flex flex-row gap-3 margin justify-between heights flex-wrap">
          {showPublishButton && (
            <button
              type="button"
              onClick={handleTogglePublish}
              disabled={publishLoading}
              className={`flex-1 min-w-0 px-3 py-4 text-sm font-bold rounded-md transition-all flex items-center justify-center h-10 ${
                book.isPublic
                  ? 'bg-gray-500 hover:bg-gray-600 text-white'
                  : 'bg-[#8b5a2b] hover:bg-[#a67c52] text-white'
              } ${publishLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {publishLoading ? '...' : book.isPublic ? 'Unpublish' : 'Publish'}
            </button>
          )}
          {book.status === 'finished' ? (
            <>
              <button
                onClick={handleAgainReadClick}
                className="flex-1 px-5 py-4 bg-gradient-to-r from-[#8b5a2b] to-[#a67c52] hover:from-[#a67c52] hover:to-[#8b5a2b] text-white text-base font-bold rounded-md flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg h-10"
              >
                Again Read
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-5 py-4 bg-[#e97373] hover:bg-red-600 text-white text-base font-bold rounded-md transition-all transform hover:scale-[1.02] shadow-lg h-10 flex items-center justify-center"
                title="Delete Book"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleReadClick}
                className="flex-1 px-5 py-4 bg-[#bd926a] hover:bg-[#8b5a2b] text-white text-base font-bold rounded-md flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg h-10"
              >
                {book.lastReadPage > 0 ? 'Continue Reading' : 'Start Reading'}
              </button>
              <button
                onClick={() => handleStatusChange('finished')}
                className="flex-1 px-5 py-4 bg-[#7cc96b] hover:bg-green-600 text-white text-base font-bold rounded-md transition-all transform hover:scale-[1.02] shadow-lg h-10 flex items-center justify-center"
              >
                Mark as Done
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-5 py-4 bg-[#e97373] hover:bg-red-600 text-white text-base font-bold rounded-md transition-all transform hover:scale-[1.02] shadow-lg h-10 flex items-center justify-center"
                title="Delete Book"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookCard;