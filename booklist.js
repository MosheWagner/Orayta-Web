// TODO: Make booklist look better
// TODO: Make booklist collapsable
// TODO: Put booklist in a sidebar? (Only for desktop mode?)
// FAR TODO: Add booklist search

function showBookTree() {
    fetch("./booklist.json").then(res => res.json()).then(displayBookTree);
}

function hasUid(name, book, uid, callback) {
    if (book['UniqueId'] == uid) {
        callback(name);
    }
}

function findBookByUid(uid, callback) {
    fetch("./booklist.json").then(res => res.json()).then(e => traverseBookTreeRec(e, (name, book) => hasUid(name, book, uid, callback)));
}

function traverseBookTreeRec(booklist, callback) {
    for (let [name, book] of Object.entries(booklist['files'])) {
        callback(name, book);
    }
    for (let [, subfolder] of Object.entries(booklist['subfolders'])) {
        traverseBookTreeRec(subfolder, callback);
    }
}

function displayBookTree(booklist) {
    displayBookTreeRec(booklist, $("#booklist"), 0)
}

function redirectToBook(book_name) {
    if (book_name == undefined) {
        console.log("Error, book is undefined!");
    }
    let anchor_suffix = "";
    if (params['anchor'] != undefined && params['anchor'] != "") {
        anchor_suffix = `&anchor=${params['anchor']}`;
    }
    window.location.replace('./book.html?book_id=' + book_name + anchor_suffix);
}

function displayBookTreeRec(booklist, elem, indent) {
    var indent_html = "&nbsp".repeat(indent * 4);
    for (let [name, book] of Object.entries(booklist['files'])) {
        elem.append(indent_html + "<a onclick=redirectToBook(this.id) id=" + name + ">" + book['DisplayName'] + "<BR>" + "</a>");
    }
    for (let [, subfolder] of Object.entries(booklist['subfolders'])) {
        var new_elem = elem.append(indent_html + "<b>" + subfolder['name'] + "</b><BR>");
        displayBookTreeRec(subfolder, new_elem, indent + 1);
    }
}