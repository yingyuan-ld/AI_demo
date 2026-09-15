import { ENTITY_META, type EntityType } from "../types";

interface LegendProps {
  hiddenTypes: Set<EntityType>;
  onToggle: (type: EntityType) => void;
}

export function Legend({ hiddenTypes, onToggle }: LegendProps) {
  return (
    <section className="rail-card">
      <header>实体图例</header>
      <ul className="legend-list">
        {(Object.keys(ENTITY_META) as EntityType[]).map((type) => {
          const meta = ENTITY_META[type];
          const dimmed = hiddenTypes.has(type);
          return (
            <li key={type}>
              <button
                type="button"
                className={`legend-item ${dimmed ? "is-off" : ""}`}
                onClick={() => onToggle(type)}
              >
                <i style={{ background: meta.color }} data-shape={type} />
                <span>{meta.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="hint">点击图例可显示 / 隐藏该类型节点</p>
    </section>
  );
}
