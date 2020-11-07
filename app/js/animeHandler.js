function searchBox() {
    search.placeholder = search.value
    searchAnime(search.value)
    search.value = ""
    document.location.hash = "#browse"
}
navNew.onclick = () => { hsRss() }
navTrending.onclick = () => { searchAnime() }
navList.onclick = () => { searchAnime() }
async function alRequest(a, b) {
    let query,
        variables = {
            type: "ANIME",
            sort: "TRENDING_DESC",
            page: 1,
            perPage: 50
        },
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        }
    if (localStorage.getItem("ALtoken")) {
        options.headers['Authorization'] = localStorage.getItem("ALtoken")
    }
    if (!a) {
        search.placeholder = "Search"
        query = `
        query ($page: Int, $perPage: Int, $sort: [MediaSort], $type: MediaType) {
            Page (page: $page, perPage: $perPage) {
                media(type: $type, sort: $sort) {
                    id
                    title {
                        romaji
                        english
                        native
                        userPreferred
                    }
                    description(
                        asHtml: true
                    )
                    season
                    seasonYear
                    format
                    status
                    episodes
                    duration
                    averageScore
                    genres
                    coverImage {
                        extraLarge
                        medium
                        color
                    }
                    bannerImage
                    synonyms
                    nextAiringEpisode {
                        timeUntilAiring
                        episode
                    }
                    trailer {
                        id
                        site
                    }
                    streamingEpisodes {
                        title
                        thumbnail
                    }
                }
            }
        }`
    } else if (b) {
        variables.search = a
        variables.perPage = b
        variables.status = "RELEASING"
        query = `
        query ($page: Int, $sort: [MediaSort], $search: String, $type: MediaType, $status: MediaStatus) {
            Page (page: $page) {
                media (type: $type, search: $search, sort: $sort, status: $status) {
                    id
                    title {
                        userPreferred
                    }
                    description(
                        asHtml: true
                    )
                    season
                    seasonYear
                    format
                    status
                    episodes
                    duration
                    genres
                    coverImage {
                        extraLarge
                        medium
                        color
                    }
                    streamingEpisodes {
                        title
                        thumbnail
                    }
                }
            }
        }`
    } else {
        variables.search = a
        variables.sort = "TRENDING_DESC"
        query = `
        query ($page: Int, $perPage: Int, $sort: [MediaSort], $type: MediaType, $search: String) {
            Page (page: $page, perPage: $perPage) {
                media(type: $type, search: $search, sort: $sort) {
                    id
                    title {
                        romaji
                        english
                        native
                        userPreferred
                    }
                    description(
                        asHtml: true
                    )
                    season
                    seasonYear
                    format
                    status
                    episodes
                    duration
                    averageScore
                    genres
                    coverImage {
                        extraLarge
                        medium
                        color
                    }
                    bannerImage
                    synonyms
                    nextAiringEpisode {
                        timeUntilAiring
                        episode
                    }
                    trailer {
                        id
                        site
                    }
                    streamingEpisodes {
                        title
                        thumbnail
                    }
                }
            }
        }`
    }
    options.body = JSON.stringify({
        query: query,
        variables: variables
    })

    let res = await fetch('https://graphql.anilist.co', options).catch((error) => console.error(error)),
        json = await res.json();
    return json
}
function alEntry() {
    if (store[playerData.nowPlaying[0]]) {
        let query = `
mutation ($id: Int, $status: MediaListStatus, $episode: Int) {
    SaveMediaListEntry (mediaId: $id, status: $status, progress: $episode) {
        id
        status
        progress
    }
}`,
            variables = {
                id: parseInt(store[playerData.nowPlaying[0]].id),
                status: "CURRENT",
                episode: parseInt(playerData.nowPlaying[1])
            },
            options = {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem("ALtoken"),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    variables: variables
                })
            }
        fetch("https://graphql.anilist.co", options)
    }
}
let alResponse
async function searchAnime(a) {
    let frag = document.createDocumentFragment(),
        browse = document.querySelector(".browse")
    browse.textContent = '';
    browse.appendChild(skeletonCard)
    alResponse = await alRequest(a)
    try {
        alResponse.data.Page.media.forEach(media => {
            let template = cardCreator(media)
            template.onclick = () => {
                viewAnime(media)
            }
            frag.appendChild(template)
        })
    } catch (e) {
        console.error(e)
    }
    browse.textContent = '';
    browse.appendChild(frag)
}


let detailsfrag = document.createDocumentFragment()
let details = {
    averageScore: "Average Score",
    // duration: "Episode Duration",
    // episodes: "Episodes",
    // format: "Format",
    genres: "Genres",
    // season: "Season",
    // seasonYear: "Year",
    status: "Status",
    english: "English",
    romaji: "Romaji",
    native: "Native",
    synonyms: "Synonyms"
}
const episodeRx = /Episode (\d+) - (.*)/;
function viewAnime(media) {
    halfmoon.toggleModal("view")
    view.setAttribute("style", `background-image: url(${media.bannerImage}) !important`)
    viewImg.src = media.coverImage.extraLarge
    viewTitle.textContent = media.title.userPreferred
    viewDesc.innerHTML = media.description || ""

    viewDetails.innerHTML = ""
    detailsCreator(media)
    viewDetails.appendChild(detailsfrag)
    if (media.nextAiringEpisode) {
        let temp = document.createElement("p")
        temp.innerHTML = `<span class="font-weight-bold">Airing</span><br><span class="text-muted"> Episode ${media.nextAiringEpisode.episode}: ${toTS(media.nextAiringEpisode.timeUntilAiring)}</span>`
        viewDetails.prepend(temp)
    }
    viewSeason.innerHTML = `${(media.season ? media.season.toLowerCase() + " " : "") + (media.seasonYear ? media.seasonYear : "")}`
    viewMediaInfo.innerHTML = `${media.format ? "<span>" + media.format + "</span>" : ""}${media.episodes ? "<span>" + media.episodes + " Episodes</span>" : ""}${media.duration ? "<span>" + media.duration + " Minutes</span>" : ""}`
    viewPlay.onclick = () => { nyaaSearch(media, 1); halfmoon.toggleModal("view") }
    if (media.trailer) {
        viewTrailer.removeAttribute("disabled", "")
        viewTrailer.onclick = () =>
            trailerPopup(media.trailer)
    } else {
        viewTrailer.setAttribute("disabled", "")
    }
    viewEpisodes.onclick = () => {
        viewEpisodesWrapper.classList.toggle("hidden")
    }
    episodes.innerHTML = ""
    if (media.streamingEpisodes) {
        viewEpisodes.removeAttribute("disabled", "")
        let frag = document.createDocumentFragment()
        media.streamingEpisodes.forEach(episode => {
            let temp = document.createElement("div")
            temp.classList.add("position-relative", "w-250", "rounded", "mr-10", "overflow-hidden", "pointer")
            temp.innerHTML = `
            <img src="${episode.thumbnail}" class="w-full h-full">
            <div class="position-absolute ep-title w-full p-10 text-truncate bottom-0">${episode.title}</div>`
            temp.onclick = () => { nyaaSearch(media, episodeRx.exec(episode.title)[1]); halfmoon.toggleModal("view") }
            frag.appendChild(temp)
        })
        episodes.appendChild(frag)
    } else {
        viewEpisodes.setAttribute("disabled", "")
    }
}
function trailerPopup(trailer) {
    trailerVideo.src = ""
    halfmoon.toggleModal("trailer")
    switch (trailer.site) {
        case "youtube":
            trailerVideo.src = "https://www.youtube.com/embed/" + trailer.id
            break;
    }

}
function detailsCreator(entry) {
    if (entry) {
        Object.entries(entry).forEach(value => {
            let template = document.createElement("p")
            if (typeof value[1] == 'object') {
                if (Array.isArray(value[1])) {
                    if (details[value[0]] && value[1].length > 0) {
                        template.innerHTML = `<span class="font-weight-bold">${details[value[0]]}</span><br><span class="text-muted">${value[1].map(key => (key)).join(', ')}</span>`
                        detailsfrag.appendChild(template)
                    }
                } else {
                    detailsCreator(value[1])
                }
            } else {
                if (details[value[0]]) {
                    template.innerHTML = `<span class="font-weight-bold">${details[value[0]]}</span><br><span class="text-muted">${value[1].toString()}</span>`
                    detailsfrag.appendChild(template)
                }
            }
        })
    }
}
function cardCreator(media, regexParse) {
    let template = document.createElement("div")
    template.classList.add("card", "m-0", "p-0")
    if (media) {
        template.innerHTML = `
    <div class="row h-full" style="--color:${media.coverImage.color || "#1890ff"};">
        <div class="col-4">
            <img src="${media.coverImage.extraLarge || ""}"
                class="cover-img w-full h-full">
        </div>
        <div class="col-8 h-full card-grid">
            <div class="px-15 py-10">
                <h5 class="m-0 text-capitalize font-weight-bold">${media.title.userPreferred}${regexParse ? " - " + regexParse[4] : ""}</h5>
                <p class="text-muted m-0 text-capitalize details">
                ${(media.format ? (media.format == "TV" ? "<span>" + media.format + " Show" : "<span>" + media.format.toLowerCase().replace(/_/g, " ")) : "") + "</span>"}
                ${media.episodes ? "<span>" + media.episodes + " Episodes</span>" : media.duration ? "<span>" + media.duration + " Minutes</span>" : ""}
                ${media.status ? "<span>" + media.status.toLowerCase().replace(/_/g, " ") + "</span>" : ""}
                ${media.season || media.seasonYear ? "<span>" + (!!media.season ? media.season.toLowerCase() + " " : "") + (media.seasonYear || "") + "</span>" : ""}
                </p>
            </div>
            <div class="overflow-y-scroll px-15 py-10 bg-very-dark card-desc">
                ${media.description}
            </div>
            <div class="px-15 pb-10 pt-5">
                ${media.genres.map(key => (`<span class="badge badge-pill badge-color text-dark mt-5 font-weight-bold">${key}</span> `)).join('')}
            </div>
        </div>
    </div>
    `
    } else {
        template.innerHTML = `
        <div class="row h-full">
            <div class="col-4 w-full bg-very-dark skeloader">
            </div>
            <div class="col-8 h-full card-grid skeloader">
                <div class="px-15 py-10">
                    <h5 class="m-0 text-capitalize font-weight-bold">${regexParse ? regexParse[2] + " - " + regexParse[4] : ""}</h5>
                </div>
            </div>
        </div>
        `
    }
    return template
}
let skeletonCard = cardCreator()

const DOMPARSER = new DOMParser().parseFromString.bind(new DOMParser())

async function nyaaSearch(media, episode) {
    if (parseInt(episode) < 10) {
        episode = `0${episode}`
    }

    let titles = Object.values(media.title).concat(media.synonyms).filter(name => name != null)
    let table = document.querySelector("tbody.results")
    let results = document.createDocumentFragment()

    for (let title of titles) {
        if (results.children.length == 0) {
            title = title.replace(/ /g, "+")
            let url = new URL(`https://miru.kirdow.com/request/?url=https://nyaa.si/?page=rss$c=1_2$f=${settings.torrent3 == true ? 2 : 0}$s=seeders$o=desc$q=${title}"+${episode}+"+${settings.torrent1}`)
            results = await nyaaRss(url)
        }
    }

    if (results.children.length == 0) {
        halfmoon.initStickyAlert({
            content: `Couldn't find torrent for ${media.title.userPreferred} Episode ${parseInt(episode)}! Try specifying a torrent manually.`,
            title: "Search Failed",
            alertType: "alert-danger",
            fillType: ""
        })
    } else {
        table.textContent = ""
        table.appendChild(results)
        halfmoon.toggleModal("tsearch")
        playerData.selected = [media, parseInt(episode)]
    }
}

async function nyaaRss(url) {
    let frag = document.createDocumentFragment()
    res = await fetch(url)
    await res.text().then((xmlTxt) => {
        try {
            let doc = DOMPARSER(xmlTxt, "text/xml")
            if (settings.torrent2 && doc.querySelectorAll("infoHash")[0]) {
                addTorrent(doc.querySelectorAll("infoHash")[0].textContent)
                halfmoon.toggleModal("tsearch")
            }
            doc.querySelectorAll("item").forEach((item, index) => {
                let i = item.querySelector.bind(item)
                let template = document.createElement("tr")
                template.innerHTML += `
                <th>${(index + 1)}</th>
                <td>${i("title").textContent}</td>
                <td>${i("size").textContent}</td>
                <td>${i("seeders").textContent}</td>
                <td>${i("leechers").textContent}</td>
                <td>${i("downloads").textContent}</td>
                <td onclick="addTorrent('${i('infoHash').textContent}')" class="pointer">Play</td>`
                frag.appendChild(template)
            })

        } catch (e) {
            console.error(e)
        }
    })
    return frag
}


const nameParseRegex = {
    "https://subsplease.org/rss/?r=": /(\[.[^\]]*\]\ ?)?(.+?(?=\ \-\ \d))?(\ \-\ )?(\d+)?(.*)?/i,
    "https://miru.kirdow.com/request/?url=https://www.erai-raws.info/rss-": /(\[.*\]\ ?)?(.+?(?=\ \–\ \d))?(\ \–\ )?(\d+)?/i,
    fallback: /((?:\[[^\]]*\])*)?\s*((?:[^\d\[\.](?!S\d))*)?\s*((?:S\d+[^\w\[]*E?)?[\d\-]*)\s*(.*)?/i
}
let store = JSON.parse(localStorage.getItem("store")) || {},
    lastResult

async function hsRss() {
    let frag = document.createDocumentFragment(),
        releases = document.querySelector(".releases"),
        url = settings.torrent4 == "https://miru.kirdow.com/request/?url=https://www.erai-raws.info/rss-" ? settings.torrent4 + settings.torrent1 + "-magnet" : settings.torrent4 + settings.torrent1
    res = await fetch(url)
    await res.text().then(async (xmlTxt) => {
        try {
            let doc = DOMPARSER(xmlTxt, "text/xml")
            if (lastResult != doc) {
                releases.textContent = '';
                releases.appendChild(skeletonCard)
                lastResult = doc
                let items = doc.querySelectorAll("item")
                for (let item of items) {
                    let i = item.querySelector.bind(item),
                        regexParse = (nameParseRegex[settings.torrent4] || nameParseRegex.parse).exec(i("title").textContent)
                    if (!store.hasOwnProperty(regexParse[2]) && !alResponse.data.Page.media.some(media => (Object.values(media.title).concat(media.synonyms).filter(name => name != null).includes(regexParse[2]) && ((store[regexParse[2]] = media) && true)))) {
                        //shit not found, lookup
                        let res = await alRequest(regexParse[2], 1)
                        if (!res.data.Page.media[0]) {
                            res = await alRequest(regexParse[2].replace(" (TV)", "").replace(` (${new Date().getFullYear()})`, ""), 1)
                        }
                        store[regexParse[2]] = res.data.Page.media[0]
                    }
                    let media = store[regexParse[2]],
                        template = cardCreator(media, regexParse)
                    template.onclick = () => {
                        playerData.selected = [regexParse[2], regexParse[4]]
                        addTorrent(i('link').textContent)
                    }
                    frag.appendChild(template)
                }
                releases.textContent = '';
                releases.appendChild(frag)
            }
        } catch (e) {
            console.error(e)
        }
    })

    localStorage.setItem("store", JSON.stringify(store))
}
clearRelCache.onclick = () => {
    localStorage.removeItem("store")
    store = {}
}
setInterval(() => {
    hsRss()
}, 30000);
async function loadAnime() {
    await searchAnime()
    hsRss()
}
loadAnime()