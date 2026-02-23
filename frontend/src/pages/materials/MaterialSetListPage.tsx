import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, getSubjectBadgeVariant } from '@/components/ui/badge';
import { useMaterialList } from '@/hooks/materials';
import { SUBJECT, SUBJECT_LABEL } from '@/lib/Consts';
import { MATERIAL_PROVIDER_OPTIONS, MATERIAL_STATUS_LABEL } from '@/lib/materialConsts';
import type { WordTestSubject } from '@typings/wordtest';

export const MaterialSetListPage = () => {
  const { materials, form, search, clear, remove, ConfirmDialog } = useMaterialList();
  const { register, setValue, watch } = form;
  const subject = watch('subject');
  const provider = watch('provider');
  const status = watch('status');
  const grade = watch('grade');
  const infoBadgeClass = 'px-4 py-2 text-sm';

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(materials.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pagedMaterials = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return materials.slice(start, start + pageSize);
  }, [materials, currentPage]);

  const onSearch: React.FormEventHandler<HTMLFormElement> = (e) => {
    setPage(1);
    search(e);
  };

  return (
    <div className="space-y-6 px-8 py-4">
      <ConfirmDialog />
      <Card>
        <CardContent>
          <form onSubmit={onSearch} className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="w-40">
                <label className="text-sm font-medium">STATUS</label>
                <input type="hidden" {...register('status')} />
                <Select
                  value={status}
                  onValueChange={(v) => setValue('status', v as 'ALL' | 'IN_PROGRESS' | 'COMPLETED')}
                  defaultValue="ALL">
                  <SelectTrigger>
                    <SelectValue placeholder="STATUS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全て</SelectItem>
                    <SelectItem value="IN_PROGRESS">{MATERIAL_STATUS_LABEL.IN_PROGRESS}</SelectItem>
                    <SelectItem value="COMPLETED">{MATERIAL_STATUS_LABEL.COMPLETED}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <label className="text-sm font-medium">科目</label>
                <Select value={subject} onValueChange={(v) => setValue('subject', v as 'ALL' | WordTestSubject)}>
                  <SelectTrigger>
                    <SelectValue placeholder="科目" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全て</SelectItem>
                    <SelectItem value={SUBJECT.math}>{SUBJECT_LABEL[SUBJECT.math]}</SelectItem>
                    <SelectItem value={SUBJECT.science}>{SUBJECT_LABEL[SUBJECT.science]}</SelectItem>
                    <SelectItem value={SUBJECT.society}>{SUBJECT_LABEL[SUBJECT.society]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <label className="text-sm font-medium">学年</label>
                <Select value={grade} onValueChange={(v) => setValue('grade', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="学年" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全て</SelectItem>
                    <SelectItem value="4">4年</SelectItem>
                    <SelectItem value="5">5年</SelectItem>
                    <SelectItem value="6">6年</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <label className="text-sm font-medium">教材種別</label>
                <input type="hidden" {...register('provider')} />
                <Select
                  value={(provider?.trim() ? provider : 'ALL') as string}
                  onValueChange={(v) => setValue('provider', v === 'ALL' ? '' : v, { shouldDirty: true })}
                  defaultValue="ALL">
                  <SelectTrigger>
                    <SelectValue placeholder="教材種別" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全て</SelectItem>
                    {MATERIAL_PROVIDER_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <label className="text-sm font-medium">教材年月日</label>
                <Input type="date" {...register('date')} />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium">キーワード</label>
                <Input {...register('q')} placeholder="教材名など" />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" asChild>
                <Link to="/materials/new">新規登録</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPage(1);
                  void clear();
                }}>
                クリア
              </Button>
              <Button type="submit">検索</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}>
            前へ
          </Button>
          <div className="text-sm">
            {currentPage} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}>
            次へ
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">操作</TableHead>
              <TableHead>学年</TableHead>
              <TableHead>教材種別</TableHead>
              <TableHead>科目</TableHead>
              <TableHead>教材年月日</TableHead>
              <TableHead>教材名</TableHead>
              <TableHead>問題数</TableHead>
              <TableHead>STATUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedMaterials.map((material) => (
              <TableRow key={material.id} className="h-8">
                <TableCell className="py-1">
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="icon" className="h-8 w-8" aria-label="詳細">
                      <Link to={`/materials/${material.id}`}>
                        <FileText className="h-4 w-4" />
                      </Link>
                    </Button>
                    {!material.isCompleted && (
                      <Button
                        variant="destructive"
                        size="icon"
                        aria-label="削除"
                        className="h-8 w-8"
                        onClick={() => remove(material.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-1">{material.grade}年</TableCell>
                <TableCell className="py-1">{material.provider ?? ''}</TableCell>
                <TableCell className="py-1">
                  <Badge variant={getSubjectBadgeVariant(material.subject)} className={infoBadgeClass}>
                    {SUBJECT_LABEL[material.subject as keyof typeof SUBJECT_LABEL] ?? ''}
                  </Badge>
                </TableCell>
                <TableCell className="py-1">{material.materialDate}</TableCell>
                <TableCell className="py-1 font-medium">{material.name}</TableCell>
                <TableCell className="py-1">{material.questionCount}</TableCell>
                <TableCell className="py-1">
                  <Badge variant={material.isCompleted ? 'outline' : 'warning_soft'} className={infoBadgeClass}>
                    {material.isCompleted ? MATERIAL_STATUS_LABEL.COMPLETED : MATERIAL_STATUS_LABEL.IN_PROGRESS}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {materials.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  データがありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
