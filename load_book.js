// TODO: Full book parsing

// TODO: Book index (side bar?)
// TODO: Improve link parsing
// TODO: Book interleaving
// TODO: Nikud and Teamin toggle
// TODO: Handle comments (start with #)

const LEVEL_SIGNS = "$#^@~";
const LEVEL_REGEXES = [
    // General level marks
    /(~) ([^\n]*)/gm,
    /(@) ([^\n]*)/gm, 
    /(\^) ([^\n]*)/gm, 
    /(#) ([^\n]*)/gm, 
    /(\$) ([^\n]*)/gm,
]

const ADDITIONAL_REPLACES = [
    // Tanach Pasuk mark
    [/! {([^}]+)}/gm, "<b>$1</b>"],
    [/{{([^}]+)}}/gm, "<b><i>$1</i></b>"],
    // Comment lines
    [/^\/\/ .*\n/gm, ""],
    [/^&.*\n/gm, ""],
]

const LINK_REGEX = /<!--ex([abc])([A-Z]*)-->(.*)/gm

function fetchUnzipBook(book_short_path) {
    let book_path = BOOK_PATH_BASE + book_short_path;
    var zip = new JSZip();
    return fetch(book_path).then(res => res.blob())
    .then(JSZip.loadAsync)                             
    .then(zip => zip.file("BookText").async("string"));
}

function levelHtml(level_sign, level_title) {
    let level_index = LEVEL_SIGNS.indexOf(level_sign);
    let escaped_level_title = level_title.replaceAll(" ", "_");
    if (level_index == 0) {level_index++};
    return `<h${level_index}><div id=${escaped_level_title}>${level_title}</div></h${level_index}>`;
}

function decodePayload(payload) {
    let decoded = "";
    for(var i=0; i < payload.length - 1; i+=2){
        let v = payload[i].charCodeAt(0) - 0x41;
        v += ((payload[i+1].charCodeAt(0) - 0x41) << 4);
        decoded += String.fromCharCode(v);
    }
    return iconv.decode(decoded,"ISO-88598");
}

function decodeLink(type, encoded, disp) {
    // Note: As exciting as the link type is, we don't really use it...

    let book_id = 0;
    let link_label = "";
    let display_style_bits = 0;  // BITS:  0-bold, 1-underline, 2-italic, 3-small, 4-big, 5-red, 6-green, 7-blue
    let decoded = decodePayload(encoded);
    let parts = decoded.split('|');
    display_style_bits = parseInt(parts[0]);

    if (parts.length < 2) {
        return `<a href=#>${disp}</a> `;
    }

    if (parts[1].startsWith("bm:")) {
        // TODO: For some reason משנה seems to give the wrong id?
        book_id = parseInt(parts[1].substring(3, parts[1].indexOf("#") - 1));
        link_label = parts[1].substring(parts[1].indexOf("#")+1).replace(" ", "_");
        // TODO: This removes the lowest level part of the link, is that good?
        link_label = link_label.replace(/-{[^}]*}/gm, '');
    } else {
        return `<a href=#>${disp}</a> `;
    }

    return `<a href=/book.html?book_uid=${book_id}&anchor=${link_label}>${disp}</a> `
}

function parseBook(book_text) {
    for (regex of LEVEL_REGEXES) {
        book_text = book_text.replace(regex, (_, sign, title) => levelHtml(sign, title));
    }
    for (replace of ADDITIONAL_REPLACES) {
        book_text = book_text.replace(replace[0], replace[1]);
    }
    book_text = book_text.replace(LINK_REGEX, (_, type, encoded, disp) => decodeLink(type, encoded, disp));
    

    return book_text;
}

function displayBook(book_short_path) {
    fetchUnzipBook(book_short_path).then(parseBook).then(function success(text) {
        $("#contents").append(text);
        scrollToAnchor();
    }, function error(e) {
        $("#contents").append($("<p>", {
            "class": "alert alert-danger",
            text: e
        }));
    });
}

function loadBook() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    if (params['book_id'] != undefined) {
        displayBook(params['book_id']);
    }
    if (params['book_uid'] != undefined) {
        findBookByUid(params['book_uid'], displayBook);
    }
}

function scrollToAnchor() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    if (params['anchor'] != undefined && params['anchor'] != "") {
        document.getElementById(params['anchor'].replaceAll(" ", "_")).scrollIntoView();
    }
}


iconv.skipDecodeWarning = true;