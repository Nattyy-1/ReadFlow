import assert from 'node:assert/strict';
import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const dbPath = `/tmp/readflow-test-${process.pid}.db`;
const databaseUrl = `file:${dbPath}`;

let baseUrl;
let server;
let prisma;
let authService;
let axios;
let nodemailer;
let capturedEmails = [];
const googlePayloads = new Map();
let forceGoogleBooksFailure = false;

const tests = [];

const bookFixtures = {
  google_book_1: {
    title: 'Crime and Punishment',
    authors: ['Fyodor Dostoevsky'],
    description: 'A classic novel.',
    pageCount: 430,
    categories: ['Fiction'],
    imageLinks: { thumbnail: 'https://example.com/crime.jpg' }
  },
  google_book_2: {
    title: 'The Trial',
    authors: ['Franz Kafka'],
    description: 'A Kafka novel.',
    pageCount: 250,
    categories: ['Classics'],
    imageLinks: { thumbnail: 'https://example.com/trial.jpg' }
  }
};

function defineTest(name, fn) {
  tests.push({ name, fn });
}

function cleanDatabaseFiles() {
  for (const suffix of ['', '-journal', '-shm', '-wal']) {
    fs.rmSync(`${dbPath}${suffix}`, { force: true });
  }
}

function applyMigrations() {
  const migrationsPath = path.join(repoRoot, 'prisma', 'migrations');
  const migrationDirectories = fs.readdirSync(migrationsPath)
    .filter((entry) => entry !== 'migration_lock.toml')
    .sort();

  const db = new Database(dbPath);

  for (const directory of migrationDirectories) {
    const sqlPath = path.join(migrationsPath, directory, 'migration.sql');
    db.exec(fs.readFileSync(sqlPath, 'utf8'));
  }

  db.close();
}

async function request(method, pathname, { token, body } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  return { status: response.status, data };
}

async function registerAndLogin({
  username,
  email,
  password = 'password123'
}) {
  const registerResponse = await request('POST', '/api/auth/register', {
    body: { username, email, password }
  });

  assert.equal(registerResponse.status, 201);

  const loginResponse = await request('POST', '/api/auth/login', {
    body: { username, password }
  });

  assert.equal(loginResponse.status, 200);

  return {
    token: loginResponse.data.token,
    user: loginResponse.data.user
  };
}

async function addBook(token, { googleId = 'google_book_1', status = 'WANT_TO_READ' } = {}) {
  const response = await request('POST', '/api/books/add', {
    token,
    body: { googleId, status }
  });

  assert.equal(response.status, 201);
  return response.data.book;
}

async function startSession(token, bookId) {
  const response = await request('POST', '/api/sessions/start', {
    token,
    body: { bookId }
  });

  assert.equal(response.status, 201);
  return response.data.session;
}

function extractResetToken() {
  const message = capturedEmails.at(-1)?.text || '';
  const token = message.match(/token=([a-f0-9]+)/)?.[1];
  assert.ok(token, 'Expected password reset token in captured email');
  return token;
}

async function setup() {
  cleanDatabaseFiles();

  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = databaseUrl;
  process.env.JWT_SECRET = 'test-secret';
  process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
  process.env.GOOGLE_BOOKS_API_KEY = 'test-google-books-key';
  process.env.APP_URL = 'http://localhost:5000';
  process.env.SMTP_HOST = 'smtp.test.local';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'test-user';
  process.env.SMTP_PASS = 'test-pass';

  applyMigrations();

  const { startServer } = await import('../src/server.js');
  ({ default: axios } = await import('axios'));
  ({ default: nodemailer } = await import('nodemailer'));
  ({ default: authService } = await import('../src/services/authService.js'));
  ({ prisma } = await import('../src/prismaClient.js'));

  const originalAxiosGet = axios.get.bind(axios);
  axios.get = async (url, ...args) => {
    if (typeof url !== 'string' || !url.startsWith('https://www.googleapis.com/books/v1/volumes')) {
      return originalAxiosGet(url, ...args);
    }

    if (forceGoogleBooksFailure) {
      throw new Error('Upstream unavailable');
    }

    if (url.includes('/volumes?')) {
      return {
        data: {
          items: Object.entries(bookFixtures).map(([id, volumeInfo]) => ({
            id,
            volumeInfo: {
              title: volumeInfo.title,
              authors: volumeInfo.authors,
              imageLinks: volumeInfo.imageLinks,
            }
          }))
        }
      };
    }

    const match = url.match(/\/volumes\/([^?]+)/);
    const googleId = match?.[1];
    const volumeInfo = bookFixtures[googleId];
    assert.ok(volumeInfo, `Unexpected Google Books fixture request for ${googleId}`);

    return {
      data: {
        id: googleId,
        volumeInfo
      }
    };
  };

  nodemailer.createTransport = () => ({
    sendMail: async (mailOptions) => {
      capturedEmails.push(mailOptions);
      return { messageId: `message-${capturedEmails.length}` };
    }
  });

  authService.googleClient.verifyIdToken = async ({ idToken }) => {
    const payload = googlePayloads.get(idToken);

    if (!payload) {
      throw new Error('Invalid test token');
    }

    return {
      getPayload: () => payload
    };
  };

  server = startServer(0);
  if (!server.listening) {
    await Promise.race([
      once(server, 'listening'),
      once(server, 'error').then(([error]) => Promise.reject(error))
    ]);
  }
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}

async function resetState() {
  capturedEmails = [];
  googlePayloads.clear();
  forceGoogleBooksFailure = false;

  await prisma.readingSession.deleteMany();
  await prisma.userBook.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();
}

async function teardown() {
  if (server?.listening) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }

  if (prisma) {
    await prisma.$disconnect();
  }

  cleanDatabaseFiles();
}

defineTest('registers and logs in a user, then returns the profile', async () => {
  const { token, user } = await registerAndLogin({
    username: 'reader1',
    email: 'reader1@example.com'
  });

  assert.equal(user.username, 'reader1');
  assert.equal(user.email, 'reader1@example.com');

  const meResponse = await request('GET', '/api/auth/me', { token });

  assert.equal(meResponse.status, 200);
  assert.equal(meResponse.data.user.username, 'reader1');
  assert.equal(meResponse.data.user.email, 'reader1@example.com');
});

defineTest('rejects invalid auth input and wrong credentials', async () => {
  const invalidRegister = await request('POST', '/api/auth/register', {
    body: {
      username: 'ab',
      email: 'not-an-email',
      password: '123'
    }
  });

  assert.equal(invalidRegister.status, 400);
  assert.equal(invalidRegister.data.success, false);
  assert.equal(invalidRegister.data.error.email, 'Invalid email format');

  await registerAndLogin({
    username: 'reader2',
    email: 'reader2@example.com'
  });

  const badLogin = await request('POST', '/api/auth/login', {
    body: {
      username: 'reader2',
      password: 'wrong-password'
    }
  });

  assert.equal(badLogin.status, 401);
  assert.equal(badLogin.data.error, 'Invalid username or password');
});

defineTest('executes the password reset flow using the token captured from the sent email', async () => {
  await registerAndLogin({
    username: 'reader3',
    email: 'reader3@example.com'
  });

  const forgotResponse = await request('POST', '/api/auth/forgot-password', {
    body: { email: 'reader3@example.com' }
  });

  assert.equal(forgotResponse.status, 200);
  assert.equal(capturedEmails.length, 1);

  const resetToken = extractResetToken();

  const verifyResponse = await request('POST', '/api/auth/verify-reset-token', {
    body: {
      email: 'reader3@example.com',
      token: resetToken
    }
  });

  assert.equal(verifyResponse.status, 200);

  const resetResponse = await request('PUT', '/api/auth/reset-password', {
    body: {
      email: 'reader3@example.com',
      token: resetToken,
      password: 'new-password-123'
    }
  });

  assert.equal(resetResponse.status, 200);

  const oldPasswordLogin = await request('POST', '/api/auth/login', {
    body: {
      username: 'reader3',
      password: 'password123'
    }
  });

  assert.equal(oldPasswordLogin.status, 401);

  const newPasswordLogin = await request('POST', '/api/auth/login', {
    body: {
      username: 'reader3',
      password: 'new-password-123'
    }
  });

  assert.equal(newPasswordLogin.status, 200);
});

defineTest('rejects invalid and expired password reset tokens', async () => {
  await registerAndLogin({
    username: 'reader3b',
    email: 'reader3b@example.com'
  });

  await request('POST', '/api/auth/forgot-password', {
    body: { email: 'reader3b@example.com' }
  });

  const invalidVerify = await request('POST', '/api/auth/verify-reset-token', {
    body: {
      email: 'reader3b@example.com',
      token: 'short-token'
    }
  });

  assert.equal(invalidVerify.status, 400);
  assert.equal(invalidVerify.data.error, 'Invalid reset token');

  await prisma.user.update({
    where: { email: 'reader3b@example.com' },
    data: {
      resetTokenExpires: new Date(Date.now() - 60_000)
    }
  });

  const expiredVerify = await request('POST', '/api/auth/verify-reset-token', {
    body: {
      email: 'reader3b@example.com',
      token: extractResetToken()
    }
  });

  assert.equal(expiredVerify.status, 400);
  assert.equal(expiredVerify.data.error, 'Reset link has expired');
});

defineTest('does not leak whether a password reset email exists', async () => {
  const forgotResponse = await request('POST', '/api/auth/forgot-password', {
    body: { email: 'missing@example.com' }
  });

  assert.equal(forgotResponse.status, 200);
  assert.equal(capturedEmails.length, 0);
});

defineTest('supports Google OAuth login for new and existing users', async () => {
  googlePayloads.set('google-new', {
    sub: 'google-user-1',
    email: 'google-user@example.com',
    name: 'Google User'
  });

  const googleLogin = await request('POST', '/api/auth/google', {
    body: { idToken: 'google-new' }
  });

  assert.equal(googleLogin.status, 200);
  assert.equal(googleLogin.data.user.email, 'google-user@example.com');
  assert.equal(googleLogin.data.user.authProvider, 'google');

  await registerAndLogin({
    username: 'reader4',
    email: 'reader4@example.com'
  });

  googlePayloads.set('google-link', {
    sub: 'google-user-2',
    email: 'reader4@example.com',
    name: 'Reader Four'
  });

  const linkedLogin = await request('POST', '/api/auth/google', {
    body: { idToken: 'google-link' }
  });

  assert.equal(linkedLogin.status, 200);
  assert.equal(linkedLogin.data.user.email, 'reader4@example.com');
  assert.equal(linkedLogin.data.user.googleId, 'google-user-2');
});

defineTest('rejects invalid Google OAuth tokens', async () => {
  const response = await request('POST', '/api/auth/google', {
    body: { idToken: 'unknown-token' }
  });

  assert.equal(response.status, 401);
  assert.equal(response.data.error, 'Invalid or expired Google token');
});

defineTest('requires authentication for protected routes', async () => {
  const response = await request('GET', '/api/books');

  assert.equal(response.status, 401);
  assert.equal(response.data.message, 'No token provided or invalid format');
});

defineTest('searches and adds books, then filters the shelf', async () => {
  const { token } = await registerAndLogin({
    username: 'reader5',
    email: 'reader5@example.com'
  });

  const searchResponse = await request('GET', '/api/books/search?title=crime', { token });

  assert.equal(searchResponse.status, 200);
  assert.equal(searchResponse.data.count, 2);

  const addedBook = await addBook(token, {
    googleId: 'google_book_1',
    status: 'READING'
  });

  assert.equal(addedBook.book.title, 'Crime and Punishment');

  const shelfResponse = await request('GET', '/api/books?status=READING', { token });

  assert.equal(shelfResponse.status, 200);
  assert.equal(shelfResponse.data.books.length, 1);
  assert.equal(shelfResponse.data.books[0].title, 'Crime and Punishment');
});

defineTest('returns book details, updates status and review, then deletes the shelf entry', async () => {
  const { token } = await registerAndLogin({
    username: 'reader5b',
    email: 'reader5b@example.com'
  });

  const addedBook = await addBook(token, {
    googleId: 'google_book_1',
    status: 'WANT_TO_READ'
  });

  const detailsResponse = await request('GET', `/api/books/${addedBook.bookId}`, { token });
  assert.equal(detailsResponse.status, 200);
  assert.equal(detailsResponse.data.metadata.status, 'WANT_TO_READ');

  const updateStatusResponse = await request('PATCH', `/api/books/${addedBook.bookId}`, {
    token,
    body: { status: 'READING' }
  });
  assert.equal(updateStatusResponse.status, 200);
  assert.equal(updateStatusResponse.data.metadata.status, 'READING');

  const reviewResponse = await request('PATCH', `/api/books/${addedBook.bookId}/review`, {
    token,
    body: { rating: 5, review: 'great book' }
  });
  assert.equal(reviewResponse.status, 200);
  assert.equal(reviewResponse.data.data.rating, 5);
  assert.equal(reviewResponse.data.data.review, 'great book');

  const deleteResponse = await request('DELETE', `/api/books/${addedBook.bookId}`, { token });
  assert.equal(deleteResponse.status, 204);

  const missingDetails = await request('GET', `/api/books/${addedBook.bookId}`, { token });
  assert.equal(missingDetails.status, 404);
});

defineTest('rejects invalid book and review inputs', async () => {
  const { token } = await registerAndLogin({
    username: 'reader6',
    email: 'reader6@example.com'
  });

  const invalidSearch = await request('GET', '/api/books/search?title=', { token });
  assert.equal(invalidSearch.status, 400);

  const invalidAdd = await request('POST', '/api/books/add', {
    token,
    body: {
      googleId: 'google_book_1',
      status: 'BROKEN'
    }
  });

  assert.equal(invalidAdd.status, 400);

  const addedBook = await addBook(token, {
    googleId: 'google_book_1',
    status: 'COMPLETED'
  });

  const invalidReview = await request('PATCH', `/api/books/${addedBook.bookId}/review`, {
    token,
    body: {
      rating: 'not-a-number',
      review: 'bad payload'
    }
  });

  assert.equal(invalidReview.status, 400);
});

defineTest('returns not found or upstream errors for missing book state and Google Books failures', async () => {
  const { token } = await registerAndLogin({
    username: 'reader6b',
    email: 'reader6b@example.com'
  });

  const missingBook = await request('GET', '/api/books/9999', { token });
  assert.equal(missingBook.status, 404);

  const missingPace = await request('GET', '/api/books/9999/pace', { token });
  assert.equal(missingPace.status, 200);
  assert.equal(missingPace.data.pace, 0);

  forceGoogleBooksFailure = true;
  const failedSearch = await request('GET', '/api/books/search?title=crime', { token });
  assert.equal(failedSearch.status, 502);
  assert.equal(failedSearch.data.error, 'Unable to fetch book data from Google Books');

  const failedAdd = await request('POST', '/api/books/add', {
    token,
    body: {
      googleId: 'google_book_1',
      status: 'READING'
    }
  });
  assert.equal(failedAdd.status, 502);
  assert.equal(failedAdd.data.error, 'Unable to fetch book data from Google Books');
});

defineTest('starts and stops a reading session, computes pace, and marks the book completed at the end', async () => {
  const { token } = await registerAndLogin({
    username: 'reader7',
    email: 'reader7@example.com'
  });

  const addedBook = await addBook(token, {
    googleId: 'google_book_2',
    status: 'READING'
  });

  const startResponse = await request('POST', '/api/sessions/start', {
    token,
    body: { bookId: addedBook.bookId }
  });

  assert.equal(startResponse.status, 201);

  await prisma.readingSession.update({
    where: { id: startResponse.data.session.id },
    data: {
      startTime: new Date(Date.now() - 60 * 60 * 1000)
    }
  });

  const stopResponse = await request('POST', '/api/sessions/stop', {
    token,
    body: {
      sessionId: startResponse.data.session.id,
      currentPage: 250
    }
  });

  assert.equal(stopResponse.status, 200);
  assert.equal(stopResponse.data.data.pagesRead, 250);
  assert.equal(stopResponse.data.data.status, 'COMPLETED');

  const paceResponse = await request('GET', `/api/books/${addedBook.bookId}/pace`, { token });

  assert.equal(paceResponse.status, 200);
  assert.equal(paceResponse.data.unit, 'pages_per_hour');
  assert.ok(paceResponse.data.pace >= 249 && paceResponse.data.pace <= 251);
});

defineTest('lists sessions for one book and for the whole user account', async () => {
  const { token } = await registerAndLogin({
    username: 'reader7b',
    email: 'reader7b@example.com'
  });

  const firstBook = await addBook(token, {
    googleId: 'google_book_1',
    status: 'READING'
  });
  const secondBook = await addBook(token, {
    googleId: 'google_book_2',
    status: 'READING'
  });

  const firstSession = await startSession(token, firstBook.bookId);
  await prisma.readingSession.update({
    where: { id: firstSession.id },
    data: { startTime: new Date(Date.now() - 30 * 60 * 1000) }
  });
  await request('POST', '/api/sessions/stop', {
    token,
    body: { sessionId: firstSession.id, currentPage: 50 }
  });

  const secondSession = await startSession(token, secondBook.bookId);
  await prisma.readingSession.update({
    where: { id: secondSession.id },
    data: { startTime: new Date(Date.now() - 20 * 60 * 1000) }
  });
  await request('POST', '/api/sessions/stop', {
    token,
    body: { sessionId: secondSession.id, currentPage: 25 }
  });

  const bookSessions = await request('GET', `/api/sessions/book/${firstBook.bookId}`, { token });
  assert.equal(bookSessions.status, 200);
  assert.equal(bookSessions.data.data.length, 1);
  assert.equal(bookSessions.data.data[0].userBook.book.title, 'Crime and Punishment');

  const allSessions = await request('GET', '/api/sessions', { token });
  assert.equal(allSessions.status, 200);
  assert.equal(allSessions.data.data.length, 2);
});

defineTest('blocks a second active session for the same user', async () => {
  const { token } = await registerAndLogin({
    username: 'reader8',
    email: 'reader8@example.com'
  });

  const addedBook = await addBook(token, {
    googleId: 'google_book_1',
    status: 'READING'
  });

  const firstStart = await request('POST', '/api/sessions/start', {
    token,
    body: { bookId: addedBook.bookId }
  });

  assert.equal(firstStart.status, 201);

  const secondStart = await request('POST', '/api/sessions/start', {
    token,
    body: { bookId: addedBook.bookId }
  });

  assert.equal(secondStart.status, 400);
  assert.match(secondStart.data.error, /already have an active session/i);
});

defineTest('prevents one user from stopping another users session', async () => {
  const owner = await registerAndLogin({
    username: 'owner',
    email: 'owner@example.com'
  });
  const attacker = await registerAndLogin({
    username: 'attacker',
    email: 'attacker@example.com'
  });

  const addedBook = await addBook(owner.token, {
    googleId: 'google_book_1',
    status: 'READING'
  });

  const startResponse = await request('POST', '/api/sessions/start', {
    token: owner.token,
    body: { bookId: addedBook.bookId }
  });

  assert.equal(startResponse.status, 201);

  const stopResponse = await request('POST', '/api/sessions/stop', {
    token: attacker.token,
    body: {
      sessionId: startResponse.data.session.id,
      currentPage: 50
    }
  });

  assert.equal(stopResponse.status, 404);
  assert.equal(stopResponse.data.error, 'No open session found by this ID');
});

defineTest('rejects invalid session input and impossible page progression', async () => {
  const { token } = await registerAndLogin({
    username: 'reader9',
    email: 'reader9@example.com'
  });

  const addedBook = await addBook(token, {
    googleId: 'google_book_1',
    status: 'READING'
  });

  const invalidStart = await request('POST', '/api/sessions/start', {
    token,
    body: { bookId: 'not-a-number' }
  });

  assert.equal(invalidStart.status, 400);

  const startResponse = await request('POST', '/api/sessions/start', {
    token,
    body: { bookId: addedBook.bookId }
  });

  assert.equal(startResponse.status, 201);

  const tooHighPage = await request('POST', '/api/sessions/stop', {
    token,
    body: {
      sessionId: startResponse.data.session.id,
      currentPage: 9999
    }
  });

  assert.equal(tooHighPage.status, 400);
  assert.equal(tooHighPage.data.error, "Current page cannot exceed the book's total page count");

  const lowerPage = await request('POST', '/api/sessions/stop', {
    token,
    body: {
      sessionId: startResponse.data.session.id,
      currentPage: -1
    }
  });

  assert.equal(lowerPage.status, 400);
});

defineTest('updates username successfully', async () => {
  const { token, user } = await registerAndLogin({
    username: 'updateuser1',
    email: 'updateuser1@example.com'
  });

  assert.equal(user.username, 'updateuser1');

  const updateResponse = await request('PUT', '/api/auth/update-profile', {
    token,
    body: { username: 'newusername1' }
  });

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.data.user.username, 'newusername1');

  const meResponse = await request('GET', '/api/auth/me', { token });
  assert.equal(meResponse.data.user.username, 'newusername1');
});

defineTest('updates password successfully and can login with new password', async () => {
  await registerAndLogin({
    username: 'updatepass1',
    email: 'updatepass1@example.com',
    password: 'oldpassword123'
  });

  const loginWithOld = await request('POST', '/api/auth/login', {
    body: { username: 'updatepass1', password: 'oldpassword123' }
  });
  assert.equal(loginWithOld.status, 200);

  const updateResponse = await request('PUT', '/api/auth/update-profile', {
    token: loginWithOld.data.token,
    body: { password: 'newpassword456' }
  });

  assert.equal(updateResponse.status, 200);

  const loginWithOldAgain = await request('POST', '/api/auth/login', {
    body: { username: 'updatepass1', password: 'oldpassword123' }
  });
  assert.equal(loginWithOldAgain.status, 401);

  const loginWithNew = await request('POST', '/api/auth/login', {
    body: { username: 'updatepass1', password: 'newpassword456' }
  });
  assert.equal(loginWithNew.status, 200);
});

defineTest('updates both username and password successfully', async () => {
  const { token } = await registerAndLogin({
    username: 'bothupdate1',
    email: 'bothupdate1@example.com',
    password: 'oldpass123'
  });

  const updateResponse = await request('PUT', '/api/auth/update-profile', {
    token,
    body: { username: 'bothupdate2', password: 'newpass456' }
  });

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.data.user.username, 'bothupdate2');

  const loginNew = await request('POST', '/api/auth/login', {
    body: { username: 'bothupdate2', password: 'newpass456' }
  });
  assert.equal(loginNew.status, 200);
});

defineTest('updating to same username succeeds (no change)', async () => {
  const { token } = await registerAndLogin({
    username: 'sameuser1',
    email: 'sameuser1@example.com'
  });

  const updateResponse = await request('PUT', '/api/auth/update-profile', {
    token,
    body: { username: 'sameuser1' }
  });

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.data.user.username, 'sameuser1');
});

defineTest('rejects update when username is already taken by another user', async () => {
  await registerAndLogin({
    username: 'takenuser1',
    email: 'takenuser1@example.com'
  });

  const { token } = await registerAndLogin({
    username: 'updateuser2',
    email: 'updateuser2@example.com'
  });

  const updateResponse = await request('PUT', '/api/auth/update-profile', {
    token,
    body: { username: 'takenuser1' }
  });

  assert.equal(updateResponse.status, 409);
  assert.equal(updateResponse.data.error, 'Username is already taken');
});

defineTest('rejects update without any valid fields', async () => {
  const { token } = await registerAndLogin({
    username: 'emptyupdate1',
    email: 'emptyupdate1@example.com'
  });

  const updateResponse = await request('PUT', '/api/auth/update-profile', {
    token,
    body: {}
  });

  assert.equal(updateResponse.status, 400);
  assert.ok(updateResponse.data.error['']);
});

defineTest('rejects invalid username and password input', async () => {
  const { token } = await registerAndLogin({
    username: 'invalidupdate1',
    email: 'invalidupdate1@example.com'
  });

  const shortUsername = await request('PUT', '/api/auth/update-profile', {
    token,
    body: { username: 'ab' }
  });

  assert.equal(shortUsername.status, 400);
  assert.ok(shortUsername.data.error.username);

  const shortPassword = await request('PUT', '/api/auth/update-profile', {
    token,
    body: { password: '1234567' }
  });

  assert.equal(shortPassword.status, 400);
  assert.ok(shortPassword.data.error.password);
});

defineTest('requires authentication for update-profile', async () => {
  const response = await request('PUT', '/api/auth/update-profile', {
    body: { username: 'someuser' }
  });

  assert.equal(response.status, 401);
  assert.equal(response.data.message, 'No token provided or invalid format');
});

async function run() {
  let passed = 0;
  let failed = 0;

  try {
    await setup();

    for (const { name, fn } of tests) {
      await resetState();

      try {
        await fn();
        passed += 1;
        console.log(`PASS ${name}`);
      } catch (error) {
        failed += 1;
        console.error(`FAIL ${name}`);
        console.error(error);
      }
    }
  } finally {
    await teardown();
  }

  console.log(`\n${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error('Test runner failed');
  console.error(error);
  process.exit(1);
});
