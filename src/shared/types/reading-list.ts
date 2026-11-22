export interface SavedPage{
    id: string,
    title: string,
    url: string,
    savedAt: string,
    //domain: string
}

export interface SavePageInput{
    title: string,
    url: string
}

export type SavePageResult = 
 | {
    success: true,
    page: SavedPage
 }
 | {
    success: false,
    reason: "duplicate",
    existingPage: SavedPage
 }

export type ReadingList = SavedPage[]