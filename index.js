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
            return `<pre><code class="hljs language-${lang}">` +
                   hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                   '</code></pre>';
          } catch (__) {}
        }
    
        return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
    }
})
md.use(centerImagesPlugin)
md.use(externalLinksPlugin)

let dataCache = { pages: [] }

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
        const path = `${location.pathname}${location.search}#/about`
        history.replaceState(null, "", path)
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
async function fetchDB(){

    try{
        const response = await fetch(`data.json`)

        return await response.json()
    }catch(e){
        return 
    }
}


async function fetchContent(path){
    
    try{
        const response = await fetch(path)
        return await response.text()

    }catch(e){
        console.error(e)
        return ""
    }
}


fetchDB().then((data) => {
    for (let x of data["pages"]) {
        buildSideBar(x.icon ?? "", x.name, x.link, x.content)
    }
    dataCache = data
    loadSearchResults(data["pages"])

    if (!location.hash || location.hash === "#") {
        history.replaceState(
            null,
            "",
            `${location.pathname}${location.search}#/about`
        )
    }
    window.addEventListener("hashchange", applyRoute)
    applyRoute()
})


function buildSideBar(icon, name, link, content) {
    const iconHtml = pageIconSidebarHtml(icon)
    const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'")
    sideBarContent.innerHTML += `
        <button type="button" onclick="loadPage('${esc(link)}')" id="${link}" class="page-link tw-text-base tw-flex tw-flex-gap-1">
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

    document.getElementById(link).classList.add("active")
}

function loadPage(pageLink) {
    const item = dataCache.pages.find((obj) => obj.link === pageLink)

    if (!item) {
        console.warn([`Page not found for: ${pageLink}`])
        return
    }

    const target = "#" + pageLink
    if (location.hash !== target) {
        location.hash = target
    } else {
        applyRoute()
    }
}

function searchOnClick(link){
    loadPage(link)
    setTimeout(closeSearch, 100)
}

function updateSearch(event){

    let searchResults = []

    dataCache['pages'].forEach(item => {
        if (item.name.toLowerCase().startsWith(event.target.value.toLowerCase())){
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

        searchDropDown.innerHTML += `
                <button onclick="searchOnClick('${item.link}')" class="tw-flex tw-text-base tw-place-items-center tw-gap-2 tw-rounded-sm tw-cursor-pointer tw-p-2 tw-px-3 tw-w-full hover:tw-bg-[#f1f0ef]">
                    ${prefix}
                    ${item.name}
                </button>
            `
    })

}

function searchClickOutside(event){

    if (!searchContainer.contains(event.target)){
        closeSearch()
    }


}

function openSearch(){

    searchBGContainer.classList.remove("tw-hidden")
    setTimeout(() => {
        searchInput.focus()
    }, 1)

    setTimeout(() => window.document.addEventListener("click", searchClickOutside), 100)

}


function closeSearch(){

    searchBGContainer.classList.add("tw-hidden")
    window.document.removeEventListener("click", searchClickOutside)

}

window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeSearch()
    }

})
