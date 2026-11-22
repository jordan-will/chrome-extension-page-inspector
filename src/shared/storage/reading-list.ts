import type {
    SavedPage,
    SavePageInput,
    SavePageResult
} from "../types/reading-list"

const STORAGE_KEY = "readingList"

export async function getReadingList(): Promise<SavedPage[]>{
    const result = await chrome.storage.local.get(STORAGE_KEY)
    const readingLists = result[STORAGE_KEY]

    if(!Array.isArray(readingLists)) return []

    return readingLists as SavedPage[]
}

export async function savePage(
    input: SavePageInput
): Promise<SavePageResult>
{
    const readingList = await getReadingList()
    const normilzedUrl = normalizeUrl(input.url)

    const existingPage = readingList.find(
        (page) => normalizeUrl(page.url) === normilzedUrl
    )

    if(existingPage){
        return {
            success: false,
            reason: "duplicate",
            existingPage
        }
    }

    const newPage: SavedPage = {
        id: crypto.randomUUID(),
        title: input.title.trim() || input.url,
        url: input.url,
        savedAt: new Date().toISOString()
    }

    const updateReadingList = [
        newPage,
        ...readingList
    ]

    await chrome.storage.local.set({
        [STORAGE_KEY]: updateReadingList
    })

    return {
        success: true,
        page: newPage
    }

}   

export async function removePage(
    id: string
): Promise<boolean>{
    const readingList = await getReadingList()

    const updateReadingList = readingList.filter(
        (page) => page.id !== id
    )

    if(updateReadingList.length === readingList.length) return false

    await chrome.storage.local.set({
        [STORAGE_KEY]: updateReadingList
    })

    return true
} 

export async function isPagedSaved(
    url: string
): Promise<boolean>{
    const readingList = await getReadingList()

    const normalizedUrl = normalizeUrl(url)

    return readingList.some(
        (page) => normalizeUrl(page.url) == normalizedUrl
    )
}

function normalizeUrl(url:string): string {
    try {
        const parseUrl = new URL(url)
        parseUrl.hash = ""

        return parseUrl.toString()
    } catch (error) {
        return url.trim()
    }
}