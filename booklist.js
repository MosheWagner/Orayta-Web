// TODO: Make booklist look better
// TODO: Make booklist collapsable
// FAR TODO: Add booklist search
// TODO: Hide booklist after loading book
// TODO: Put booklist in a sidebar? (Only for desktop mode?)

fetch("./booklist.json").then(res => res.json()).then(displayBookTree)

function displayBookTree(booklist) {
    displayBookTreeRec(booklist, $("#booklist"), 0)
}

function loadBook(b) {
    displayBook(b + ".obk");
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