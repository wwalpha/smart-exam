export type GetUploadUrlRequest = {
  /** S3 key prefix (e.g. "materials/<id>/QUESTION") */
  prefix?: string;
  fileName: string;
  contentType: string;
};

export type GetUploadUrlResponse = {
  uploadUrl: string;
  fileKey: string;
};
