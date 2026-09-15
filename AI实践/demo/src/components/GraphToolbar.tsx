interface GraphToolbarProps {
  physics: boolean;
  canOperate: boolean;
  onFit: () => void;
  onExpandAll: () => void;
  onCollapse: () => void;
  onTogglePhysics: () => void;
}

export function GraphToolbar({
  physics,
  canOperate,
  onFit,
  onExpandAll,
  onCollapse,
  onTogglePhysics,
}: GraphToolbarProps) {
  return (
    <div className="graph-toolbar">
      <button type="button" disabled={!canOperate} onClick={onFit}>
        适应画布
      </button>
      <button type="button" disabled={!canOperate} onClick={onExpandAll}>
        展开全部层级
      </button>
      <button type="button" disabled={!canOperate} onClick={onCollapse}>
        收起至一层
      </button>
      <button type="button" disabled={!canOperate} onClick={onTogglePhysics}>
        {physics ? "冻结布局" : "恢复力学"}
      </button>
    </div>
  );
}
