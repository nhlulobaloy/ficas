type Column<T> = {
    key: keyof T;
    label: string;
    type?: "text" | "checkbox" | "number";
    width?: string;
    readOnly?: boolean;
};

interface Props<T> {
    title: string;
    columns: Column<T>[];
    rows: T[];
    onChange: (rows: T[]) => void;
    note?: string;
    fixedNoColumn?: boolean;
}

export function EditableTable<T extends { no: number }>({
                                                            title,
                                                            columns,
                                                            rows,
                                                            onChange,
                                                            note,
                                                            fixedNoColumn = true,
                                                        }: Props<T>) {
    const addRow = () => {
        const empty: any = { no: rows.length + 1 };
        columns.forEach((c) => {
            empty[c.key as string] = c.type === "checkbox" ? false : "";
        });
        onChange([...rows, empty as T]);
    };

    const removeRow = (i: number) => {
        const next = rows
            .filter((_, idx) => idx !== i)
            .map((r, idx) => ({ ...r, no: idx + 1 }));
        onChange(next);
    };

    const update = (i: number, key: keyof T, value: any) => {
        onChange(
            rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r))
        );
    };

    return (
        <div className="form-section full-width">
            <h2>{title}</h2>
            {note && <p className="dist-note">{note}</p>}

            <table className="distribution-table">
                <thead>
                <tr>
                    {fixedNoColumn && <th style={{ width: 60 }}>NO</th>}
                    {columns.map((c) => (
                        <th key={String(c.key)} style={{ width: c.width }}>
                            {c.label}
                        </th>
                    ))}
                    <th style={{ width: 50 }}></th>
                </tr>
                </thead>
                <tbody>
                {rows.map((row, i) => (
                    <tr key={i}>
                        {fixedNoColumn && (
                            <td>
                                <input
                                    type="number"
                                    value={row.no}
                                    onChange={(e) =>
                                        update(i, "no" as keyof T, Number(e.target.value))
                                    }
                                    className="dist-no"
                                />
                            </td>
                        )}
                        {columns.map((c) => (
                            <td key={String(c.key)}>
                                {c.type === "checkbox" ? (
                                    <input
                                        type="checkbox"
                                        checked={!!row[c.key]}
                                        onChange={(e) => update(i, c.key, e.target.checked)}
                                    />
                                ) : c.type === "number" ? (
                                    <input
                                        type="number"
                                        value={(row[c.key] as any) ?? ""}
                                        onChange={(e) =>
                                            update(i, c.key, Number(e.target.value))
                                        }
                                        readOnly={c.readOnly}
                                    />
                                ) : (
                                    <textarea
                                        value={(row[c.key] as any) || ""}
                                        onChange={(e) => update(i, c.key, e.target.value)}
                                        rows={1}
                                        placeholder={c.label}
                                    />
                                )}
                            </td>
                        ))}
                        <td>
                            <button
                                type="button"
                                className="dist-remove"
                                onClick={() => removeRow(i)}
                            >
                                ✕
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <button type="button" className="dist-add" onClick={addRow}>
                + Add Row
            </button>
        </div>
    );
}