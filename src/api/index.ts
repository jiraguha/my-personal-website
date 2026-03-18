const server = Bun.serve({
  port: Number(process.env.API_PORT ?? 3000),

  fetch(req: Request): Response {
    const url = new URL(req.url);

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`API running on port ${server.port}`);

export default server;
