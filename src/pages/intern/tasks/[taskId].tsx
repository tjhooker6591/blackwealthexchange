import { useRouter } from "next/router";

export default function InternTaskDetail() {
  const { query } = useRouter();

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Task: {String(query.taskId ?? "")}</h1>
      <p>Task instructions will be defined here.</p>
    </div>
  );
}
