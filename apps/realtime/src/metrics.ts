let connections = 0;
let activeRooms = 0;
let updatesTotal = 0;
let snapshotWritesOk = 0;
let snapshotWritesErr = 0;
let connectFailures = 0;

export const metrics = {
  incConnections: () => connections++,
  decConnections: () => connections--,
  incActiveRooms: () => activeRooms++,
  decActiveRooms: () => activeRooms--,
  incUpdates: () => updatesTotal++,
  incSnapshotOk: () => snapshotWritesOk++,
  incSnapshotErr: () => snapshotWritesErr++,
  incConnectFail: () => connectFailures++,
  render(): string {
    return [
      `# HELP canvasly_connections Active WS connections`,
      `# TYPE canvasly_connections gauge`,
      `canvasly_connections ${connections}`,
      `# HELP canvasly_active_rooms Active rooms in memory`,
      `# TYPE canvasly_active_rooms gauge`,
      `canvasly_active_rooms ${activeRooms}`,
      `# HELP canvasly_updates_total Yjs updates processed`,
      `# TYPE canvasly_updates_total counter`,
      `canvasly_updates_total ${updatesTotal}`,
      `# HELP canvasly_snapshot_writes_total`,
      `# TYPE canvasly_snapshot_writes_total counter`,
      `canvasly_snapshot_writes_total{result="ok"} ${snapshotWritesOk}`,
      `canvasly_snapshot_writes_total{result="err"} ${snapshotWritesErr}`,
      `# HELP canvasly_connect_failures_total`,
      `# TYPE canvasly_connect_failures_total counter`,
      `canvasly_connect_failures_total ${connectFailures}`,
      "",
    ].join("\n");
  },
};
