// Module: ExamCandidatesRepository responsibilities.

import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import { createUuid } from '../lib/uuid';
import { DateUtils } from '@/lib/dateUtils';
import type { ReviewMode, SubjectId } from '@smart-exam/api-types';
import type { ExamCandidateTable } from '../types/db';

const TABLE_NAME = ENV.TABLE_EXAM_CANDIDATES;
// 科目 + 次回出題日（candidateKey）で候補を引くためのGSI
const INDEX_GSI_SUBJECT_NEXT_TIME = 'gsi_subject_next_time';
// 問題ID + 作成日時で候補履歴を引くためのGSI
const INDEX_GSI_QUESTION_ID_CREATED_AT = 'gsi_question_id_created_at';

// 旧データで correctCount が欠落している可能性に備えた読み取り用型
type ExamCandidateTableRaw = Omit<ExamCandidateTable, 'correctCount'> & {
  correctCount?: number;
};

// 欠落値を補完してアプリ側で扱う正規形へそろえる
const normalizeCandidate = (raw: ExamCandidateTableRaw): ExamCandidateTable => {
  return {
    ...raw,
    // 過去データ互換: 未設定の場合は 0 扱いにする
    correctCount: typeof raw.correctCount === 'number' ? raw.correctCount : 0,
  };
};

// 候補作成・更新時に統一して現在時刻ISO文字列を使う
const nowIso = (): string => DateUtils.now();

// YYYY-MM-DD#~ まで含めることで当日までの candidateKey 範囲を作る
const toCandidateKeyUpperBound = (ymd: string): string => `${ymd}#~`;

/** ExamCandidatesRepository. */
export const ExamCandidatesRepository = {
  bulkCreateCandidates: async (items: ExamCandidateTable[]): Promise<void> => {
    // 空配列時はDynamoDB呼び出しを避ける
    if (items.length === 0) return;
    // まとめて投入してネットワーク往復を減らす
    await dbHelper.bulk(TABLE_NAME, items as unknown as Record<string, unknown>[]);
  },

  createCandidate: async (params: {
    subject: SubjectId;
    questionId: string;
    mode: ReviewMode;
    nextTime: string;
    correctCount: number;
    status: 'OPEN' | 'EXCLUDED' | 'CLOSED';
    createdAtIso?: string;
  }): Promise<ExamCandidateTable> => {
    // candidateKey 生成用のユニークIDを採番する
    const id = createUuid();
    // 明示指定があればそれを使い、なければ現在時刻を採用する
    const createdAt = params.createdAtIso ?? nowIso();
    // パーティション内で nextTime 順に並ぶよう nextTime を先頭にしたキーを作る
    const candidateKey = `${params.nextTime}#${id}`;

    // 保存する候補レコード本体を組み立てる
    const item: ExamCandidateTable = {
      subject: params.subject,
      candidateKey,
      id,
      questionId: params.questionId,
      mode: params.mode,
      status: params.status,
      // 負数や小数が混入しても壊れないよう正の整数へ丸める
      correctCount: Math.max(0, Math.trunc(params.correctCount)),
      nextTime: params.nextTime,
      createdAt,
    };

    // 同一主キー重複を禁止して誤上書きを防ぐ
    await dbHelper.put({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(#subject) AND attribute_not_exists(#candidateKey)',
      ExpressionAttributeNames: { '#subject': 'subject', '#candidateKey': 'candidateKey' },
    });

    // 作成結果を呼び出し元へ返す
    return item;
  },

  listCandidatesByTargetId: async (params: { targetId: string }): Promise<ExamCandidateTable[]> => {
    // 問題IDインデックスから対象候補を新しい順で取得する
    const result = await dbHelper.query<ExamCandidateTableRaw>({
      TableName: TABLE_NAME,
      IndexName: INDEX_GSI_QUESTION_ID_CREATED_AT,
      KeyConditionExpression: '#questionId = :questionId',
      ExpressionAttributeNames: { '#questionId': 'questionId' },
      ExpressionAttributeValues: { ':questionId': params.targetId },
      // 最新から見たいので降順
      ScanIndexForward: false,
      // 候補履歴が極端に多い場合の読み過ぎを抑える
      Limit: 200,
    });

    // 欠損補完をかけて返す
    return (result.Items ?? []).map(normalizeCandidate);
  },

  deleteCandidatesByTargetId: async (params: { subject: SubjectId; targetId: string }): Promise<void> => {
    // 問題IDに紐づく候補をまとめて取得する
    const items = await ExamCandidatesRepository.listCandidatesByTargetId({ targetId: params.targetId });
    // 他科目の候補を誤って消さないよう subject で絞る
    const filtered = items.filter((x) => x.subject === params.subject);
    // 対象候補を並列削除する
    await Promise.all(
      filtered.map(async (item) => {
        await dbHelper.delete({
          TableName: TABLE_NAME,
          Key: { subject: item.subject, candidateKey: item.candidateKey },
        });
      }),
    );
  },

  getLatestCandidateByTargetId: async (params: {
    subject: SubjectId;
    targetId: string;
  }): Promise<ExamCandidateTable | null> => {
    // 問題ID単位の履歴から最新候補を探す
    const result = await dbHelper.query<ExamCandidateTableRaw>({
      TableName: TABLE_NAME,
      IndexName: INDEX_GSI_QUESTION_ID_CREATED_AT,
      KeyConditionExpression: '#questionId = :questionId',
      ExpressionAttributeNames: { '#questionId': 'questionId' },
      ExpressionAttributeValues: { ':questionId': params.targetId },
      // 新しい順で先頭側を見る
      ScanIndexForward: false,
      // 同一問題が複数科目にまたがる可能性を考慮して少し多めに読む
      Limit: 10,
    });

    // 指定科目に一致する最初の1件を返す
    const items = (result.Items ?? []).map(normalizeCandidate);
    return items.find((x) => x.subject === params.subject) ?? null;
  },

  getLatestOpenCandidateByTargetId: async (params: {
    subject: SubjectId;
    targetId: string;
  }): Promise<ExamCandidateTable | null> => {
    // 問題ID単位の履歴から OPEN 状態の最新を探す
    const result = await dbHelper.query<ExamCandidateTableRaw>({
      TableName: TABLE_NAME,
      IndexName: INDEX_GSI_QUESTION_ID_CREATED_AT,
      KeyConditionExpression: '#questionId = :questionId',
      ExpressionAttributeNames: { '#questionId': 'questionId' },
      ExpressionAttributeValues: { ':questionId': params.targetId },
      ScanIndexForward: false,
      // subject + status で絞るために少し多めに取得
      Limit: 20,
    });

    // 同一科目かつ OPEN の最初の1件を返す
    const items = (result.Items ?? []).map(normalizeCandidate);
    return items.find((x) => x.subject === params.subject && x.status === 'OPEN') ?? null;
  },

  deleteCandidate: async (params: { subject: SubjectId; candidateKey: string }): Promise<void> => {
    // 主キーを直接指定して単一候補を削除する
    await dbHelper.delete({
      TableName: TABLE_NAME,
      Key: { subject: params.subject, candidateKey: params.candidateKey },
    });
  },

  deleteLatestOpenCandidateByTargetId: async (params: { subject: SubjectId; targetId: string }): Promise<void> => {
    // まず OPEN の最新候補を特定する
    const open = await ExamCandidatesRepository.getLatestOpenCandidateByTargetId({
      subject: params.subject,
      targetId: params.targetId,
    });
    // 対象がなければ何もしない
    if (!open) return;
    // 見つかった候補のみ削除する
    await ExamCandidatesRepository.deleteCandidate({
      subject: params.subject,
      candidateKey: open.candidateKey,
    });
  },

  lockCandidateIfUnlocked: async (params: {
    subject: SubjectId;
    candidateKey: string;
    testId: string;
    status?: 'LOCKED';
  }): Promise<void> => {
    // testId 未設定の候補だけをロック対象にする（重複ロック防止）
    await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { subject: params.subject, candidateKey: params.candidateKey },
      ConditionExpression: 'attribute_not_exists(#testId)',
      UpdateExpression: 'SET #testId = :testId, #status = :status',
      ExpressionAttributeNames: { '#testId': 'testId', '#status': 'status' },
      ExpressionAttributeValues: { ':testId': params.testId, ':status': params.status ?? 'LOCKED' },
    });
  },

  releaseLockIfMatch: async (params: { subject: SubjectId; candidateKey: string; testId: string }): Promise<void> => {
    // 自分が付けた testId ロックだけ解除する
    await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { subject: params.subject, candidateKey: params.candidateKey },
      ConditionExpression: '#testId = :testId',
      UpdateExpression: 'REMOVE #testId SET #status = :open',
      ExpressionAttributeNames: { '#testId': 'testId', '#status': 'status' },
      ExpressionAttributeValues: { ':testId': params.testId, ':open': 'OPEN' },
    });
  },

  closeCandidateIfMatch: async (params: {
    subject: SubjectId;
    candidateKey: string;
    expectedTestId?: string;
  }): Promise<void> => {
    // 更新式で使う属性名プレースホルダを定義する
    const expNames: Record<string, string> = {
      '#status': 'status',
      '#closedAt': 'closedAt',
      '#testId': 'testId',
    };
    // 更新式で使う属性値プレースホルダを定義する
    const expValues: Record<string, unknown> = {
      ':closed': 'CLOSED',
      ':closedAt': nowIso(),
    };

    // testId 指定がある場合だけ条件付き更新にする
    const condition = params.expectedTestId ? '#testId = :testId' : undefined;
    if (params.expectedTestId) {
      expValues[':testId'] = params.expectedTestId;
    }

    // status を CLOSED にし、ロック情報 testId を除去する
    await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { subject: params.subject, candidateKey: params.candidateKey },
      ...(condition ? { ConditionExpression: condition } : {}),
      UpdateExpression: 'SET #status = :closed, #closedAt = :closedAt REMOVE #testId',
      ExpressionAttributeNames: expNames,
      ExpressionAttributeValues: expValues,
    });
  },

  listDueCandidates: async (params: {
    subject: SubjectId;
    mode?: ReviewMode;
    todayYmd: string;
  }): Promise<ExamCandidateTable[]> => {
    // クエリ式で使う属性名を組み立てる
    const expNames: Record<string, string> = {
      '#subject': 'subject',
      '#candidateKey': 'candidateKey',
      '#status': 'status',
      // mode 指定時のみ mode 属性名を追加する
      ...(params.mode ? { '#mode': 'mode' } : {}),
    };
    // クエリ式で使う属性値を組み立てる
    const expValues: Record<string, unknown> = {
      ':subject': params.subject,
      // candidateKey が当日まで（<= YYYY-MM-DD#~）のものを対象にする
      ':upper': toCandidateKeyUpperBound(params.todayYmd),
      ':open': 'OPEN',
      // mode 指定時のみ比較値を追加する
      ...(params.mode ? { ':mode': params.mode } : {}),
    };

    // 科目 + 期限日範囲で候補を取得し、OPEN かつ（必要なら mode 一致）で絞る
    const result = await dbHelper.query<ExamCandidateTableRaw>({
      TableName: TABLE_NAME,
      IndexName: INDEX_GSI_SUBJECT_NEXT_TIME,
      KeyConditionExpression: '#subject = :subject AND #candidateKey <= :upper',
      ExpressionAttributeNames: expNames,
      ExpressionAttributeValues: expValues,
      FilterExpression: params.mode ? '#status = :open AND #mode = :mode' : '#status = :open',
      // 期限の古い順に処理しやすいよう昇順で取得
      ScanIndexForward: true,
    });

    // 欠損補完をかけて返す
    return (result.Items ?? []).map(normalizeCandidate);
  },

  listCandidates: async (params: { subject?: SubjectId; mode?: ReviewMode }): Promise<ExamCandidateTable[]> => {
    // mode 任意条件付きの OPEN 候補抽出に使う属性名を定義する
    const expAttrNames: Record<string, string> = {
      '#status': 'status',
      ...(params.mode ? { '#mode': 'mode' } : {}),
    };
    // mode 任意条件付きの OPEN 候補抽出に使う属性値を定義する
    const expAttrValues: Record<string, unknown> = {
      ':open': 'OPEN',
      ...(params.mode ? { ':mode': params.mode } : {}),
    };
    // mode 指定有無でフィルタ式を切り替える
    const filterExp = params.mode ? '#status = :open AND #mode = :mode' : '#status = :open';

    if (params.subject) {
      // subject が指定されている場合は Query で効率良く取得する
      const result = await dbHelper.query<ExamCandidateTableRaw>({
        TableName: TABLE_NAME,
        KeyConditionExpression: '#subject = :subject',
        ExpressionAttributeNames: {
          '#subject': 'subject',
          ...expAttrNames,
        },
        ExpressionAttributeValues: {
          ':subject': params.subject,
          ...expAttrValues,
        },
        FilterExpression: filterExp,
      });

      // 欠損補完をかけて返す
      return (result.Items ?? []).map(normalizeCandidate);
    }

    // subject 未指定時は全件スキャンして OPEN 候補のみ返す
    const result = await dbHelper.scan<ExamCandidateTableRaw>({
      TableName: TABLE_NAME,
      ExpressionAttributeNames: expAttrNames,
      ExpressionAttributeValues: expAttrValues,
      FilterExpression: filterExp,
    });

    // 欠損補完をかけて返す
    return (result.Items ?? []).map(normalizeCandidate);
  },

  deleteOpenCandidatesByTargetId: async (params: { subject: SubjectId; targetId: string }): Promise<void> => {
    // 対象問題の最新 OPEN 候補を取得する
    const open = await ExamCandidatesRepository.getLatestOpenCandidateByTargetId({
      subject: params.subject,
      targetId: params.targetId,
    });
    // OPEN 候補がなければ終了する
    if (!open) return;

    // 物理削除ではなく CLOSED 化して履歴は残す
    await ExamCandidatesRepository.closeCandidateIfMatch({
      subject: params.subject,
      candidateKey: open.candidateKey,
    });
  },
};
