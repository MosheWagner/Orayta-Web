const BOOK_PATH_BASE = "https://raw.githubusercontent.com/MosheWagner/Orayta-Books/master/books/";

// Parse and expose url params 
const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());