import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ConflictItem {
  type: string;
  id: string;
  existing: any;
  incoming: any;
}

interface NewItem {
  type: string;
  data: any;
}

interface ConflictResolutionProps {
  conflicts: ConflictItem[];
  newItems: NewItem[];
  onResolve: (resolutions: Record<string, any>) => void;
  onCancel: () => void;
}

export default function ConflictResolution({ conflicts, newItems, onResolve, onCancel }: ConflictResolutionProps) {
  const [resolutions, setResolutions] = useState<Record<string, any>>({});
  const [editingConflict, setEditingConflict] = useState<ConflictItem | null>(null);
  const [editedData, setEditedData] = useState<any>(null);

  const handleResolutionChange = (key: string, value: string) => {
    setResolutions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleEdit = (conflict: ConflictItem) => {
    setEditingConflict(conflict);
    setEditedData(JSON.parse(JSON.stringify(conflict.incoming)));
  };

  const handleSaveEdit = () => {
    if (editingConflict) {
      const key = `${editingConflict.type}-${editingConflict.id}`;
      setResolutions(prev => ({
        ...prev,
        [key]: { edited: editedData }
      }));
      setEditingConflict(null);
      setEditedData(null);
    }
  };

  const handleSubmit = () => {
    const finalResolutions: Record<string, any> = {};

    conflicts.forEach(conflict => {
      const key = `${conflict.type}-${conflict.id}`;
      const resolution = resolutions[key];
      
      if (!resolution) {
        finalResolutions[key] = 'skip';
      } else if (typeof resolution === 'string') {
        finalResolutions[key] = resolution;
      } else {
        finalResolutions[key] = resolution;
      }
    });

    newItems.forEach(item => {
      const idField = item.type === 'setting' ? item.data.key : item.data.id;
      const key = `${item.type}-${idField}`;
      finalResolutions[key] = 'add';
    });

    onResolve(finalResolutions);
  };

  const getConflictLabel = (type: string): string => {
    const labels: Record<string, string> = {
      category: 'Thể loại',
      difficulty: 'Độ khó',
      challenge: 'Thử thách',
      player: 'Người chơi',
      submission: 'Bài nộp',
      announcement: 'Thông báo',
      setting: 'Cài đặt'
    };
    return labels[type] || type;
  };

  const getDisplayValue = (data: any, type: string): string => {
    if (type === 'category' || type === 'difficulty' || type === 'challenge' || type === 'announcement') {
      return data.name || data.title || 'N/A';
    }
    if (type === 'player') {
      return data.username || 'N/A';
    }
    if (type === 'setting') {
      return data.key || 'N/A';
    }
    if (type === 'submission') {
      return `Submission #${data.id?.substring(0, 8)}...`;
    }
    return 'N/A';
  };

  const renderEditDialog = () => {
    if (!editingConflict || !editedData) return null;

    const fields = Object.keys(editedData).filter(key => 
      key !== 'createdAt' && key !== 'updatedAt' && key !== 'passwordHash'
    );

    return (
      <Dialog open={true} onOpenChange={() => {
        setEditingConflict(null);
        setEditedData(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chỉnh sửa {getConflictLabel(editingConflict.type)}: {getDisplayValue(editedData, editingConflict.type)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {fields.map(field => (
              <div key={field}>
                <Label htmlFor={field} className="capitalize">{field}</Label>
                {typeof editedData[field] === 'boolean' ? (
                  <Select
                    value={editedData[field].toString()}
                    onValueChange={(value) => 
                      setEditedData({ ...editedData, [field]: value === 'true' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                ) : typeof editedData[field] === 'number' ? (
                  <Input
                    id={field}
                    type="number"
                    value={editedData[field]}
                    onChange={(e) => setEditedData({ ...editedData, [field]: parseInt(e.target.value) || 0 })}
                  />
                ) : field === 'description' || field === 'message' ? (
                  <Textarea
                    id={field}
                    value={editedData[field] || ''}
                    onChange={(e) => setEditedData({ ...editedData, [field]: e.target.value })}
                    rows={4}
                  />
                ) : (
                  <Input
                    id={field}
                    value={editedData[field] || ''}
                    onChange={(e) => setEditedData({ ...editedData, [field]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingConflict(null);
              setEditedData(null);
            }}>
              Hủy
            </Button>
            <Button onClick={handleSaveEdit}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderComparison = (conflict: ConflictItem) => {
    return (
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="font-semibold text-red-600">Dữ liệu hiện tại:</div>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
            {JSON.stringify(conflict.existing, null, 2)}
          </pre>
        </div>
        <div className="space-y-2">
          <div className="font-semibold text-green-600">Dữ liệu mới:</div>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
            {JSON.stringify(conflict.incoming, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  const totalConflicts = conflicts.length;
  const resolvedConflicts = Object.keys(resolutions).filter(key => 
    conflicts.some(c => `${c.type}-${c.id}` === key)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Xem trước dữ liệu nhập</h3>
          <p className="text-sm text-muted-foreground">
            Tìm thấy {conflicts.length} xung đột và {newItems.length} mục mới
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={resolvedConflicts < totalConflicts}
          >
            Thực hiện nhập ({resolvedConflicts}/{totalConflicts} đã giải quyết)
          </Button>
        </div>
      </div>

      {conflicts.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-4">Xung đột dữ liệu ({conflicts.length})</h4>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {conflicts.map((conflict, index) => {
                const key = `${conflict.type}-${conflict.id}`;
                const resolution = resolutions[key];
                const hasCustomEdit = resolution && typeof resolution === 'object' && resolution.edited;

                return (
                  <Card key={index} className="p-4 border-2 border-yellow-200">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{getConflictLabel(conflict.type)}</Badge>
                          <span className="font-medium">
                            {getDisplayValue(conflict.incoming, conflict.type)}
                          </span>
                          {hasCustomEdit && (
                            <Badge variant="secondary">Đã chỉnh sửa</Badge>
                          )}
                        </div>
                      </div>

                      {renderComparison(conflict)}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={resolution === 'skip' ? 'default' : 'outline'}
                          onClick={() => handleResolutionChange(key, 'skip')}
                        >
                          Giữ dữ liệu cũ
                        </Button>
                        <Button
                          size="sm"
                          variant={resolution === 'update' && !hasCustomEdit ? 'default' : 'outline'}
                          onClick={() => handleResolutionChange(key, 'update')}
                        >
                          Cập nhật dữ liệu mới
                        </Button>
                        <Button
                          size="sm"
                          variant={hasCustomEdit ? 'default' : 'outline'}
                          onClick={() => handleEdit(conflict)}
                        >
                          Chỉnh sửa
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      )}

      {newItems.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-4">Dữ liệu mới ({newItems.length})</h4>
          <p className="text-sm text-muted-foreground">
            Các mục này sẽ được thêm vào cơ sở dữ liệu
          </p>
          <div className="mt-3 space-y-2">
            {newItems.slice(0, 10).map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">{getConflictLabel(item.type)}</Badge>
                <span>{getDisplayValue(item.data, item.type)}</span>
              </div>
            ))}
            {newItems.length > 10 && (
              <p className="text-sm text-muted-foreground">...và {newItems.length - 10} mục khác</p>
            )}
          </div>
        </Card>
      )}

      {renderEditDialog()}
    </div>
  );
}
