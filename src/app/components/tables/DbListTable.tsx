/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useEffect } from "react";
import { Table, Dropdown, Button, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FilterOutlined } from "@ant-design/icons";
import clsx from "clsx";
import Link from "next/link";

type DbStatus = "Active" | "Idle" | "Offline";

interface DbRow {
  key: string;
  sNo: number;
  nameId: string;
  status: DbStatus;
  cpu?: number | null;
  memory?: number | null;
  disk?: number | null;
  diskRaw?: string;
  recommendation: string;
}

interface DbListTableProps {
  type?: "database" | "vm";
  title?: string;
}

const ENDPOINTS = {
  database: "https://nmqhfvs3-8000.inc1.devtunnels.ms/overall-db-list",
  vm: "https://nmqhfvs3-8000.inc1.devtunnels.ms/overall-vm-list",
} as const;

function percentClass(v?: number | null) {
  if (v == null) return "text-gray-400";
  if (v <= 10) return "text-green-600";
  if (v <= 20) return "text-orange-500";
  return "text-red-500";
}

function StatusCell({ status }: { status: DbStatus }) {
  const map = {
    Active: "text-green-600",
    Idle: "text-orange-500",
    Offline: "text-gray-400",
  } as const;
  return (
    <span className={clsx("text-sm font-medium", map[status])}>{status}</span>
  );
}

const normalizeStatus = (s: string | undefined | null): DbStatus => {
  const t = (s || "").toLowerCase();
  if (t === "online" || t === "active") return "Active";
  if (t === "idle") return "Idle";
  return "Offline";
};

const parsePercent = (v: unknown): number | null => {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const m = v.match(/-?\d+(\.\d+)?/);
    return m ? Number(m[0]) : null;
  }
  return null;
};

export default function DbListTable({
  type = "database",
  title = "Overall DB List",
}: DbListTableProps) {
  const [statusFilter, setStatusFilter] = useState<DbStatus | "All">("All");
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [allRows, setAllRows] = useState<DbRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch on mount + when 'type' changes
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const url = ENDPOINTS[type];
        const res = await fetch(url, {
          method: "GET",
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        let rows: DbRow[] = [];
        if (type === "database") {
          rows = (json as any[]).map((it, idx) => ({
            key: String(it.db_name ?? idx + 1),
            sNo: idx + 1,
            nameId: String(it.db_name ?? `DB_${idx + 1}`),
            status: normalizeStatus(it.db_status),
            cpu: parsePercent(it.cpu_usage),
            memory: parsePercent(it.memory_usage),
            disk: parsePercent(it.disk_usage),
            recommendation: String(
              it.recommendation ?? "No immediate action needed."
            ),
          }));
        } else {
          rows = (json as any[]).map((it) => ({
            key: String(it.s_no ?? it.name_id),
            sNo: Number(it.s_no ?? 0),
            nameId: String(it.name_id ?? `VM_${it.s_no ?? ""}`),
            status: normalizeStatus(it.status),
            cpu: parsePercent(it.cpu_utilization),
            memory: parsePercent(it.memory_utilization),
            disk: null,
            diskRaw: String(it.disk_utilization ?? "-"),
            recommendation: String(it.recommendation ?? "Normal"),
          }));
        }

        if (!cancelled) {
          setAllRows(rows);
          setCurrent(1);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErrorMsg(
            `Failed to load ${type === "vm" ? "VM" : "DB"} list. ${
              e?.message ? `(${e.message})` : ""
            }`
          );
          setAllRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [type]);

  const filtered = useMemo(() => {
    if (statusFilter === "All") return allRows;
    return allRows.filter((r) => r.status === statusFilter);
  }, [statusFilter, allRows]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(current * pageSize, total);

  const data = useMemo(
    () => filtered.slice((current - 1) * pageSize, current * pageSize),
    [filtered, current, pageSize]
  );

  const columns: ColumnsType<DbRow> = [
    {
      title: "S.No",
      dataIndex: "sNo",
      width: 80,
      align: "left",
      render: (v: number) => v.toString().padStart(2, "0"),
    },
    {
      title: "Name/ID",
      dataIndex: "nameId",
      align: "left",
      render: (v: string) => <span className="text-sm font-medium">{v}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      align: "left",
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (v: DbStatus) => <StatusCell status={v} />,
    },
    {
      title: "CPU Utilization",
      dataIndex: "cpu",
      align: "left",
      sorter: (a, b) => (a.cpu ?? -1) - (b.cpu ?? -1),
      render: (v?: number | null) => (
        <span className={clsx("text-sm font-medium", percentClass(v))}>
          {v == null ? "-" : `${v.toFixed(0).toString().padStart(2, "0")}%`}
        </span>
      ),
    },
    {
      title: "Memory Utilization",
      dataIndex: "memory",
      align: "left",
      sorter: (a, b) => (a.memory ?? -1) - (b.memory ?? -1),
      render: (v?: number | null) => (
        <span className={clsx("text-sm font-medium", percentClass(v))}>
          {v == null ? "-" : `${v.toFixed(0).toString().padStart(2, "0")}%`}
        </span>
      ),
    },
    {
      title: "Disk Utilization",
      dataIndex: "disk",
      align: "left",
      
      sorter:
        type === "vm"
          ? undefined
          : (a, b) => (a.disk ?? -1) - (b.disk ?? -1),
      render: (_v: number | null, record: DbRow) =>
        type === "vm" ? (
          <span className="text-sm font-medium text-gray-800">
            {record.diskRaw ?? "-"}
          </span>
        ) : (
          <span className={clsx("text-sm font-medium", percentClass(_v))}>
            {_v == null ? "-" : `${_v.toFixed(0).toString().padStart(2, "0")}%`}
          </span>
        ),
    },
    {
      title: "Recommendations",
      dataIndex: "recommendation",
      align: "left",
      ellipsis: true,
      render: (v: string) => (
        <span className="text-xs text-gray-700">{v}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      align: "center",

      render: (_: any, record: DbRow) => {
        const baseUrl = type === "vm" ? "/vm-analytics" : "/graph";
        const paramName = type === "vm" ? "vm" : "db";
        return (
          <Link
            href={`${baseUrl}/1?${paramName}=${encodeURIComponent(
              record.nameId
            )}`}
            className="bg-blue-800 text-white hover:text-white hover:bg-blue-700 text-decoration-none font-semibold rounded-md px-2 py-1 whitespace-nowrap text-xs inline-block"
          >
            Get 360
          </Link>
        );
      },
    },
  ];

  const goFirst = () => setCurrent(1);
  const goPrev = () => setCurrent((c) => Math.max(1, c - 1));
  const goNext = () => setCurrent((c) => Math.min(pageCount, c + 1));
  const goLast = () => setCurrent(pageCount);

  return (
    <div className="bg-white shadow-sm rounded-xl border border-zinc-200 mt-3">
      <style jsx global>{`
        .ant-table .ant-table-thead > tr > th,
        .ant-table .ant-table-tbody > tr > td {
          text-align: left !important;
        }
        .ant-table-column-sorters {
          gap: 2px !important;
          padding: 0 !important;
        }
        .ant-table-column-sorters .ant-table-column-title {
          margin-inline-end: 2px !important;
        }
        .ant-table-column-sorter {
          margin-inline-start: 2px !important;
        }
      `}</style>
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h4 className="font-semibold text-base">
          {title || (type === "vm" ? "Overall VM List" : "Overall DB List")}
        </h4>

        <Dropdown
          menu={{
            items: [
              { key: "all", label: "All", onClick: () => setStatusFilter("All") },
              { key: "active", label: "Active", onClick: () => setStatusFilter("Active") },
              { key: "idle", label: "Idle", onClick: () => setStatusFilter("Idle") },
              { key: "offline", label: "Offline", onClick: () => setStatusFilter("Offline") },
            ],
          }}
          trigger={["click"]}
        >
          <Button size="small" icon={<FilterOutlined />}>
            Filters
          </Button>
        </Dropdown>
      </div>
      {errorMsg && (
        <div className="px-4 py-2 text-xs text-red-700 bg-red-50 border-b border-red-100">
          {errorMsg}
        </div>
      )}
      <Table<DbRow>
        rowKey="key"
        size="small"
        columns={columns}
        dataSource={data}
        pagination={false}
        bordered={false}
        sticky
        rowClassName={() => "hover:bg-gray-50"}
        loading={loading}
      />
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-xs text-gray-600">
        <div>{`Showing ${start} to ${end} of ${total.toLocaleString()} entries`}</div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Rows per Page</span>
          <Select
            size="small"
            value={pageSize}
            style={{ width: 72 }}
            options={[5, 10, 25, 50].map((v) => ({
              value: v,
              label: v.toString().padStart(2, "0"),
            }))}
            onChange={(v) => {
              setPageSize(v);
              setCurrent(1);
            }}
          />
          <Button size="small" type="text" className="px-1" onClick={goFirst} disabled={current === 1}>
            ⏮
          </Button>
          <Button size="small" type="text" className="px-1" onClick={goPrev} disabled={current === 1}>
            ‹
          </Button>
          <Button
            size="small"
            type="text"
            className="px-1"
            onClick={goNext}
            disabled={total === 0 || current === pageCount}
          >
            ›
          </Button>
          <Button
            size="small"
            type="text"
            className="px-1"
            onClick={goLast}
            disabled={total === 0 || current === pageCount}
          >
            ⏭
          </Button>
        </div>
      </div>
    </div>
  );
}
