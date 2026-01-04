export type GetUploadUrlRequest = {
  fileName: string;
  contentType: string;
};

export type GetUploadUrlResponse = {
  uploadUrl: string;
  fileKey: string;
};
