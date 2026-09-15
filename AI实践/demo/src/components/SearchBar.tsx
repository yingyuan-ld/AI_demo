import { useMemo, useState } from "react";
import { EXAMPLE_ADDRESSES } from "../mock/graphData";
import { validateTronAddress } from "../utils/address";

interface SearchBarProps {
  analyzing: boolean;
  onSearch: (address: string) => Promise<boolean> | boolean;
  lookupKnown: (address: string) => "invalid" | "unknown" | "known";
}

export function SearchBar({ analyzing, onSearch, lookupKnown }: SearchBarProps) {
  const [value, setValue] = useState(EXAMPLE_ADDRESSES[0].address);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const liveError = useMemo(() => {
    if (!touched && !value) return null;
    return validateTronAddress(value);
  }, [touched, value]);

  async function submit(address = value) {
    setTouched(true);
    const formatError = validateTronAddress(address);
    if (formatError) {
      setError(formatError);
      return;
    }
    const status = lookupKnown(address);
    if (status === "unknown") {
      setError("该地址未纳入当前演示图谱，请使用下方示例地址，或输入图中已出现的节点地址。");
      return;
    }
    setError(null);
    await onSearch(address.trim());
  }

  return (
    <div className="search-wrap">
      <form
        className={`search-box ${error || liveError ? "is-invalid" : ""}`}
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <span className="search-icon" aria-hidden>
          ⌕
        </span>
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value.trim());
            setError(null);
          }}
          onBlur={() => setTouched(true)}
          placeholder="输入 TRON 地址（T 开头，34 位 Base58）"
          spellCheck={false}
          autoComplete="off"
          disabled={analyzing}
        />
        <button type="submit" disabled={analyzing}>
          {analyzing ? "分析中…" : "开始溯源"}
        </button>
      </form>
      {(error || liveError) && (
        <p className="search-error" role="alert">
          {error || liveError}
        </p>
      )}
      <div className="example-row">
        <span>示例</span>
        {EXAMPLE_ADDRESSES.map((item) => (
          <button
            key={item.address}
            type="button"
            className="chip"
            onClick={() => {
              setValue(item.address);
              setError(null);
              void submit(item.address);
            }}
          >
            {item.label}
            <em>{item.hint}</em>
          </button>
        ))}
      </div>
    </div>
  );
}
