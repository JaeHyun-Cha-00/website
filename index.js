// initialization
const sideBarContent = document.querySelector("#sidebar-content")
const content = document.querySelector("#content")

const searchBGContainer = document.querySelector("#search-bg-container")
const searchContainer = document.querySelector("#search-container")
const searchInput = document.querySelector("#search-input")
const searchDropDown = document.querySelector("#search-dropdown")

const md = window.markdownit({
    breaks: true,
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return (
                    `<pre><code class="hljs language-${lang}">` +
                    hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                    "</code></pre>"
                )
            } catch (__) {}
        }

        return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + "</code></pre>"
    },
})
md.use(centerImagesPlugin)
md.use(externalLinksPlugin)

let dataCache = { pages: [] }

/** GitHub Pages: normalize /repo vs /repo/ so data.json & content/* resolve correctly */
function siteRootUrl() {
    const u = new URL(location.href.split("#")[0])
    let path = u.pathname
    if (path.endsWith("/")) {
        /* ok */
    } else if (/\.html?$/i.test(path)) {
        path = path.replace(/\/[^/]+$/, "/")
    } else {
        path = path + "/"
    }
    u.pathname = path
    return u
}

/** Read current page link from URL hash, e.g. #/blogs → /blogs */
function parseHash() {
    const raw = location.hash.replace(/^#/, "").trim()
    if (!raw) return "/about"
    return raw.startsWith("/") ? raw : "/" + raw
}

function applyRoute() {
    const link = parseHash()
    const item = dataCache.pages.find((obj) => obj.link === link)
    if (!item) {
        const u = siteRootUrl()
        u.hash = "#/about"
        history.replaceState(null, "", u.href)
        const fallback = dataCache.pages.find((obj) => obj.link === "/about")
        if (fallback) {
            updateContent(fallback.content, fallback.icon ?? "", fallback.link)
        }
        return
    }
    updateContent(item.content, item.icon ?? "", item.link)
}

/**
 * Fetches the json db
 * @returns JS object
 */
async function fetchDB() {
    try {
        const url = new URL("data.json", siteRootUrl())
        const response = await fetch(url)
        return await response.json()
    } catch (e) {
        return
    }
}

async function fetchContent(path) {
    try {
        const url = new URL(path.replace(/^\//, ""), siteRootUrl())
        const response = await fetch(url)
        return await response.text()
    } catch (e) {
        console.error(e)
        return ""
    }
}

function escAttr(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
}

fetchDB().then((data) => {
    for (let x of data["pages"]) {
        buildSideBar(x.icon ?? "", x.name, x.link, x.content)
    }
    dataCache = data
    loadSearchResults(data["pages"])

    const u = siteRootUrl()
    if (!location.hash || location.hash === "#") {
        u.hash = "#/about"
        history.replaceState(null, "", u.href)
    }
    window.addEventListener("hashchange", applyRoute)
    window.addEventListener("popstate", applyRoute)
    applyRoute()

    sideBarContent.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-nav-link]")
        if (!btn) return
        e.preventDefault()
        loadPage(btn.getAttribute("data-nav-link"))
    })
})

function buildSideBar(icon, name, link, content) {
    const iconHtml = pageIconSidebarHtml(icon)
    sideBarContent.innerHTML += `
        <button type="button" data-nav-link="${escAttr(link)}" class="page-link tw-text-base tw-flex tw-flex-gap-1">
            ${iconHtml}
            <div class="">${name}</div>
        </button>
    `
}

async function updateContent(path, icon, link) {
    const body = await fetchContent(path)

    const iconEl = document.querySelector("#content-icon")
    const largeIconHtml = pageIconContentHtml(icon)
    if (hasPageIcon(icon)) {
        iconEl.classList.remove("tw-hidden")
        iconEl.innerHTML = largeIconHtml
    } else {
        iconEl.classList.add("tw-hidden")
        iconEl.innerHTML = ""
    }

    content.innerHTML = `

        ${path.endsWith(".md") ? md.render(body) : body}   
    `

    document.querySelectorAll(".page-link").forEach((ele) => {
        ele.classList.remove("active")
    })

    document.querySelectorAll("button.page-link[data-nav-link]").forEach((btn) => {
        if (btn.getAttribute("data-nav-link") === link) btn.classList.add("active")
    })
}

function loadPage(pageLink) {
    const item = dataCache.pages.find((obj) => obj.link === pageLink)

    if (!item) {
        console.warn([`Page not found for: ${pageLink}`])
        return
    }

    const u = new URL(location.href.split("#")[0])
    u.hash = "#" + pageLink
    if (location.href !== u.href) {
        history.pushState(null, "", u.href)
    }
    applyRoute()
}

function searchOnClick(link) {
    loadPage(link)
    setTimeout(closeSearch, 100)
}

function updateSearch(event) {
    let searchResults = []

    dataCache["pages"].forEach((item) => {
        if (item.name.toLowerCase().startsWith(event.target.value.toLowerCase())) {
            searchResults.push(item)
        }
    })

    loadSearchResults(searchResults)
}

function loadSearchResults(data) {
    searchDropDown.innerHTML = ""
    if (data.length === 0) {
        return
    }

    data.forEach((item) => {
        const icon = item.icon ?? ""
        const iconHtml = pageIconContentHtml(icon)
        const prefix = hasPageIcon(icon)
            ? `<div class="tw-w-[20px] tw-text-sm tw-h-[20px] tw-overflow-hidden tw-rounded-sm tw-flex tw-items-center tw-justify-center">${iconHtml}</div>`
            : ""

        const linkEsc = item.link.replace(/'/g, "\\'")
        searchDropDown.innerHTML += `
                <button type="button" onclick="searchOnClick('${linkEsc}')" class="tw-flex tw-text-base tw-place-items-center tw-gap-2 tw-rounded-sm tw-cursor-pointer tw-p-2 tw-px-3 tw-w-full hover:tw-bg-[#f1f0ef]">
                    ${prefix}
                    ${item.name}
                </button>
            `
    })
}

function searchClickOutside(event) {
    if (!searchContainer.contains(event.target)) {
        closeSearch()
    }
}

function openSearch() {
    searchBGContainer.classList.remove("tw-hidden")
    setTimeout(() => {
        searchInput.focus()
    }, 1)

    setTimeout(() => window.document.addEventListener("click", searchClickOutside), 100)
}

function closeSearch() {
    searchBGContainer.classList.add("tw-hidden")
    window.document.removeEventListener("click", searchClickOutside)
}

window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeSearch()
    }
})

window.loadPage = loadPage
window.searchOnClick = searchOnClick
window.openSearch = openSearch
