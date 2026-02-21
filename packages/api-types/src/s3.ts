export type GetUploadUrlRequest = {
  /** S3キーのプレフィックス（例: `materials/<id>/QUESTION`） */
  prefix?: string;
  /** アップロード元ファイル名 */
  fileName: string;
  /** ファイルのContent-Type */
  contentType: string;
};

export type GetUploadUrlResponse = {
  /** 署名付きアップロードURL */
  uploadUrl: string;
  /** アップロード先のS3キー */
  fileKey: string;
};
