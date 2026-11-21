export interface PageInspectionData{
    title:string,
    url: string,
    headings: number,
    links: number,
    images:number,
    paragraphs: number,
    wordCount: number
}

export interface InspectPageRequest{
    type: "INSPECT_PAGE" 
}

export interface InspectPageResponse{
    success: boolean,
    data?: PageInspectionData,
    error?: string
}

export interface ToggleHighlightRequest{
    type: "TOGGLE_LINK_HIGHLIGHT",
    enabled: boolean
}


export interface ToggleHighlightResponse{
    success: boolean,
    enabled?: boolean,
    highlightedLinks?: number,
    error?:string
}

export type ExtensionRequest = 
    | InspectPageRequest
    | ToggleHighlightRequest

export type ExtensionResponse = 
    | InspectPageResponse
    | ToggleHighlightResponse