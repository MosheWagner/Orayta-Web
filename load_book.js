// TODO: Full book parsing

// TODO: Replace previous book when loading new book
// TODO: Link parsing
// TODO: Book interleaving
// TODO: Nikud and Teamin toggle
// TODO: Handle first line (starts with a $)
// TODO: Handle comments (start with #)

let LEVEL_MAP = [
    [/{{([^}]+)}}/gm, "<b><i>$1</i></b>"],
    [/! {([^}]+)}/gm, "<b>$1</b>"],
    [/~ ([^\n]*)/gm, "<h1>$1</h1>"],
]

function fetchUnzipBook(book_short_path) {
    let book_path = BOOK_PATH_BASE + book_short_path;
    var zip = new JSZip();
    return fetch(book_path).then(res => res.blob())
    .then(JSZip.loadAsync)                             
    .then(zip => zip.file("BookText").async("string"));
}

function parseBook(book_text) {
    for (map_entry of LEVEL_MAP) {
        book_text = book_text.replace(map_entry[0], map_entry[1]);
    }
    // ...
    // And so on and so forth
    // ...
    return book_text;
}

function displayBook(book_short_path) {
    fetchUnzipBook(book_short_path).then(parseBook).then(function success(text) {
        $("#fetch").append(text);
    }, function error(e) {
        $("#fetch").append($("<p>", {
            "class": "alert alert-danger",
            text: e
        }));
    });
}