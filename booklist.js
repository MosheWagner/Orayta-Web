// TODO: Make booklist look better
// TODO: Make booklist collapsable
// FAR TODO: Add booklist search
// TODO: Hide booklist after loading book
// TODO: Put booklist in a sidebar? (Only for desktop mode?)

function showBookTree() {
    fetch("./booklist.json").then(res => res.json()).then(displayBookTree);
}

function hasUid(name, book, uid, callback) {
    if (book['UniqueId'] == uid) {
        callback(name + '.obk');
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

function loadBook(b) {
    window.location = '/book.html?book_id=' + b + ".obk";
}

function displayBookTreeRec(booklist, elem, indent) {
    var indent_html = "&nbsp".repeat(indent * 4);
    for (let [name, book] of Object.entries(booklist['files'])) {
        elem.append(indent_html + "<a onclick=loadBook(this.id) id=" + name + ">" + book['DisplayName'] + "<BR>" + "</a>");
    }
    for (let [, subfolder] of Object.entries(booklist['subfolders'])) {
        var new_elem = elem.append(indent_html + "<b>" + subfolder['name'] + "</b><BR>");
        displayBookTreeRec(subfolder, new_elem, indent+1);
    }
}