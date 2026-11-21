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

export type ExtensionRequest = InspectPageRequest