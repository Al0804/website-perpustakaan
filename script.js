/*******************************************
 * API BUKU INDONESIA (Google Books)
 * Mengganti Project Gutenberg → Google Books
 * Filter bahasa menggunakan: langRestrict=id
 *******************************************/

// Menyimpan semua buku di memory JS
let allBooks = [];

// Menyimpan daftar favorit di localStorage
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

/*******************************************
 * EVENT UTAMA: EKSEKUSI SAAT DOM SUDAH SIAP
 *******************************************/
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'index.html' || currentPage === '') {
        initHomePage();
    } else if (currentPage === 'katalog.html') {
        initCatalogPage();
    } else if (currentPage === 'kategori.html') {
        initCategoryPage();
    } else if (currentPage === 'favorit.html') {
        initFavoritesPage();
    }
});

/*******************************************
 * 1. HALAMAN BERANDA
 *******************************************/
function initHomePage() {
    animateCounter('bookCount', 12000);
    animateCounter('categoryCount', 30);
    animateCounter('readerCount', 8000);
    loadPopularBooks(); // Muat buku populer
}

/*******************************************
 * EFFECT ANIMASI COUNTER NUMBER
 *******************************************/
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    let currentValue = 0;
    const increment = targetValue / 50;
    const duration = 2000;
    const stepTime = duration / 50;

    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            element.textContent = targetValue.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(currentValue).toLocaleString();
        }
    }, stepTime);
}

/*******************************************
 * SCROLL HALUS KE SECTION BUKU
 *******************************************/
function scrollToBooks() {
    document.getElementById('booksSection').scrollIntoView({ behavior: 'smooth' });
}

/*******************************************
 * 2. MEMUAT BUKU POPULER (HALAMAN BERANDA)
 * Menggunakan kata kunci random: "novel"
 *******************************************/
async function loadPopularBooks() {
    const grid = document.getElementById('popularBooksGrid');
    if (!grid) return;
    grid.innerHTML = '<p style="text-align:center;grid-column:1/-1;">Memuat buku...</p>';

    try {
        // Meminta 12 buku Indonesia
        const response = await fetch(
            'https://www.googleapis.com/books/v1/volumes?q=novel&langRestrict=id&maxResults=12'
        );
        const data = await response.json();

        // Simpan seluruh buku di variabel global
        allBooks = data.items || [];

        // Tampilkan hanya 6 pertama
        displayBooks(allBooks.slice(0, 6), grid);
    } catch (error) {
        grid.innerHTML = '<p style="text-align:center;">Gagal memuat buku.</p>';
    }
}

/*******************************************
 * 3. MEMBUAT GRID CARD BUKU
 *******************************************/
function displayBooks(books, gridElement) {
    if (!books || books.length === 0) {
        gridElement.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Tidak ada buku ditemukan.</p>';
        return;
    }

    gridElement.innerHTML = '';

    books.forEach(book => {
        gridElement.appendChild(createBookCard(book));
    });
}

/*******************************************
 * 4. MEMBUAT KOMPONEN CARD UNTUK SATU BUKU
 *******************************************/
function createBookCard(book) {
    const info = book.volumeInfo;

    // Ambil data aman agar tidak error
    const title = info.title || "Tanpa Judul";
    const author = info.authors ? info.authors[0] : "Tidak diketahui";
    const category = info.categories ? info.categories[0] : "Umum";
    const preview = info.previewLink || ""; // Link untuk baca
    const thumb = info.imageLinks ? info.imageLinks.thumbnail : ""; // Cover

    const isFavorite = favorites.some(fav => fav.id === book.id);

    const card = document.createElement('div');
    card.className = 'book-card';

    card.innerHTML = `
        <img src="${thumb}" alt="${title}" />
        <h3>${title}</h3>
        <p class="author">oleh ${author}</p>
        <span class="category">${category}</span>

        <div class="actions">
            <button class="btn-read" onclick="readBook('${preview}')">Baca</button>
            <button class="btn-favorite ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${book.id}')">
                ${isFavorite ? '★ Favorit' : '☆ Favorit'}
            </button>
        </div>
    `;

    return card;
}

/*******************************************
 * 5. MEMBUKA PREVIEW BUKU (GOOGLE READER)
 *******************************************/
function readBook(link) {
    if (!link) {
        alert("Preview buku tidak tersedia.");
        return;
    }
    if (confirm("Buka preview buku di tab baru?")) window.open(link, "_blank");
}

/*******************************************
 * 6. MENGELOLA FAVORIT (localStorage)
 *******************************************/
function toggleFavorite(bookId) {
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;

    const index = favorites.findIndex(b => b.id === bookId);

    if (index > -1) {
        favorites.splice(index, 1);
        alert(`Buku dihapus dari favorit!`);
    } else {
        favorites.push(book);
        alert(`Buku ditambahkan ke favorit!`);
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
    refreshCurrentPage();
}

/*******************************************
 * REFRESH HALAMAN SUPAYA FAVORIT UPDATE
 *******************************************/
function refreshCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html' || currentPage === '') {
        loadPopularBooks();
    } else if (currentPage === 'katalog.html') {
        loadAllBooks();
    } else if (currentPage === 'favorit.html') {
        initFavoritesPage();
    }
}

/*******************************************
 * 7. HALAMAN KATALOG BUKU
 *******************************************/
async function initCatalogPage() {
    await loadAllBooks();
}

/*******************************************
 * MEMUAT BANYAK BUKU
 *******************************************/
async function loadAllBooks() {
    const grid = document.getElementById('catalogGrid');
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Memuat katalog...</p>';

    try {
        const response = await fetch(
            'https://www.googleapis.com/books/v1/volumes?q=buku&langRestrict=id&maxResults=40'
        );
        const data = await response.json();
        allBooks = data.items || [];

        displayBooks(allBooks, grid);
        updateResultCount(allBooks.length);
    } catch (e) {
        grid.innerHTML = '<p>Gagal memuat katalog.</p>';
    }
}

/*******************************************
 * 8. FITUR PENCARIAN DI KATALOG
 *******************************************/
function searchBooks() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!query) return alert('Masukkan kata kunci!');

    const filtered = allBooks.filter(b => {
        const info = b.volumeInfo;
        return (
            (info.title && info.title.toLowerCase().includes(query)) ||
            (info.authors && info.authors[0].toLowerCase().includes(query))
        );
    });

    displayBooks(filtered, document.getElementById('catalogGrid'));
    updateResultCount(filtered.length);
}

/*******************************************
 * MENAMPILKAN JUMLAH HASIL
 *******************************************/
function updateResultCount(count) {
    const resultCount = document.getElementById('resultCount');
    if (resultCount) resultCount.textContent = `Menampilkan ${count} buku`;
}

/*******************************************
 * 9. URUTKAN BUKU
 *******************************************/
function sortBooks() {
    const sortBy = document.getElementById('sortSelect').value;

    let sorted = [...allBooks];

    if (sortBy === 'title')
        sorted.sort((a, b) => a.volumeInfo.title.localeCompare(b.volumeInfo.title));

    if (sortBy === 'author')
        sorted.sort((a, b) => {
            const a1 = a.volumeInfo.authors ? a.volumeInfo.authors[0] : "";
            const b1 = b.volumeInfo.authors ? b.volumeInfo.authors[0] : "";
            return a1.localeCompare(b1);
        });

    if (sortBy === 'year')
        sorted.sort((a, b) => {
            const ya = a.volumeInfo.publishedDate ? parseInt(a.volumeInfo.publishedDate) : 0;
            const yb = b.volumeInfo.publishedDate ? parseInt(b.volumeInfo.publishedDate) : 0;
            return yb - ya;
        });

    allBooks = sorted;
    displayBooks(allBooks, document.getElementById('catalogGrid'));
}

/*******************************************
 * 10. HALAMAN KATEGORI
 *******************************************/
async function initCategoryPage() {
    await loadCategories();
}

/*******************************************
 * KUMPULKAN KATEGORI DARI API
 *******************************************/
async function loadCategories() {
    const grid = document.getElementById('categoryGrid');
    grid.innerHTML = '<p>Memuat kategori...</p>';

    try {
        const res = await fetch(
            'https://www.googleapis.com/books/v1/volumes?q=novel&langRestrict=id&maxResults=40'
        );
        const data = await res.json();
        allBooks = data.items || [];

        const categoryMap = new Map();

        allBooks.forEach(book => {
            if (!book.volumeInfo.categories) return;
            book.volumeInfo.categories.forEach(cat => {
                categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
            });
        });

        const categories = Array.from(categoryMap.entries()).slice(0, 12);

        displayCategories(categories, grid);
    } catch (e) {
        grid.innerHTML = '<p>Gagal memuat kategori.</p>';
    }
}

/*******************************************
 * MENAMPILKAN KARTU KATEGORI
 *******************************************/
function displayCategories(arr, grid) {
    grid.innerHTML = '';

    arr.forEach(([category, count]) => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
            <h3>${category}</h3>
            <p>${count} buku</p>
        `;
        card.onclick = () => showCategoryBooks(category);
        grid.appendChild(card);
    });
}

/*******************************************
 * FILTER BUKU BERDASARKAN KATEGORI
 *******************************************/
function showCategoryBooks(category) {
    const section = document.getElementById('categoryBooksSection');
    const title = document.getElementById('selectedCategoryTitle');
    const grid = document.getElementById('categoryBooksGrid');

    const filtered = allBooks.filter(book =>
        book.volumeInfo.categories &&
        book.volumeInfo.categories.includes(category)
    );

    title.textContent = `Kategori: ${category}`;
    section.style.display = 'block';
    displayBooks(filtered, grid);
    section.scrollIntoView({ behavior: 'smooth' });
}

function resetCategory() {
    document.getElementById('categoryBooksSection').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/*******************************************
 * 11. HALAMAN FAVORIT
 *******************************************/
function initFavoritesPage() {
    const grid = document.getElementById('favoritesGrid');
    const emptyState = document.getElementById('emptyFavorites');

    favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    allBooks = favorites;

    if (favorites.length === 0) {
        emptyState.style.display = 'block';
        grid.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        grid.style.display = 'grid';
        displayBooks(favorites, grid);
    }
}

/*******************************************
 * 12. FORM KONTAK
 *******************************************/
function submitContact(event) {
    event.preventDefault();
    alert("Pesan terkirim! Kami akan balas segera.");
    document.getElementById('contactForm').reset();
}
