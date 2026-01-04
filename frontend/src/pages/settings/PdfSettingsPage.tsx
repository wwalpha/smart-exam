import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePdfSettings } from '@/hooks/settings';

export const PdfSettingsPage = () => {
  const { form, submit, ConfirmDialog } = usePdfSettings();
  const { register, setValue } = form;

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <ConfirmDialog />
      <h1 className="text-2xl font-bold">PDF出力設定</h1>

      <Card>
        <CardHeader>
          <CardTitle>レイアウト設定</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>用紙サイズ</Label>
                <Select onValueChange={(v) => setValue('paperSize', v)} defaultValue="A4">
                  <SelectTrigger>
                    <SelectValue placeholder="サイズ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="B5">B5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>向き</Label>
                <Select onValueChange={(v) => setValue('orientation', v)} defaultValue="portrait">
                  <SelectTrigger>
                    <SelectValue placeholder="向き" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">縦</SelectItem>
                    <SelectItem value="landscape">横</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>フォントサイズ (pt)</Label>
              <Input type="number" {...register('fontSize')} min={8} max={24} />
            </div>

            <div className="space-y-2">
              <Label>ヘッダーテキスト</Label>
              <Input {...register('headerText')} />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit">保存</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
