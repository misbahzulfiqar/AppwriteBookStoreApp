# BookStore (BookGlow) – Project Guide

This document explains **every part of the project** from start to end: entry point, auth (login/signup), routing, library, and all main files and functions.

---

## 1. Tech Stack & Config

- **React 19** + **Vite 7** (build tool)
- **React Router DOM 7** (routing)
- **Redux Toolkit** (global state: auth + books)
- **Appwrite** (backend: auth, database, storage for PDFs and covers)
- **react-hook-form** (form handling)
- **Tailwind CSS** (styling)
- **@react-pdf-viewer** (PDF reading)

**Config** (`conf/conf.js`): Reads env vars `VITE_APPWRITE_*` (URL, project ID, database ID, collection ID, bucket ID) and exports them for Appwrite.

---

## 2. App Entry & Bootstrap

### `index.html`
- Root `<div id="root">` where the React app mounts.

### `main.jsx`
- **createRoot(document.getElementById('root')).render(...)**
- Wraps the app in:
  1. **StrictMode**
  2. **BrowserRouter** (React Router)
  3. **Provider** (Redux `store`)
  4. **AuthInit** (session check on load)
  5. **App** (which only renders `<Routes />`)

So the flow is: **HTML → main.jsx → Router + Redux + AuthInit → App → Routes**.

---

## 3. Routing (`routes/Routes.jsx`)

- **`/`** – Uses **MainLayout** (protected). Child routes:
  - **`/`** (index) → **HomePage**
  - **`/library`** → **Library**
  - **`/reader/:bookId`** → **PDFReaderPage**
- **`/auth`** – Uses **AuthLayout** (centered, no header/footer). Child routes:
  - **`/auth/login`** → **Login**
  - **`/auth/signup`** → **Signup**
  - **`/auth/verify`** → **VerifyEmail**
  - **`/auth/reset-password`** → **ResetPassword**

**MainLayout**: If Redux `userData` is missing → **Navigate to `/auth/login`**. Otherwise renders Header, **Outlet** (child route), Footer, BottomNavbar.

**AuthLayout**: Just a centered wrapper with **Outlet** for login/signup/verify/reset.

---

## 4. Authentication (Start to End)

### 4.1 Redux auth state (`store/authSlices.js`)

- **Initial state**: `status: false`, `userData: null`, `authChecked: false`.
- **Actions**:
  - **login(state, action)**: `status = true`, `userData = action.payload` (user object from Appwrite).
  - **logout(state)**: `status = false`, `userData = null`.
  - **setAuthFromSession(state, action)**: Sets `userData` and `status` from existing session; sets `authChecked = true` (used after refresh).

### 4.2 Session restore on load (`components/AuthInit.jsx`)

- Wraps the whole app (in `main.jsx`).
- **useEffect** on mount:
  - Calls **authService.getCurrentUser()** (Appwrite).
  - Dispatches **setAuthFromSession(user)** or **setAuthFromSession(null)**.
  - Sets local `ready = true`.
- Until `ready` is true, shows a loading spinner; then renders **children** (the app).
- **Purpose**: On refresh, Redux is empty but Appwrite may still have a session; this restores `userData` so the user is not sent to login unnecessarily.

### 4.3 Auth service – Appwrite API (`appwrite/auth/authService.js`)

Uses Appwrite **Client** + **Account**; endpoint and project come from `conf`.

- **createAccount({ email, password, name })**: `account.create(ID.unique(), email, password, name)`.
- **login({ email, password })**: Deletes existing sessions, then `account.createEmailPasswordSession(email, password)`.
- **getCurrentUser()**: `account.get()`; returns user or `null`.
- **logout()**: `account.deleteSessions()`.
- **sendVerificationEmail(verificationUrl)**: `account.createVerification(verificationUrl)` (user must be logged in).
- **verifyEmail(userId, secret)**: `account.updateVerification(userId, secret)` (from email link).
- **requestPasswordReset(email, resetUrl)**: `account.createRecovery(email, resetUrl)`.
- **confirmPasswordReset(userId, secret, newPassword)**: `account.updateRecovery(userId, secret, newPassword)`.
- **getVerificationStatus()** / **resendVerificationEmail()**: Helpers around verification.

### 4.4 Login (`forms/Login.jsx`)

- **react-hook-form**: `register`, `handleSubmit` for email/password.
- **login(data)**:
  1. `authService.login(data)`.
  2. `authService.getCurrentUser()` → **dispatch(login(userData))**.
  3. **navigate("/")**.
- Also includes **Forgot password** flow (same page, steps: request reset → enter token → set new password) using `authService.account.createRecovery` / `updateRecovery`.
- Links to Signup and uses shared **Input** / **Button** components.

### 4.5 Signup (`forms/Signup.jsx`)

- **signupHandler(data)**:
  1. **authService.createAccount(data)** (name, email, password).
  2. **authService.login({ email, password })** to create session.
  3. **authService.sendVerificationEmail(verificationUrl)** with `${origin}/verify`.
  4. Success message; after 5s **navigate('/login')** or **navigate('/')** if verification email fails.
- Uses **Input** / **Button**; shows errors (e.g. user already exists, network).

### 4.6 Email verification (`forms/Verification.jsx`)

- **useSearchParams()** for `userId` and `secret` (from email link).
- **useEffect**: **authService.verifyEmail(userId, secret)** → set status (verifying / success / error).
- On success, after 3s **navigate('/login')**.

### 4.7 Reset password (`forms/ResetPassword.jsx`)

- Reads **userId** and **secret** from URL (from email link).
- Form: new password + confirm.
- **handleSubmit**: **authService.confirmPasswordReset(userId, secret, newPassword)** → success message and redirect to login.

### 4.8 Logout (`forms/Logout.jsx`)

- **logoutHandler**:
  1. **authService.logout()** (delete Appwrite sessions).
  2. **dispatch(logout())** (clear Redux auth).
  3. **navigate('/auth/login')**.
- Rendered as a button (used in Header when logged in).

---

## 5. Protected UI: Header, Footer, MainLayout

### `components/common/Header.jsx`

- **useSelector(state => state.auth.status)**.
- If logged in: link to **Library**, **LogoutBtn**.
- If not: **Login** and **Sign Up** buttons (navigate to `/auth/login`, `/auth/signup`).
- Nav links from **constants** (Home, About Us, Featured, Reviews, Contact).
- Logo "BookGlow" links to `/`.

### `components/common/Footer.jsx`

- Uses **footerLinks** from `layouts/applayout/common.js` (locations, quick links, extra links, contact, social).
- Renders boxes and credit text.

### `layouts/applayout/main/BottomNavbar.jsx`

- Fixed bottom nav: Home, Featured, Category, Reviews, Feedback (anchor links).

---

## 6. Redux store (`store/store.js`)

- **configureStore** with reducers:
  - **auth**: `authSlice` (authSlices.js).
  - **books**: `bookReducer` (bookSlice.js).
- So global state is `{ auth: {...}, books: {...} }`.

---

## 7. Books: Service & Redux

### 7.1 Book service (`components/library/bookService.js`)

Uses Appwrite **Databases** + **Storage**; ids from `conf` (databaseId, collectionId, bucketId).

- **getCoverImageUrl(fileId)** / **getPdfUrl(fileId)**: Storage view URLs.
- **addUrlsToBook(book)**: Adds `coverImageUrl` and `pdfUrl` to a book object.
- **uploadFile(file, type)** / **uploadPdf** / **uploadCoverImage**: Upload to bucket; return file ID.
- **createBook(bookData, pdfFile, coverFile)**:
  - Upload PDF (and optional cover).
  - Build document: title, author, description, status, pagesRead, totalPages, rating, pdfFileId, coverImageId, lastReadPage: 0, **isPublic: false** by default.
  - **databases.createDocument**; return with URLs.
- **getUserBooks()**: List all documents in the collection (current user’s books); add URLs.
- **getPublicBooks()**: **Query.equal('isPublic', true)**; add URLs (for home page).
- **updateBook(bookId, updates)**: **databases.updateDocument**; return with URLs.
- **updateCoverImage(bookId, coverFile)** / **updateReadingProgress(bookId, lastReadPage)** / **deleteBook(bookId)** / **getBookById(bookId)** / **toggleBookVisibility(bookId, makePublic)** etc. as needed.

### 7.2 Book Redux slice (`components/library/bookSlice.js`)

- **Async thunks** (each calls bookService and uses thunkAPI.rejectWithValue on error):
  - **getUserBooks**
  - **createBook({ bookData, pdfFile, coverFile })**
  - **updateBook({ bookId, updates })**
  - **uploadCoverImage**, **updateReadingProgress**, **deleteBook**, **updateBookCover**, **fetchPublicBooks**
- **State**: books[], publicBooks[], isLoading, error, currentReadingBook, coverUploadProgress, operationStatus.
- **Reducers**: clearBooks, setCurrentReadingBook, clearCurrentReadingBook, clearOperationStatus, setCoverUploadProgress, manualUpdateBook.
- **extraReducers**: Handle pending/fulfilled/rejected for each thunk (update books array, loading, errors).
- **Selectors**: selectAllBooks, selectPublicBooks, selectBookById, selectBooksByStatus, etc.

---

## 8. Library Page & Book List

### `components/library/Library.jsx`

- **useDispatch** + **useSelector(books, isLoading)**.
- **useEffect**: **dispatch(getUserBooks())** on mount.
- Renders:
  - Title "My Personal Library" and **BookUploadForm** (add book button/modal).
  - If books.length > 0: **ReadingStats** and **BookList** with **showPublishButton={true}**.
  - Empty state if no books.
  - "Library Summary" cards (total, currently reading, finished, have progress).

### `components/library/bookList.jsx`

- Props: **books**, **showPublishButton** (default false).
- Local state: filter (all / status), searchTerm.
- **filteredBooks**: by status and by title/author search.
- Renders "My Books" heading and a grid of **BookCard** for each book; passes **showPublishButton** and **isEditable={true}**.

### `components/library/bookCard.jsx`

- Props: **book**, **onCoverUpdate**, **isEditable**, **showPublishButton**.
- **Cover image**: From **book.coverImageId** via **storage.getFileView** (Appwrite Client); fallbacks to getFilePreview or manual URL.
- **Progress**: progress % from pagesRead/totalPages; progress bar when status === 'reading'.
- **Status badge**: want-to-read / Reading / Complete (finished).
- **Handlers**:
  - **handleReadClick**: **navigate(`/reader/${book.$id}`)**.
  - **handleAgainReadClick**: **updateBook({ status: 'reading' })** then navigate to reader (for finished books).
  - **handleTogglePublish**: **updateBook({ isPublic: !book.isPublic })** (only if showPublishButton).
  - **handleStatusChange('finished')**: Mark as done.
  - **handleDelete**: **deleteBook(book.$id)** with confirm.
  - **handleImageUpload**: Upload new cover to storage, **updateBook({ coverImageId })**, refresh image (when isEditable).
- **Buttons** (same row, same size):
  - If **showPublishButton**: Publish / Unpublish (toggles isPublic).
  - If **finished**: Again Read, Delete.
  - Else: Start Reading (or Continue Reading), Mark as Done, Delete.

---

## 9. Add Book Form

### `components/library/BookUploadForm.jsx`

- **formData** (title, author, description, status, pagesRead, totalPages, rating, isPublic: false, coverImageId).
- **pdfFile**, **coverImageFile**, **coverPreview**, **showForm** (modal), **submitError**.
- **handleSubmit**:
  - Optional: upload cover to storage, get **coverImageId**.
  - Build **bookData** (including **isPublic: formData.isPublic || false**).
  - **dispatch(createBook({ bookData, pdfFile, coverImageFile }))**.
  - Reset form and close; alert success.
- **handleCoverUpload** / **handlePdfChange** / **handleRating** for form and preview.
- Renders "Add New Book" button; when opened, form with **Input**/**Button** and file inputs.

---

## 10. PDF Reader

### `components/library/pdfReaderPage.jsx`

- **useParams()** → **bookId**.
- **useEffect**: Fetch **bookService.getBookById(bookId)**; get **pdfUrl** via **bookService.getPdfUrl(pdfFileId)**; test URL (with fallback); **setBook**, **setPdfUrl**.
- Uses **@react-pdf-viewer** **Worker** + **Viewer** + **defaultLayoutPlugin** to render PDF.
- Header: Back button, book title/author, "Open in New Tab".
- Loading and error states with messages.

---

## 11. Home Page & Public Books

### `pages/home.jsx`

- Composes: **Home** (hero/slider), section **"Public Library"** with **PublicBookListWrapper**, then **AboutUs**, **Featured**, **Newsletter**, **Deal**, **Reviews**, **Feedback**.

### `components/library/PublicBookListWrapper.jsx`

- **useEffect**: **bookService.getPublicBooks()** → **setBooks(response.documents)**.
- Loading / empty state ("No public books"; isPublic: true).
- Renders **BookList** with **books** (no **showPublishButton**), so cards on home don’t show Publish/Unpublish.

---

## 12. Reading Stats

### `components/library/ReadingStats.jsx`

- Props: **books**.
- Computes: totalBooks, booksRead (status === 'finished'), currentlyReading, wantToRead, totalPagesRead, totalPages, overallProgress %.
- Renders 4 stat boxes and an "Overall Reading Progress" bar.

---

## 13. Reusable UI

### `components/input.jsx`

- **forwardRef** input with optional **label**; supports **type="password"** with show/hide toggle; **className** and rest props.

### `components/button.jsx`

- Simple button with **children**, **bgColor**, **textColor**, **className**, and rest props.

---

## 14. Constants & Layout Data

### `constants/index.js`

- **navlinks**: Home, About Us, Featured, Reviews, Contact (name + href).

### `layouts/applayout/common.js`

- **footerLinks**: locations, quickLinks, extraLinks, contactInfo, socialLinks (used by Footer).

---

## 15. Appwrite Client (`appwrite/auth/Client.js`)

- Creates **Client** with endpoint and project (hardcoded; can be switched to conf).
- Exports **account**, **storage**, **databases**, **Query**, **client** for components that need direct Appwrite access (e.g. Login recovery, BookCard cover URL).

---

## 16. Flow Summary

1. **Open app** → main.jsx mounts Router + Redux + AuthInit + App.
2. **AuthInit** runs **getCurrentUser()** → **setAuthFromSession** → then renders App.
3. **Routes**: If path under `/` and **userData** is null → MainLayout redirects to **/auth/login**.
4. **Login**: Submit → authService.login → getCurrentUser → dispatch login(userData) → navigate `/`.
5. **Signup**: createAccount → login → sendVerificationEmail → redirect; user verifies via **/auth/verify?userId=&secret=**.
6. **Reset password**: Link with userId/secret → **/auth/reset-password** → confirmPasswordReset → redirect to login.
7. **Logout**: authService.logout + dispatch logout + navigate to **/auth/login**.
8. **Library**: getUserBooks → BookList → BookCards with Publish/Unpublish, Start/Again Read, Mark as Done, Delete; upload via BookUploadForm (createBook, isPublic false by default).
9. **Home**: PublicBookListWrapper loads getPublicBooks() (isPublic: true) and shows same BookList without publish buttons.
10. **Reader**: /reader/:bookId → fetch book + PDF URL → render with @react-pdf-viewer.

That’s the full flow from login/signup through library, public books, and PDF reading.
