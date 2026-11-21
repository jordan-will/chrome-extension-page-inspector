import type {
  InspectPageResponse,
  PageInspectionData,
} from "./messages";

export function createSuccessResponse(
  data: PageInspectionData
): InspectPageResponse {
  return {
    success: true,
    data,
  };
}

export function createErrorResponse(
  error: string
): InspectPageResponse {
  return {
    success: false,
    error,
  };
}