// TODO: Improve book rendering
// TODO: Move index to side bar
// TODO: Improve index look
// TODO: Book interleaving
// TODO: Nikud and Teamin toggle

const LEVEL_INDEXES = {
    "$": 1,
    "#": 1,
    "^": 2,
    "@": 3,
    "~": 4
}

// General level marks
const LEVEL_REGEXES = [
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

function linkToAnchor(level_index, level_title, escaped_level_title) {
    let style = "";
    if (level_index > 2) {
        style = "style=\"display:inline\"";
    }
    return `<small><h${level_index} ${style}><a href=#${escaped_level_title}>${level_title}</a></h${level_index}><small> &nbsp&nbsp`;
}

function levelHtml(offset, level_sign, level_title, index) {
    let level_index = LEVEL_INDEXES[level_sign];
    let escaped_level_title = level_title.replaceAll(" ", "_");

    index[offset] = linkToAnchor(level_index, level_title, escaped_level_title);

    return `<h${level_index}><div id=${escaped_level_title}>${level_title}</div></h${level_index}>`;
}

/*
 * Each byte in the payload of links is encoded as 2 4-bit chunks,
 * stored as the delta above 'A'.
 * The Hebrew in the decoded payload is encoded as "ISO-88598". 
 */
function decodeLinkPayload(payload) {
    let decoded = "";
    for (var i = 0; i < payload.length - 1; i += 2) {
        let v = payload[i].charCodeAt(0) - 0x41;
        v += ((payload[i + 1].charCodeAt(0) - 0x41) << 4);
        decoded += String.fromCharCode(v);
    }
    return iconv.decode(decoded, "ISO-88598");
}

// Link bits (as described by Torat Emet): 0-bold, 1-underline, 2-italic, 3-small, 4-big, 5-red, 6-green, 7-blue
const LINK_FORMATTING_BITS = {
    0b00000001: ['<b>', '</b>'],
    0b00000010: ['<u>', '</u>'],
    0b00000100: ['<i>', '</i>'],
    0b00001000: ['<small>', '</small>'],
    0b00010000: ['<big>', '</big>'],
    0b00100000: ["<p style=\"color:rgb(255,0,0);\">", "</p>"],
    0b01000000: ["<p style=\"color:rgb(0,255,0);\">", "</p>"],
    0b10000000: ["<p style=\"color:rgb(0,0,255);\">", "</p>"],
}

function decodeLink(type, encoded, disp) {
    // Note: As exciting as the link type is, we don't really use it...

    let link = "";

    let decoded = decodeLinkPayload(encoded);
    let parts = decoded.split('|');
    let display_style_bits = parseInt(parts[0]);

    if (parts.length < 2) {
        link = `<a href=#>${disp}</a> `;
    } else if (parts[1].startsWith("bm:")) {
        let book_id = 0;
        let link_label = "";
        // TODO: For some reason משנה seems to give the wrong id?
        book_id = parseInt(parts[1].substring(3, parts[1].indexOf("#") - 1));
        link_label = parts[1].substring(parts[1].indexOf("#") + 1).replace(" ", "_");
        // TODO: This removes the lowest level part of the link, is that good?
        link_label = link_label.replace(/-{[^}]*}/gm, '');
        link = `<a href=/book.html?book_uid=${book_id}&anchor=${link_label}>${disp}</a> `
    } else {
        link = `<a href=#>${disp}</a> `;
    }

    let close_tags = [];
    for (let [bit, tags] of Object.entries(LINK_FORMATTING_BITS)) {
        if ((display_style_bits & bit) != 0) {
            link = tags[0] + link;
            close_tags.push(tags[1]);
        }
    }
    for (tag of close_tags) {
        link += tag;
    }

    return link;
}

function parseBook(book_text) {
    let index = {};
    for (regex of LEVEL_REGEXES) {
        book_text = book_text.replace(regex, (match, sign, title) => levelHtml(book_text.indexOf(match), sign, title, index));
    }
    for (replace of ADDITIONAL_REPLACES) {
        book_text = book_text.replace(replace[0], replace[1]);
    }
    book_text = book_text.replace(LINK_REGEX, (_, type, encoded, disp) => decodeLink(type, encoded, disp));

    return [index, book_text];
}

function renderIndex(index_map) {
    for (k of Object.keys(index_map).map(x => parseInt(x)).sort((a, b) => a - b)) {
        $("#index").append(index_map[k]);
    }
}

function displayBook(book_short_path) {
    fetchUnzipBook(book_short_path).then(parseBook).then(function success([index, text]) {
        renderIndex(index);
        $("#contents").append(text);
        scrollToAnchor();
    }, function error(e) {
        $("#contents").append($("<p>", {
            "class": "alert alert-danger",
            text: e
        }));
    });
}

// Main function in /book url. Called on page load.
function loadBook() {
    if (params['book_id'] != undefined) {
        displayBook(params['book_id'] + ".obk");
    }
    if (params['book_uid'] != undefined) {
        findBookByUid(params['book_uid'], redirectToBook);
    }
}

function selfLink() {
    return `?book_id=${params['book_id']}`
}

// Scrolls to the location set in the 'anchor' url param.
// Triggered once `displayBook` is done.
function scrollToAnchor() {
    if (params['anchor'] != undefined && params['anchor'] != "") {
        window.location.replace(selfLink() + "#" + params['anchor']);
    } else {
        // Refresh hash when coming back to a page. Normal anchor scrolling doesn't work since the page is lazy loaded, so we refresh it here.
        document.getElementById(decodeURIComponent(location.hash).substr(1)).scrollIntoView();
    }
}

// Silence annoying iconv warnings 
iconv.skipDecodeWarning = true;