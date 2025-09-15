// app/data/mock.ts
export const heatMap = {
    total: 33,
    slices: [
      { label: "Clear", value: 7, color: "#9FE7A4" },
      { label: "Critical", value: 9, color: "#F87171" },
      { label: "Attention", value: 8, color: "#FBBF24" },
      { label: "Service down", value: 5, color: "#A78BFA" },
      { label: "Trouble", value: 4, color: "#60A5FA" },
    ],
  };
  
  export const ipAvailability = {
    transient: 3767,
    available: 370,
    used: 190,
    bars: [
      { key: "A", value: 30 },
      { key: "B", value: 70 },
      { key: "C", value: 80 },
      { key: "D", value: 55 },
    ],
  };
  
  export type InfraRow = {
    name: string;
    alarms: number;
    devices: number;
    problematic: number;
  };
  export const infraSnapshot: InfraRow[] = [
    { name: "Server", alarms: 215, devices: 20, problematic: 7 },
    { name: "Router", alarms: 2, devices: 1, problematic: 1 },
    { name: "Switch", alarms: 1, devices: 2, problematic: 1 },
    { name: "Desktop", alarms: 8, devices: 3, problematic: 2 },
    { name: "Domain Controller", alarms: 49, devices: 2, problematic: 2 },
    { name: "Load Balancer", alarms: 0, devices: 3, problematic: 0 },
    { name: "Wireless", alarms: 0, devices: 0, problematic: 0 },
    { name: "UPS", alarms: 0, devices: 4, problematic: 0 },
    { name: "Printer", alarms: 0, devices: 0, problematic: 0 },
    { name: "Unknown", alarms: 0, devices: 1, problematic: 0 },
    { name: "Storage", alarms: 0, devices: 0, problematic: 0 },
  ];
  
  export type UsageRow = {
    deviceName: string;
    min: number;
    avg: number;
  };
  export const devicesByMemory: UsageRow[] = [
    { deviceName: "EX Device 1", min: 98, avg: 93 },
    { deviceName: "EX Device 2", min: 92, avg: 89 },
    { deviceName: "EX Device 3", min: 26, avg: 74 },
    { deviceName: "EX Device 4", min: 59, avg: 63 },
    { deviceName: "EX Device 5", min: 35, avg: 42 },
    { deviceName: "EX Device 6", min: 42, avg: 42 },
  ];
  
  export const devicesByCpu: UsageRow[] = [
    { deviceName: "EX Device 1", min: 98, avg: 93 },
    { deviceName: "EX Device 2", min: 92, avg: 89 },
    { deviceName: "EX Device 3", min: 26, avg: 74 },
    { deviceName: "EX Device 4", min: 59, avg: 63 },
    { deviceName: "EX Device 5", min: 35, avg: 42 },
  ];
  
  export type DiskRow = {
    deviceName: string;
    volume: string;
    utilization: number;
  };
  export const volumesMostUsage: DiskRow[] = [
    { deviceName: "EX Device 1", volume: "C:\\label...", utilization: 93 },
    { deviceName: "EX Device 2", volume: "C:\\label...", utilization: 89 },
    { deviceName: "EX Device 3", volume: "C:\\label...", utilization: 74 },
    { deviceName: "EX Device 4", volume: "C:\\label...", utilization: 63 },
    { deviceName: "EX Device 5", volume: "C:\\label...", utilization: 42 },
  ];
  
  export type Alarm = {
    id: string;
    title: string;
    time: string;
  };
  export const recentAlarms: Alarm[] = Array.from({ length: 12 }).map((_, i) => ({
    id: `ID-2004 Source-Microsoft Windows-R-${i + 1}`,
    title: "Source-Microsoft Windows-R",
    time: "21 Feb 2024 04:45:37 PM IST",
  }));
  