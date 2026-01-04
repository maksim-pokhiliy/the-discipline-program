export default function Page() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>The Discipline Program API</h1>

      <p>API Server is running on port 3001</p>

      <ul>
        <li>GET /api/programs</li>
        <li>GET /api/reviews</li>
        <li>GET /api/blog</li>
      </ul>
    </div>
  );
}
